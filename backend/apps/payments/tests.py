"""
FILE: apps/payments/tests.py
PURPOSE: Tests for the time-scaled refund percentage engine.
"""
from datetime import timedelta
from django.test import TestCase
from django.utils import timezone
from .refund_service import calculate_refund_percentage


class RefundEngineTests(TestCase):
    def test_full_refund_when_cancelled_early(self):
        event_time = timezone.now() + timedelta(hours=100)
        self.assertEqual(calculate_refund_percentage(event_time), 100)

    def test_seventy_percent_tier(self):
        event_time = timezone.now() + timedelta(hours=30)
        self.assertEqual(calculate_refund_percentage(event_time), 70)

    def test_fifty_percent_tier(self):
        event_time = timezone.now() + timedelta(hours=10)
        self.assertEqual(calculate_refund_percentage(event_time), 50)

    def test_zero_refund_last_minute(self):
        event_time = timezone.now() + timedelta(hours=2)
        self.assertEqual(calculate_refund_percentage(event_time), 0)
