"""
FILE: apps/gallery/urls.py
PURPOSE: Router registration for gallery items. Mounted at /api/gallery/.
"""
from rest_framework.routers import DefaultRouter
from .views import GalleryItemViewSet

router = DefaultRouter()
router.register('items', GalleryItemViewSet, basename='gallery-item')

urlpatterns = router.urls
