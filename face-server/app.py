from flask import Flask, request, jsonify
from flask_cors import CORS
import face_recognition
import numpy as np
import base64
import io
import logging
from PIL import Image, ImageEnhance, ImageOps

app = Flask(__name__)
CORS(app)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


def decode_image(image_base64):
    # Base64 padding fix
  
    if ',' in image_base64:
        image_base64 = image_base64.split(',', 1)[1]

    padding = 4 - len(image_base64) % 4
    if padding != 4:
        image_base64 += '=' * padding

    image_data = base64.b64decode(image_base64)
    image = Image.open(io.BytesIO(image_data))

    # EXIF rotation fix
    try:
        image = ImageOps.exif_transpose(image)
    except Exception:
        pass

    # RGB convert 
    if image.mode != 'RGB':
        image = image.convert('RGB')

    return image


def try_detect(image_np):
    """Multiple models aur upsample levels try karo"""

    # HOG upsample=1
    locs = face_recognition.face_locations(image_np, number_of_times_to_upsample=1, model='hog')
    if locs:
        encs = face_recognition.face_encodings(image_np, known_face_locations=locs, num_jitters=2)
        if encs:
            logger.info('Found via HOG-1')
            return encs

    # HOG upsample=2
    locs = face_recognition.face_locations(image_np, number_of_times_to_upsample=2, model='hog')
    if locs:
        encs = face_recognition.face_encodings(image_np, known_face_locations=locs, num_jitters=2)
        if encs:
            logger.info('Found via HOG-2')
            return encs

    return []


def find_encodings(pil_image):
    """
    Multiple variants try karo taaki mobile camera ke kisi bhi angle/lighting mein face mile.
    Registration aur verification dono ke liye same function use hota hai — 
    isliye consistency automatically maintain hoti hai.
    """
    w, h = pil_image.size
    variants = []

    # 1. Original resize to 640
    scale = 640 / w if w > 640 else 1.0
    img1 = pil_image.resize((int(w * scale), int(h * scale)), Image.LANCZOS)
    variants.append(('original-640', img1))

    # 2. Mirror — front camera ka mirror effect fix
    variants.append(('mirrored', ImageOps.mirror(img1)))

    # 3. Brightness enhance
    img3 = ImageEnhance.Brightness(img1).enhance(1.3)
    variants.append(('bright', img3))

    # 4. Contrast enhance
    img4 = ImageEnhance.Contrast(img1).enhance(1.4)
    variants.append(('contrast', img4))

    # 5. Brightness + Contrast combo
    img5 = ImageEnhance.Brightness(img1).enhance(1.2)
    img5 = ImageEnhance.Contrast(img5).enhance(1.3)
    variants.append(('bright+contrast', img5))

    # 6. Darker (overexposed photo fix)
    img6 = ImageEnhance.Brightness(img1).enhance(0.8)
    variants.append(('darker', img6))

    # 7. Larger — 800px (small face upsample)
    if w < 800:
        img7 = pil_image.resize((800, int(h * 800 / w)), Image.LANCZOS)
        variants.append(('large-800', img7))

    # 8. Smaller — 480px (noise reduce)
    img8 = img1.resize((480, int(img1.size[1] * 480 / img1.size[0])), Image.LANCZOS)
    variants.append(('small-480', img8))

    for name, img in variants:
        img_np = np.array(img)
        logger.info(f'Trying variant: {name}, shape: {img_np.shape}')
        result = try_detect(img_np)
        if result:
            logger.info(f'✓ Face found in variant: {name}')
            return result

    return []


@app.route('/')
def home():
    return jsonify({'message': 'Face server running'})


@app.route('/get-descriptor', methods=['POST'])
def get_descriptor():
    """
    Registration ke waqt call hota hai.
    Ek image se face descriptor extract karta hai.
    """
    try:
        data = request.get_json(force=True, silent=True)
        if not data:
            return jsonify({'error': 'Invalid or empty request body'}), 400

        image_base64 = data.get('image')
        if not image_base64:
            return jsonify({'error': 'No image provided'}), 400

        pil_image = decode_image(image_base64)
        logger.info(f'get-descriptor — PIL size: {pil_image.size}, mode: {pil_image.mode}')

        encodings = find_encodings(pil_image)

        if not encodings:
            logger.warning('No face detected in any variant')
            return jsonify({
                'error': 'No face detected. Tips: good lighting, face camera directly, remove glasses/mask.'
            }), 400

        descriptor = encodings[0].tolist()
        logger.info('✓ Descriptor extracted successfully')
        return jsonify({'descriptor': descriptor})

    except Exception as e:
        logger.error(f'get-descriptor error: {str(e)}')
        return jsonify({'error': str(e)}), 500


