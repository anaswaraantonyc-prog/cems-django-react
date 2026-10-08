"""
FILE: apps/emergency/face_matcher.py
PURPOSE: Backward compatibility adapter for legacy face matcher calls.
         Delegates to production ArcFace biometrics in apps.accounts.face_service.
"""
from apps.accounts.face_service import (
    extract_single_face_embedding,
    compute_similarity,
    FaceServiceError,
)

FaceMatchError = FaceServiceError


def check_face_image_quality(file_or_path):
    """Checks face presence, lighting, blur, and single-face requirement."""
    try:
        extract_single_face_embedding(file_or_path, is_registration=False)
        return True, ""
    except FaceServiceError as exc:
        return False, str(exc)
    except Exception as exc:
        return False, str(exc)


def match_face(live_file, registered_file, threshold=0.50):
    """Compares live capture against a registered file using ArcFace cosine similarity."""
    try:
        emb_live, _ = extract_single_face_embedding(live_file, is_registration=False)
        emb_reg, _ = extract_single_face_embedding(registered_file, is_registration=False)
        sim = compute_similarity(emb_live, emb_reg)
        matched = sim >= threshold
        return matched, sim, f"ArcFace similarity: {sim:.4f} (threshold: {threshold})"
    except Exception as exc:
        return False, 0.0, str(exc)
