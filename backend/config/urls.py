"""
FILE: config/urls.py
PURPOSE: Root URL configuration. Mounts every app's API routes under
         /api/<app>/ and wires up JWT token endpoints + Django admin.
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    path('admin/', admin.site.urls),

    # Auth (login/register/JWT) lives in accounts app
    path('api/auth/', include('apps.accounts.urls')),
    path('api/auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # Feature modules (SRS Module 1-5)
    path('api/bookings/', include('apps.bookings.urls')),
    path('api/payments/', include('apps.payments.urls')),
    path('api/campus-issues/', include('apps.campus_issue.urls')),
    path('api/emergency/', include('apps.emergency.urls')),
    path('api/lostfound/', include('apps.lostfound.urls')),
    path('api/notifications/', include('apps.notifications.urls')),
    path('api/gallery/', include('apps.gallery.urls')),
    path('api/dashboard/', include('apps.dashboard.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
