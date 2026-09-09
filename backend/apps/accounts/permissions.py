"""
FILE: apps/accounts/permissions.py
PURPOSE: Reusable DRF permission classes implementing the Financial
         Role-Based Access Control described in SRS Module 2. Imported
         by permissions.py of other apps (bookings, payments, etc.).
"""
from rest_framework.permissions import BasePermission


class IsAdmin(BasePermission):
    """Master Financial Ledger + refund settlement authority (Module 1)."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == 'ADMIN')


class IsPrincipal(BasePermission):
    """Rebooking authorization + Complaint Box authority (Module 2 & 5)."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == 'PRINCIPAL')


class IsFaculty(BasePermission):
    """Faculty can log event cancellations (Module 2)."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == 'FACULTY')


class IsStudent(BasePermission):
    """Students can make payments and trigger standard time-based refunds."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == 'STUDENT')


class IsValidatedUser(BasePermission):
    """Blocks platform access until the Admin has validated the profile."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.is_validated)


class IsOwnerOrAdmin(BasePermission):
    """Object-level: owner of the record, or an Admin, may access it."""
    def has_object_permission(self, request, view, obj):
        owner = getattr(obj, 'user', None) or getattr(obj, 'created_by', None)
        return request.user.role == 'ADMIN' or owner == request.user
