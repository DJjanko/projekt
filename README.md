# 📊 Decibel Area Monitoring App

This full-stack application collects, analyzes, and visualizes sound levels in various locations. It combines IoT, real-time data streaming, mapping, face recognition, and CI/CD automation.

---

## 🚀 Project Purpose

The goal is to monitor how loud specific areas are by collecting decibel data and combining it with speed limit data.  
It can be used for:

- Noise pollution analysis
- Urban traffic studies
- Smart city monitoring

---

## 🗂 Project Structure

.github/workflows/ -> GitHub Actions CI/CD pipeline
API/ -> Python Flask API (face recognition, audio processing)
backend/ -> Node.js Express backend (REST API + MongoDB)
dump/vaja6/ -> MongoDB dump (database backup)
frontend_web/ -> React frontend web app (map, charts)
frontweb_mobile/ -> React Native mobile app (registration, MQTT, camera)
mqtt/ -> MQTT broker client (real-time audio streaming)


---

## ⚙️ Technologies Used

| Layer            | Tech Stack                                  |
| ----------------- | ------------------------------------------- |
| **Backend**       | Node.js, Express, MongoDB, Mongoose         |
| **Frontend Web**  | React.js, Leaflet.js, OpenStreetMap         |
| **Frontend Mobile** | React Native, Expo, MQTT, Camera API    |
| **Audio Analysis**| Python, Flask, Librosa, OpenCV (Face Recog) |
| **Data Streaming**| MQTT (Mosquitto), WebSocket transport       |
| **CI/CD**         | GitHub Actions                              |

---

## 🔧 Features

- Real-time decibel monitoring via MQTT
- Audio analysis (RMS → dB)
- Speed limit data integration (OpenStreetMap Overpass API)
- Map visualization (Leaflet + clustering)
- Face recognition for user registration/login
- Fully automated tests with CI/CD
- Database backup included (`dump/vaja6/`)

---

## 💾 Database

MongoDB data is stored in:

dump/vaja6/

You can restore the database locally using:

```bash
mongorestore --db vaja6 dump/vaja6/

🏃‍♂️ Getting Started (windows testing)
1️⃣ Clone repository
bash
Kopiraj
Uredi
git clone https://github.com/your-username/your-repo.git
2️⃣ Restore database (optional)
bash
Kopiraj
Uredi
mongorestore --db vaja6 dump/vaja6/
3️⃣ Start Backend
bash
Kopiraj
Uredi
cd backend
npm install
npm start
4️⃣ Start Python API (Flask)
bash
Kopiraj
Uredi
cd API
pip install -r requirements.txt
python API.py
5️⃣ Start Frontend Web
bash
Kopiraj
Uredi
cd frontend_web
npm install
npm start
6️⃣ Start Frontend Mobile (Expo)
bash
Kopiraj
Uredi
cd frontweb_mobile
npm install
npm run android  # or npm run ios / npm run web
7️⃣ (Optional) Start MQTT Broker
bash
Kopiraj
Uredi
mosquitto -c mosquitto.conf
🧪 Testing
Backend tests are written using Mocha + Supertest.

bash
Kopiraj
Uredi
cd backend
npm test
These tests are also run automatically via GitHub Actions on every push or pull request.

(LINUX)
download postavi_sistem.sh
Make sure you have docker installed
run the script: ./postavi_sistem.sh


🌐 Live Features Overview
Map View:

Decibel markers

Speed limit overlays

Clustered markers for performance

Correlation heatmap (dB vs Speed)

Mobile:

User face registration with camera

Live face login

Real-time decibel data streaming via MQTT

🚦 CI/CD
GitHub Actions automatically builds and tests the backend on each commit using the config in:

bash
Kopiraj
Uredi
.github/workflows/backend-ci.yml
📈 Improvements Possible
Heatmap smoothing for large datasets

Dynamic data cleaning

Multi-device user session management

Better correlation visualization

📄 License
For educational & demonstration purposes.

✅ Enjoy building & testing 🚀

Authors:
