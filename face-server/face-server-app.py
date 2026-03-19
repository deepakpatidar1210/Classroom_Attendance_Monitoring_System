from flask import Flask, request, jsonify
from flask_cors import CORS
import face_recognition
import numpy as np
import base64
import io
import logging
from PIL import Image

app = Flask(__name__)
CORS(app)

# Proper logging setup
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.route('/')
def home():
    return jsonify({'message': 'Face server running'})

@app.route('/get-descriptor', methods=['POST'])
def get_descriptor():
    try:
        data = request.json
        image_base64 = data.get('image')

        if not image_base64:
            return jsonify({'error': 'No image provided'}), 400

        # Base64 decode karo
        image_data = base64.b64decode(image_base64)
        image = Image.open(io.BytesIO(image_data))

        # RGB convert karo (PNG mein RGBA hoti hai jo face_recognition support nahi karta)
        image = image.convert('RGB')
        image_np = np.array(image)

        # Face descriptor nikalo
        encodings = face_recognition.face_encodings(image_np)

        if len(encodings) == 0:
            logger.warning('No face detected in image')
            return jsonify({'error': 'No face detected'}), 400

        descriptor = encodings[0].tolist()
        logger.info('Face descriptor extracted successfully')
        return jsonify({'descriptor': descriptor})

    except Exception as e:
        logger.error(f'get-descriptor error: {str(e)}')
        return jsonify({'error': str(e)}), 500


@app.route('/verify-face', methods=['POST'])
def verify_face():
    try:
        data = request.json
        live_image_base64 = data.get('liveImage')
        stored_descriptors = data.get('storedDescriptors')

        if not live_image_base64:
            return jsonify({'verified': False, 'reason': 'No image provided'}), 400

        if not stored_descriptors or len(stored_descriptors) == 0:
            return jsonify({'verified': False, 'reason': 'No stored face data'}), 400

        # Live image decode karo
        image_data = base64.b64decode(live_image_base64)
        image = Image.open(io.BytesIO(image_data))

        # RGB convert karo
        image = image.convert('RGB')
        image_np = np.array(image)

        # Live face descriptor nikalo
        live_encodings = face_recognition.face_encodings(image_np)

        if len(live_encodings) == 0:
            logger.warning('No face detected in live image')
            return jsonify({'verified': False, 'reason': 'No face detected in camera'}), 200

        live_encoding = live_encodings[0]

        # Stored descriptors se compare karo
        stored_encodings = [np.array(d) for d in stored_descriptors]

        # Fixed: tolerance 0.7 se 0.5 kiya — attendance ke liye strict hona chahiye
        results = face_recognition.compare_faces(
            stored_encodings,
            live_encoding,
            tolerance=0.5
        )

        distances = face_recognition.face_distance(stored_encodings, live_encoding)
        min_distance = float(min(distances))
        verified = any(results)

        logger.info(f'Face verification: verified={verified}, min_distance={min_distance:.3f}')

        return jsonify({
            'verified': verified,
            'confidence': round((1 - min_distance) * 100, 1),
            'reason': None if verified else 'Face did not match'
        })

    except Exception as e:
        logger.error(f'verify-face error: {str(e)}')
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=False)
