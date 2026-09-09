"""
FILE: apps/payments/urls.py
PURPOSE: Router registration for payments/refunds + the ledger summary
         endpoint. Mounted at /api/payments/ in config/urls.py.
"""
from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import PaymentViewSet, RefundViewSet, LedgerSummaryView

router = DefaultRouter()
router.register('payments', PaymentViewSet, basename='payment')
router.register('refunds', RefundViewSet, basename='refund')

urlpatterns = [
    path('ledger/', LedgerSummaryView.as_view(), name='ledger-summary'),
] + router.urls
