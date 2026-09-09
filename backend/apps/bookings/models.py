"""
FILE: apps/bookings/models.py
PURPOSE: Core reservation models for the three sub-systems named in SRS
         Module 3 (Auditorium, Hostel AC/Non-AC, Canteen pre-ordering),
         plus the shared Cancellation + Rebooking Description Box flow
         from SRS Module 2 & 3.
"""
from django.conf import settings
from django.db import models


class Booking(models.Model):
    """
    A single reservation against any of the three sub-systems. One table
    is used across sub-systems (BookingType) to keep the cancellation /
    rebooking / refund pipeline (Module 3) identical for all of them.
    """

    class BookingType(models.TextChoices):
        AUDITORIUM = 'AUDITORIUM', 'Auditorium'
        HOSTEL = 'HOSTEL', 'Hostel'
        CANTEEN = 'CANTEEN', 'Canteen'

    class RoomType(models.TextChoices):
        AC = 'AC', 'AC'
        NON_AC = 'NON_AC', 'Non-AC'
        NOT_APPLICABLE = 'NA', 'Not Applicable'

    class Status(models.TextChoices):
        PENDING = 'PENDING', 'Pending'
        CONFIRMED = 'CONFIRMED', 'Confirmed'
        CANCELLED = 'CANCELLED', 'Cancelled'
        REBOOKING_REQUESTED = 'REBOOKING_REQUESTED', 'Rebooking Requested'
        REBOOKED = 'REBOOKED', 'Rebooked'
        COMPLETED = 'COMPLETED', 'Completed'

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='bookings')
    booking_type = models.CharField(max_length=20, choices=BookingType.choices)
    room_type = models.CharField(max_length=10, choices=RoomType.choices, default=RoomType.NOT_APPLICABLE)

    title = models.CharField(max_length=200, help_text="Event/program name or purpose of booking.")
    event_datetime = models.DateTimeField(help_text="Scheduled date/time of the program or stay start.")
    end_datetime = models.DateTimeField(null=True, blank=True)

    seats_or_units = models.PositiveIntegerField(default=1, help_text="Seats (auditorium), rooms (hostel), or meal count (canteen).")
    amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    status = models.CharField(max_length=25, choices=Status.choices, default=Status.PENDING)

    # --- Cancellation & the Refund Description Box (SRS Module 3) ---
    cancelled_at = models.DateTimeField(null=True, blank=True)
    cancellation_reason = models.TextField(
        blank=True,
        help_text="Refund Description Box: mandatory comprehensive reason attached permanently to the transaction ledger.",
    )
    cancelled_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name='cancelled_bookings',
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.booking_type} | {self.title} | {self.user}"


class RebookingRequest(models.Model):
    """
    SRS Module 2 & 3: When a cancelled program is rescheduled instead of
    abandoned, the user fills the Rebooking Description Box. The Principal
    inspects the original cancellation path on their dashboard timeline
    and authorizes (or rejects) the calendar relocation.
    """

    class Status(models.TextChoices):
        PENDING = 'PENDING', 'Pending Principal Review'
        APPROVED = 'APPROVED', 'Approved'
        REJECTED = 'REJECTED', 'Rejected'

    original_booking = models.ForeignKey(Booking, on_delete=models.CASCADE, related_name='rebooking_requests')
    requested_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='rebooking_requests')

    # The Rebooking Description Box itself
    description = models.TextField(help_text="Logistical obstacles or reasons forcing the reschedule.")

    proposed_datetime = models.DateTimeField()
    status = models.CharField(max_length=15, choices=Status.choices, default=Status.PENDING)

    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name='reviewed_rebookings',
        limit_choices_to={'role': 'PRINCIPAL'},
    )
    principal_remarks = models.TextField(blank=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Rebooking#{self.id} for Booking#{self.original_booking_id} [{self.status}]"
