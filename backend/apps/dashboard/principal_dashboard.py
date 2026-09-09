"""
FILE: apps/dashboard/principal_dashboard.py
PURPOSE: Aggregates data for the Principal's dashboard — pending
         rebooking requests with cancellation-path timeline, and the
         live Complaint Box feed (SRS Module 2 & 5).
"""
from apps.bookings.models import RebookingRequest
from apps.campus_issue.models import Complaint


def build_principal_dashboard():
    pending_rebookings = RebookingRequest.objects.filter(status=RebookingRequest.Status.PENDING).select_related('original_booking')
    open_complaints = Complaint.objects.filter(status=Complaint.Status.OPEN).order_by('-priority', '-submitted_at')

    return {
        'pending_rebookings': [
            {
                'id': r.id,
                'booking_title': r.original_booking.title,
                'original_cancellation_reason': r.original_booking.cancellation_reason,
                'cancelled_at': r.original_booking.cancelled_at,
                'description': r.description,
                'proposed_datetime': r.proposed_datetime,
            } for r in pending_rebookings
        ],
        'open_complaints_count': open_complaints.count(),
        'high_priority_complaints': open_complaints.filter(priority='HIGH').count(),
    }
