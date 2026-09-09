"""
FILE: apps/notifications/urls.py
PURPOSE: Routes for the notification feed. Mounted at /api/notifications/.
"""
from django.urls import path
from .views import NotificationListView, MarkNotificationReadView

urlpatterns = [
    path('', NotificationListView.as_view(), name='notification-list'),
    path('<int:pk>/read/', MarkNotificationReadView.as_view(), name='notification-read'),
]
