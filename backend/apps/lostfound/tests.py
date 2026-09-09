"""
FILE: apps/lostfound/tests.py
PURPOSE: Tests for lost/found item reporting and match suggestions.
"""
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from .models import LostFoundItem

User = get_user_model()


class LostFoundMatchTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='u1', password='pass1234', role='STUDENT', is_validated=True)
        self.client.force_authenticate(self.user)

    def test_report_and_match(self):
        LostFoundItem.objects.create(reported_by=self.user, item_status='FOUND', title='Blue Wallet', description='Found near canteen', category='Wallet')
        url = reverse('lostfound-item-list')
        response = self.client.post(url, {'item_status': 'LOST', 'title': 'Blue Wallet', 'description': 'Lost near library', 'category': 'Wallet'})
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
