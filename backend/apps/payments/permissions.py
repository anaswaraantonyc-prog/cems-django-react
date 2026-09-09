"""
FILE: apps/payments/permissions.py
PURPOSE: Only Admins may settle refunds or view the Master Financial
         Ledger; students/faculty may only view their own payments.
"""
from rest_framework.permissions import BasePermission


class IsAdminForLedger(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == 'ADMIN')
