import io
from datetime import timedelta
from PIL import Image, ImageDraw
from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.utils import timezone
from rest_framework.test import APITestCase
import jwt
from django.conf import settings

from apps.accounts.models import CollegeID

User = get_user_model()


def _create_synthetic_face_image(seed=1):
    """Generate a clean synthetic portrait image with distinct features."""
    bg_color = (20 + (seed * 53) % 200, 20 + (seed * 71) % 200, 20 + (seed * 97) % 200)
    img = Image.new("RGB", (256, 256), color=bg_color)
    draw = ImageDraw.Draw(img)

    for i in range(12):
        draw.line([(0, i * 20), (255, (i * seed * 19) % 255)], fill=((seed * 43) % 255, (seed * 83) % 255, (seed * 123) % 255), width=3)

    skin_r = 160 + (seed * 27) % 85
    skin_g = 110 + (seed * 21) % 65
    skin_b = 80 + (seed * 17) % 45
    ox = 50 + (seed * 11) % 25
    oy = 35 + (seed * 7) % 20

    draw.ellipse([ox, oy, ox + 130, oy + 160], fill=(skin_r, skin_g, skin_b))
    draw.ellipse([ox + 25, oy + 45, ox + 45, oy + 60], fill=(15, 10, 10))
    draw.ellipse([ox + 85, oy + 45, ox + 105, oy + 60], fill=(15, 10, 10))
    draw.rectangle([ox + 55, oy + 65, ox + 75, oy + 95], fill=(skin_r - 30, skin_g - 25, skin_b - 20))
    draw.arc([ox + 35, oy + 105, ox + 95, oy + 125], start=0, end=180, fill=(120, 25, 25), width=4)

    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    return buf.getvalue()


def _create_synthetic_card_image(seed=1, text="MCA-2025-2027"):
    """Generate a clean synthetic ID card image with distinct border, pattern, and text."""
    img = Image.new("RGB", (320, 200), color=(245, 245, 248))
    draw = ImageDraw.Draw(img)
    draw.rectangle([10, 10, 310, 190], outline=(100 + (seed * 17) % 80, 20, 30), width=4)
    for i in range(8):
        draw.line([(20, 30 + i * 20), (300, (30 + i * seed * 19) % 190)], fill=((seed * 43) % 200, (seed * 83) % 200, (seed * 123) % 200), width=2)
    draw.text((25, 25), "COLLEGE ID CARD", fill=(80, 20, 30))
    draw.text((25, 75), text, fill=(20, 20, 20))
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    return buf.getvalue()


