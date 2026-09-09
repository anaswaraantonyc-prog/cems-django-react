"""
FILE: apps/gallery/models.py
PURPOSE: Stores photos/media uploaded for past college events, optionally
         linked to a Booking (e.g., Auditorium event) for context.
"""
from django.conf import settings
from django.db import models
from apps.bookings.models import Booking


class GalleryItem(models.Model):
    booking = models.ForeignKey(Booking, null=True, blank=True, on_delete=models.SET_NULL, related_name='gallery_items')
    uploaded_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='gallery_uploads')
    caption = models.CharField(max_length=200, blank=True)
    image = models.ImageField(upload_to='gallery/')
    is_public = models.BooleanField(default=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-uploaded_at']

    def __str__(self):
        return self.caption or f"GalleryItem#{self.id}"
