"""
FILE: apps/notifications/services.py
PURPOSE: Central helper for creating in-app notifications — imported by
         every other app (bookings, campus_issue, lostfound, payments)
         to avoid duplicating notification-creation logic.
"""
from .models import Notification


def create_notification(user, message):
    return Notification.objects.create(user=user, message=message)
