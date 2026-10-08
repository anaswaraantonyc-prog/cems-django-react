"""
Deterministic physical-ID-card matching for CEMS.

Uses OpenCV ORB feature detection + homography/RANSAC descriptor matching
to compare a camera photo of the physical card against registered card images.
Guarantees:
  - Does NOT authenticate on shared college ID template design alone.
  - Requires high unique feature inlier count and distinct card details.
  - Detects QR codes if present on the ID card.
  - Detects motion blur to prompt the user to hold the card steady.
"""
import cv2
import numpy as np


class IDCardMatchError(Exception):
    pass


def _read_image(uploaded_file):
    """Read file-like object or path -> grayscale numpy array."""
    if isinstance(uploaded_file, str):
        image = cv2.imread(uploaded_file, cv2.IMREAD_GRAYSCALE)
        if image is None:
            raise IDCardMatchError('Could not read stored card image.')
    elif hasattr(uploaded_file, 'seek'):
        uploaded_file.seek(0)
        raw = uploaded_file.read()
        uploaded_file.seek(0)
        array = np.frombuffer(raw, dtype=np.uint8)
        image = cv2.imdecode(array, cv2.IMREAD_GRAYSCALE)
        if image is None:
            raise IDCardMatchError('The uploaded image could not be read.')
    elif isinstance(uploaded_file, (bytes, bytearray)):
        array = np.frombuffer(uploaded_file, dtype=np.uint8)
        image = cv2.imdecode(array, cv2.IMREAD_GRAYSCALE)
        if image is None:
            raise IDCardMatchError('The uploaded image could not be read.')
    else:
        raise IDCardMatchError('Unsupported image input format.')

    h, w = image.shape[:2]
    scale = min(1.0, 800.0 / max(h, w))
    if scale < 1.0:
        image = cv2.resize(image, (int(w * scale), int(h * scale)), interpolation=cv2.INTER_AREA)
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    return clahe.apply(image)


def check_id_card_blurriness(uploaded_file):
    """
    Check if the captured ID card image is too blurry to extract features reliably.
    Returns (is_sharp: bool, message: str).
    """
    try:
        img = _read_image(uploaded_file)
    except Exception as exc:
        return False, str(exc)

    variance = cv2.Laplacian(img, cv2.CV_64F).var()
    if variance < 15.0:
        return False, "ID card image is blurry. Please hold the ID card clearly and steady in front of the camera."
    return True, ""


def check_id_card_lighting(uploaded_file):
    """
    Check if the captured ID card is too dark or overexposed with glare.
    Returns (ok: bool, message: str).
    """
    try:
        img = _read_image(uploaded_file)
    except Exception as exc:
        return False, str(exc)

    mean_val = float(np.mean(img))
    if mean_val < 25.0:
        return False, "ID card image is too dark. Please ensure sufficient ambient lighting."
    if mean_val > 245.0:
        return False, "ID card image is overexposed. Avoid direct light reflection or glare on the card."
    return True, ""


def rectify_card_perspective(uploaded_file):
    """
    Detect the physical ID card in the image and rectify its perspective.
    If a clear 4-corner boundary is found, applies 4-point perspective warp.
    Returns (rectified_image, detected: bool).
    """
    try:
        if isinstance(uploaded_file, str):
            bgr = cv2.imread(uploaded_file, cv2.IMREAD_COLOR)
        elif hasattr(uploaded_file, 'seek'):
            uploaded_file.seek(0)
            raw = uploaded_file.read()
            uploaded_file.seek(0)
            arr = np.frombuffer(raw, dtype=np.uint8)
            bgr = cv2.imdecode(arr, cv2.IMREAD_COLOR)
        elif isinstance(uploaded_file, (bytes, bytearray)):
            arr = np.frombuffer(uploaded_file, dtype=np.uint8)
            bgr = cv2.imdecode(arr, cv2.IMREAD_COLOR)
        else:
            return None, False
        if bgr is None:
            return None, False
    except Exception:
        return None, False

    h, w = bgr.shape[:2]
    gray = cv2.cvtColor(bgr, cv2.COLOR_BGR2GRAY)
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)
    thresh = cv2.adaptiveThreshold(blurred, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 11, 2)
    contours, _ = cv2.findContours(thresh, cv2.RETR_LIST, cv2.CHAIN_APPROX_SIMPLE)

    total_area = w * h
    best_card_contour = None
    max_area = 0

    for c in contours:
        area = cv2.contourArea(c)
        if area > 0.15 * total_area and area > max_area:
            peri = cv2.arcLength(c, True)
            approx = cv2.approxPolyDP(c, 0.02 * peri, True)
            if len(approx) == 4:
                rect = cv2.minAreaRect(c)
                rw, rh = rect[1]
                if rw > 0 and rh > 0:
                    ar = max(rw, rh) / min(rw, rh)
                    if 1.2 <= ar <= 2.2:
                        best_card_contour = approx
                        max_area = area

    if best_card_contour is not None:
        pts = best_card_contour.reshape(4, 2)
        rect = np.zeros((4, 2), dtype="float32")
        s = pts.sum(axis=1)
        rect[0] = pts[np.argmin(s)]
        rect[2] = pts[np.argmax(s)]
        diff = np.diff(pts, axis=1)
        rect[1] = pts[np.argmin(diff)]
        rect[3] = pts[np.argmax(diff)]

        (tl, tr, br, bl) = rect
        widthA = np.sqrt(((br[0] - bl[0]) ** 2) + ((br[1] - bl[1]) ** 2))
        widthB = np.sqrt(((tr[0] - tl[0]) ** 2) + ((tr[1] - tl[1]) ** 2))
        maxWidth = max(int(widthA), int(widthB))

        heightA = np.sqrt(((tr[0] - br[0]) ** 2) + ((tr[1] - br[1]) ** 2))
        heightB = np.sqrt(((tl[0] - bl[0]) ** 2) + ((tl[1] - bl[1]) ** 2))
        maxHeight = max(int(heightA), int(heightB))

        if maxWidth < maxHeight:
            maxWidth, maxHeight = maxHeight, maxWidth
            dst = np.array([
                [0, maxHeight - 1],
                [0, 0],
                [maxWidth - 1, 0],
                [maxWidth - 1, maxHeight - 1]
            ], dtype="float32")
        else:
            dst = np.array([
                [0, 0],
                [maxWidth - 1, 0],
                [maxWidth - 1, maxHeight - 1],
                [0, maxHeight - 1]
            ], dtype="float32")

        M = cv2.getPerspectiveTransform(rect, dst)
        warped = cv2.warpPerspective(bgr, M, (maxWidth, maxHeight))
        return warped, True

    return bgr, False


