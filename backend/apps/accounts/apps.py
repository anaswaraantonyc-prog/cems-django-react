"""
FILE: apps/accounts/apps.py
PURPOSE: Django AppConfig for the accounts app. Wires up signal
         registration (welcome email on user activation) on ready().
"""
from django.apps import AppConfig


class AccountsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.accounts'
    verbose_name = 'Accounts & Access Control'

    def ready(self):
        import apps.accounts.signals  # noqa: F401
