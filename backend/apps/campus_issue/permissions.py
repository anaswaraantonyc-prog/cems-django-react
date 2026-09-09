"""
FILE: apps/campus_issue/permissions.py
PURPOSE: Only the Principal may view the full complaint feed and reply;
         regular users can submit and view only their own (non-anonymous) complaints.
"""
from rest_framework.permissions import BasePermission


class IsPrincipal(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == 'PRINCIPAL')
