"""
FILE: apps/payments/models.py
PURPOSE: Master Financial Ledger models — every Payment made against a
         Booking, and the Refund lifecycle (time-scaled 50/70/100% tiers,
         Admin review queue, final settlement) described in SRS Module 1
         & 3.
"""
from django.conf import settings
from django.db import models
from apps.bookings.models import Booking


class Payment(models.Model):
    """
    A single transaction log entry. The Admin's Master Financial Ledger
    is effectively `Payment.objects.all()` filtered/aggregated by
    channel (Auditorium/Hostel/Canteen).
    """

    class Method(models.TextChoices):
        CARD = 'CARD', 'Card'
        UPI = 'UPI', 'UPI'
        NET_BANKING = 'NET_BANKING', 'Net Banking'
        WALLET = 'WALLET', 'Wallet'

    class Status(models.TextChoices):
        PENDING = 'PENDING', 'Pending'
        SUCCESS = 'SUCCESS', 'Success'
        FAILED = 'FAILED', 'Failed'
        REFUNDED = 'REFUNDED', 'Refunded'
        PARTIALLY_REFUNDED = 'PARTIALLY_REFUNDED', 'Partially Refunded'

    booking = models.ForeignKey(Booking, on_delete=models.CASCADE, related_name='payments')
    paid_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='payments')

    amount = models.DecimalField(max_digits=10, decimal_places=2)
    method = models.CharField(max_length=15, choices=Method.choices, default=Method.UPI)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    transaction_reference = models.CharField(max_length=100, unique=True)
    receipt = models.FileField(upload_to='receipts/', null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Payment#{self.id} {self.amount} [{self.status}]"


class Refund(models.Model):
    """
    SRS Module 1 & 3: system timeline calculates the owed percentage
    (50/70/100), then the Admin holds physical execution authority —
    reviews the queue, checks payment logs, and signs off on release.
    """

    class Status(models.TextChoices):
        PENDING_REVIEW = 'PENDING_REVIEW', 'Pending Admin Review'
        APPROVED = 'APPROVED', 'Approved / Released'
        REJECTED = 'REJECTED', 'Rejected'

    booking = models.ForeignKey(Booking, on_delete=models.CASCADE, related_name='refunds')
    payment = models.ForeignKey(Payment, null=True, blank=True, on_delete=models.SET_NULL, related_name='refunds')

    # Refund Description Box content is stored on Booking.cancellation_reason;
    # mirrored here for a self-contained ledger record.
    reason = models.TextField()

    refund_percentage = models.PositiveSmallIntegerField(help_text="Time-scaled tier: 50, 70, or 100.")
    refund_amount = models.DecimalField(max_digits=10, decimal_places=2)

    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING_REVIEW)
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL,
        related_name='settled_refunds', limit_choices_to={'role': 'ADMIN'},
    )
    admin_remarks = models.TextField(blank=True)
    settled_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Refund#{self.id} {self.refund_percentage}% -> {self.refund_amount} [{self.status}]"
