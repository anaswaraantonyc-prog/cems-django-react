"""
FILE: apps/campus_issue/urls.py
PURPOSE: Router registration for the complaints endpoint.
         Mounted at /api/campus-issues/ in config/urls.py.
"""
from rest_framework.routers import DefaultRouter
from .views import ComplaintViewSet

router = DefaultRouter()
router.register('complaints', ComplaintViewSet, basename='complaint')

urlpatterns = router.urls
