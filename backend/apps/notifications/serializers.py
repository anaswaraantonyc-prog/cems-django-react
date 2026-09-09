"""
FILE: apps/notifications/serializers.py
PURPOSE: Serializer for the notification feed.
"""
from rest_framework import serializers
from .models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ['id', 'message', 'is_read', 'created_at']
        read_only_fields = fields
