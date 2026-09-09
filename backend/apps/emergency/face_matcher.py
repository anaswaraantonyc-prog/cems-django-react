"""
Face-based login matcher for CEMS emergency access.

Uses full-image resizing + ORB feature matching + histogram correlation
to compare a live face capture against the registered profile image.
No cropping is performed, to ensure compatibility with half-body/non-centered
registered photos.

Works with opencv-python-headless — no Haar XML files needed.
No external AI models or cloud APIs are used.
"""
import cv2
import numpy as np


class FaceMatchError(Exception):
    pass


def _read_and_resize(file_obj, target=256):
    """Read file-like object → square grayscale numpy array (entire image)."""
    file_obj.seek(0)
    raw = file_obj.read()
    file_obj.seek(0)

    arr = np.frombuffer(raw, dtype=np.uint8)
    img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    if img is None:
        raise FaceMatchError("Could not decode the image.")

    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    # Resize entire image (no crop) to avoid cutting out faces in half-body registered pictures
    resized = cv2.resize(gray, (target, target))

    # Equalise histogram to normalise lighting
    equalized = cv2.equalizeHist(resized)
    return equalized


def _orb_score(img_a, img_b):
    """Return number of good ORB feature matches between two grayscale images."""
    orb = cv2.ORB_create(nfeatures=800, scaleFactor=1.2, nlevels=8, fastThreshold=8)
    kp1, des1 = orb.detectAndCompute(img_a, None)
    kp2, des2 = orb.detectAndCompute(img_b, None)

    if des1 is None or des2 is None or len(kp1) < 5 or len(kp2) < 5:
        return 0

    matcher = cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=False)
    pairs = matcher.knnMatch(des1, des2, k=2)

    good = 0
    for pair in pairs:
        if len(pair) == 2:
            a, b = pair
            if a.distance < 0.78 * b.distance:
                good += 1
    return good


def _hist_score(img_a, img_b):
    """Histogram correlation [0,1] between two grayscale images."""
    h_a = cv2.calcHist([img_a], [0], None, [64], [0, 256])
    h_b = cv2.calcHist([img_b], [0], None, [64], [0, 256])
    cv2.normalize(h_a, h_a)
    cv2.normalize(h_b, h_b)
    score = cv2.compareHist(h_a, h_b, cv2.HISTCMP_CORREL)
    return max(0.0, float(score))


def match_face(live_file, registered_file):
    """
    Compare a live camera face photo against the registered profile image.

    Returns (matched: bool, detail: str).
    matched=True  → similar enough → allow login.
    matched=False → too different   → deny login.
    """
    try:
        live_img = _read_and_resize(live_file)
        reg_img  = _read_and_resize(registered_file)
    except FaceMatchError as exc:
        return False, str(exc)
    except Exception as exc:
        return False, f"Image processing error: {exc}"

    orb  = _orb_score(live_img, reg_img)
    hist = _hist_score(live_img, reg_img)

    # Print to django runserver console for debugging / fine-tuning by developer/tester
    print(f"\n[FACE MATCH DEBUG] Comparing live vs registered: ORB_MATCHES={orb}, HIST_CORR={hist:.3f}")

    # Threshold for real-world face login:
    # - ORB matches >= 5 is standard for identifying main matching features.
    # - HIST correlation >= 0.40 ensures consistent background/brightness tones.
    matched = orb >= 5 and hist >= 0.40

    detail = f"face_orb={orb}, face_hist={hist:.2f}, matched={matched}"
    return matched, detail