class IDCardEmergencyAuthenticationTests(APITestCase):
    """
    Test suite for METHOD 1: ID Card Scanner
    - Completely independent
    - Never uses ID Year alone
    - Never picks arbitrarily
    - Ignores frontend user_id overrides
    - Gracefully handles errors
    """
    def setUp(self):
        # Create User A (Rahul Jacob Thomas)
        self.user_a = User.objects.create_user(
            username='rahul',
            email='rahulthomas3510@gmail.com',
            password='password123',
            first_name='Rahul',
            last_name='Jacob Thomas',
            role='STUDENT',
            is_validated=True,
            is_active=True,
        )
        self.card_a_bytes = _create_synthetic_card_image(seed=1, text='Rahul Jacob Thomas MCA-2025-2027')
        self.card_a = CollegeID.objects.create(
            user=self.user_a,
            id_year='MCA-2025-2027',
            is_active=True,
            expires_at=timezone.now() + timedelta(days=365),
        )
        self.card_a.id_card_image.save('rahul_card.jpg', SimpleUploadedFile('rahul_card.jpg', self.card_a_bytes, content_type='image/jpeg'))

        # Create User B (Anaswara Antony) - SHARES SAME ID YEAR 'MCA-2025-2027'
        self.user_b = User.objects.create_user(
            username='anaswara',
            email='anaswaraantonyc@gmail.com',
            password='password123',
            first_name='Anaswara',
            last_name='Antony',
            role='STUDENT',
            is_validated=True,
            is_active=True,
        )
        self.card_b_bytes = _create_synthetic_card_image(seed=2, text='Anaswara Antony MCA-2025-2027')
        self.card_b = CollegeID.objects.create(
            user=self.user_b,
            id_year='MCA-2025-2027',
            is_active=True,
            expires_at=timezone.now() + timedelta(days=365),
        )
        self.card_b.id_card_image.save('anaswara_card.jpg', SimpleUploadedFile('anaswara_card.jpg', self.card_b_bytes, content_type='image/jpeg'))

    def test_1_valid_id_card_authenticates_correct_account(self):
        """1. Valid ID card -> correct account authenticated."""
        response = self.client.post('/api/emergency/verify-id-card/', {
            'email': 'rahulthomas3510@gmail.com',
            'id_year': 'MCA-2025-2027',
        })
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data['verified'])
        self.assertEqual(data['verification_method'], 'id_card')
        self.assertEqual(data['user_id'], self.user_a.id)
        self.assertEqual(data['username'], 'rahul')
        self.assertEqual(data['identity']['name'], 'Rahul Jacob Thomas')

    def test_2_invalid_id_card_rejected(self):
        """2. Invalid ID card -> rejected."""
        response = self.client.post('/api/emergency/verify-id-card/', {
            'email': 'nonexistent_student@gmail.com',
            'id_year': 'MCA-2025-2027',
        })
        self.assertEqual(response.status_code, 401)
        self.assertIn('This ID card could not be matched', response.json()['detail'])

    def test_3_same_id_year_shared_by_multiple_students_no_arbitrary_selection(self):
        """3. Same ID Year shared by multiple students -> no arbitrary selection."""
        # Submitting ONLY id_year when both Rahul and Anaswara share 'MCA-2025-2027'
        response = self.client.post('/api/emergency/verify-id-card/', {
            'id_year': 'MCA-2025-2027',
        })
        self.assertEqual(response.status_code, 400)
        detail = response.json()['detail']
        # Must refuse to pick arbitrarily and guide to Face Scanner
        self.assertTrue(
            "not a unique identifier" in detail or "Unable to uniquely identify" in detail or "Face Scanner" in detail
        )

    def test_4_ocr_failure_graceful_error(self):
        """4. OCR failure / unreadable card -> graceful error."""
        response = self.client.post('/api/emergency/verify-id-card/', {
            'ocr_text': 'Gibberish 12345 !@#$%^&*()',
        })
        self.assertEqual(response.status_code, 401)
        self.assertIn('could not be matched', response.json()['detail'])

    def test_5_card_not_detected_graceful_error(self):
        """5. Card not detected (empty request) -> graceful error."""
        response = self.client.post('/api/emergency/verify-id-card/', {})
        self.assertEqual(response.status_code, 400)
        self.assertIn('ID card not detected', response.json()['detail'])

    def test_6_inactive_id_rejected(self):
        """6. Inactive ID -> rejected."""
        self.card_a.is_active = False
        self.card_a.save()
        response = self.client.post('/api/emergency/verify-id-card/', {
            'email': 'rahulthomas3510@gmail.com',
        })
        self.assertEqual(response.status_code, 403)
        self.assertEqual(response.json()['detail'], 'This ID card is inactive. Access denied.')

    def test_7_frontend_cannot_force_another_users_id(self):
        """7. Frontend cannot force another user's ID -> rejected."""
        # Frontend maliciously sends user_id of user_b, but card details belong to user_a
        response = self.client.post('/api/emergency/verify-id-card/', {
            'user_id': self.user_b.id,
            'email': 'rahulthomas3510@gmail.com',
            'id_year': 'MCA-2025-2027',
        })
        self.assertEqual(response.status_code, 200)
        # Backend must authenticate user_a based on card, completely ignoring frontend user_id!
        self.assertEqual(response.json()['user_id'], self.user_a.id)
        self.assertNotEqual(response.json()['user_id'], self.user_b.id)

    def test_8_unregistered_person_id_card_rejected(self):
        """8. Unregistered person's ID card -> REJECTED (401). Must NOT return any user."""
        response = self.client.post('/api/emergency/verify-id-card/', {
            'name': 'George Varghese',
            'email': 'georgev@gmail.com',
            'id_year': 'MCA-2025-2027',
        })
        self.assertEqual(response.status_code, 401)
        data = response.json()
        self.assertFalse(data.get('authenticated', True))
        self.assertFalse(data.get('matched', True))
        self.assertTrue(data.get('not_registered', False))
        self.assertNotIn('user_id', data)
        self.assertNotIn('access', data)

    def test_9_unregistered_person_card_image_upload_rejected(self):
        """9. Unregistered card image uploaded -> REJECTED (401). No fallback to User A or User B."""
        # Create a synthetic card image with non-registered content
        unknown_card_bytes = _create_synthetic_card_image(seed=99, text='Unregistered Person MBA-2025-2027')
        unknown_file = SimpleUploadedFile('unknown_card.jpg', unknown_card_bytes, content_type='image/jpeg')
        response = self.client.post('/api/emergency/verify-id-card/', {
            'id_card_image': unknown_file,
        }, format='multipart')
        self.assertEqual(response.status_code, 401)
        data = response.json()
        self.assertFalse(data.get('authenticated', True))
        self.assertNotIn('user_id', data)

    def test_10_sequential_scan_user_a_then_unknown_person(self):
        """10. User A scans -> User A. Then Unknown person scans -> No user, rejection!"""
        # Step 1: User A scans
        res_a = self.client.post('/api/emergency/verify-id-card/', {
            'email': 'rahulthomas3510@gmail.com',
            'id_year': 'MCA-2025-2027',
        })
        self.assertEqual(res_a.status_code, 200)
        self.assertEqual(res_a.json()['user_id'], self.user_a.id)

        # Step 2: Unknown person scans immediately after
        res_unknown = self.client.post('/api/emergency/verify-id-card/', {
            'email': 'stranger@gmail.com',
            'id_year': 'MCA-2025-2027',
        })
        self.assertEqual(res_unknown.status_code, 401)
        self.assertNotIn('user_id', res_unknown.json())

    def test_11_sequential_scan_unknown_after_user_b(self):
        """11. User B scans -> User B. Then Unknown person scans -> No user, rejection!"""
        # Step 1: User B scans
        res_b = self.client.post('/api/emergency/verify-id-card/', {
            'email': 'anaswaraantonyc@gmail.com',
            'id_year': 'MCA-2025-2027',
        })
        self.assertEqual(res_b.status_code, 200)
        self.assertEqual(res_b.json()['user_id'], self.user_b.id)

        # Step 2: Unknown person scans
        res_unknown = self.client.post('/api/emergency/verify-id-card/', {
            'name': 'Unknown Visitor',
            'id_year': 'MCA-2025-2027',
        })
        self.assertEqual(res_unknown.status_code, 401)
        self.assertNotIn('user_id', res_unknown.json())

    def test_12_ocr_unregistered_student_name_rejected(self):
        """12. OCR text containing unregistered name -> REJECTED (401)."""
        response = self.client.post('/api/emergency/verify-id-card/', {
            'ocr_text': 'MACFAST Igniting wisdom since 2001 GEORGE VARGHESE MCA 2025-27 george@example.com',
        })
        self.assertEqual(response.status_code, 401)
        self.assertNotIn('user_id', response.json())

    def test_13_ocr_valid_student_a_recognized(self):
        """13. OCR text with registered student A -> Authenticates User A."""
        response = self.client.post('/api/emergency/verify-id-card/', {
            'ocr_text': 'MACFAST Igniting wisdom since 2001 RAHUL JACOB THOMAS MCA 2025-27 rahulthomas3510@gmail.com',
        })
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['user_id'], self.user_a.id)

    def test_14_ocr_valid_student_b_recognized(self):
        """14. OCR text with registered student B -> Authenticates User B."""
        response = self.client.post('/api/emergency/verify-id-card/', {
            'ocr_text': 'MACFAST Igniting wisdom since 2001 ANASWARA ANTONY MCA 2025-27 anaswaraantonyc@gmail.com',
        })
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['user_id'], self.user_b.id)

    def test_15_wrong_name_same_id_year_rejected(self):
        """15. Wrong name + same ID Year -> REJECTED (401)."""
        response = self.client.post('/api/emergency/verify-id-card/', {
            'name': 'Totally Fake Name',
            'id_year': 'MCA-2025-2027',
        })
        self.assertEqual(response.status_code, 401)
        self.assertFalse(response.json().get('authenticated', True))
        self.assertNotIn('user_id', response.json())

    def test_16_wrong_email_same_id_year_rejected(self):
        """16. Wrong email + same ID Year -> REJECTED (401)."""
        response = self.client.post('/api/emergency/verify-id-card/', {
            'email': 'completelywrongemail999@gmail.com',
            'id_year': 'MCA-2025-2027',
        })
        self.assertEqual(response.status_code, 401)
        self.assertFalse(response.json().get('authenticated', True))
        self.assertNotIn('user_id', response.json())

    def test_17_correct_name_wrong_email_same_id_year_rejected(self):
        """17. Correct name + wrong email + same ID Year -> REJECTED (400 conflicting)."""
        response = self.client.post('/api/emergency/verify-id-card/', {
            'name': 'Rahul Jacob Thomas',
            'email': 'someoneelse@gmail.com',
            'id_year': 'MCA-2025-2027',
        })
        # Email does not match the registered user for this name/email
        self.assertIn(response.status_code, [400, 401])
        self.assertFalse(response.json().get('authenticated', True))
        self.assertNotIn('user_id', response.json())

    def test_18_correct_email_wrong_name_same_id_year_rejected(self):
        """18. Correct email + wrong name + same ID Year -> REJECTED (400 conflicting)."""
        response = self.client.post('/api/emergency/verify-id-card/', {
            'email': 'rahulthomas3510@gmail.com',
            'name': 'Anaswara Antony',
            'id_year': 'MCA-2025-2027',
        })
        self.assertEqual(response.status_code, 400)
        self.assertFalse(response.json().get('authenticated', True))
        self.assertNotIn('user_id', response.json())

    def test_19_wrong_id_year_rejected(self):
        """19. Correct email + wrong ID Year -> REJECTED (400 mismatch)."""
        response = self.client.post('/api/emergency/verify-id-card/', {
            'email': 'rahulthomas3510@gmail.com',
            'id_year': 'BCA-2021-2024',
        })
        self.assertEqual(response.status_code, 400)
        self.assertFalse(response.json().get('authenticated', True))
        self.assertNotIn('user_id', response.json())

    def test_20_blurry_card_rejected(self):
        """20. Blurry card image -> REJECTED (400)."""
        # Create a single solid color image (Laplacian variance = 0)
        blurry_img = Image.new('RGB', (320, 200), color=(128, 128, 128))
        buf = io.BytesIO()
        blurry_img.save(buf, format='JPEG')
        file_obj = SimpleUploadedFile('blurry.jpg', buf.getvalue(), content_type='image/jpeg')
        response = self.client.post('/api/emergency/verify-id-card/', {
            'id_card_image': file_obj,
        }, format='multipart')
        self.assertEqual(response.status_code, 400)
        self.assertIn('blurry', response.json()['detail'].lower())

    def test_21_dark_card_rejected(self):
        """21. Excessively dark card image -> REJECTED (400)."""
        dark_img = Image.new('RGB', (320, 200), color=(5, 5, 5))
        buf = io.BytesIO()
        dark_img.save(buf, format='JPEG')
        file_obj = SimpleUploadedFile('dark.jpg', buf.getvalue(), content_type='image/jpeg')
        response = self.client.post('/api/emergency/verify-id-card/', {
            'id_card_image': file_obj,
        }, format='multipart')
        self.assertEqual(response.status_code, 400)
        self.assertIn('dark', response.json()['detail'].lower())

    def test_22_real_rahul_card_authenticates_rahul(self):
        """22. Real stored ID card of Rahul -> Authenticates Rahul ONLY."""
        card_file_path = os.path.join(settings.BASE_DIR, 'media', 'college_ids', 'std.jpeg')
        if os.path.exists(card_file_path):
            from apps.emergency.views import _id_card_face_cache
            _id_card_face_cache.clear()
            with open(card_file_path, 'rb') as f:
                card_bytes = f.read()
            self.card_a.id_card_image.save('std.jpeg', SimpleUploadedFile('std.jpeg', card_bytes, content_type='image/jpeg'))
            self.card_a.save()
            upload_file = SimpleUploadedFile('std.jpeg', card_bytes, content_type='image/jpeg')
            response = self.client.post('/api/emergency/verify-id-card/', {
                'id_card_image': upload_file,
            }, format='multipart')
            # If real Rahul card is uploaded, must authenticate Rahul
            self.assertEqual(response.status_code, 200)
            data = response.json()
            self.assertTrue(data['authenticated'])
            self.assertEqual(data['username'], 'rahul')
            self.assertEqual(data['user_id'], self.user_a.id)

    def test_23_real_anaswara_card_authenticates_anaswara(self):
        """23. Real stored ID card of Anaswara -> Authenticates Anaswara ONLY."""
        card_file_path = os.path.join(settings.BASE_DIR, 'media', 'college_ids', 'WhatsApp_Image_2026-10-06_at_11.45.42_AM.jpeg')
        if os.path.exists(card_file_path):
            from apps.emergency.views import _id_card_face_cache
            _id_card_face_cache.clear()
            with open(card_file_path, 'rb') as f:
                card_bytes = f.read()
            self.card_b.id_card_image.save('ans_card.jpeg', SimpleUploadedFile('ans_card.jpeg', card_bytes, content_type='image/jpeg'))
            self.card_b.save()
            upload_file = SimpleUploadedFile('anaswara_card.jpeg', card_bytes, content_type='image/jpeg')
            response = self.client.post('/api/emergency/verify-id-card/', {
                'id_card_image': upload_file,
            }, format='multipart')
            # Must authenticate Anaswara, NOT Rahul
            self.assertEqual(response.status_code, 200)
            data = response.json()
            self.assertTrue(data['authenticated'])
            self.assertEqual(data['username'], 'anaswara')
            self.assertEqual(data['user_id'], self.user_b.id)
            self.assertNotEqual(data['user_id'], self.user_a.id)

    def test_24_unknown_person_card_photo_rejected_never_rahul_or_anaswara(self):
        """24. Unknown person's photo on card -> REJECTED (401), NEVER Rahul or Anaswara."""
        stranger_face_path = os.path.join(settings.BASE_DIR, 'media', 'profile_images', 'jith.jpeg')
        if os.path.exists(stranger_face_path):
            # Paste stranger face onto card canvas
            stranger_face_img = Image.open(stranger_face_path).resize((180, 220))
            card_canvas = Image.new('RGB', (600, 800), color=(250, 250, 250))
            card_canvas.paste(stranger_face_img, (210, 200))
            d = ImageDraw.Draw(card_canvas)
            d.text((50, 50), "MACFAST Igniting wisdom since 2001", fill=(80, 20, 30))
            d.text((50, 500), "UNKNOWN STRANGER", fill=(20, 20, 20))
            d.text((50, 550), "MCA 2025-27", fill=(20, 20, 20))
            d.text((50, 600), "unknown@gmail.com", fill=(20, 20, 20))
            buf = io.BytesIO()
            card_canvas.save(buf, format='JPEG')
            upload_file = SimpleUploadedFile('stranger_card.jpg', buf.getvalue(), content_type='image/jpeg')

            response = self.client.post('/api/emergency/verify-id-card/', {
                'id_card_image': upload_file,
            }, format='multipart')
            self.assertEqual(response.status_code, 401)
            data = response.json()
            self.assertFalse(data.get('authenticated', True))
            self.assertNotIn('user_id', data)
            self.assertNotIn('access', data)

    def test_25_sequential_rahul_then_unknown_never_returns_rahul(self):
        """25. Sequential scan: Rahul valid scan -> 200, then immediate unknown scan -> 401, NOT Rahul!"""
        # Step 1: Rahul valid
        res_r = self.client.post('/api/emergency/verify-id-card/', {
            'email': 'rahulthomas3510@gmail.com',
            'id_year': 'MCA-2025-2027',
        })
        self.assertEqual(res_r.status_code, 200)
        self.assertEqual(res_r.json()['user_id'], self.user_a.id)

        # Step 2: Unknown scan
        res_u = self.client.post('/api/emergency/verify-id-card/', {
            'email': 'stranger@nowhere.com',
            'name': 'Unknown Person',
            'id_year': 'MCA-2025-2027',
        })
        self.assertEqual(res_u.status_code, 401)
        self.assertNotIn('user_id', res_u.json())

    def test_26_sequential_anaswara_then_unknown_never_returns_anaswara(self):
        """26. Sequential scan: Anaswara valid scan -> 200, then immediate unknown scan -> 401, NOT Anaswara!"""
        # Step 1: Anaswara valid
        res_a = self.client.post('/api/emergency/verify-id-card/', {
            'email': 'anaswaraantonyc@gmail.com',
            'id_year': 'MCA-2025-2027',
        })
        self.assertEqual(res_a.status_code, 200)
        self.assertEqual(res_a.json()['user_id'], self.user_b.id)

        # Step 2: Unknown scan
        res_u = self.client.post('/api/emergency/verify-id-card/', {
            'email': 'stranger2@nowhere.com',
            'name': 'Unknown Person 2',
            'id_year': 'MCA-2025-2027',
        })
        self.assertEqual(res_u.status_code, 401)
        self.assertNotIn('user_id', res_u.json())



