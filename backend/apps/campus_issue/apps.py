"""
FILE: apps/campus_issue/apps.py
PURPOSE: AppConfig for the campus_issue app — the Complaint Box &
         Principal web portal (SRS Module 5).
"""
from django.apps import AppConfig


class CampusIssueConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.campus_issue'
    verbose_name = 'Complaint Box & Principal Portal'
