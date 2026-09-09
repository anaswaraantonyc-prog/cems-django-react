"""
FILE: apps/emergency/admin.py
PURPOSE: Django admin registrations for MedicalStaff and EmergencyAccessLog.
"""
from django.contrib import admin
from .models import MedicalStaff, EmergencyAccessLog


@admin.register(MedicalStaff)
class MedicalStaffAdmin(admin.ModelAdmin):
    list_display = ('user', 'designation', 'contact_number', 'is_on_duty')
    list_filter = ('is_on_duty',)


@admin.register(EmergencyAccessLog)
class EmergencyAccessLogAdmin(admin.ModelAdmin):
    list_display = ('user', 'accessed_at', 'dispatched_staff')
