"""
FILE: apps/gallery/views.py
PURPOSE: API endpoints for uploading and browsing the event gallery.
"""
from rest_framework import viewsets, permissions
from .models import GalleryItem
from .serializers import GalleryItemSerializer
from .permissions import IsUploaderOrReadOnly


class GalleryItemViewSet(viewsets.ModelViewSet):
    """/api/gallery/items/ — list (public) / upload / delete own."""
    serializer_class = GalleryItemSerializer
    permission_classes = [permissions.IsAuthenticated, IsUploaderOrReadOnly]
    filterset_fields = ['booking', 'is_public']

    def get_queryset(self):
        return GalleryItem.objects.filter(is_public=True) if self.request.user.role not in ('ADMIN',) else GalleryItem.objects.all()