def normalize_id_year(val):
    """
    Deterministically normalize ID Year strings:
    e.g. 'MCA 2025-27' -> 'MCA-2025-2027'
         'mca-2025-2027' -> 'MCA-2025-2027'
         'MCA-2025-2027' -> 'MCA-2025-2027'
    ID Year is a batch metadata identifier and is NOT unique across students.
    """
    if not val:
        return ""
    import re
    s = str(val).strip().upper()
    m = re.search(r'([A-Z]{2,6})[\s-]+(\d{4})[\s-]+(\d{2,4})', s)
    if m:
        prefix = m.group(1)
        start_year = m.group(2)
        end_year = m.group(3)
        if len(end_year) == 2:
            end_year = f"20{end_year}"
        return f"{prefix}-{start_year}-{end_year}"
    return s


def extract_card_metadata(ocr_text=""):
    """
    Extract course duration / ID Year (e.g. MCA-2025-2027) and email from OCR text.
    Handles OCR spacing anomalies and 2-digit end years safely.
    """
    import re
    res = {'id_year': '', 'email': '', 'name': ''}
    if not ocr_text:
        return res

    # 1. Email extraction (with OCR space cleaning)
    # E.g. 'rahulthomas3510@gmail.com' or 'rahulthomas 3510@gmail.com'
    cleaned_ocr = ocr_text
    cleaned_ocr = re.sub(r'([\w\.-]+)\s*@\s*([\w\.-]+)\s*\.\s*([a-zA-Z]{2,4})', r'\1@\2.\3', cleaned_ocr)

    em = re.search(r'[\w\.-]+@[\w\.-]+\.[a-zA-Z]{2,4}', cleaned_ocr)
    if em:
        raw_email = em.group(0).lower()
        # Clean common OCR domain substitutions
        raw_email = re.sub(r'@gmgil\.com$', '@gmail.com', raw_email)
        raw_email = re.sub(r'@gmai1\.com$', '@gmail.com', raw_email)
        raw_email = re.sub(r'@gmall\.com$', '@gmail.com', raw_email)
        res['email'] = raw_email

    # 2. ID Year extraction (e.g. MCA-2025-2027 or MCA 2025-27)
    m = re.search(r'([A-Za-z]{2,6})[\s-]+(\d{4})[\s-]+(\d{2,4})', ocr_text)
    if m:
        res['id_year'] = normalize_id_year(m.group(0))

    # 3. Candidate Name extraction
    # Find potential student names: lines or words before the ID Year/email
    institution_words = {
        'MACFAST', 'COLLEGE', 'ADVANCED', 'STUDIES', 'TIRUVALLA', 'WISDOM',
        'SINCE', 'IGNITING', 'CAMPUS', 'EVENT', 'MANAGEMENT', 'SYSTEM',
        'MAR', 'ATHANASIOS', 'STUDENT', 'IDENTITY', 'CARD', 'UNIVERSITY',
        'GOVERNMENT', 'KERALA', 'INDIA', 'DEPARTMENT', 'AFFILIATED'
    }
    lines = [ln.strip() for ln in ocr_text.splitlines() if ln.strip()]
    candidate_names = []
    for line in lines:
        cleaned_line = re.sub(r'[^A-Za-z\s]', '', line).strip()
        words = [w for w in cleaned_line.split() if len(w) >= 2]
        if 1 <= len(words) <= 4:
            non_inst = [w for w in words if w.upper() not in institution_words]
            if len(non_inst) == len(words) and any(len(w) >= 3 for w in words):
                candidate_names.append(" ".join(words))

    if candidate_names:
        res['name'] = candidate_names[0]
        res['all_names'] = candidate_names

    return res


