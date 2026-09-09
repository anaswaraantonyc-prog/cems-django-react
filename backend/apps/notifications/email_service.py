"""
FILE: apps/notifications/email_service.py
PURPOSE: Outbound transactional emails (account activation, payment
         receipts, refund settlement, etc.), using Django's configured
         EMAIL_BACKEND from config/settings.py.
"""
from django.core.mail import send_mail
from django.conf import settings


def send_account_activated_email(user):
    send_mail(
        subject='CEMS: Your account has been activated',
        message=f"Hi {user.get_full_name() or user.username}, your account has been validated by the Admin. You now have full platform access.",
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[user.email] if user.email else [],
        fail_silently=True,
    )


def send_refund_settled_email(user, refund):
    send_mail(
        subject='CEMS: Refund Update',
        message=f"Your refund request for booking #{refund.booking_id} has been {refund.status.lower()}. Amount: {refund.refund_amount}.",
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[user.email] if user.email else [],
        fail_silently=True,
    )
