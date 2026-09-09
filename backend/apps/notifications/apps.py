"""
FILE: apps/notifications/apps.py
PURPOSE: AppConfig for the notifications app — in-app notification feed
         and outbound email alerts used across all other modules.
"""
from django.apps import AppConfig


class NotificationsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.notifications'
    verbose_name = 'Notifications'
