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

# MQTT Imports
from threading import Thread
from paho.mqtt import client as mqtt_client

def get_local_ip():
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        # This doesn't actually send data, it's just for OS to select interface
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
    except Exception:
        ip = "127.0.0.1"
    finally:
        s.close()
    return ip
LOCAL_IP = get_local_ip()
print(" Local IP detected:", LOCAL_IP)


# === Flask App ===
app = Flask(__name__)
CORS(app)

# === MQTT Configuration ===
MQTT_BROKER = LOCAL_IP  # IP of your Mosquitto broker
MQTT_PORT = 9001              # WebSocket port
MQTT_TOPIC = 'audio/decibel'
MQTT_CLIENT_ID = 'flask-subscriber'

# === MQTT Publisher for Web Login ===
mqtt_web_client = mqtt_client.Client(client_id='flask-web-login', transport="websockets")
mqtt_web_client.connect(MQTT_BROKER, MQTT_PORT)
mqtt_web_client.loop_start()

# === Image Processing ===
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

# === Routes ===
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

# === New Route: Login Challenge ===
@app.route('/login-challenge', methods=['POST'])
def login_challenge():
    try:
        data = request.json
        username = data.get('username')

        if not username:
            return jsonify({ 'error': 'No username provided' }), 400

        topic = f'login_challenge/{username}'
        mqtt_web_client.publish(topic, payload='please_scan_face')

        print(f"📡 Sent login challenge to {topic}")

        return jsonify({ 'status': 'challenge sent' })

    except Exception as e:
        print(f"[ERROR] Failed to send login challenge: {str(e)}")
        return jsonify({ 'error': 'Failed to send login challenge' }), 500

# === MQTT Subscriber Setup ===
def on_connect(client, userdata, flags, rc, properties=None):
    if rc == 0:
        #print(" Connected to MQTT broker.")
        client.subscribe("audio/decibel")
        client.subscribe("presence/+")  # Wildcard for all presence messages
    else:
        print(f" Failed to connect. Code: {rc}")

active_subscribers = set()

def on_message(client, userdata, msg):
    try:
        topic = msg.topic
        payload_raw = msg.payload.decode()
        #print(" MQTT on_message triggered")
        #print(f" Topic: {topic}")
        #print(f" Payload: {payload_raw}")

        # === Handle Presence Messages ===
        if topic.startswith("presence/"):
            user_id = topic.split("/")[1]

            if payload_raw == 'online':
                active_subscribers.add(user_id)
                #print(f" {user_id} is now online.")
            elif payload_raw == '':
                active_subscribers.discard(user_id)
                #print(f" {user_id} went offline.")

            print(f" Active subscribers: {len(active_subscribers)}")
            return

        # === Handle Photo Updates ===
        payload = json.loads(payload_raw)

        if payload.get("status") == "offline":
            print("📴 Client reported offline status.")
            return

        photo_id = payload.get("photoId")
        db = payload.get("db")
        location = payload.get("location")

        if not photo_id or db is None or not location:
            print(" Incomplete data, skipping update.")
            return

        url = f"http://{LOCAL_IP}:3001/photos/{photo_id}"
        data = {
            "db": db,
            "location": location
        }

        print(f" Updating photo: {url} with {data}")
        response = requests.put(url, json=data)

        if response.ok:
            print(f" Photo {photo_id} updated successfully.")
        else:
            print(f" Failed to update photo. Status: {response.status_code}, Response: {response.text}")

    except Exception as e:
        print(f" MQTT message handling error: {e}")
        traceback.print_exc()

# === MQTT Forever Listener ===
def run_mqtt_listener():
    client = mqtt_client.Client(client_id=MQTT_CLIENT_ID, transport="websockets")
    client.on_connect = on_connect
    client.on_message = on_message
    client.connect(MQTT_BROKER, MQTT_PORT)
    client.loop_forever()

# === Start MQTT Listener in Background ===
Thread(target=run_mqtt_listener, daemon=True).start()

# === Start Flask ===
if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
