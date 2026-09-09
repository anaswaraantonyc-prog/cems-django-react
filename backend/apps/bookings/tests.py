"""
FILE: apps/bookings/tests.py
PURPOSE: Tests for booking creation, cancellation (Refund Description Box
         enforcement), and the rebooking approval flow.
"""
from datetime import timedelta
from django.contrib.auth import get_user_model
from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APITestCase
from rest_framework import status
from .models import Booking

User = get_user_model()


class BookingCancelTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='stud', password='pass1234', role='STUDENT', is_validated=True)
        self.client.force_authenticate(self.user)
        self.booking = Booking.objects.create(
            user=self.user, booking_type='AUDITORIUM', title='Tech Fest',
            event_datetime=timezone.now() + timedelta(days=5), amount=1000,
        )

    def test_cancel_requires_description_box(self):
        url = reverse('booking-cancel', args=[self.booking.id])
        response = self.client.post(url, {'reason': 'short'})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_cancel_with_valid_reason_triggers_refund(self):
        url = reverse('booking-cancel', args=[self.booking.id])
        response = self.client.post(url, {'reason': 'Venue double-booked due to unforeseen maintenance work.'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['refund_percentage'], 100)
