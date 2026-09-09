"""
FILE: apps/bookings/validators.py
PURPOSE: Field validation for booking/rebooking input, enforcing that
         the Refund/Rebooking Description Boxes are never trivially empty
         (SRS Module 3: "comprehensive text reason").
"""
from django.core.exceptions import ValidationError
from django.utils import timezone


def validate_description_box(value):
    if not value or len(value.strip()) < 15:
        raise ValidationError('Description must be a comprehensive explanation (min 15 characters).')


def validate_future_datetime(value):
    if value <= timezone.now():
        raise ValidationError('Event/proposed date-time must be in the future.')
