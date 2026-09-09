"""
FILE: apps/dashboard/urls.py
PURPOSE: Routes for each role-specific dashboard. Mounted at /api/dashboard/.
"""
from django.urls import path
from .views import (
    AdminDashboardView, PrincipalDashboardView, FacultyDashboardView,
    StudentDashboardView, CanteenDashboardView, WardenDashboardView,
)

urlpatterns = [
    path('admin/', AdminDashboardView.as_view(), name='dashboard-admin'),
    path('principal/', PrincipalDashboardView.as_view(), name='dashboard-principal'),
    path('faculty/', FacultyDashboardView.as_view(), name='dashboard-faculty'),
    path('student/', StudentDashboardView.as_view(), name='dashboard-student'),
    path('canteen/', CanteenDashboardView.as_view(), name='dashboard-canteen'),
    path('warden/', WardenDashboardView.as_view(), name='dashboard-warden'),
]
