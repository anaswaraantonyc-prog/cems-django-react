"""
FILE: apps/dashboard/tests.py
PURPOSE: Tests that each role dashboard is only reachable by its role.
"""
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status

User = get_user_model()


class DashboardAccessTests(APITestCase):
    def test_student_cannot_access_admin_dashboard(self):
        student = User.objects.create_user(username='s1', password='pass1234', role='STUDENT', is_validated=True)
        self.client.force_authenticate(student)
        response = self.client.get(reverse('dashboard-admin'))
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_can_access_admin_dashboard(self):
        admin = User.objects.create_user(username='a1', password='pass1234', role='ADMIN', is_validated=True)
        self.client.force_authenticate(admin)
        response = self.client.get(reverse('dashboard-admin'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
