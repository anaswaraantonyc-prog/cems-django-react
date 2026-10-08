"""
FILE: apps/accounts/face_service.py
PURPOSE: Production Deep-Learning Face Recognition Service for CEMS.
         Powered by InsightFace / ONNX Runtime (buffalo_sc ArcFace 512-D embeddings).
         Provides:
           - Image validation & quality diagnostics (blur, lighting, resolution).
           - Strict single-face verification (rejects 0 faces and multi-face images).
           - 512-D normalized facial embedding extraction.
           - Deterministic cosine similarity search against FaceReference records.
           - Identity authentication without frontend-supplied user hints.
"""
import logging
import threading
import cv2
import numpy as np
from django.conf import settings
from .models import FaceReference

logger = logging.getLogger(__name__)

# Configurable matching threshold. In ArcFace, cosine similarity >= 0.50
# provides high security (FAR < 0.001%) while remaining resilient to slight angles.
DEFAULT_FACE_MATCH_THRESHOLD = 0.50

# Thread-safe lazy initializer for InsightFace FaceAnalysis
_face_app = None
_face_app_lock = threading.Lock()


class FaceServiceError(Exception):
    """Custom exception raised during face validation or embedding extraction."""
    def __init__(self, message, code='invalid_face'):
        super().__init__(message)
        self.message = message
        self.code = code


def get_face_app():
    """Thread-safe singleton accessor for the InsightFace model runner."""
    global _face_app
    if _face_app is None:
        with _face_app_lock:
            if _face_app is None:
                from insightface.app import FaceAnalysis
                app = FaceAnalysis(name='buffalo_sc', providers=['CPUExecutionProvider'])
                app.prepare(ctx_id=0, det_size=(640, 640))
                _face_app = app
    return _face_app


def decode_image_file(file_or_bytes_or_path):
    """
    Decodes an uploaded file, byte stream, or path into a BGR numpy array.
    """
    if isinstance(file_or_bytes_or_path, (str, bytes, bytearray)):
        if isinstance(file_or_bytes_or_path, str):
            img = cv2.imread(file_or_bytes_or_path, cv2.IMREAD_COLOR)
            if img is None:
                raise FaceServiceError("Could not read image file from disk.", code='read_error')
            return img
        raw = file_or_bytes_or_path
    elif hasattr(file_or_bytes_or_path, 'read'):
        if hasattr(file_or_bytes_or_path, 'seek'):
            file_or_bytes_or_path.seek(0)
        raw = file_or_bytes_or_path.read()
        if hasattr(file_or_bytes_or_path, 'seek'):
            file_or_bytes_or_path.seek(0)
    else:
        raise FaceServiceError("Unsupported image payload.", code='unsupported_format')

    arr = np.frombuffer(raw, dtype=np.uint8)
    img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    if img is None:
        raise FaceServiceError("Could not decode image. Please upload a valid image file.", code='decode_error')
    return img


def validate_image_quality(img_bgr, is_registration=True):
    """
    Performs preliminary image health checks (dimensions, brightness, blur).
    Returns None if ok, or raises FaceServiceError.
    """
    h, w = img_bgr.shape[:2]
    if h < 60 or w < 60:
        msg = "Image quality is insufficient. The image resolution is too small." if is_registration \
              else "Face image quality is insufficient (image is too small)."
        raise FaceServiceError(msg, code='low_resolution')

    gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
    mean_val = float(np.mean(gray))

    # Lighting check
    if mean_val < 20:
        msg = "Image quality is insufficient. Lighting is too dark." if is_registration \
              else "Face image quality is insufficient (image is too dark). Please move to better light."
        raise FaceServiceError(msg, code='too_dark')

    if mean_val > 245:
        msg = "Image quality is insufficient. Lighting is overexposed." if is_registration \
              else "Face image quality is insufficient (image is overexposed). Please reduce glare."
        raise FaceServiceError(msg, code='overexposed')

    # Blur check using Laplacian variance
    laplacian_var = cv2.Laplacian(gray, cv2.CV_64F).var()
    if laplacian_var < 8.0:
        msg = "Image quality is insufficient. The photograph is too blurry." if is_registration \
              else "Face image quality is insufficient (image is too blurry). Please hold still."
        raise FaceServiceError(msg, code='blurry')


