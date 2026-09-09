"""
FILE: apps/accounts/tests.py
PURPOSE: Unit tests for registration, JWT login, and Admin validation flow.
"""
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status

User = get_user_model()


class RegistrationTests(APITestCase):
    def test_register_creates_unvalidated_user(self):
        url = reverse('register')
        payload = {
            'username': 'student1', 'email': 's1@college.edu', 'first_name': 'A', 'last_name': 'B',
            'password': 'StrongPass123!', 'password_confirm': 'StrongPass123!', 'role': 'STUDENT',
        }
        response = self.client.post(url, payload)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        user = User.objects.get(username='student1')
        self.assertFalse(user.is_validated)


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
