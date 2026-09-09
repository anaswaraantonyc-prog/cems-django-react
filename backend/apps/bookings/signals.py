"""
FILE: apps/bookings/signals.py
PURPOSE: Sends an in-app/email notification whenever a booking is
         confirmed or cancelled, via the notifications app.
"""
from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Booking


@receiver(post_save, sender=Booking)
def notify_booking_status_change(sender, instance, created, **kwargs):
    from apps.notifications.services import create_notification
    if created:
        create_notification(instance.user, f"Booking '{instance.title}' created and pending confirmation.")
    elif instance.status == Booking.Status.CANCELLED:
        create_notification(instance.user, f"Booking '{instance.title}' was cancelled.")
