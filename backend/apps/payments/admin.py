"""
FILE: apps/payments/admin.py
PURPOSE: Django admin registrations for Payment and Refund ledger records.
"""
from django.contrib import admin
from .models import Payment, Refund


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ('id', 'booking', 'paid_by', 'amount', 'method', 'status', 'created_at')
    list_filter = ('status', 'method')
    search_fields = ('transaction_reference', 'paid_by__username')


@admin.register(Refund)
class RefundAdmin(admin.ModelAdmin):
    list_display = ('id', 'booking', 'refund_percentage', 'refund_amount', 'status', 'reviewed_by')
    list_filter = ('status', 'refund_percentage')
