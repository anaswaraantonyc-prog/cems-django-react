"""
FILE: apps/payments/apps.py
PURPOSE: AppConfig for the payments app — master financial ledger,
         payment capture, and the time-scaled refund settlement engine
         (SRS Module 1).
"""
from django.apps import AppConfig


class PaymentsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.payments'
    verbose_name = 'Payments, Ledger & Refunds'
