"""
FILE: apps/accounts/tests.py
PURPOSE: Unit tests for registration, JWT login (username & email), and Admin validation flow.
"""
from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from apps.accounts.models import CollegeID

User = get_user_model()


import os
from django.conf import settings

def _get_valid_face_image_bytes():
    path = os.path.join(settings.BASE_DIR, 'media', 'profile_images', 'std1.jpeg')
    with open(path, 'rb') as f:
        return f.read()

def _get_second_face_image_bytes():
    path = os.path.join(settings.BASE_DIR, 'media', 'profile_images', 'ans.png')
    with open(path, 'rb') as f:
        return f.read()


class RegistrationTests(APITestCase):
    def test_register_creates_unvalidated_user_with_face_reference(self):
        """1 & 4 & 5: Registration accepts single face and associates FaceReference with this user."""
        import io
        from PIL import Image
        url = reverse('register')
        buf = io.BytesIO()
        Image.new('RGB', (100, 100), color='white').save(buf, format='JPEG')
        dummy_id_image = SimpleUploadedFile("id.jpg", buf.getvalue(), content_type="image/jpeg")

        face_bytes = _get_valid_face_image_bytes()
        valid_face_file = SimpleUploadedFile("face.jpg", face_bytes, content_type="image/jpeg")

        payload = {
            'username': 'student1',
            'email': 's1@college.edu',
            'first_name': 'Alice',
            'last_name': 'Smith',
            'password': 'StrongPass123!',
            'password_confirm': 'StrongPass123!',
            'role': 'STUDENT',
            'phone_number': '9876543210',
            'id_year': 'MCA-2025-2027',
            'profile_image': valid_face_file,
            'id_card_image': dummy_id_image,
        }
        response = self.client.post(url, payload, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        user = User.objects.get(username='student1')
        self.assertFalse(user.is_validated)
        self.assertEqual(user.college_id.id_year, 'MCA-2025-2027')
        # Check FaceReference created and linked to this user
        self.assertTrue(user.has_face_reference)
        ref = user.face_reference
        self.assertEqual(ref.model_name, 'buffalo_sc')
        self.assertEqual(ref.embedding_dim, 512)
        vec = ref.get_embedding_vector()
        self.assertIsNotNone(vec)
        self.assertEqual(vec.shape, (512,))

    def test_registration_rejects_zero_face_image(self):
        """2. Registration rejects zero-face image."""
        import io
        from PIL import Image
        import numpy as np, cv2
        url = reverse('register')
        buf = io.BytesIO()
        Image.new('RGB', (100, 100), color='white').save(buf, format='JPEG')
        dummy_id_image = SimpleUploadedFile("id.jpg", buf.getvalue(), content_type="image/jpeg")

        np.random.seed(42)
        noise = np.random.randint(50, 200, (300, 300, 3), dtype=np.uint8)
        _, encoded = cv2.imencode('.jpg', noise)
        zero_face_file = SimpleUploadedFile("noise.jpg", encoded.tobytes(), content_type="image/jpeg")

        payload = {
            'username': 'student_zero_face',
            'email': 'zeroface@college.edu',
            'first_name': 'Zero',
            'last_name': 'Face',
            'password': 'StrongPass123!',
            'password_confirm': 'StrongPass123!',
            'role': 'STUDENT',
            'phone_number': '9876543219',
            'id_year': 'MCA-2025-2027',
            'profile_image': zero_face_file,
            'id_card_image': dummy_id_image,
        }
        response = self.client.post(url, payload, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('Face not detected', str(response.json()))

    def test_registration_rejects_multi_face_image(self):
        """3. Registration rejects multi-face image."""
        import io
        from PIL import Image
        import cv2, numpy as np
        url = reverse('register')
        buf = io.BytesIO()
        Image.new('RGB', (100, 100), color='white').save(buf, format='JPEG')
        dummy_id_image = SimpleUploadedFile("id.jpg", buf.getvalue(), content_type="image/jpeg")

        img1 = cv2.imread(os.path.join(settings.BASE_DIR, 'media', 'profile_images', 'std1.jpeg'))
        img2 = cv2.imread(os.path.join(settings.BASE_DIR, 'media', 'profile_images', 'ans.png'))
        h = 400
        w1 = int(img1.shape[1] * (h / img1.shape[0]))
        w2 = int(img2.shape[1] * (h / img2.shape[0]))
        combined = np.hstack([cv2.resize(img1, (w1, h)), cv2.resize(img2, (w2, h))])
        _, enc_multi = cv2.imencode('.jpg', combined)
        multi_face_file = SimpleUploadedFile("multi.jpg", enc_multi.tobytes(), content_type="image/jpeg")

        payload = {
            'username': 'student_multi_face',
            'email': 'multiface@college.edu',
            'first_name': 'Multi',
            'last_name': 'Face',
            'password': 'StrongPass123!',
            'password_confirm': 'StrongPass123!',
            'role': 'STUDENT',
            'phone_number': '9876543218',
            'id_year': 'MCA-2025-2027',
            'profile_image': multi_face_file,
            'id_card_image': dummy_id_image,
        }
        response = self.client.post(url, payload, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('Multiple faces detected', str(response.json()))

    def test_multiple_users_can_register_with_identical_id_year(self):
        """Proves ID Year is non-unique and multiple students in the same course/batch can register."""
        import io
        from PIL import Image
        url = reverse('register')
        buf = io.BytesIO()
        Image.new('RGB', (100, 100), color='white').save(buf, format='JPEG')
        id_image_bytes = buf.getvalue()

        face_a_bytes = _get_valid_face_image_bytes()
        face_b_bytes = _get_second_face_image_bytes()

        # Student A
        img_a = SimpleUploadedFile("a.jpg", face_a_bytes, content_type="image/jpeg")
        id_img_a = SimpleUploadedFile("ida.jpg", id_image_bytes, content_type="image/jpeg")
        res_a = self.client.post(url, {
            'username': 'batch_student_a',
            'email': 'student_a@college.edu',
            'first_name': 'Anaswara',
            'last_name': 'Antony',
            'password': 'StrongPass123!',
            'password_confirm': 'StrongPass123!',
            'role': 'STUDENT',
            'phone_number': '9876543211',
            'id_year': 'MCA-2025-2027',
            'profile_image': img_a,
            'id_card_image': id_img_a,
        }, format='multipart')
        self.assertEqual(res_a.status_code, status.HTTP_201_CREATED)

        # Student B with EXACT SAME ID Year
        img_b = SimpleUploadedFile("b.jpg", face_b_bytes, content_type="image/jpeg")
        id_img_b = SimpleUploadedFile("idb.jpg", id_image_bytes, content_type="image/jpeg")
        res_b = self.client.post(url, {
            'username': 'batch_student_b',
            'email': 'student_b@college.edu',
            'first_name': 'Rahul',
            'last_name': 'Thomas',
            'password': 'StrongPass123!',
            'password_confirm': 'StrongPass123!',
            'role': 'STUDENT',
            'phone_number': '9876543212',
            'id_year': 'MCA-2025-2027',
            'profile_image': img_b,
            'id_card_image': id_img_b,
        }, format='multipart')
        self.assertEqual(res_b.status_code, status.HTTP_201_CREATED)

        user_a = User.objects.get(username='batch_student_a')
        user_b = User.objects.get(username='batch_student_b')
        self.assertEqual(user_a.college_id.id_year, 'MCA-2025-2027')
        self.assertEqual(user_b.college_id.id_year, 'MCA-2025-2027')
        self.assertEqual(user_a.college_id.id_year, user_b.college_id.id_year)
        self.assertTrue(user_a.has_face_reference)
        self.assertTrue(user_b.has_face_reference)


class LoginTests(APITestCase):
    def setUp(self):
        self.student = User.objects.create_user(
            username='student_login_test',
            email='student_login@cems.edu',
            password='password123',
            role='STUDENT',
            is_validated=True,
            first_name='Student',
            last_name='Test',
        )

        self.admin = User.objects.create_user(
            username='admin_login_test',
            email='admin_login@cems.edu',
            password='adminpassword123',
            role='ADMIN',
            is_validated=True,
            first_name='Admin',
            last_name='Boss',
        )

    def test_student_login_with_username(self):
        url = reverse('login')
        response = self.client.post(url, {'username': 'student_login_test', 'password': 'password123'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)

    def test_student_login_with_email(self):
        url = reverse('login')
        response = self.client.post(url, {'username': 'student_login@cems.edu', 'password': 'password123'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)

    def test_admin_login_with_username(self):
        url = reverse('login')
        response = self.client.post(url, {'username': 'admin_login_test', 'password': 'adminpassword123'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertEqual(response.data.get('role'), 'ADMIN')

    def test_admin_login_with_email(self):
        url = reverse('login')
        response = self.client.post(url, {'username': 'admin_login@cems.edu', 'password': 'adminpassword123'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertEqual(response.data.get('role'), 'ADMIN')

    def test_student_login_invalid_password(self):
        url = reverse('login')
        response = self.client.post(url, {'username': 'student_login_test', 'password': 'wrongpassword'})
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class AdminValidationTests(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_user(username='admin1', password='pass1234', role='ADMIN', is_validated=True)
        self.student = User.objects.create_user(username='student2', password='pass1234', role='STUDENT')
        self.client.force_authenticate(self.admin)

    def test_admin_can_validate_user(self):
        url = reverse('validate-user', args=[self.student.id])
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.student.refresh_from_db()
        self.assertTrue(self.student.is_validated)


class UserManagementTests(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_user(
            username='admin_user_mgmt',
            email='admin_mgmt@cems.edu',
            password='pass1234',
            role='ADMIN',
            is_validated=True,
            first_name='Admin',
            last_name='User'
        )
        self.student = User.objects.create_user(
            username='student_mgmt',
            email='student_mgmt@cems.edu',
            password='pass1234',
            role='STUDENT',
            is_validated=True,
            first_name='Rahul',
            last_name='Thomas',
            phone_number='9876543210',
            department='Computer Science'
        )

    def test_admin_can_list_users(self):
        self.client.force_authenticate(self.admin)
        url = reverse('user-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data), 2)

    def test_student_cannot_list_users(self):
        self.client.force_authenticate(self.student)
        url = reverse('user-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_can_view_user_detail(self):
        self.client.force_authenticate(self.admin)
        url = reverse('user-detail', args=[self.student.id])
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['username'], 'student_mgmt')
        self.assertEqual(response.data['first_name'], 'Rahul')
        self.assertEqual(response.data['email'], 'student_mgmt@cems.edu')
        self.assertNotIn('password', response.data)

    def test_admin_can_edit_user_profile(self):
        self.client.force_authenticate(self.admin)
        url = reverse('user-detail', args=[self.student.id])
        payload = {
            'first_name': 'Rahul Jacob',
            'last_name': 'Thomas',
            'email': 'rahul.jacob@cems.edu',
            'department': 'Information Technology',
            'role': 'FACULTY',
        }
        response = self.client.patch(url, payload)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.student.refresh_from_db()
        self.assertEqual(self.student.first_name, 'Rahul Jacob')
        self.assertEqual(self.student.email, 'rahul.jacob@cems.edu')
        self.assertEqual(self.student.department, 'Information Technology')
        self.assertEqual(self.student.role, 'FACULTY')

    def test_student_cannot_edit_other_user_profile(self):
        self.client.force_authenticate(self.student)
        url = reverse('user-detail', args=[self.admin.id])
        payload = {'first_name': 'Hacked'}
        response = self.client.patch(url, payload)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class SelfProfileTests(APITestCase):
    def setUp(self):
        self.student = User.objects.create_user(
            username='student_self',
            email='student_self@cems.edu',
            password='pass1234',
            role='STUDENT',
            is_validated=True,
            first_name='Rahul',
            last_name='Jacob',
            phone_number='9876543210',
            department='MCA'
        )
        self.faculty = User.objects.create_user(
            username='faculty_self',
            email='faculty_self@cems.edu',
            password='pass1234',
            role='FACULTY',
            is_validated=True,
            first_name='Prof',
            last_name='Oak',
            phone_number='9876543211',
            department='Computer Science'
        )
        self.admin = User.objects.create_user(
            username='admin_self',
            email='admin_self@cems.edu',
            password='pass1234',
            role='ADMIN',
            is_validated=True,
            first_name='System',
            last_name='Admin'
        )

    def test_unauthenticated_user_cannot_access_me(self):
        url = reverse('me')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_authenticated_student_can_retrieve_own_profile(self):
        self.client.force_authenticate(self.student)
        url = reverse('me')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['username'], 'student_self')
        self.assertEqual(response.data['email'], 'student_self@cems.edu')
        self.assertEqual(response.data['first_name'], 'Rahul')
        self.assertEqual(response.data['last_name'], 'Jacob')
        self.assertEqual(response.data['role'], 'STUDENT')
        self.assertNotIn('password', response.data)

    def test_authenticated_faculty_can_retrieve_own_profile(self):
        self.client.force_authenticate(self.faculty)
        url = reverse('me')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['username'], 'faculty_self')
        self.assertEqual(response.data['role'], 'FACULTY')

    def test_authenticated_admin_can_retrieve_own_profile(self):
        self.client.force_authenticate(self.admin)
        url = reverse('me')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['username'], 'admin_self')
        self.assertEqual(response.data['role'], 'ADMIN')

    def test_user_can_update_all_own_profile_fields(self):
        self.client.force_authenticate(self.student)
        url = reverse('me')
        payload = {
            'username': 'rahul_updated',
            'first_name': 'Rahul Jacob',
            'last_name': 'Thomas',
            'email': 'rahul.thomas@cems.edu',
            'phone_number': '9123456789',
            'department': 'Artificial Intelligence',
            'role': 'FACULTY',
            'is_validated': True,
            'is_active': True,
            'id_year': 'MCA-2025-2027',
        }
        response = self.client.patch(url, payload)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.student.refresh_from_db()
        self.assertEqual(self.student.username, 'rahul_updated')
        self.assertEqual(self.student.first_name, 'Rahul Jacob')
        self.assertEqual(self.student.last_name, 'Thomas')
        self.assertEqual(self.student.email, 'rahul.thomas@cems.edu')
        self.assertEqual(self.student.phone_number, '9123456789')
        self.assertEqual(self.student.role, 'STUDENT')
        self.assertEqual(self.student.college_id.id_year, 'MCA-2025-2027')
        self.assertEqual(self.student.college_id.id_number, 'MCA-2025-2027')

    def test_admin_can_update_user_id_year(self):
        CollegeID.objects.get_or_create(user=self.student, defaults={'id_year': 'MCA-2024-2026'})
        self.client.force_authenticate(self.admin)
        url = reverse('user-detail', kwargs={'pk': self.student.pk})
        response = self.client.patch(url, {'id_year': 'MBA-2025-2027'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.student.refresh_from_db()
        self.assertEqual(self.student.college_id.id_year, 'MBA-2025-2027')

    def test_search_by_id_year_returns_multiple_users(self):
        # Assign same ID Year to both student and another user
        cid, _ = CollegeID.objects.get_or_create(user=self.student, defaults={'id_year': 'MCA-2025-2027'})
        cid.id_year = 'MCA-2025-2027'
        cid.save()

        user2 = User.objects.create_user(
            username='user2_mca',
            email='u2@cems.edu',
            password='password123',
            role='STUDENT',
            is_validated=True,
        )
        CollegeID.objects.create(user=user2, id_year='MCA-2025-2027')

        self.client.force_authenticate(self.admin)
        url = reverse('user-list')
        response = self.client.get(f"{url}?q=MCA-2025-2027")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get('results', response.data) if isinstance(response.data, dict) else response.data
        usernames = [u['username'] for u in results]
        self.assertIn(self.student.username, usernames)
        self.assertIn('user2_mca', usernames)



