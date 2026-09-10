"""
FILE: apps/lostfound/models.py
PURPOSE: Model for lost/found item reports posted by students/staff,
         supporting the auto-matching engine in matching.py.
"""
from django.conf import settings
from django.db import models


class LostFoundItem(models.Model):
    class ItemStatus(models.TextChoices):
        LOST = 'LOST', 'Lost'
        FOUND = 'FOUND', 'Found'
        CLAIMED = 'CLAIMED', 'Claimed'

    reported_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='lostfound_items')
    item_status = models.CharField(max_length=10, choices=ItemStatus.choices)
    title = models.CharField(max_length=150)
    description = models.TextField()
    category = models.CharField(max_length=80, blank=True, help_text="e.g., Electronics, ID Card, Books.")
    location = models.CharField(max_length=150, blank=True)
    image = models.ImageField(upload_to='lost_found/', null=True, blank=True)
    video = models.FileField(upload_to='lost_found_videos/', null=True, blank=True)

    matched_with = models.ForeignKey(
        'self', null=True, blank=True, on_delete=models.SET_NULL, related_name='matched_by',
    )

    reported_at = models.DateTimeField(auto_now_add=True)
    resolved_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-reported_at']

    def __str__(self):
        return f"{self.item_status}: {self.title}"


class LostFoundMessage(models.Model):
    item = models.ForeignKey(LostFoundItem, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    text = models.TextField(blank=True)
    image = models.ImageField(upload_to='lost_found_chat/', null=True, blank=True)
    video = models.FileField(upload_to='lost_found_chat_videos/', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"Message by {self.sender} on {self.item}"
