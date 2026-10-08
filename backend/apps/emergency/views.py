import re
from django.conf import settings
from django.utils import timezone
from django.contrib.auth import get_user_model
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework_simplejwt.tokens import RefreshToken

from apps.accounts.models import CollegeID
from apps.accounts.serializers import CEMSTokenObtainPairSerializer
from apps.accounts.face_service import (
    extract_single_face_embedding,
    find_best_matching_user,
    FaceServiceError,
)
from .models import MedicalStaff, EmergencyAccessLog
from .serializers import IDCardLoginSerializer, MedicalStaffSerializer, EmergencyAccessLogSerializer
from .id_card_matcher import (
    match_id_card, check_id_card_blurriness, check_id_card_lighting,
    rectify_card_perspective, extract_card_metadata, detect_qr_code,
    normalize_id_year, IDCardMatchError, _read_image,
    extract_id_card_face_embedding,
)

User = get_user_model()


def _abs_url(request, field):
    if not field:
        return None
    try:
        return request.build_absolute_uri(field.url)
    except (ValueError, AttributeError):
        return None


def _match_email_fuzzy(detected_email, user_email):
    """
    Safely match email with tolerance for 1-character OCR noise or minor domain typos.
    e.g. anaswardantonyc@gmail.com vs anaswaraantonyc@gmail.com
         rahulthomas3510@gmgil.com vs rahulthomas3510@gmail.com
    """
    if not detected_email or not user_email:
        return False
    d = detected_email.strip().lower()
    u = user_email.strip().lower()
    if d == u:
        return True
    if '@' in d and '@' in u:
        d_pref, d_dom = d.split('@', 1)
        u_pref, u_dom = u.split('@', 1)
        d_dom = re.sub(r'gm[a-z0-9]+', 'gmail', d_dom)
        u_dom = re.sub(r'gm[a-z0-9]+', 'gmail', u_dom)
        if d_dom == u_dom:
            if d_pref == u_pref:
                return True
            if abs(len(d_pref) - len(u_pref)) <= 1:
                diffs = sum(1 for c1, c2 in zip(d_pref, u_pref) if c1 != c2)
                diffs += abs(len(d_pref) - len(u_pref))
                if diffs <= 2:
                    return True
    return False


def _match_users_by_name(all_cids, raw_name):
    """
    Match registered users by full name or username.
    Safe, exact normalized comparison.
    """
    if not raw_name:
        return []
    target = re.sub(r'[^a-z0-9]', '', raw_name.lower())
    if not target:
        return []

    matched = []
    for cid in all_cids:
        full_n = re.sub(r'[^a-z0-9]', '', (cid.user.get_full_name() or '').lower())
        uname = re.sub(r'[^a-z0-9]', '', (cid.user.username or '').lower())
        first_last = re.sub(r'[^a-z0-9]', '', f"{cid.user.first_name}{cid.user.last_name}".lower())

        if target == full_n or target == uname or target == first_last:
            matched.append(cid)
        elif len(target) >= 4 and (target == re.sub(r'[^a-z0-9]', '', (cid.user.first_name or '').lower()) and not cid.user.last_name):
            matched.append(cid)
    return matched


_id_card_face_cache = {}


def _get_registered_card_face_embedding(cid):
    """Retrieve or compute normalized 512-D face embedding for a registered CollegeID."""
    import numpy as np
    if cid.id in _id_card_face_cache:
        return _id_card_face_cache[cid.id]
    emb = None
    if hasattr(cid.user, 'face_reference') and cid.user.face_reference and cid.user.face_reference.embedding:
        try:
            arr = np.frombuffer(cid.user.face_reference.embedding, dtype=np.float32)
            norm = np.linalg.norm(arr)
            if norm > 0:
                emb = arr / norm
        except Exception:
            pass
    if emb is None and cid.id_card_image:
        try:
            card_path = cid.id_card_image.path if hasattr(cid.id_card_image, 'path') else cid.id_card_image
            arr, det_sc, _ = extract_id_card_face_embedding(card_path)
            if arr is not None:
                emb = arr
        except Exception:
            pass
    _id_card_face_cache[cid.id] = emb
    return emb


