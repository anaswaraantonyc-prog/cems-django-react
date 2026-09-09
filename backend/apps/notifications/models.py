"""
FILE: apps/notifications/models.py
PURPOSE: In-app notification model. Created by other apps' signals/
         services (booking updates, refund settlement, complaint replies,
         lost & found matches, etc.) and surfaced via a simple feed API.
"""
from django.conf import settings
from django.db import models


class Notification(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='notifications')
    message = models.CharField(max_length=255)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Notification -> {self.user}: {self.message[:40]}"
