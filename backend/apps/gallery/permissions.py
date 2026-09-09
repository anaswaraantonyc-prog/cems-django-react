"""
FILE: apps/gallery/permissions.py
PURPOSE: Anyone authenticated can view the public gallery; only the
         uploader or Admin can delete/edit an item.
"""
from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsUploaderOrReadOnly(BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return True
        return obj.uploaded_by == request.user or request.user.role == 'ADMIN'
