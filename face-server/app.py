from flask import Flask, request, jsonify
from flask_cors import CORS
import face_recognition
import numpy as np
import base64
import io
from PIL import Image

app = Flask(__name__)
CORS(app)

@app.route('/')
def home():
    return jsonify({'message': 'Face server running'})

@app.route('/get-descriptor', methods=['POST'])
def get_descriptor():
    try:
        data = request.json
        image_base64 = data['image']
        
        # Base64 decode karo
        image_data = base64.b64decode(image_base64)
        image = Image.open(io.BytesIO(image_data))
        image_np = np.array(image)
        
        # Face descriptor nikalo
        encodings = face_recognition.face_encodings(image_np)
        
        if len(encodings) == 0:
            return jsonify({'error': 'No face detected'}), 400
        
        descriptor = encodings[0].tolist()
        return jsonify({'descriptor': descriptor})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/verify-face', methods=['POST'])
def verify_face():
    try:
        data = request.json
        live_image_base64 = data['liveImage']
        stored_descriptors = data['storedDescriptors']
        
        # Live image decode karo
        image_data = base64.b64decode(live_image_base64)
        image = Image.open(io.BytesIO(image_data))
        image_np = np.array(image)
        
        # Live face descriptor nikalo
        live_encodings = face_recognition.face_encodings(image_np)
        
        if len(live_encodings) == 0:
            return jsonify({'verified': False, 'reason': 'No face detected in camera'}), 200
        
        live_encoding = live_encodings[0]
        
        # Stored descriptors se compare karo
        stored_encodings = [np.array(d) for d in stored_descriptors]
        
        results = face_recognition.compare_faces(
            stored_encodings, 
            live_encoding, 
            tolerance=0.7  # 0.5 = strict, 0.6 = lenient
        )
        
        distances = face_recognition.face_distance(stored_encodings, live_encoding)
        min_distance = float(min(distances))
        
        verified = any(results)
        
        return jsonify({
            'verified': verified,
            'confidence': round((1 - min_distance) * 100, 1),
            'reason': None if verified else 'Face did not match'
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
   app.run(host='0.0.0.0', port=5001, debug=False)