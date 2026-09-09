"""
FILE: apps/payments/rebooking_service.py
PURPOSE: Financial-side helper for the rebooking flow — when a Principal
         approves a rebooking (apps/bookings/services.py), any pending
         Refund tied to that booking is cancelled/withdrawn since the
         program is moving forward instead of being paid out.
"""
from .models import Refund


def withdraw_pending_refund_on_rebooking(booking):
    """Cancels any PENDING_REVIEW refund once a booking is successfully rebooked."""
    updated = Refund.objects.filter(
        booking=booking, status=Refund.Status.PENDING_REVIEW,
    ).update(status=Refund.Status.REJECTED, admin_remarks='Auto-withdrawn: booking was rebooked instead of refunded.')
    return updated
