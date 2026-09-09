"""
FILE: apps/campus_issue/tests.py
PURPOSE: Tests for complaint submission and Principal reply flow.
"""
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from .models import Complaint

User = get_user_model()


class ComplaintFlowTests(APITestCase):
    def setUp(self):
        self.student = User.objects.create_user(username='s1', password='pass1234', role='STUDENT', is_validated=True)
        self.principal = User.objects.create_user(username='p1', password='pass1234', role='PRINCIPAL', is_validated=True)

    def test_student_can_submit_complaint(self):
        self.client.force_authenticate(self.student)
        url = reverse('complaint-list')
        response = self.client.post(url, {'subject': 'Wifi down', 'description': 'Hostel wifi has been down for 3 days.', 'priority': 'HIGH'})
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_principal_can_reply(self):
        complaint = Complaint.objects.create(submitted_by=self.student, subject='Noise', description='Late night construction noise near hostel block.')
        self.client.force_authenticate(self.principal)
        url = reverse('complaint-reply', args=[complaint.id])
        response = self.client.post(url, {'reply': 'We will address this by tomorrow.', 'status': 'IN_PROGRESS'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
