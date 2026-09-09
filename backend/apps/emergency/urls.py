from django.urls import path
from .views import IDCardLoginView, FaceLoginView, OnDutyMedicalStaffListView, EmergencyAccessLogListView

urlpatterns = [
    path('id-card-login/', IDCardLoginView.as_view(), name='id-card-login'),
    path('face-login/',    FaceLoginView.as_view(),   name='face-login'),
    path('on-duty/', OnDutyMedicalStaffListView.as_view(), name='on-duty-staff'),
    path('logs/', EmergencyAccessLogListView.as_view(), name='emergency-logs'),
]
