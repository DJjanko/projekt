import numpy as np
import cv2
import base64
import librosa
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