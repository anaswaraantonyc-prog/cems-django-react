"""
FILE: apps/bookings/tests.py
PURPOSE: Tests for booking creation, cancellation (Refund Description Box
         enforcement), the rebooking approval flow, and strict data isolation
         between students.
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
        self.user = User.objects.create_user(username='faculty_user', password='pass1234', role='FACULTY', is_validated=True)
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


class BookingOwnershipAndIsolationTests(APITestCase):
    """
    Verifies that Student A sees only their own booking history (Hostel, Canteen, Event)
    and can NEVER view, access, or cancel Student B's bookings.
    Also verifies Admin/Staff permissions.
    """
    def setUp(self):
        self.student_a = User.objects.create_user(username='student_a', password='password123', role='STUDENT', is_validated=True)
        self.student_b = User.objects.create_user(username='student_b', password='password123', role='STUDENT', is_validated=True)
        self.admin_user = User.objects.create_user(username='admin_boss', password='password123', role='ADMIN', is_validated=True)
        self.warden_user = User.objects.create_user(username='hostel_warden', password='password123', role='WARDEN', is_validated=True)
        self.canteen_user = User.objects.create_user(username='canteen_staff', password='password123', role='CANTEEN_STAFF', is_validated=True)

        # Student A bookings: Hostel and Canteen
        self.booking_a_hostel = Booking.objects.create(
            user=self.student_a, booking_type='HOSTEL', room_type='Single Room (AC)',
            title='Hostel Stay - Student A', event_datetime=timezone.now() + timedelta(days=10),
            amount=2000, details='Hostel Room 101'
        )
        self.booking_a_canteen = Booking.objects.create(
            user=self.student_a, booking_type='CANTEEN', title='Lunch Pre-order Student A',
            event_datetime=timezone.now() + timedelta(days=1), amount=150, details='Veg Lunch Meal'
        )

        # Student B bookings: Hostel and Canteen
        self.booking_b_hostel = Booking.objects.create(
            user=self.student_b, booking_type='HOSTEL', room_type='Dormitory (Non-AC)',
            title='Hostel Stay - Student B', event_datetime=timezone.now() + timedelta(days=12),
            amount=800, details='Hostel Room 204'
        )
        self.booking_b_canteen = Booking.objects.create(
            user=self.student_b, booking_type='CANTEEN', title='Canteen Snacks Student B',
            event_datetime=timezone.now() + timedelta(days=2), amount=90, details='Chicken Biriyani'
        )

    def test_student_a_sees_only_own_bookings_in_list(self):
        self.client.force_authenticate(self.student_a)
        response = self.client.get(reverse('booking-list'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get('results', response.data)
        booking_ids = [b['id'] for b in results]

        self.assertIn(self.booking_a_hostel.id, booking_ids)
        self.assertIn(self.booking_a_canteen.id, booking_ids)
        self.assertNotIn(self.booking_b_hostel.id, booking_ids)
        self.assertNotIn(self.booking_b_canteen.id, booking_ids)

    def test_student_b_sees_only_own_bookings_in_list(self):
        self.client.force_authenticate(self.student_b)
        response = self.client.get(reverse('booking-list'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get('results', response.data)
        booking_ids = [b['id'] for b in results]

        self.assertIn(self.booking_b_hostel.id, booking_ids)
        self.assertIn(self.booking_b_canteen.id, booking_ids)
        self.assertNotIn(self.booking_a_hostel.id, booking_ids)
        self.assertNotIn(self.booking_a_canteen.id, booking_ids)

    def test_student_a_cannot_access_student_b_booking_detail(self):
        self.client.force_authenticate(self.student_a)
        url = reverse('booking-detail', args=[self.booking_b_hostel.id])
        response = self.client.get(url)
        # Should be 404 Not Found (filtered out of queryset)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_student_a_cannot_cancel_student_b_booking(self):
        self.client.force_authenticate(self.student_a)
        url = reverse('booking-cancel', args=[self.booking_b_hostel.id])
        response = self.client.post(url, {'reason': 'Trying to cancel someone elses room'})
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_admin_can_see_all_bookings(self):
        self.client.force_authenticate(self.admin_user)
        response = self.client.get(reverse('booking-list'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get('results', response.data)
        booking_ids = [b['id'] for b in results]

        self.assertIn(self.booking_a_hostel.id, booking_ids)
        self.assertIn(self.booking_a_canteen.id, booking_ids)
        self.assertIn(self.booking_b_hostel.id, booking_ids)
        self.assertIn(self.booking_b_canteen.id, booking_ids)

    def test_warden_sees_hostel_bookings_only(self):
        self.client.force_authenticate(self.warden_user)
        response = self.client.get(reverse('booking-list'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get('results', response.data)
        booking_ids = [b['id'] for b in results]

        self.assertIn(self.booking_a_hostel.id, booking_ids)
        self.assertIn(self.booking_b_hostel.id, booking_ids)
        self.assertNotIn(self.booking_a_canteen.id, booking_ids)
        self.assertNotIn(self.booking_b_canteen.id, booking_ids)

    def test_canteen_staff_sees_canteen_orders_only(self):
        self.client.force_authenticate(self.canteen_user)
        response = self.client.get(reverse('booking-list'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get('results', response.data)
        booking_ids = [b['id'] for b in results]

        self.assertIn(self.booking_a_canteen.id, booking_ids)
        self.assertIn(self.booking_b_canteen.id, booking_ids)
        self.assertNotIn(self.booking_a_hostel.id, booking_ids)
        self.assertNotIn(self.booking_b_hostel.id, booking_ids)