@app.route('/verify-face', methods=['POST'])
def verify_face():
    """
    Attendance mark karte waqt call hota hai.
    Live image ko stored descriptors se compare karta hai.
    """
    try:
        data = request.get_json(force=True, silent=True)
        if not data:
            return jsonify({'verified': False, 'reason': 'Invalid request body'}), 400

        live_image_base64 = data.get('liveImage')
        stored_descriptors = data.get('storedDescriptors')

        if not live_image_base64:
            return jsonify({'verified': False, 'reason': 'No image provided'}), 400
        if not stored_descriptors or len(stored_descriptors) == 0:
            return jsonify({'verified': False, 'reason': 'No stored face data'}), 400

        pil_image = decode_image(live_image_base64)
        logger.info(f'verify-face — PIL size: {pil_image.size}, stored descriptors: {len(stored_descriptors)}')

        live_encodings = find_encodings(pil_image)

        if not live_encodings:
            logger.warning('No face detected in live image')
            return jsonify({
                'verified': False,
                'reason': 'No face detected. Ensure good lighting and face the camera directly.'
            }), 200

        live_encoding = live_encodings[0]
        stored_encodings = [np.array(d) for d in stored_descriptors]

        distances = face_recognition.face_distance(stored_encodings, live_encoding)
        min_distance = float(np.min(distances))
        avg_distance = float(np.mean(distances))
        confidence = round((1 - min_distance) * 100, 1)

        # ----- TOLERANCE TUNING -----
        # 0.4 = very strict | 0.6 = standard | 0.65 = lenient | 0.75 = very lenient
        # Mobile front camera ke liye 0.75 best hai
        TOLERANCE = 0.4

        results = face_recognition.compare_faces(
            stored_encodings,
            live_encoding,
            tolerance=TOLERANCE
        )
        matched_count = int(sum(results))   # numpy.int64 → Python int fix
        verified = matched_count > 0

        logger.info(
            f'Verify result: verified={verified}, '
            f'min_dist={min_distance:.4f}, avg_dist={avg_distance:.4f}, '
            f'confidence={confidence}%, '
            f'matched={matched_count}/{len(stored_encodings)}, '
            f'tolerance={TOLERANCE}'
        )

        return jsonify({
            'verified': verified,
            'confidence': confidence,
            'matched_count': matched_count,
            'total_stored': len(stored_encodings),
            'reason': None if verified else (
                f'Face did not match '
                f'(confidence: {confidence}%, '
                f'required: >{round((1 - TOLERANCE) * 100)}%)'
            )
        })

    except Exception as e:
        logger.error(f'verify-face error: {str(e)}')
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=False)


@app.route('/debug-distance', methods=['POST'])
def debug_distance():
    try:
        data = request.get_json(force=True, silent=True)
        live_image_base64 = data.get('liveImage')
        stored_descriptors = data.get('storedDescriptors')

        pil_image = decode_image(live_image_base64)
        live_encodings = find_encodings(pil_image)

        if not live_encodings:
            return jsonify({'error': 'No face detected in live image'})

        live_encoding = live_encodings[0]
        stored_encodings = [np.array(d) for d in stored_descriptors]
        distances = face_recognition.face_distance(stored_encodings, live_encoding)

        result = {
            'distances': [round(float(d), 4) for d in distances],
            'min_distance': round(float(np.min(distances)), 4),
            'confidence_pct': round((1 - float(np.min(distances))) * 100, 1),
            'would_pass_0_65': bool(np.min(distances) < 0.65),
            'would_pass_0_70': bool(np.min(distances) < 0.70),
            'would_pass_0_75': bool(np.min(distances) < 0.75),
            'would_pass_0_80': bool(np.min(distances) < 0.80),
        }
        logger.info(f'DEBUG: {result}')
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 500