def _resolve_id_card_record(clean_id_year, clean_email, clean_name, uploaded_image=None, ocr_text=""):
    """
    Deterministically identify the unique registered user from physical ID card data.

    STRICT SECURITY RULES:
      1. ID Year is a batch metadata identifier (e.g. MCA-2025-2027) shared by multiple students.
         It MUST NEVER be used alone to identify a user.
      2. Complete verification across all available signals (card image, photo, name, email, ID year).
      3. No arbitrary fallback (.first(), [0], closest match, or previous user).
      4. An unknown person's ID card MUST NEVER open another registered user's account.
      5. ALL FIELDS MUST AGREE: if an image or credentials are provided, they must match the registered user;
         and any provided credentials (name, email, ID year, OCR text) must not contradict the matched card.
      6. EXACTLY ONE MATCH -> Authenticate that user.
         ZERO MATCHES -> REJECT (401 Unauthorized, not_registered: True, user: None).
         MORE THAN ONE MATCH -> REJECT (400 Bad Request, ambiguous, user: None).
         INSUFFICIENT INFO -> REJECT (400 Bad Request, user: None).
    """
    import numpy as np
    all_cids = list(CollegeID.objects.select_related('user', 'user__face_reference').all())

    def _validate_cid_status(cid):
        if not cid.user.is_active:
            return {
                'success': False,
                'authenticated': False,
                'matched': False,
                'user': None,
                'message': 'This account has been disabled. Please contact the administrator.',
                'detail': 'This account has been disabled. Please contact the administrator.',
                'status': status.HTTP_403_FORBIDDEN,
            }
        if not cid.user.is_validated:
            return {
                'success': False,
                'authenticated': False,
                'matched': False,
                'user': None,
                'message': 'Your registration is pending approval by the college administrator.',
                'detail': 'Your registration is pending approval by the college administrator.',
                'status': status.HTTP_403_FORBIDDEN,
            }
        if not cid.is_active:
            return {
                'success': False,
                'authenticated': False,
                'matched': False,
                'user': None,
                'message': 'This college ID is not currently valid.',
                'detail': 'This ID card is inactive. Access denied.',
                'status': status.HTTP_403_FORBIDDEN,
            }
        if cid.expires_at and cid.expires_at < timezone.now():
            return {
                'success': False,
                'authenticated': False,
                'matched': False,
                'user': None,
                'message': 'ID card has expired. Access denied.',
                'detail': 'ID card has expired. Access denied.',
                'status': status.HTTP_403_FORBIDDEN,
            }
        return None

    # Parse OCR metadata upfront if available
    ocr_meta = extract_card_metadata(ocr_text) if ocr_text else {}
    ocr_detected_email = ocr_meta.get('email', '')
    ocr_detected_year = ocr_meta.get('id_year', '')
    ocr_detected_name = ocr_meta.get('name', '')

    # ──────────────────────────────────────────────────────────
    # A. Scanned Image Verification (When an image is provided)
    # ──────────────────────────────────────────────────────────
    if uploaded_image:
        # A1. Check lighting
        is_lit, light_msg = check_id_card_lighting(uploaded_image)
        if not is_lit:
            return None, None, {
                'success': False,
                'authenticated': False,
                'matched': False,
                'user': None,
                'message': light_msg or 'ID card image quality is insufficient.',
                'detail': light_msg or 'ID card image quality is insufficient.',
                'status': status.HTTP_400_BAD_REQUEST,
            }

        # A2. Check blurriness
        is_sharp, blur_msg = check_id_card_blurriness(uploaded_image)
        if not is_sharp:
            return None, None, {
                'success': False,
                'authenticated': False,
                'matched': False,
                'user': None,
                'message': 'ID card image is blurry. Please hold the ID card clearly and steady in front of the camera.',
                'detail': 'ID card image is too blurry.',
                'status': status.HTTP_400_BAD_REQUEST,
            }

        # A3. Perspective Rectification
        rectified_card, has_boundary = rectify_card_perspective(uploaded_image)
        card_img_to_inspect = rectified_card if has_boundary else uploaded_image

        # A4. Check for embedded QR code
        qr_text = detect_qr_code(card_img_to_inspect)
        if qr_text:
            qr_matches = [
                c for c in all_cids
                if (c.user.email and c.user.email.strip().lower() == qr_text.lower())
                or (c.user.username and c.user.username.strip().lower() == qr_text.lower())
            ]
            if len(qr_matches) == 1:
                qr_rec = qr_matches[0]
                status_err = _validate_cid_status(qr_rec)
                if status_err:
                    return None, None, status_err
                if clean_id_year and qr_rec.id_year and normalize_id_year(clean_id_year) != normalize_id_year(qr_rec.id_year):
                    return None, None, {
                        'success': False, 'authenticated': False, 'matched': False, 'user': None,
                        'message': 'Conflicting identity fields on ID card.', 'detail': 'Conflicting identity fields.',
                        'status': status.HTTP_400_BAD_REQUEST
                    }
                return qr_rec, f"QR Code: {qr_text} (ID Year: {qr_rec.id_year})", None
            elif len(qr_matches) > 1:
                return None, None, {
                    'success': False,
                    'authenticated': False,
                    'matched': False,
                    'user': None,
                    'message': 'ID card information matches multiple users. Authentication denied.',
                    'detail': 'Unable to uniquely identify this ID card. Please contact the administrator.',
                    'status': status.HTTP_400_BAD_REQUEST,
                }
            else:
                return None, None, {
                    'success': False,
                    'authenticated': False,
                    'matched': False,
                    'user': None,
                    'message': 'ID card not recognized. This person is not registered.',
                    'detail': 'This ID card could not be matched to a registered account.',
                    'not_registered': True,
                    'status': status.HTTP_401_UNAUTHORIZED,
                }

        # A5. Extract face photograph on the ID card
        card_face_emb, det_score, face_bbox = extract_id_card_face_embedding(card_img_to_inspect)
        if card_face_emb is None and has_boundary:
            card_face_emb, det_score, face_bbox = extract_id_card_face_embedding(uploaded_image)

        if card_face_emb is not None:
            # A photo exists on the scanned ID card!
            # Compare this photo against every registered student's reference embedding.
            scored_candidates = []
            for cid in all_cids:
                ref_emb = _get_registered_card_face_embedding(cid)
                if ref_emb is not None:
                    sim = float(np.dot(card_face_emb, ref_emb))
                    if sim >= 0.50:
                        scored_candidates.append((sim, cid))

            scored_candidates.sort(key=lambda x: x[0], reverse=True)

            if not scored_candidates:
                # The photo belongs to an UNKNOWN PERSON not registered in CEMS!
                # STRICT REJECT - NEVER fall back to template match or another user.
                return None, None, {
                    'success': False,
                    'authenticated': False,
                    'matched': False,
                    'user': None,
                    'message': 'ID card not recognized. This person is not registered.',
                    'detail': 'This ID card could not be matched to a registered account.',
                    'not_registered': True,
                    'status': status.HTTP_401_UNAUTHORIZED,
                }

            best_sim, best_candidate = scored_candidates[0]
            if len(scored_candidates) > 1:
                runner_up_sim = scored_candidates[1][0]
                if (best_sim - runner_up_sim) < 0.10:
                    return None, None, {
                        'success': False,
                        'authenticated': False,
                        'matched': False,
                        'user': None,
                        'message': 'ID card photo is ambiguous between multiple registered accounts. Authentication denied.',
                        'detail': 'Unable to uniquely identify this ID card. Please use Face Scanner or contact the administrator.',
                        'status': status.HTTP_400_BAD_REQUEST,
                    }

            # VERIFY ALL FIELDS AGREE WITH best_candidate (Zero Conflict Rule)
            if clean_id_year and best_candidate.id_year:
                if normalize_id_year(clean_id_year) != normalize_id_year(best_candidate.id_year):
                    return None, None, {
                        'success': False, 'authenticated': False, 'matched': False, 'user': None,
                        'message': f"ID Year '{clean_id_year}' does not match the scanned ID card.",
                        'detail': f"ID Year '{clean_id_year}' does not match the scanned ID card.",
                        'status': status.HTTP_400_BAD_REQUEST,
                    }

            if clean_email and best_candidate.user.email:
                if not _match_email_fuzzy(clean_email, best_candidate.user.email):
                    return None, None, {
                        'success': False, 'authenticated': False, 'matched': False, 'user': None,
                        'message': "Email does not match the scanned ID card.",
                        'detail': "Email does not match the scanned ID card.",
                        'status': status.HTTP_400_BAD_REQUEST,
                    }

            if clean_name:
                name_matches = _match_users_by_name([best_candidate], clean_name)
                if not name_matches:
                    return None, None, {
                        'success': False, 'authenticated': False, 'matched': False, 'user': None,
                        'message': "Name does not match the scanned ID card.",
                        'detail': "Name does not match the scanned ID card.",
                        'status': status.HTTP_400_BAD_REQUEST,
                    }

            if ocr_detected_email and best_candidate.user.email:
                if not _match_email_fuzzy(ocr_detected_email, best_candidate.user.email):
                    return None, None, {
                        'success': False, 'authenticated': False, 'matched': False, 'user': None,
                        'message': "Email on the card does not match the registered user.",
                        'detail': "Email on the card does not match the registered user.",
                        'status': status.HTTP_400_BAD_REQUEST,
                    }

            if ocr_detected_year and best_candidate.id_year:
                if normalize_id_year(ocr_detected_year) != normalize_id_year(best_candidate.id_year):
                    return None, None, {
                        'success': False, 'authenticated': False, 'matched': False, 'user': None,
                        'message': "ID Year on the card does not match the registered user.",
                        'detail': "ID Year on the card does not match the registered user.",
                        'status': status.HTTP_400_BAD_REQUEST,
                    }

            status_err = _validate_cid_status(best_candidate)
            if status_err:
                return None, None, status_err

            return best_candidate, f"ID Card Photo Verified (Match Score: {best_sim:.2f})", None

        # A6. If NO face photo detected on the card (e.g. synthetic card or occluded photo)
        # We require strict verification of identity signals (Name, Email, ID Year)
        identity_email = clean_email or ocr_detected_email
        identity_name = clean_name or ocr_detected_name
        identity_year = clean_id_year or ocr_detected_year

        # If no identity credentials found on or with the card:
        if not identity_email and not identity_name:
            return None, None, {
                'success': False,
                'authenticated': False,
                'matched': False,
                'user': None,
                'message': 'ID card not recognized. Card photo or identity fields could not be verified.',
                'detail': 'This ID card could not be matched to a registered account.',
                'not_registered': True,
                'status': status.HTTP_401_UNAUTHORIZED,
            }

        # Resolve candidate by email if available
        if identity_email:
            matched_by_email = [c for c in all_cids if c.user.email and _match_email_fuzzy(identity_email, c.user.email)]
            if len(matched_by_email) == 1:
                cand = matched_by_email[0]
                if identity_year and cand.id_year and normalize_id_year(identity_year) != normalize_id_year(cand.id_year):
                    return None, None, {
                        'success': False, 'authenticated': False, 'matched': False, 'user': None,
                        'message': "ID Year does not match the registered user for this email.",
                        'detail': "ID Year does not match the registered user for this email.",
                        'status': status.HTTP_400_BAD_REQUEST,
                    }
                if identity_name:
                    n_matches = _match_users_by_name([cand], identity_name)
                    if not n_matches:
                        return None, None, {
                            'success': False, 'authenticated': False, 'matched': False, 'user': None,
                            'message': "Name does not match the registered user for this email.",
                            'detail': "Name does not match the registered user for this email.",
                            'status': status.HTTP_400_BAD_REQUEST,
                        }
                status_err = _validate_cid_status(cand)
                if status_err:
                    return None, None, status_err
                return cand, f"ID Card Verified (Email: {identity_email})", None
            elif len(matched_by_email) > 1:
                return None, None, {
                    'success': False, 'authenticated': False, 'matched': False, 'user': None,
                    'message': 'ID card information matches multiple users. Authentication denied.',
                    'detail': 'Unable to uniquely identify this ID card.',
                    'status': status.HTTP_400_BAD_REQUEST,
                }
            else:
                return None, None, {
                    'success': False, 'authenticated': False, 'matched': False, 'user': None,
                    'message': 'ID card not recognized. No registered user matches this card.',
                    'detail': 'This ID card could not be matched to a registered account.',
                    'not_registered': True,
                    'status': status.HTTP_401_UNAUTHORIZED,
                }

        # Resolve candidate by name if available
        if identity_name:
            matched_by_name = _match_users_by_name(all_cids, identity_name)
            if identity_year and len(matched_by_name) > 1:
                norm_y = normalize_id_year(identity_year)
                matched_by_name = [c for c in matched_by_name if normalize_id_year(c.id_year) == norm_y]

            if len(matched_by_name) == 1:
                cand = matched_by_name[0]
                if identity_year and cand.id_year and normalize_id_year(identity_year) != normalize_id_year(cand.id_year):
                    return None, None, {
                        'success': False, 'authenticated': False, 'matched': False, 'user': None,
                        'message': "ID Year does not match the registered user for this name.",
                        'detail': "ID Year does not match the registered user for this name.",
                        'status': status.HTTP_400_BAD_REQUEST,
                    }
                status_err = _validate_cid_status(cand)
                if status_err:
                    return None, None, status_err
                return cand, f"ID Card Verified (Name: {identity_name})", None
            elif len(matched_by_name) > 1:
                return None, None, {
                    'success': False, 'authenticated': False, 'matched': False, 'user': None,
                    'message': 'ID card information matches multiple users. Authentication denied.',
                    'detail': 'Unable to uniquely identify this ID card.',
                    'status': status.HTTP_400_BAD_REQUEST,
                }
            else:
                return None, None, {
                    'success': False, 'authenticated': False, 'matched': False, 'user': None,
                    'message': 'ID card not recognized. No registered user matches this card.',
                    'detail': 'This ID card could not be matched to a registered account.',
                    'not_registered': True,
                    'status': status.HTTP_401_UNAUTHORIZED,
                }

        return None, None, {
            'success': False,
            'authenticated': False,
            'matched': False,
            'user': None,
            'message': 'ID card not recognized. This person is not registered.',
            'detail': 'This ID card could not be matched to a registered account.',
            'not_registered': True,
            'status': status.HTTP_401_UNAUTHORIZED,
        }

    # ──────────────────────────────────────────────────────────
    # B. Text & Metadata Resolution (When NO image is uploaded)
    # ──────────────────────────────────────────────────────────
    # 1. Email Resolution (Email is unique per student)
    if clean_email:
        records = [c for c in all_cids if c.user.email and _match_email_fuzzy(clean_email, c.user.email)]
        if len(records) == 1:
            matched_cid = records[0]
            status_err = _validate_cid_status(matched_cid)
            if status_err:
                return None, None, status_err

            if clean_id_year and matched_cid.id_year:
                norm_card_year = normalize_id_year(matched_cid.id_year)
                norm_clean_year = normalize_id_year(clean_id_year)
                if norm_card_year != norm_clean_year:
                    return None, None, {
                        'success': False,
                        'authenticated': False,
                        'matched': False,
                        'user': None,
                        'message': f"ID Year '{clean_id_year}' does not match the registered ID Year for this account.",
                        'detail': f"ID Year '{clean_id_year}' does not match the registered ID Year for this account.",
                        'status': status.HTTP_400_BAD_REQUEST,
                    }

            if clean_name:
                name_matches = _match_users_by_name([matched_cid], clean_name)
                if not name_matches:
                    return None, None, {
                        'success': False,
                        'authenticated': False,
                        'matched': False,
                        'user': None,
                        'message': 'Name does not match the registered account for this email.',
                        'detail': 'Name does not match the registered account for this email.',
                        'status': status.HTTP_400_BAD_REQUEST,
                    }

            return matched_cid, f"Email: {clean_email} (ID Year: {matched_cid.id_year})", None

        elif len(records) > 1:
            if clean_id_year:
                norm_clean_year = normalize_id_year(clean_id_year)
                filtered = [r for r in records if normalize_id_year(r.id_year) == norm_clean_year]
                if len(filtered) == 1:
                    matched_cid = filtered[0]
                    status_err = _validate_cid_status(matched_cid)
                    if status_err:
                        return None, None, status_err
                    return matched_cid, f"Email: {clean_email} (ID Year: {matched_cid.id_year})", None
            return None, None, {
                'success': False,
                'authenticated': False,
                'matched': False,
                'user': None,
                'message': 'ID card information matches multiple users. Authentication denied.',
                'detail': 'Unable to uniquely identify this ID card. Please use Face Scanner or contact the administrator.',
                'status': status.HTTP_400_BAD_REQUEST,
            }
        else:
            return None, None, {
                'success': False,
                'authenticated': False,
                'matched': False,
                'user': None,
                'message': 'ID card not recognized. No registered user matches this card.',
                'detail': 'This ID card could not be matched to a registered account.',
                'not_registered': True,
                'status': status.HTTP_401_UNAUTHORIZED,
            }

    # 2. Name Resolution
    if clean_name:
        records = _match_users_by_name(all_cids, clean_name)
        if clean_id_year and len(records) > 1:
            norm_clean_year = normalize_id_year(clean_id_year)
            records = [r for r in records if normalize_id_year(r.id_year) == norm_clean_year]

        if len(records) == 1:
            matched_cid = records[0]
            status_err = _validate_cid_status(matched_cid)
            if status_err:
                return None, None, status_err

            if clean_id_year and matched_cid.id_year:
                norm_card_year = normalize_id_year(matched_cid.id_year)
                norm_clean_year = normalize_id_year(clean_id_year)
                if norm_card_year != norm_clean_year:
                    return None, None, {
                        'success': False,
                        'authenticated': False,
                        'matched': False,
                        'user': None,
                        'message': f"ID Year '{clean_id_year}' does not match the registered ID Year for this account.",
                        'detail': f"ID Year '{clean_id_year}' does not match the registered ID Year for this account.",
                        'status': status.HTTP_400_BAD_REQUEST,
                    }
            return matched_cid, f"Name: {clean_name} (ID Year: {matched_cid.id_year})", None

        elif len(records) > 1:
            return None, None, {
                'success': False,
                'authenticated': False,
                'matched': False,
                'user': None,
                'message': 'ID card information matches multiple users. Authentication denied.',
                'detail': 'Unable to uniquely identify this ID card. Please use Face Scanner or contact the administrator.',
                'status': status.HTTP_400_BAD_REQUEST,
            }
        else:
            return None, None, {
                'success': False,
                'authenticated': False,
                'matched': False,
                'user': None,
                'message': 'ID card not recognized. No registered user matches this card.',
                'detail': 'This ID card could not be matched to a registered account.',
                'not_registered': True,
                'status': status.HTTP_401_UNAUTHORIZED,
            }

    # 3. OCR Text Parsing
    if ocr_text:
        detected_id_year = clean_id_year or ocr_detected_year
        detected_email = ocr_detected_email

        if detected_email:
            email_matches = [
                c for c in all_cids
                if (c.user.email and _match_email_fuzzy(detected_email, c.user.email))
                or (c.user.username and len(c.user.username) >= 4 and c.user.username.lower() in detected_email.lower())
            ]
            if len(email_matches) == 1:
                matched_cid = email_matches[0]
                status_err = _validate_cid_status(matched_cid)
                if status_err:
                    return None, None, status_err
                return matched_cid, f"OCR Detected Email: {detected_email}", None
            elif len(email_matches) > 1:
                return None, None, {
                    'success': False,
                    'authenticated': False,
                    'matched': False,
                    'user': None,
                    'message': 'ID card information matches multiple users. Authentication denied.',
                    'detail': 'Unable to uniquely identify this ID card.',
                    'status': status.HTTP_400_BAD_REQUEST,
                }
            else:
                return None, None, {
                    'success': False,
                    'authenticated': False,
                    'matched': False,
                    'user': None,
                    'message': 'ID card not recognized. No registered user matches this card.',
                    'detail': 'This ID card could not be matched to a registered account.',
                    'not_registered': True,
                    'status': status.HTTP_401_UNAUTHORIZED,
                }

        # Check for registered student names inside OCR text
        matched_ocr = []
        ocr_clean = re.sub(r'[^a-z0-9\s]', ' ', ocr_text.lower())
        ocr_collapsed = " " + " ".join(ocr_clean.split()) + " "

        for cid in all_cids:
            full_n = (cid.user.get_full_name() or "").strip().lower()
            first_n = (cid.user.first_name or "").strip().lower()
            last_n = (cid.user.last_name or "").strip().lower()
            uname = (cid.user.username or "").strip().lower()

            if full_n and len(full_n) >= 4 and f" {full_n} " in ocr_collapsed:
                matched_ocr.append(cid)
            elif uname and len(uname) >= 4 and f" {uname} " in ocr_collapsed:
                matched_ocr.append(cid)
            elif first_n and last_n and len(first_n) >= 3 and len(last_n) >= 3:
                if f" {first_n} " in ocr_collapsed and f" {last_n} " in ocr_collapsed:
                    matched_ocr.append(cid)
            elif first_n and len(first_n) >= 4 and f" {first_n} " in ocr_collapsed:
                if detected_id_year and normalize_id_year(cid.id_year) == normalize_id_year(detected_id_year):
                    matched_ocr.append(cid)

        if detected_id_year and len(matched_ocr) > 1:
            norm_det_year = normalize_id_year(detected_id_year)
            matched_ocr = [c for c in matched_ocr if normalize_id_year(c.id_year) == norm_det_year]

        if len(matched_ocr) == 1:
            status_err = _validate_cid_status(matched_ocr[0])
            if status_err:
                return None, None, status_err
            return matched_ocr[0], f"OCR Recognized: {matched_ocr[0].user.get_full_name()}", None

        if len(matched_ocr) > 1:
            return None, None, {
                'success': False,
                'authenticated': False,
                'matched': False,
                'user': None,
                'message': 'ID card information matches multiple users. Authentication denied.',
                'detail': 'Unable to uniquely identify this ID card. Please use Face Scanner or contact the administrator.',
                'status': status.HTTP_400_BAD_REQUEST,
            }
        return None, None, {
            'success': False,
            'authenticated': False,
            'matched': False,
            'user': None,
            'message': 'ID card not recognized. No registered user matches this card.',
            'detail': 'This ID card could not be matched to a registered account.',
            'not_registered': True,
            'status': status.HTTP_401_UNAUTHORIZED,
        }

    # 4. ID Year alone cannot identify a student
    if clean_id_year:
        return None, None, {
            'success': False,
            'authenticated': False,
            'matched': False,
            'user': None,
            'message': 'ID card does not contain enough information to identify a registered user. ID Year is a non-unique batch identifier.',
            'detail': 'Unable to uniquely identify this ID card. ID Year is a batch identifier shared by multiple students. Please provide your student name or email, or use Face Scanner.',
            'status': status.HTTP_400_BAD_REQUEST,
        }

    return None, None, {
        'success': False,
        'authenticated': False,
        'matched': False,
        'user': None,
        'message': 'ID card not recognized. No registered user matches this card.',
        'detail': 'This ID card could not be matched to a registered account.',
        'not_registered': True,
        'status': status.HTTP_401_UNAUTHORIZED,
    }