def extract_single_face_embedding(file_or_bytes_or_path, is_registration=True):
    """
    Validates the image and extracts an ArcFace 512-D L2-normalized embedding.
    Guarantees:
      - Exactly ONE face detected.
      - 0 faces -> Rejected with clear message.
      - >1 faces -> Rejected with clear message (no silent selection).
      - Returns (embedding: np.ndarray shape (512,), det_score: float).
    """
    img_bgr = decode_image_file(file_or_bytes_or_path)
    validate_image_quality(img_bgr, is_registration=is_registration)

    app = get_face_app()
    detected_faces = app.get(img_bgr)

    # Filter detected faces by confidence & minimum bounding box size
    valid_faces = []
    for f in detected_faces:
        bbox_w = f.bbox[2] - f.bbox[0]
        bbox_h = f.bbox[3] - f.bbox[1]
        if f.det_score >= 0.50 and bbox_w >= 30 and bbox_h >= 30:
            valid_faces.append(f)

    if len(valid_faces) == 0:
        msg = "Face not detected. Please upload a clear photograph containing your face." if is_registration \
              else "Face not detected. Please position your face inside the frame."
        raise FaceServiceError(msg, code='no_face')

    if len(valid_faces) > 1:
        msg = "Multiple faces detected. Please upload a photograph containing only your face." if is_registration \
              else "Only one person should be visible during face verification."
        raise FaceServiceError(msg, code='multiple_faces')

    face = valid_faces[0]

    # Face size & quality check
    face_w = face.bbox[2] - face.bbox[0]
    face_h = face.bbox[3] - face.bbox[1]
    if face_w < 35 or face_h < 35:
        msg = "Face size is too small. Please upload a closer, clearer photograph." if is_registration \
              else "Please move closer and make sure your face is clearly visible."
        raise FaceServiceError(msg, code='face_too_small')

    if face.det_score < 0.55:
        msg = "Face image quality is insufficient. Face confidence is too low." if is_registration \
              else "Face could not be verified with sufficient confidence."
        raise FaceServiceError(msg, code='low_confidence')

    embedding = face.normed_embedding
    if embedding is None:
        raw_emb = face.embedding
        if raw_emb is None:
            raise FaceServiceError("Failed to extract facial embedding.", code='embedding_failed')
        norm = np.linalg.norm(raw_emb)
        embedding = (raw_emb / norm) if norm > 1e-6 else raw_emb

    embedding = np.asarray(embedding, dtype=np.float32)
    return embedding, float(face.det_score)


def compute_similarity(emb1, emb2):
    """
    Computes cosine similarity between two L2-normalized 1D embeddings.
    Returns float in [-1.0, 1.0].
    """
    v1 = np.asarray(emb1, dtype=np.float32)
    v2 = np.asarray(emb2, dtype=np.float32)
    norm1 = np.linalg.norm(v1)
    norm2 = np.linalg.norm(v2)
    if norm1 < 1e-6 or norm2 < 1e-6:
        return 0.0
    return float(np.dot(v1, v2) / (norm1 * norm2))


def save_user_face_reference(user, embedding):
    """
    Saves or updates the FaceReference model for the specified user.
    Stores the 512-D float32 vector securely as binary bytes.
    """
    ref, _ = FaceReference.objects.get_or_create(user=user)
    ref.model_name = 'buffalo_sc'
    ref.model_version = '1.0'
    ref.set_embedding_vector(embedding)
    ref.is_active = True
    ref.save()
    return ref


def find_best_matching_user(live_embedding, threshold=None):
    """
    Compares live face embedding against all active registered FaceReferences in CEMS.
    Guarantees:
      - Searches only validated and active registered accounts.
      - Finds best match by highest cosine similarity.
      - Enforces threshold (default 0.50).
      - Checks ambiguity: top candidate must lead runners-up.
      - Returns (matched_user, best_score, error_message).
    """
    if threshold is None:
        threshold = getattr(
            settings,
            'FACE_RECOGNITION_THRESHOLD',
            getattr(settings, 'FACE_MATCH_THRESHOLD', DEFAULT_FACE_MATCH_THRESHOLD)
        )

    # Load active references with valid users
    references = (
        FaceReference.objects
        .filter(is_active=True, user__is_active=True, user__is_validated=True)
        .select_related('user')
    )

    if not references.exists():
        return None, 0.0, "Face verification failed. No registered face references found in the system."

    scored_candidates = []
    live_vec = np.asarray(live_embedding, dtype=np.float32)

    for ref in references:
        ref_vec = ref.get_embedding_vector()
        if ref_vec is None or ref_vec.shape != live_vec.shape:
            continue
        sim = compute_similarity(live_vec, ref_vec)
        scored_candidates.append((sim, ref.user))

    if not scored_candidates:
        return None, 0.0, "Face verification failed. No valid registered face references available."

    # Sort descending by cosine similarity
    scored_candidates.sort(key=lambda item: item[0], reverse=True)
    best_score, best_user = scored_candidates[0]

    if best_score < threshold:
        return None, best_score, "Face verification failed. No matching registered user was found."

    # Ambiguity check: if multiple registered faces are above threshold,
    # top match must have a clear margin (>= 0.06 higher than runner-up)
    if len(scored_candidates) > 1:
        second_score, second_user = scored_candidates[1]
        if second_score >= threshold and (best_score - second_score) < 0.06:
            logger.warning(
                "Face ambiguity between user %s (score %.3f) and %s (score %.3f)",
                best_user.username, best_score, second_user.username, second_score
            )
            return None, best_score, "Face similarity is ambiguous between registered users. Please position your face directly in front of the camera."

    return best_user, best_score, None
