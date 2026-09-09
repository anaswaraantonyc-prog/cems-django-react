"""
FILE: apps/bookings/urls.py
PURPOSE: Router registration for bookings + rebooking-requests endpoints.
         Mounted at /api/bookings/ in config/urls.py.
"""
from rest_framework.routers import DefaultRouter
from .views import BookingViewSet, RebookingRequestViewSet

router = DefaultRouter()
router.register('bookings', BookingViewSet, basename='booking')
router.register('rebookings', RebookingRequestViewSet, basename='rebooking')

urlpatterns = router.urls
