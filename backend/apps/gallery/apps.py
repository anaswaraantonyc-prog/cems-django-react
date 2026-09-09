"""
FILE: apps/gallery/apps.py
PURPOSE: AppConfig for the gallery app — event photo galleries.
"""
from django.apps import AppConfig


class GalleryConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.gallery'
    verbose_name = 'Event Gallery'
