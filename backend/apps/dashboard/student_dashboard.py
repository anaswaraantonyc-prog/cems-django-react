"""
FILE: apps/dashboard/student_dashboard.py
PURPOSE: Aggregates data for the Student dashboard — their bookings,
         payments, refund status, and unread notifications.
"""
from apps.bookings.models import Booking
from apps.payments.models import Refund
from apps.notifications.models import Notification


def build_student_dashboard(user):
    bookings = Booking.objects.filter(user=user)
    return {
        'my_bookings': bookings.count(),
        'active_bookings': bookings.filter(status__in=[Booking.Status.CONFIRMED, Booking.Status.REBOOKED]).count(),
        'pending_refunds': Refund.objects.filter(booking__user=user, status=Refund.Status.PENDING_REVIEW).count(),
        'unread_notifications': Notification.objects.filter(user=user, is_read=False).count(),
    }
