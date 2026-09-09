"""
FILE: apps/dashboard/faculty_dashboard.py
PURPOSE: Aggregates data for the Faculty dashboard — their logged event
         cancellations and bookings (SRS Module 2: Faculty can log event
         cancellations).
"""
from apps.bookings.models import Booking


def build_faculty_dashboard(user):
    bookings = Booking.objects.filter(user=user)
    return {
        'total_bookings': bookings.count(),
        'cancelled_bookings': bookings.filter(status=Booking.Status.CANCELLED).count(),
        'upcoming_bookings': bookings.exclude(status__in=[Booking.Status.CANCELLED, Booking.Status.COMPLETED]).count(),
    }