import os
import cv2
import numpy as np
from apps.accounts.face_service import extract_single_face_embedding, save_user_face_reference
from apps.accounts.models import FaceReference


def _load_real_face_bytes(filename):
    path = os.path.join(settings.BASE_DIR, 'media', 'profile_images', filename)
    with open(path, 'rb') as f:
        return f.read()


class FaceEmergencyAuthenticationTests(APITestCase):
    """
    Test suite for METHOD 2: Face Scanner (Deep-Learning Biometrics)
    - Completely independent from ID Card Scanner
    - Compares live capture against registered FaceReference embeddings
    - Rejects invalid / multiple / poor quality / stranger faces
    - Ignores frontend user_id overrides
    - Distinguishes User A vs User B accurately
    """
    def setUp(self):
        self.user_a_bytes = _load_real_face_bytes('std1.jpeg')
        self.user_b_bytes = _load_real_face_bytes('ans.png')
        self.stranger_bytes = _load_real_face_bytes('jith.jpeg')

        self.user_a = User.objects.create_user(
            username='rahul_face',
            email='rahul_face@gmail.com',
            password='password123',
            first_name='Rahul',
            last_name='Thomas',
            role='STUDENT',
            is_validated=True,
            is_active=True,
        )
        self.user_a.profile_image.save('std1.jpeg', SimpleUploadedFile('std1.jpeg', self.user_a_bytes, content_type='image/jpeg'))
        emb_a, _ = extract_single_face_embedding(self.user_a_bytes, is_registration=False)
        save_user_face_reference(self.user_a, emb_a)

        self.user_b = User.objects.create_user(
            username='anaswara_face',
            email='anaswara_face@gmail.com',
            password='password123',
            first_name='Anaswara',
            last_name='Antony',
            role='STUDENT',
            is_validated=True,
            is_active=True,
        )
        self.user_b.profile_image.save('ans.png', SimpleUploadedFile('ans.png', self.user_b_bytes, content_type='image/png'))
        emb_b, _ = extract_single_face_embedding(self.user_b_bytes, is_registration=False)
        save_user_face_reference(self.user_b, emb_b)

    def test_6_correct_live_face_a_authenticates_user_a(self):
        """6. Correct person A's live face -> authenticates User A."""
        live_file = SimpleUploadedFile('camera_frame.jpg', self.user_a_bytes, content_type='image/jpeg')
        response = self.client.post('/api/emergency/verify-face/', {'face_image': live_file}, format='multipart')
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data['verified'])
        self.assertEqual(data['verification_method'], 'face')
        self.assertEqual(data['username'], 'rahul_face')
        self.assertEqual(data['user_id'], self.user_a.id)
        self.assertIn('access', data)
        self.assertIn('refresh', data)

    def test_6b_correct_live_face_b_authenticates_user_b(self):
        """6b. Correct person B's live face -> authenticates User B (distinguishes A vs B)."""
        live_file = SimpleUploadedFile('camera_frame_b.png', self.user_b_bytes, content_type='image/png')
        response = self.client.post('/api/emergency/verify-face/', {'face_image': live_file}, format='multipart')
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data['verified'])
        self.assertEqual(data['username'], 'anaswara_face')
        self.assertEqual(data['user_id'], self.user_b.id)

    def test_7_wrong_person_live_face_rejected(self):
        """7. Wrong / unregistered person's face -> rejected with 401."""
        stranger_file = SimpleUploadedFile('stranger.jpg', self.stranger_bytes, content_type='image/jpeg')
        response = self.client.post('/api/emergency/verify-face/', {'face_image': stranger_file}, format='multipart')
        self.assertEqual(response.status_code, 401)
        self.assertIn('Face verification failed', response.json()['detail'])

    def test_8_no_face_rejected(self):
        """8. No face provided -> rejected with 400."""
        response = self.client.post('/api/emergency/verify-face/', {})
        self.assertEqual(response.status_code, 400)
        self.assertIn('Face not detected', response.json()['detail'])

    def test_9_multiple_faces_rejected(self):
        """9. Multiple faces in live capture -> rejected."""
        img1 = cv2.imread(os.path.join(settings.BASE_DIR, 'media', 'profile_images', 'std1.jpeg'))
        img2 = cv2.imread(os.path.join(settings.BASE_DIR, 'media', 'profile_images', 'ans.png'))
        h = 400
        w1 = int(img1.shape[1] * (h / img1.shape[0]))
        w2 = int(img2.shape[1] * (h / img2.shape[0]))
        combined = np.hstack([cv2.resize(img1, (w1, h)), cv2.resize(img2, (w2, h))])
        _, enc_multi = cv2.imencode('.jpg', combined)
        multi_file = SimpleUploadedFile('multi.jpg', enc_multi.tobytes(), content_type='image/jpeg')

        response = self.client.post('/api/emergency/verify-face/', {'face_image': multi_file}, format='multipart')
        self.assertEqual(response.status_code, 400)
        self.assertIn('Only one person should be visible', response.json()['detail'])

    def test_10_poor_quality_rejected(self):
        """10. Poor quality / tiny / blurry face image -> rejected."""
        tiny_img = Image.new("RGB", (20, 20), color=(100, 100, 100))
        buf = io.BytesIO()
        tiny_img.save(buf, format="JPEG")
        tiny_file = SimpleUploadedFile('tiny.jpg', buf.getvalue(), content_type='image/jpeg')
        response = self.client.post('/api/emergency/verify-face/', {'face_image': tiny_file}, format='multipart')
        self.assertEqual(response.status_code, 400)
        self.assertIn('Face image quality is insufficient', response.json()['detail'])

    def test_11_user_without_face_reference_gives_clear_error(self):
        """11. User without face reference -> clear error."""
        FaceReference.objects.all().delete()
        live_file = SimpleUploadedFile('camera_frame.jpg', self.user_a_bytes, content_type='image/jpeg')
        response = self.client.post('/api/emergency/verify-face/', {'face_image': live_file}, format='multipart')
        self.assertEqual(response.status_code, 401)
        self.assertIn('No registered face references', response.json()['detail'])

    def test_12_frontend_cannot_specify_another_user_id_and_bypass_verification(self):
        """12. Frontend cannot specify user_id to bypass biometric verification."""
        # Face is user B, but frontend passes user_a.id in payload
        live_file = SimpleUploadedFile('camera_frame_b.png', self.user_b_bytes, content_type='image/png')
        response = self.client.post('/api/emergency/verify-face/', {
            'face_image': live_file,
            'user_id': self.user_a.id,
        }, format='multipart')
        self.assertEqual(response.status_code, 200)
        # Backend authenticated user B, ignoring the frontend's spoofed user_id
        self.assertEqual(response.json()['user_id'], self.user_b.id)
        self.assertNotEqual(response.json()['user_id'], self.user_a.id)

    def test_13_face_verification_does_not_use_id_year(self):
        """13. Face verification does not use ID Year to authenticate."""
        # Request has no ID Year parameter at all
        live_file = SimpleUploadedFile('camera_frame.jpg', self.user_a_bytes, content_type='image/jpeg')
        response = self.client.post('/api/emergency/verify-face/', {'face_image': live_file}, format='multipart')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['user_id'], self.user_a.id)

    def test_14_face_verification_does_not_require_id_card(self):
        """14. Face verification does not require an ID card image."""
        live_file = SimpleUploadedFile('camera_frame.jpg', self.user_a_bytes, content_type='image/jpeg')
        response = self.client.post('/api/emergency/verify-face/', {'face_image': live_file}, format='multipart')
        self.assertEqual(response.status_code, 200)
        self.assertNotIn('need_card', response.json())

    def test_16_successful_verification_opens_only_matched_user_emergency_profile(self):
        """16. Successful verification opens only the matched user's emergency profile."""
        live_file = SimpleUploadedFile('camera_frame.jpg', self.user_a_bytes, content_type='image/jpeg')
        response = self.client.post('/api/emergency/verify-face/', {'face_image': live_file}, format='multipart')
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data['user_id'], self.user_a.id)
        self.assertEqual(data['username'], 'rahul_face')
        self.assertEqual(data['display_name'], 'Rahul Thomas')
        self.assertEqual(data['identity']['email'], 'rahul_face@gmail.com')

    def test_17_verify_face_accepts_image_field_and_returns_clean_payload(self):
        """17. verify-face accepts 'image' field and returns standardized success/matched/user."""
        live_file = SimpleUploadedFile('face_test.jpg', self.user_a_bytes, content_type='image/jpeg')
        response = self.client.post('/api/emergency/verify-face/', {'image': live_file}, format='multipart')
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data.get('success'))
        self.assertTrue(data.get('matched'))
        self.assertIn('user', data)
        self.assertEqual(data['user']['id'], self.user_a.id)
        self.assertEqual(data['user']['username'], 'rahul_face')

    def test_18_verify_face_does_not_expose_embeddings_or_debug_scores(self):
        """18. verify-face response never exposes raw embeddings, internal vectors, or debug metrics."""
        live_file = SimpleUploadedFile('face_test.jpg', self.user_a_bytes, content_type='image/jpeg')
        response = self.client.post('/api/emergency/verify-face/', {'face_image': live_file}, format='multipart')
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertNotIn('embedding', data)
        self.assertNotIn('raw_embedding', data)
        self.assertNotIn('debug', data)
        self.assertNotIn('score', data)

    def test_19_unregistered_face_returns_proper_failure_payload(self):
        """19. Unknown face returns 401 with success=False, matched=False, and clear message."""
        stranger_file = SimpleUploadedFile('stranger.jpg', self.stranger_bytes, content_type='image/jpeg')
        response = self.client.post('/api/emergency/verify-face/', {'image': stranger_file}, format='multipart')
        self.assertEqual(response.status_code, 401)
        data = response.json()
        self.assertFalse(data.get('success'))
        self.assertFalse(data.get('matched'))
        self.assertIn('Face verification failed', data.get('message', ''))


