"""
FILE: apps/bookings/permissions.py
PURPOSE: Object-level permissions for bookings — owners manage their own
          bookings; only the Principal may review rebooking requests.
"""
from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsBookingOwnerOrReadOnlyAdmin(BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.user.role == 'ADMIN' and request.method in SAFE_METHODS:
            return True
        return obj.user == request.user


class IsPrincipalForReview(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == 'PRINCIPAL')
