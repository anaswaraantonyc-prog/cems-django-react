"""
FILE: apps/bookings/apps.py
PURPOSE: AppConfig for the bookings app (Auditorium, Hostel, Canteen
         reservations, cancellations, and Principal rebooking flow).
"""
from django.apps import AppConfig


class BookingsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.bookings'
    verbose_name = 'Booking, Commerce & Rebooking'

    def ready(self):
        import apps.bookings.signals  # noqa: F401
