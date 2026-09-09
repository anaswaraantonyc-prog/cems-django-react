"""
FILE: apps/dashboard/warden_dashboard.py
PURPOSE: Aggregates data for the Warden dashboard — Hostel booking
         occupancy across the AC/Non-AC room-type matrix (SRS Module 3).
"""
from apps.bookings.models import Booking


def build_warden_dashboard():
    hostel_bookings = Booking.objects.filter(booking_type=Booking.BookingType.HOSTEL, status=Booking.Status.CONFIRMED)
    return {
        'ac_occupied_units': sum(b.seats_or_units for b in hostel_bookings.filter(room_type=Booking.RoomType.AC)),
        'non_ac_occupied_units': sum(b.seats_or_units for b in hostel_bookings.filter(room_type=Booking.RoomType.NON_AC)),
        'total_active_stays': hostel_bookings.count(),
    }
