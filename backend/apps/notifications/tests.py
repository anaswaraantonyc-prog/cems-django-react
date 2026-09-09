"""
FILE: apps/notifications/tests.py
PURPOSE: Tests for the notification feed and mark-as-read action.
"""
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from .models import Notification

User = get_user_model()


class NotificationTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='u1', password='pass1234', role='STUDENT', is_validated=True)
        self.client.force_authenticate(self.user)
        self.notif = Notification.objects.create(user=self.user, message='Test message')

    def test_mark_read(self):
        url = reverse('notification-read', args=[self.notif.id])
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.notif.refresh_from_db()
        self.assertTrue(self.notif.is_read)
