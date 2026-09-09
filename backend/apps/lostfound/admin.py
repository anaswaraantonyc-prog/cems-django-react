"""
FILE: apps/lostfound/admin.py
PURPOSE: Django admin registration for LostFoundItem.
"""
from django.contrib import admin
from .models import LostFoundItem


@admin.register(LostFoundItem)
class LostFoundItemAdmin(admin.ModelAdmin):
    list_display = ('title', 'item_status', 'category', 'reported_by', 'reported_at')
    list_filter = ('item_status', 'category')
    search_fields = ('title', 'description')
