"""
FILE: apps/campus_issue/models.py
PURPOSE: Complaint model backing SRS Module 5's Integrated Complaints Web
         Interface — real-time feed to the Principal's dashboard with
         priority tags, bypassing mid-level administrative desks entirely.
"""
from django.conf import settings
from django.db import models


class Complaint(models.Model):
    class Priority(models.TextChoices):
        HIGH = 'HIGH', 'High'
        MEDIUM = 'MEDIUM', 'Medium'
        LOW = 'LOW', 'Low'

    class Status(models.TextChoices):
        OPEN = 'OPEN', 'Open'
        IN_PROGRESS = 'IN_PROGRESS', 'In Progress'
        RESOLVED = 'RESOLVED', 'Resolved'

    submitted_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name='complaints',
    )
    is_anonymous = models.BooleanField(default=False)

    subject = models.CharField(max_length=200)
    description = models.TextField(help_text="Anonymized or open text input submitted by the student/staff.")
    priority = models.CharField(max_length=10, choices=Priority.choices, default=Priority.MEDIUM)
    status = models.CharField(max_length=15, choices=Status.choices, default=Status.OPEN)

    # Principal's direct, confidential reply — bypasses mid-level admin desks
    principal_reply = models.TextField(blank=True)
    replied_at = models.DateTimeField(null=True, blank=True)

    submitted_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-submitted_at']

    def __str__(self):
        who = 'Anonymous' if self.is_anonymous else str(self.submitted_by)
        return f"Complaint#{self.id} [{self.priority}] by {who}"
