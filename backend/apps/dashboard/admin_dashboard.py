"""
FILE: apps/dashboard/admin_dashboard.py
PURPOSE: Aggregates data for the Admin's dashboard — Master Financial
         Ledger summary, pending user validations, pending refunds
         (SRS Module 1).
"""
from apps.payments.services import get_ledger_summary
from apps.payments.models import Refund
from apps.accounts.models import User


def build_admin_dashboard():
    return {
        'ledger_summary': get_ledger_summary(),
        'pending_user_validations': User.objects.filter(is_validated=False).count(),
        'pending_refunds': Refund.objects.filter(status=Refund.Status.PENDING_REVIEW).count(),
    }