class SeparationVerificationTests(APITestCase):
    """
    Test suite for SEPARATION:
    - ID-card scanner does not call or require face verification.
    - Face scanner does not call or require ID-card verification.
    - Both methods succeed completely independently.
    """
    def setUp(self):
        self.user_bytes = _load_real_face_bytes('std1.jpeg')
        self.user = User.objects.create_user(
            username='independent_student',
            email='independent@gmail.com',
            password='password123',
            first_name='Independent',
            last_name='Student',
            role='STUDENT',
            is_validated=True,
            is_active=True,
        )
        self.user.profile_image.save('student.jpg', SimpleUploadedFile('student.jpg', self.user_bytes, content_type='image/jpeg'))
        emb, _ = extract_single_face_embedding(self.user_bytes, is_registration=False)
        save_user_face_reference(self.user, emb)

        self.card = CollegeID.objects.create(
            user=self.user,
            id_year='MCA-2025-2027',
            is_active=True,
            expires_at=timezone.now() + timedelta(days=365),
        )

    def test_14_id_card_scanner_does_not_call_face_verification(self):
        """14. ID-card scanner does not call face verification."""
        # Request has NO face_image at all
        response = self.client.post('/api/emergency/verify-id-card/', {
            'email': 'independent@gmail.com',
            'id_year': 'MCA-2025-2027',
        })
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data['verification_method'], 'id_card')
        self.assertNotIn('need_face', data)

    def test_15_face_scanner_does_not_call_id_card_verification(self):
        """15. Face scanner does not call ID-card verification."""
        # Request has NO id_year, NO id_card_image, NO ocr_text
        live_file = SimpleUploadedFile('face.jpg', self.user_bytes, content_type='image/jpeg')
        response = self.client.post('/api/emergency/verify-face/', {'face_image': live_file}, format='multipart')
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data['verification_method'], 'face')
        self.assertEqual(data['user_id'], self.user.id)

    def test_16_id_card_authentication_succeeds_without_face_scanning(self):
        """16. ID-card authentication succeeds without face scanning."""
        response = self.client.post('/api/emergency/id-card-login/', {
            'email': 'independent@gmail.com',
            'name': 'Independent Student',
        })
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json()['verified'])
        self.assertEqual(response.json()['verification_method'], 'id_card')

    def test_17_face_authentication_succeeds_without_id_card_scanning(self):
        """17. Face authentication succeeds without ID-card scanning."""
        live_file = SimpleUploadedFile('face.jpg', self.user_bytes, content_type='image/jpeg')
        response = self.client.post('/api/emergency/face-login/', {'face_image': live_file}, format='multipart')
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json()['verified'])
        self.assertEqual(response.json()['verification_method'], 'face')
