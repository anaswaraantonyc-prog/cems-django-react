"""
FILE: apps/dashboard/canteen_dashboard.py
PURPOSE: Aggregates data for the Canteen Staff dashboard — pending and
         upcoming Canteen/Program Food Pre-ordering bookings (SRS Module 3).
"""
from apps.bookings.models import Booking


def build_canteen_dashboard():
    canteen_bookings = Booking.objects.filter(booking_type=Booking.BookingType.CANTEEN)
    return {
        'pending_orders': canteen_bookings.filter(status=Booking.Status.PENDING).count(),
        'confirmed_orders': canteen_bookings.filter(status=Booking.Status.CONFIRMED).count(),
        'total_meals_today': sum(b.seats_or_units for b in canteen_bookings.filter(status=Booking.Status.CONFIRMED)),
    }
