"""
FILE: apps/emergency/apps.py
PURPOSE: AppConfig for the emergency app — ID Card QR Login System,
         instant password bypass, and instant doctor dispatch (SRS Module 4).
"""
from django.apps import AppConfig


class EmergencyConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.emergency'
    verbose_name = 'Medical Emergency & Rapid Access'
