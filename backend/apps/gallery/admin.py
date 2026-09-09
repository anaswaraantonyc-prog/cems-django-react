"""
FILE: apps/gallery/admin.py
PURPOSE: Django admin registration for GalleryItem.
"""
from django.contrib import admin
from .models import GalleryItem


@admin.register(GalleryItem)
class GalleryItemAdmin(admin.ModelAdmin):
    list_display = ('id', 'caption', 'uploaded_by', 'is_public', 'uploaded_at')
