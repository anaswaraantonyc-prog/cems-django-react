"""
FILE: apps/bookings/services.py
PURPOSE: Business logic for cancelling a booking (kicks off the refund
         pipeline) and for the Principal approving a rebooking request
         (moves the event to a new slot) — SRS Module 2 & 3.
"""
from django.utils import timezone
from .models import Booking, RebookingRequest


def cancel_booking(booking: Booking, user, reason: str):
    """
    Cancels a booking and attaches the mandatory Refund Description Box
    text to the ledger. Triggers a Refund record via the payments app's
    refund_service so the Admin can review/settle it.
    """
    booking.status = Booking.Status.CANCELLED
    booking.cancelled_at = timezone.now()
    booking.cancellation_reason = reason
    booking.cancelled_by = user
    booking.save(update_fields=['status', 'cancelled_at', 'cancellation_reason', 'cancelled_by'])

    from apps.payments.refund_service import create_refund_for_booking
    refund = create_refund_for_booking(booking)
    return booking, refund


def request_rebooking(booking: Booking, user, description: str, proposed_datetime):
    """User raises a Rebooking Description Box submission for a cancelled program."""
    booking.status = Booking.Status.REBOOKING_REQUESTED
    booking.save(update_fields=['status'])
    return RebookingRequest.objects.create(
        original_booking=booking, requested_by=user,
        description=description, proposed_datetime=proposed_datetime,
    )


def review_rebooking(rebooking: RebookingRequest, principal, decision: str, remarks: str = ''):
    """
    Principal reviews the cancellation path + description, then authorizes
    or rejects the dynamic calendar relocation (SRS Module 2).
    """
    rebooking.status = decision
    rebooking.reviewed_by = principal
    rebooking.principal_remarks = remarks
    rebooking.reviewed_at = timezone.now()
    rebooking.save(update_fields=['status', 'reviewed_by', 'principal_remarks', 'reviewed_at'])

    booking = rebooking.original_booking
    if decision == RebookingRequest.Status.APPROVED:
        booking.event_datetime = rebooking.proposed_datetime
        booking.status = Booking.Status.REBOOKED
        booking.save(update_fields=['event_datetime', 'status'])

        from apps.payments.rebooking_service import withdraw_pending_refund_on_rebooking
        withdraw_pending_refund_on_rebooking(booking)
    else:
        booking.status = Booking.Status.CANCELLED
        booking.save(update_fields=['status'])
    return rebooking
