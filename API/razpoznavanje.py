import os
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
