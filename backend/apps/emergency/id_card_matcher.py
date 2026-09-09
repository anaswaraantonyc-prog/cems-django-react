"""
Deterministic physical-ID-card matching.

This is deliberately NOT face recognition and does not use an AI model.
It uses OpenCV ORB feature detection + descriptor matching to compare the
camera photo of the physical card against the card image uploaded at
registration.

A successful result means the photographed card visually matches a stored
card. It does not prove that the person holding the card is its owner.
"""
import cv2
import numpy as np


class IDCardMatchError(Exception):
    pass


def _read_image(uploaded_file):
    uploaded_file.seek(0)
    raw = uploaded_file.read()
    uploaded_file.seek(0)
    array = np.frombuffer(raw, dtype=np.uint8)
    image = cv2.imdecode(array, cv2.IMREAD_GRAYSCALE)
    if image is None:
        raise IDCardMatchError('The uploaded image could not be read.')
    # Keep processing fast on a laptop camera.
    h, w = image.shape[:2]
    scale = min(1.0, 1400.0 / max(h, w))
    if scale < 1:
        image = cv2.resize(image, (int(w * scale), int(h * scale)))
    image = cv2.equalizeHist(image)
    return image


def _descriptor(image):
    orb = cv2.ORB_create(
        nfeatures=2500,   # more features helps with partial/angled card photos
        scaleFactor=1.2,
        nlevels=8,
        fastThreshold=10,
    )
    keypoints, descriptors = orb.detectAndCompute(image, None)
    return keypoints, descriptors


def match_id_card(uploaded_file, stored_file):
    """
    Return (matched, score). Score is the number of strong geometric matches.
    """
    camera_image = _read_image(uploaded_file)
    stored_image = _read_image(stored_file)

    kp1, des1 = _descriptor(camera_image)
    kp2, des2 = _descriptor(stored_image)

    if des1 is None or des2 is None or len(kp1) < 8 or len(kp2) < 8:
        return False, 0

    matcher = cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=False)
    pairs = matcher.knnMatch(des1, des2, k=2)

    good = []
    for pair in pairs:
        if len(pair) != 2:
            continue
        first, second = pair
        # Lowe's ratio test — 0.70 is stricter than 0.78
        if first.distance < 0.70 * second.distance:
            good.append(first)

    # A homography check removes many false matches from unrelated images.
    inliers = 0
    if len(good) >= 8:
        src = np.float32([kp1[m.queryIdx].pt for m in good]).reshape(-1, 1, 2)
        dst = np.float32([kp2[m.trainIdx].pt for m in good]).reshape(-1, 1, 2)
        matrix, mask = cv2.findHomography(src, dst, cv2.RANSAC, 5.0)
        if matrix is not None and mask is not None:
            inliers = int(mask.ravel().sum())

    score = max(inliers, min(len(good), 15))
    # Stricter thresholds: 12 inliers + score 15
    return score >= 15 and inliers >= 12, score
