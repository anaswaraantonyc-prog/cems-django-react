"""
FILE: apps/campus_issue/services.py
PURPOSE: Business logic for the Principal replying to and resolving a
         complaint directly on-screen (SRS Module 5).
"""
from django.utils import timezone
from .models import Complaint


def reply_to_complaint(complaint: Complaint, reply_text: str, new_status: str = None):
    complaint.principal_reply = reply_text
    complaint.replied_at = timezone.now()
    complaint.status = new_status or Complaint.Status.IN_PROGRESS
    complaint.save(update_fields=['principal_reply', 'replied_at', 'status'])

    if complaint.submitted_by and not complaint.is_anonymous:
        from apps.notifications.services import create_notification
        create_notification(complaint.submitted_by, f"The Principal replied to your complaint: '{complaint.subject}'.")
    return complaint
