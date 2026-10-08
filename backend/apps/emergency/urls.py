from django.urls import path
from .views import (
    IDCardScanLoginView,
    IDCardLoginView,
    FaceLoginView,
    OnDutyMedicalStaffListView,
    EmergencyAccessLogListView,
)

urlpatterns = [
    # Method 1: ID Card Scanner endpoints
    path('id-card-scan/',   IDCardScanLoginView.as_view(),  name='id-card-scan'),
    path('id-card-login/',  IDCardLoginView.as_view(),      name='id-card-login'),
    path('verify-id-card/', IDCardLoginView.as_view(),      name='verify-id-card'),

    # Method 2: Face Scanner endpoints
    path('face-login/',     FaceLoginView.as_view(),        name='face-login'),
    path('verify-face/',    FaceLoginView.as_view(),        name='verify-face'),

    # Supporting endpoints
    path('on-duty/',        OnDutyMedicalStaffListView.as_view(), name='on-duty-staff'),
    path('logs/',           EmergencyAccessLogListView.as_view(), name='emergency-logs'),
]