def extract_id_card_face_embedding(uploaded_file):
    """
    Detect portrait photograph on the physical ID card and extract 512-D ArcFace normalized embedding.
    Returns (embedding: np.ndarray or None, det_score: float, face_bbox: tuple or None).
    Guarantees:
      - Strictly deterministic.
      - Finds portrait face on the card.
      - Normalized to unit length for direct cosine similarity.
      - Returns (None, 0.0, None) if no face detected or file unreadable.
    """
    try:
        if isinstance(uploaded_file, str):
            bgr = cv2.imread(uploaded_file, cv2.IMREAD_COLOR)
        elif hasattr(uploaded_file, 'seek'):
            uploaded_file.seek(0)
            raw = uploaded_file.read()
            uploaded_file.seek(0)
            arr = np.frombuffer(raw, dtype=np.uint8)
            bgr = cv2.imdecode(arr, cv2.IMREAD_COLOR)
        elif isinstance(uploaded_file, (bytes, bytearray)):
            arr = np.frombuffer(uploaded_file, dtype=np.uint8)
            bgr = cv2.imdecode(arr, cv2.IMREAD_COLOR)
        elif isinstance(uploaded_file, np.ndarray):
            bgr = uploaded_file
        else:
            return None, 0.0, None

        if bgr is None:
            return None, 0.0, None

        from apps.accounts.face_service import get_face_app
        app = get_face_app()
        faces = app.get(bgr)
        if not faces:
            return None, 0.0, None

        # Pick the most prominent / highest scoring face on the ID card
        best_face = max(faces, key=lambda f: float(f.det_score) * ((f.bbox[2] - f.bbox[0]) * (f.bbox[3] - f.bbox[1])))
        emb = best_face.embedding.astype(np.float32)
        norm = np.linalg.norm(emb)
        if norm > 0:
            emb = emb / norm
        return emb, float(best_face.det_score), tuple(best_face.bbox)
    except Exception:
        return None, 0.0, None



def detect_qr_code(uploaded_file):
    """
    Attempt to read any QR code on the ID card.
    Returns decoded string or empty string.
    """
    try:
        if isinstance(uploaded_file, str):
            color = cv2.imread(uploaded_file, cv2.IMREAD_COLOR)
        elif hasattr(uploaded_file, 'seek'):
            uploaded_file.seek(0)
            raw = uploaded_file.read()
            uploaded_file.seek(0)
            arr = np.frombuffer(raw, dtype=np.uint8)
            color = cv2.imdecode(arr, cv2.IMREAD_COLOR)
        else:
            return ""

        if color is None:
            return ""

        detector = cv2.QRCodeDetector()
        data, _, _ = detector.detectAndDecode(color)
        return (data or "").strip()
    except Exception:
        return ""


def _descriptor(image):
    orb = cv2.ORB_create(
        nfeatures=3000,
        scaleFactor=1.15,
        nlevels=8,
        fastThreshold=5,
    )
    keypoints, descriptors = orb.detectAndCompute(image, None)
    return keypoints, descriptors


def match_id_card(uploaded_file, stored_file):
    """
    Return (matched: bool, score: int, inliers: int).

    Score is the count of strong geometric inliers found via RANSAC homography.
    - Genuine match on camera capture: typically 200 - 1200+ inliers.
    - Different card sharing the same college template: 15 - 40 inliers.
    - Completely different card: 0 - 10 inliers.
    """
    camera_image = _read_image(uploaded_file)
    stored_image = _read_image(stored_file)

    kp1, des1 = _descriptor(camera_image)
    kp2, des2 = _descriptor(stored_image)

    if des1 is None or des2 is None or len(kp1) < 8 or len(kp2) < 8:
        return False, 0, 0

    matcher = cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=False)
    pairs = matcher.knnMatch(des1, des2, k=2)

    good = [m[0] for m in pairs if len(m) == 2 and m[0].distance < 0.75 * m[1].distance]
    if len(good) < 12:
        return False, len(good), 0

    src_pts = np.float32([kp1[m.queryIdx].pt for m in good]).reshape(-1, 1, 2)
    dst_pts = np.float32([kp2[m.trainIdx].pt for m in good]).reshape(-1, 1, 2)
    matrix, mask = cv2.findHomography(src_pts, dst_pts, cv2.RANSAC, 5.0)

    if matrix is None or mask is None:
        return False, 0, 0

    inliers = int(mask.ravel().sum())
    score = inliers

    # Genuine physical card match against registered card image
    is_match = (inliers >= 100)
    return is_match, score, inliers

