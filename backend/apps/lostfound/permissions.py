"""
FILE: apps/lostfound/permissions.py
PURPOSE: Only the reporter (or Admin) may edit/resolve a lost & found entry.
"""
from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsReporterOrReadOnly(BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return True
        return obj.reported_by == request.user or request.user.role == 'ADMIN'
