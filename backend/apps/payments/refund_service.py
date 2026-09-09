"""
FILE: apps/payments/refund_service.py
PURPOSE: The time-scaled refund rule engine referenced throughout the SRS
         ("Time Delta rules: 50%/70%/100% returns"). Calculates the tier
         from REFUND_POLICY_TIERS in settings.py based on how many hours
         remained before the event at the moment of cancellation, and
         creates the Refund ledger record for Admin review.
"""
from django.conf import settings
from django.utils import timezone

from .models import Payment, Refund


def calculate_refund_percentage(event_datetime, cancelled_at=None):
    """
    Walks REFUND_POLICY_TIERS (sorted high->low hours) and returns the
    percentage for the first tier whose hour threshold is met.
    """
    cancelled_at = cancelled_at or timezone.now()
    hours_remaining = (event_datetime - cancelled_at).total_seconds() / 3600

    tiers = sorted(settings.REFUND_POLICY_TIERS, key=lambda t: t[0], reverse=True)
    for min_hours, percentage in tiers:
        if hours_remaining >= min_hours:
            return percentage
    return 0


def create_refund_for_booking(booking):
    """
    Called from apps.bookings.services.cancel_booking(). Computes the
    refund tier, locates the latest successful payment, and opens a
    Refund record in PENDING_REVIEW for the Admin's ledger queue.
    """
    percentage = calculate_refund_percentage(booking.event_datetime, booking.cancelled_at)
    payment = booking.payments.filter(status=Payment.Status.SUCCESS).order_by('-created_at').first()
    base_amount = payment.amount if payment else booking.amount
    refund_amount = (base_amount * percentage) / 100

    refund = Refund.objects.create(
        booking=booking,
        payment=payment,
        reason=booking.cancellation_reason,
        refund_percentage=percentage,
        refund_amount=refund_amount,
        status=Refund.Status.PENDING_REVIEW,
    )
    return refund


def settle_refund(refund: Refund, admin_user, decision: str, remarks: str = ''):
    """Admin's execution authority: reviews the queue and signs off on releasing funds."""
    refund.status = decision
    refund.reviewed_by = admin_user
    refund.admin_remarks = remarks
    refund.settled_at = timezone.now()
    refund.save(update_fields=['status', 'reviewed_by', 'admin_remarks', 'settled_at'])

    if decision == Refund.Status.APPROVED and refund.payment:
        refund.payment.status = Payment.Status.REFUNDED
        refund.payment.save(update_fields=['status'])
    return refund
