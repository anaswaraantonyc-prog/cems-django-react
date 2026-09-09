"""
FILE: apps/lostfound/apps.py
PURPOSE: AppConfig for the lostfound app — reporting and matching lost
         and found campus items.
"""
from django.apps import AppConfig


class LostfoundConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.lostfound'
    verbose_name = 'Lost & Found'
