"""
FILE: apps/lostfound/urls.py
PURPOSE: Router registration for lost & found items.
         Mounted at /api/lostfound/ in config/urls.py.
"""
from rest_framework.routers import DefaultRouter
from .views import LostFoundItemViewSet

router = DefaultRouter()
router.register('items', LostFoundItemViewSet, basename='lostfound-item')

urlpatterns = router.urls
