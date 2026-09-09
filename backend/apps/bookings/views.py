"""
FILE: apps/bookings/views.py
PURPOSE: API endpoints for creating/listing bookings across the
         Auditorium/Hostel/Canteen sub-systems, cancelling with the
         Refund Description Box, and the Rebooking wizard reviewed by
         the Principal (SRS Module 2 & 3).
"""
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Booking, RebookingRequest
from .serializers import (
    BookingSerializer, BookingCancelSerializer,
    RebookingRequestSerializer, RebookingReviewSerializer,
)
from .services import cancel_booking, request_rebooking, review_rebooking
from .permissions import IsBookingOwnerOrReadOnlyAdmin, IsPrincipalForReview


class BookingViewSet(viewsets.ModelViewSet):
    """
    /api/bookings/bookings/            list (own) / create
    /api/bookings/bookings/{id}/cancel/  cancel with Refund Description Box
    """
    serializer_class = BookingSerializer
    permission_classes = [permissions.IsAuthenticated, IsBookingOwnerOrReadOnlyAdmin]
    filterset_fields = ['booking_type', 'status', 'room_type']
    search_fields = ['title']

    def get_queryset(self):
        user = self.request.user
        if user.role in ['ADMIN', 'PRINCIPAL']:
            return Booking.objects.all()
        return Booking.objects.filter(user=user)

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        booking = self.get_object()
        serializer = BookingCancelSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        booking, refund = cancel_booking(booking, request.user, serializer.validated_data['reason'])
        return Response({
            'booking': BookingSerializer(booking).data,
            'refund_percentage': refund.refund_percentage,
            'refund_amount': str(refund.refund_amount),
        }, status=status.HTTP_200_OK)


class RebookingRequestViewSet(viewsets.ModelViewSet):
    """
    /api/bookings/rebookings/               list (own) / create
    /api/bookings/rebookings/{id}/review/    Principal approves/rejects
    """
    serializer_class = RebookingRequestSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['status']
    http_method_names = ['get', 'post', 'head']

    def get_queryset(self):
        user = self.request.user
        if user.role == 'PRINCIPAL' or user.role == 'ADMIN':
            return RebookingRequest.objects.all()
        return RebookingRequest.objects.filter(requested_by=user)

    def perform_create(self, serializer):
        booking = serializer.validated_data['original_booking']
        request_rebooking(
            booking, self.request.user,
            serializer.validated_data['description'],
            serializer.validated_data['proposed_datetime'],
        )

    @action(detail=True, methods=['post'], permission_classes=[IsPrincipalForReview])
    def review(self, request, pk=None):
        rebooking = self.get_object()
        serializer = RebookingReviewSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        review_rebooking(
            rebooking, request.user,
            serializer.validated_data['decision'],
            serializer.validated_data.get('remarks', ''),
        )
        return Response(RebookingRequestSerializer(rebooking).data)
