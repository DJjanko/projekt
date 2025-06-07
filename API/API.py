from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import numpy as np
import cv2
import base64
import tempfile
import librosa
import json
import socket

import razpoznavanje

import requests
import traceback

# === Flask App ===
app = Flask(__name__)
CORS(app)

def process_image(file):
    print(f"Received file: {file.filename}")
    username, _ = os.path.splitext(file.filename)
    user_dir = os.path.join("face_data", username)

    if not os.path.exists(user_dir):
        os.makedirs(user_dir, exist_ok=True)
        save_path = os.path.join(user_dir, file.filename)
        file.save(save_path)
        print(f"Saved image to: {save_path}")
        razpoznavanje.augment_and_save_image(save_path, user_dir, num_augmented=200)
        razpoznavanje.register(username)
        print(f"Augmented images saved for user: {username}")
    else:
        print(f"User directory already exists for: {username}")
        return False

    return True

def check_login(file):
    print(f"Received file: {file.filename}")
    username, _ = os.path.splitext(file.filename)
    user_dir = os.path.join("face_data", username)
    file_bytes = np.frombuffer(file.read(), np.uint8)
    img = cv2.imdecode(file_bytes, cv2.IMREAD_COLOR)
    return razpoznavanje.login(username, img)

#register
@app.route('/')
def home():
    return "Flask API is running. Use POST /upload to send an image."

@app.route('/upload', methods=['POST'])
def upload():
    if 'file' not in request.files:
        print('⚠️ No file in request.files')
        return jsonify({'error': 'No file uploaded'}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'Empty filename'}), 400

    file.seek(0, 2)
    size = file.tell()
    file.seek(0)

    if size == 0:
        return jsonify({'error': 'Uploaded file is empty'}), 400

    result = process_image(file)
    if result:
        return jsonify({'status': result}), 200
    else:
        return jsonify({'error': 'Model exists or is being created'}), 400

#Login API
@app.route('/login', methods=['POST'])
def login_user():
    if 'file' not in request.files:
        return jsonify({'error': 'No file uploaded'}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'Empty filename'}), 400

    file.seek(0, 2)
    size = file.tell()
    file.seek(0)

    if size == 0:
        return jsonify({'error': 'Uploaded file is empty'}), 400

    result = check_login(file)
    if result:
        return jsonify({'status': result}), 200
    else:
        return jsonify({'error': 'Access denied'}), 400
@app.route('/analyze-audio', methods=['POST'])
def analyze_audio():
    try:
        data = request.json
        filename = data['filename']
        audio_base64 = data['data']
        audio_bytes = base64.b64decode(audio_base64)

        with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as temp_audio:
            temp_audio.write(audio_bytes)
            temp_path = temp_audio.name

        y, sr = librosa.load(temp_path, sr=None, mono=True)
        rms = np.sqrt(np.mean(y**2))
        db = 20 * np.log10(rms) if rms > 0 else -np.inf

        print(f"[INFO] Received {len(y)} samples — dB: {round(db, 2)}")
        return jsonify({ "db": float(round(db, 2)) })

    except Exception as e:
        print(f"[ERROR] {str(e)}")
        return jsonify({ "error": "Failed to analyze audio." }), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)