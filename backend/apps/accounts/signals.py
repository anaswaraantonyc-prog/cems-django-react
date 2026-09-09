"""
FILE: apps/accounts/signals.py
PURPOSE: Fires a welcome/activation email via the notifications app when
         an Admin validates a user's profile.
"""
from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import User


@receiver(post_save, sender=User)
def notify_on_validation(sender, instance, created, **kwargs):
    """
    Only fires when `services.validate_user()` performed the save (it
    passes update_fields=['is_validated', ...]). A generic profile save
    — e.g. the user editing their own phone number via MeView — does not
    limit update_fields, so it will not re-trigger this email even though
    is_validated is already True.
    """
    update_fields = kwargs.get('update_fields')
    if created or not update_fields or 'is_validated' not in update_fields:
        return
    if instance.is_validated:
        from apps.notifications.email_service import send_account_activated_email
        send_account_activated_email(instance)
