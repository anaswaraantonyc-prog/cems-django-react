"""
FILE: apps/payments/services.py
PURPOSE: Aggregation logic backing the Admin's Master Financial Ledger —
         transaction volumes and revenue streams per booking channel
         (Auditorium/Hostel/Canteen), as described in SRS Module 1.
"""
from django.db.models import Sum, Count
from .models import Payment, Refund


def get_ledger_summary():
    revenue_qs = Payment.objects.filter(status__in=[Payment.Status.SUCCESS, Payment.Status.PARTIALLY_REFUNDED])
    total_revenue = revenue_qs.aggregate(total=Sum('amount'))['total'] or 0

    total_refunded = Refund.objects.filter(status=Refund.Status.APPROVED).aggregate(
        total=Sum('refund_amount'))['total'] or 0

    pending_refund_count = Refund.objects.filter(status=Refund.Status.PENDING_REVIEW).count()

    revenue_by_channel = {}
    channel_rows = (
        revenue_qs.values('booking__booking_type')
        .annotate(total=Sum('amount'), count=Count('id'))
    )
    for row in channel_rows:
        revenue_by_channel[row['booking__booking_type']] = {
            'total': str(row['total']), 'transaction_count': row['count'],
        }

    return {
        'total_revenue': total_revenue,
        'total_refunded': total_refunded,
        'pending_refund_count': pending_refund_count,
        'revenue_by_channel': revenue_by_channel,
    }