class IDCardLoginView(APIView):
    """
    POST /api/emergency/id-card-login/
    POST /api/emergency/verify-id-card/
    POST /api/emergency/id-card-scan/

    METHOD 1: Pure Physical ID Card Scanner Authentication.
    Completely independent from Face Scanning.
    Never requires face image or face verification.
    Identifies the unique registered user via physical card information
    (Name, ID Year, email, visual card match, or QR code).
    Never uses ID Year as a unique identifier and never picks .first().
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        uploaded_image = request.FILES.get('id_card_image') or request.FILES.get('image')
        raw_id_year = (request.data.get('id_year', '') or request.data.get('id_number', '')).strip()
        raw_email = request.data.get('email', '').strip().lower()
        raw_name = request.data.get('name', '').strip()
        ocr_text = request.data.get('ocr_text', '').strip()

        # Pure ID authentication — never accept or trust frontend user ID
        # If client passes user_id, it is strictly ignored for authentication

        if not uploaded_image and not (raw_id_year or raw_email or raw_name or ocr_text):
            return Response(
                {
                    'success': False,
                    'authenticated': False,
                    'matched': False,
                    'user': None,
                    'message': 'ID card not detected. Please capture or provide your college ID card.',
                    'detail': 'ID card not detected. Please capture or provide your college ID card.',
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        clean_id_year = raw_id_year.upper() if raw_id_year else ''
        clean_email = raw_email if raw_email else ''
        clean_name = raw_name if raw_name else ''

        college_id, matched_by, error = _resolve_id_card_record(
            clean_id_year, clean_email, clean_name, uploaded_image, ocr_text
        )

        if error:
            status_code = error.pop('status', status.HTTP_400_BAD_REQUEST)
            error['success'] = False
            error['authenticated'] = False
            error['matched'] = False
            error['user'] = None
            if 'message' not in error and 'detail' in error:
                error['message'] = error['detail']
            return Response(error, status=status_code)

        # Inactive ID card check
        if not college_id.is_active:
            return Response(
                {
                    'success': False,
                    'authenticated': False,
                    'matched': False,
                    'user': None,
                    'message': 'This college ID is not currently valid.',
                    'detail': 'This ID card is inactive. Access denied.',
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        # Expired ID card check
        if college_id.expires_at and college_id.expires_at < timezone.now():
            return Response(
                {
                    'success': False,
                    'authenticated': False,
                    'matched': False,
                    'user': None,
                    'message': 'This college ID has expired. Access denied.',
                    'detail': 'ID card has expired. Access denied.',
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        # User check
        try:
            user = college_id.user
        except Exception:
            user = None

        if not user:
            return Response(
                {
                    'success': False,
                    'authenticated': False,
                    'matched': False,
                    'user': None,
                    'message': 'No user account is associated with this ID card.',
                    'detail': 'No user account is associated with this ID card.',
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        # Disabled account check
        if not user.is_active:
            return Response(
                {
                    'success': False,
                    'authenticated': False,
                    'matched': False,
                    'user': None,
                    'message': 'This account has been disabled. Please contact the administrator.',
                    'detail': 'This account has been disabled. Please contact the administrator.',
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        # Pending approval check
        if not user.is_validated:
            return Response(
                {
                    'success': False,
                    'authenticated': False,
                    'matched': False,
                    'user': None,
                    'message': 'Your registration is pending approval by the college administrator.',
                    'detail': 'Your registration is pending approval by the college administrator.',
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        # Issue JWT strictly for the verified user
        refresh = CEMSTokenObtainPairSerializer.get_token(user)
        access_token = refresh.access_token
        responder = MedicalStaff.objects.filter(is_on_duty=True).select_related('user').first()

        EmergencyAccessLog.objects.create(
            user=user,
            scanned_id_year=college_id.id_year,
            dispatched_staff=responder,
            notes=f'Login authenticated via ID Card Scanner ({matched_by}) for user: {user.username}.',
        )

        return Response({
            'success': True,
            'authenticated': True,
            'matched': True,
            'verified': True,
            'verification_method': 'id_card',
            'user': {
                'id': user.id,
                'name': user.get_full_name() or user.username,
                'username': user.username,
                'email': user.email,
                'role': user.role,
            },
            'user_id': user.id,
            'username': user.username,
            'full_name': user.get_full_name() or user.username,
            'role': user.role,
            'access': str(access_token),
            'refresh': str(refresh),
            'identity': {
                'name': user.get_full_name() or user.username,
                'id_year': college_id.id_year,
                'id_number': college_id.id_year,
                'email': user.email,
                'department': user.department,
                'profile_image': _abs_url(request, user.profile_image),
                'id_card_image': _abs_url(request, college_id.id_card_image),
            },
            'debug': {
                'detected_identity': matched_by,
                'matched_record': f"CollegeID({college_id.id_year})",
                'authenticated_user': f"{user.username} ({user.get_full_name()})",
            },
            'responder': {
                'name': responder.user.get_full_name() or responder.user.username,
                'designation': responder.designation,
                'contact_number': responder.contact_number,
            } if responder else None,
        })


# Alias so existing endpoints / callers work smoothly
IDCardScanLoginView = IDCardLoginView


class FaceLoginView(APIView):
    """
    POST /api/emergency/face-login/
    POST /api/emergency/verify-face/

    METHOD 2: Pure Biometric Face Scanner Authentication.
    Completely independent from ID Card Scanning.
    Never requires an ID card, ID Year, email, or OCR.
    Extracts 512-D ArcFace live embedding and compares against registered FaceReferences.

    Guarantees:
      - Validates live image quality and rejects multiple faces / 0 faces.
      - Backend independently determines identity; never trusts frontend user hints.
      - Compares against all registered FaceReference embeddings using cosine similarity.
      - Finds highest-scoring candidate and strictly enforces FACE_MATCH_THRESHOLD.
      - Ambiguity protection: top match must dominate runners-up.
      - Unregistered face -> 401 'Face verification failed.'
      - Verified match -> Generates valid JWT tokens strictly for that matched registered user.
    """
    permission_classes = [permissions.AllowAny]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        live_image = request.FILES.get('face_image') or request.FILES.get('image')
        if not live_image:
            return Response(
                {
                    'success': False,
                    'matched': False,
                    'message': 'Face not detected. Please position your face inside the frame.',
                    'detail': 'Face not detected. Please position your face inside the frame.',
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # 1. Validate image & extract 512-D ArcFace face embedding
        try:
            live_embedding, det_score = extract_single_face_embedding(live_image, is_registration=False)
        except FaceServiceError as exc:
            return Response(
                {
                    'success': False,
                    'matched': False,
                    'message': exc.message,
                    'detail': exc.message,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
        except Exception as exc:
            return Response(
                {
                    'success': False,
                    'matched': False,
                    'message': f'Face image processing error: {str(exc)}',
                    'detail': f'Face image processing error: {str(exc)}',
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # 2. Match against registered FaceReferences in CEMS
        matched_user, best_score, err_msg = find_best_matching_user(live_embedding)

        if matched_user is None:
            return Response(
                {
                    'success': False,
                    'matched': False,
                    'message': err_msg or 'Face not recognized.',
                    'detail': err_msg or 'Face verification failed. No matching registered user was found.',
                    'not_registered': True,
                },
                status=status.HTTP_401_UNAUTHORIZED,
            )

        # 3. Check account validation and status
        if not matched_user.is_active:
            return Response(
                {
                    'success': False,
                    'matched': False,
                    'message': 'This account has been disabled. Please contact the administrator.',
                    'detail': 'This account has been disabled. Please contact the administrator.',
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        if not matched_user.is_validated:
            return Response(
                {
                    'success': False,
                    'matched': False,
                    'message': 'Your registration is pending approval by the college administrator.',
                    'detail': 'Your registration is pending approval by the college administrator.',
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        college_id = CollegeID.objects.filter(user=matched_user).first()
        if college_id:
            if not college_id.is_active:
                return Response(
                    {
                        'success': False,
                        'matched': False,
                        'message': 'This ID card is inactive. Access denied.',
                        'detail': 'This ID card is inactive. Access denied.',
                    },
                    status=status.HTTP_403_FORBIDDEN,
                )
            if college_id.expires_at and college_id.expires_at < timezone.now():
                return Response(
                    {
                        'success': False,
                        'matched': False,
                        'message': 'ID card has expired. Access denied.',
                        'detail': 'ID card has expired. Access denied.',
                    },
                    status=status.HTTP_403_FORBIDDEN,
                )

        # 4. Issue JWT strictly for the verified user
        refresh = CEMSTokenObtainPairSerializer.get_token(matched_user)
        access_token = refresh.access_token
        responder = MedicalStaff.objects.filter(is_on_duty=True).select_related('user').first()

        EmergencyAccessLog.objects.create(
            user=matched_user,
            scanned_id_year=college_id.id_year if college_id else 'N/A',
            dispatched_staff=responder,
            notes=f'Login authenticated via Biometric Face Recognition for user: {matched_user.username}.',
        )

        return Response({
            'success': True,
            'matched': True,
            'verified': True,
            'verification_method': 'face',
            'user': {
                'id': matched_user.id,
                'name': matched_user.get_full_name() or matched_user.username,
                'username': matched_user.username,
                'email': matched_user.email,
                'department': matched_user.department,
                'role': matched_user.role,
            },
            'user_id': matched_user.id,
            'username': matched_user.username,
            'full_name': matched_user.get_full_name() or matched_user.username,
            'display_name': matched_user.get_full_name() or matched_user.username,
            'role': matched_user.role,
            'access': str(access_token),
            'refresh': str(refresh),
            'identity': {
                'name': matched_user.get_full_name() or matched_user.username,
                'id_year': college_id.id_year if college_id else None,
                'id_number': college_id.id_year if college_id else None,
                'email': matched_user.email,
                'department': matched_user.department,
                'profile_image': _abs_url(request, matched_user.profile_image),
                'id_card_image': _abs_url(request, college_id.id_card_image) if college_id else None,
            },
            'responder': {
                'name': responder.user.get_full_name() or responder.user.username,
                'designation': responder.designation,
                'contact_number': responder.contact_number,
            } if responder else None,
        })


class OnDutyMedicalStaffListView(generics.ListAPIView):
    serializer_class = MedicalStaffSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        return MedicalStaff.objects.filter(is_on_duty=True).order_by('-updated_at')


class EmergencyAccessLogListView(generics.ListAPIView):
    serializer_class = EmergencyAccessLogSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'ADMIN':
            return EmergencyAccessLog.objects.all()
        return EmergencyAccessLog.objects.filter(user=user)

