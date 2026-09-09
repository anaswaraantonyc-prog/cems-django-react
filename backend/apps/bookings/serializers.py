"""
FILE: apps/bookings/serializers.py
PURPOSE: Serializers for creating/listing bookings, cancelling with the
         Refund Description Box, and raising/reviewing Rebooking requests.
"""
from rest_framework import serializers
from .models import Booking, RebookingRequest
from .validators import validate_description_box


class BookingSerializer(serializers.ModelSerializer):
    user = serializers.StringRelatedField(read_only=True)

    class Meta:
        model = Booking
        fields = [
            'id', 'user', 'booking_type', 'room_type', 'title', 'event_datetime',
            'end_datetime', 'seats_or_units', 'amount', 'status', 'cancelled_at',
            'cancellation_reason', 'created_at', 'updated_at',
        ]
        read_only_fields = ['status', 'cancelled_at', 'cancellation_reason', 'created_at', 'updated_at']

    def validate(self, attrs):
        user = self.context['request'].user
        booking_type = attrs.get('booking_type')
        if booking_type == Booking.BookingType.AUDITORIUM and getattr(user, 'role', 'STUDENT') == 'STUDENT':
            raise serializers.ValidationError({
                'booking_type': 'Students are not permitted to book the Auditorium. Only Faculty and Class Representatives can book the Auditorium.'
            })
        return attrs

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


class BookingCancelSerializer(serializers.Serializer):
    """Enforces the Refund Description Box on cancellation requests."""
    reason = serializers.CharField()

    def validate_reason(self, value):
        validate_description_box(value)
        return value


class RebookingRequestSerializer(serializers.ModelSerializer):
    requested_by = serializers.StringRelatedField(read_only=True)
    original_booking_title = serializers.CharField(source='original_booking.title', read_only=True)

    class Meta:
        model = RebookingRequest
        fields = [
            'id', 'original_booking', 'original_booking_title', 'requested_by',
            'description', 'proposed_datetime', 'status', 'reviewed_by',
            'principal_remarks', 'reviewed_at', 'created_at',
        ]
        read_only_fields = ['status', 'reviewed_by', 'principal_remarks', 'reviewed_at', 'created_at']

    def validate_description(self, value):
        validate_description_box(value)
        return value

    def create(self, validated_data):
        validated_data['requested_by'] = self.context['request'].user
        return super().create(validated_data)


class RebookingReviewSerializer(serializers.Serializer):
    """Used by the Principal to approve/reject via the rebooking wizard."""
    decision = serializers.ChoiceField(choices=['APPROVED', 'REJECTED'])
    remarks = serializers.CharField(required=False, allow_blank=True)
