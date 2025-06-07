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
