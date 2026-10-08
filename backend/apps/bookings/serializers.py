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
    user_id = serializers.IntegerField(source='user.id', read_only=True)
    user_full_name = serializers.SerializerMethodField()
    user_role = serializers.CharField(source='user.role', read_only=True)
    room_type = serializers.CharField(required=False, default=Booking.RoomType.NOT_APPLICABLE)

    payment_status = serializers.SerializerMethodField()
    payment_method = serializers.SerializerMethodField()
    payment_txn_id = serializers.SerializerMethodField()
    paid_at = serializers.SerializerMethodField()

    class Meta:
        model = Booking
        fields = [
            'id', 'user', 'user_id', 'user_full_name', 'user_role',
            'booking_type', 'room_type', 'title', 'event_datetime',
            'end_datetime', 'seats_or_units', 'amount', 'status',
            'details', 'order_items',
            'payment_status', 'payment_method', 'payment_txn_id', 'paid_at',
            'cancelled_at', 'cancellation_reason', 'created_at', 'updated_at',
        ]
        read_only_fields = ['status', 'cancelled_at', 'cancellation_reason', 'created_at', 'updated_at']

    def get_fields(self):
        fields = super().get_fields()
        request = self.context.get('request')
        if request and request.user and getattr(request.user, 'role', None) in ['ADMIN', 'PRINCIPAL']:
            fields['status'].read_only = False
        return fields

    def get_user_full_name(self, obj):
        if not obj.user:
            return ""
        return obj.user.get_full_name() or obj.user.username

    def get_payment_status(self, obj):
        if obj.status == Booking.Status.CANCELLED:
            if hasattr(obj, 'refunds') and obj.refunds.filter(status='APPROVED').exists():
                return "REFUNDED"
        payments = obj.payments.all() if hasattr(obj, 'payments') else []
        if any(p.status == 'SUCCESS' for p in payments):
            return "PAID"
        return "UNPAID"

    def get_payment_method(self, obj):
        payments = obj.payments.filter(status='SUCCESS').order_by('-created_at') if hasattr(obj, 'payments') else []
        p = payments.first() if payments else None
        return p.method if p else None

    def get_payment_txn_id(self, obj):
        payments = obj.payments.filter(status='SUCCESS').order_by('-created_at') if hasattr(obj, 'payments') else []
        p = payments.first() if payments else None
        return p.transaction_reference if p else None

    def get_paid_at(self, obj):
        payments = obj.payments.filter(status='SUCCESS').order_by('-created_at') if hasattr(obj, 'payments') else []
        p = payments.first() if payments else None
        return p.created_at.strftime('%Y-%m-%d %I:%M %p') if p and p.created_at else None

    def validate(self, attrs):
        user = self.context['request'].user
        booking_type = attrs.get('booking_type')
        if booking_type == Booking.BookingType.AUDITORIUM and getattr(user, 'role', 'STUDENT') == 'STUDENT':
            raise serializers.ValidationError({
                'booking_type': 'Students are not permitted to book the Auditorium. Only Faculty and Class Representatives can book the Auditorium.'
            })

        # Normalize room_type so descriptions like "Single Room (AC)" or "Non-AC" map cleanly
        raw_room = str(attrs.get('room_type', '')).upper()
        if 'NON_AC' in raw_room or 'NON-AC' in raw_room or 'NON AC' in raw_room:
            attrs['room_type'] = Booking.RoomType.NON_AC
        elif 'AC' in raw_room:
            attrs['room_type'] = Booking.RoomType.AC
        elif attrs.get('room_type') in [c[0] for c in Booking.RoomType.choices]:
            pass
        else:
            attrs['room_type'] = Booking.RoomType.NOT_APPLICABLE

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
