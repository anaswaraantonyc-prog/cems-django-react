"""
FILE: apps/dashboard/apps.py
PURPOSE: AppConfig for the dashboard app — aggregated, role-specific
         summary views for Admin, Principal, Faculty, Student, Canteen
         and Warden dashboards (no models: this app is read-only
         aggregation over other apps).
"""
from django.apps import AppConfig


class DashboardConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.dashboard'
    verbose_name = 'Role Dashboards'
