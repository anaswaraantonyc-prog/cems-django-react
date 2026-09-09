"""
FILE: apps/accounts/urls.py
PURPOSE: URL routes for registration, JWT login, profile, and Admin user
         validation endpoints. Mounted at /api/auth/ in config/urls.py.
"""
from django.urls import path
from .views import (
    RegisterView, CEMSTokenObtainPairView, MeView,
    PendingUsersListView, ValidateUserView, RejectUserView, IssueCollegeIDView,
)

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', CEMSTokenObtainPairView.as_view(), name='login'),
    path('me/', MeView.as_view(), name='me'),
    path('pending/', PendingUsersListView.as_view(), name='pending-users'),
    path('pending/<int:pk>/validate/', ValidateUserView.as_view(), name='validate-user'),
    path('pending/<int:pk>/reject/', RejectUserView.as_view(), name='reject-user'),
    path('college-id/', IssueCollegeIDView.as_view(), name='issue-college-id'),
]
