import os
import numpy as np
from sklearn.model_selection import train_test_split
import cv2
import tensorflow as tf
from sklearn.utils import class_weight
from tensorflow.keras import layers
from tensorflow.keras import initializers
from tensorflow.keras.callbacks import TensorBoard
import matplotlib.pyplot as plt
import random



#load faces
def load_face_data(data_dir, username, max_negatives=1000):
    images = []
    labels = []

    # Load negative samples from class '0'
    negative_dir = os.path.join(data_dir, '0')
    negative_files = [
        f for f in os.listdir(negative_dir)
        if f.lower().endswith(('.jpg', '.jpeg', '.png'))
    ]
    # Randomly sample up to max_negatives
    sampled_negatives = random.sample(negative_files, min(len(negative_files), max_negatives))

    for filename in sampled_negatives:
        img_path = os.path.join(negative_dir, filename)
        img = cv2.imread(img_path)
        if img is None:
            continue
        img = cv2.resize(img, (64, 64))
        img = img.astype(np.float32) / 255.0
        images.append(img)
        labels.append(0)

    # Load positive samples from the specific user folder
    user_dir = os.path.join(data_dir, username)
    for filename in os.listdir(user_dir):
        if filename.lower().endswith(('.jpg', '.jpeg', '.png')):
            img_path = os.path.join(user_dir, filename)
            img = cv2.imread(img_path)
            if img is None:
                continue
            img = cv2.resize(img, (64, 64))
            img = img.astype(np.float32) / 255.0
            images.append(img)
            labels.append(1)

    images = np.array(images)
    labels = np.array(labels)
    return images, labels

# Function to augment images
def augment_images(images, labels):
    data_augmentation = tf.keras.Sequential([
        layers.RandomFlip('horizontal'),
        layers.RandomRotation(0.01),
        layers.RandomZoom(0.01)
    ])

    def augment(image, label):
        image = data_augmentation(image)
        return image, label

    dataset = tf.data.Dataset.from_tensor_slices((images, labels))
    dataset = dataset.map(augment, num_parallel_calls=tf.data.AUTOTUNE)
    augmented_images, augmented_labels = [], []

    for img, lbl in dataset:
        augmented_images.append(img.numpy())
        augmented_labels.append(lbl.numpy())

    return np.array(augmented_images), np.array(augmented_labels)
#augment
def augment_and_save_image(image_path, output_dir, num_augmented=200):
    # Load and preprocess the original image
    img = cv2.imread(image_path)
    if img is None:
        print(f"Failed to load image: {image_path}")
        return

    img = cv2.resize(img, (64, 64))
    img = img.astype(np.float32) / 255.0

    # Create the data augmentation pipeline
    data_augmentation = tf.keras.Sequential([
        layers.RandomFlip('horizontal'),
        layers.RandomRotation(0.15),
        layers.RandomZoom(0.15),
        layers.RandomContrast(0.05)
    ])

    # Expand dims to simulate a batch
    img_tensor = tf.expand_dims(img, axis=0)

    # Generate and save augmented images
    for i in range(num_augmented):
        augmented = data_augmentation(img_tensor, training=True)[0].numpy()
        augmented = (augmented * 255).astype(np.uint8)
        save_path = os.path.join(output_dir, f"augmented_{i}.jpg")
        cv2.imwrite(save_path, augmented)
        print(f"Saved augmented image: {save_path}")

# Custom model
N = 32
def create_model(output_bias=None):
    model = tf.keras.Sequential()
    model.add(layers.Input(shape=(64, 64, 3)))

    for i in range(3):
        filters = N * (2 ** i)
        model.add(layers.Conv2D(filters, (3, 3), padding='same', activation='relu'))
        model.add(layers.BatchNormalization())
        model.add(layers.MaxPooling2D(pool_size=(2, 2)))

    model.add(layers.Flatten())
    model.add(layers.Dense(128, activation='relu'))
    model.add(layers.Dropout(0.5))

    # Binary classification output with optional bias
    if output_bias is not None:
        bias_initializer = initializers.Constant(output_bias)
    else:
        bias_initializer = 'zeros'

    model.add(layers.Dense(1, activation='sigmoid', bias_initializer=bias_initializer))

    return model

# Function to display image
def display_image(image, title=None):
    plt.figure()
    rgb_image = image[..., ::-1]  # BGR to RGB
    plt.imshow(rgb_image)
    plt.axis('off')
    if title:
        plt.title(title)
    plt.show()


def register(username):
    data_dir = os.path.join(os.getcwd(), 'face_data')
    # Load the face dataset
    images, labels = load_face_data(data_dir,username, max_negatives=1000)
    # Split into train/test/val sets
    train_images, test_images, train_labels, test_labels = train_test_split(images, labels, test_size=0.2,
                                                                            stratify=labels)
    train_images, val_images, train_labels, val_labels = train_test_split(train_images, train_labels, test_size=0.25,
                                                                          stratify=train_labels)

    print(f'Train shape: {train_images.shape}')
    print(f'Validation shape: {val_images.shape}')
    print(f'Test shape: {test_images.shape}')

    # Optional: Show example
    display_image(train_images[0], 'Sample face')

    # Augment training data
    augmented_train_images, augmented_train_labels = augment_images(train_images, train_labels)

    class_weights = class_weight.compute_class_weight(
        class_weight='balanced',
        classes=np.unique(train_labels),
        y=train_labels
    )
    class_weights_dict = dict(enumerate(class_weights))

    pos = np.sum(train_labels == 1)
    neg = np.sum(train_labels == 0)
    initial_bias = np.log((pos + 1e-7) / (neg + 1e-7))
    # Train the model
    model = create_model(output_bias=initial_bias)
    model.build((None, 64, 64, 3))
    model.compile(
        optimizer='adam',
        loss='binary_crossentropy',
        metrics=['accuracy']
    )
    model.fit(augmented_train_images, augmented_train_labels, epochs=10, validation_data=(val_images, val_labels), class_weight=class_weights_dict)

    # Evaluate on training set
    ucna_loss, ucna_accuracy = model.evaluate(augmented_train_images, augmented_train_labels)
    print(f"Ucna natancnost: {ucna_accuracy:.3f}")

    # Evaluate on validation set
    test_loss, test_accuracy = model.evaluate(val_images, val_labels)
    print(f"Testna natancnost: {test_accuracy:.3f}")
    # Save
    model.save(f'models/{username}_model.keras')



def preprocess_image(img):
    img = cv2.resize(img, (64, 64))
    img = img.astype(np.float32) / 255.0  #Normalize to match training
    img = np.expand_dims(img, axis=0)
    return img

def predict_image(model_path, image):
    if not os.path.exists(model_path):
        print(f"Model file not found: {model_path}")
        return False

    model = tf.keras.models.load_model(model_path)
    img = preprocess_image(image)
    prediction = model.predict(img)[0][0]
    print(f"Prediction score: {prediction:.5f}")

    if prediction > 0.5:  # Threshold for confidence
        print("Face match: access granted.")
        return True
    else:
        print("Face mismatch: access denied.")
        return False



def login(username, image):
    model_path = f'models/{username}_model.keras'
    if(predict_image(model_path, image)):
        return True
    else:
        return False


if __name__ == "__main__":
    #register('janko')
    img = cv2.imread("face_data/janko/janko.jpg")
    login('janko', img)
