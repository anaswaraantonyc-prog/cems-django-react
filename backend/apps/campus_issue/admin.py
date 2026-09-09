"""
FILE: apps/campus_issue/admin.py
PURPOSE: Django admin registration for Complaint records.
"""
from django.contrib import admin
from .models import Complaint


@admin.register(Complaint)
class ComplaintAdmin(admin.ModelAdmin):
    list_display = ('id', 'subject', 'priority', 'status', 'is_anonymous', 'submitted_at')
    list_filter = ('priority', 'status', 'is_anonymous')
