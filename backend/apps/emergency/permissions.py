"""
FILE: apps/emergency/permissions.py
PURPOSE: The QR-login endpoint must stay public (no prior auth token) —
         that is the entire point of the bypass — so it uses AllowAny at
         the view level; other emergency endpoints require standard auth.
"""
from rest_framework.permissions import BasePermission


class IsMedicalStaffOrAdmin(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role in ('MEDICAL_STAFF', 'ADMIN'))
