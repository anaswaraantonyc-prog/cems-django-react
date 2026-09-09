"""
FILE: apps/bookings/admin.py
PURPOSE: Django admin registrations for Booking and RebookingRequest.
"""
from django.contrib import admin
from .models import Booking, RebookingRequest


@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = ('title', 'booking_type', 'user', 'status', 'event_datetime', 'amount')
    list_filter = ('booking_type', 'status', 'room_type')
    search_fields = ('title', 'user__username')


@admin.register(RebookingRequest)
class RebookingRequestAdmin(admin.ModelAdmin):
    list_display = ('id', 'original_booking', 'requested_by', 'status', 'proposed_datetime')
    list_filter = ('status',)
