"""
FILE: apps/gallery/tests.py
PURPOSE: Basic test for gallery listing endpoint access.
"""
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status

User = get_user_model()


class GalleryListTests(APITestCase):
    def test_authenticated_user_can_list_gallery(self):
        user = User.objects.create_user(username='u1', password='pass1234', role='STUDENT', is_validated=True)
        self.client.force_authenticate(user)
        response = self.client.get(reverse('gallery-item-list'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
