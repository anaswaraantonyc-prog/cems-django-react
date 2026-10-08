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
from .permissions import (
    IsBookingOwnerOrReadOnlyAdmin, IsPrincipalForReview,
    visible_bookings_for,
)


class BookingViewSet(viewsets.ModelViewSet):
    """
    /api/bookings/bookings/              list (strictly role/owner-scoped) / create
    /api/bookings/bookings/{id}/         retrieve / update / delete (owner or admin)
    /api/bookings/bookings/{id}/cancel/  cancel with Refund Description Box
    """
    serializer_class = BookingSerializer
    permission_classes = [permissions.IsAuthenticated, IsBookingOwnerOrReadOnlyAdmin]
    filterset_fields = ['booking_type', 'status', 'room_type']
    search_fields = ['title', 'details']

    def get_queryset(self):
        user = self.request.user
        if not user or not user.is_authenticated:
            return Booking.objects.none()
        qs = Booking.objects.select_related('user').prefetch_related('payments', 'refunds')
        return visible_bookings_for(user, qs).order_by('-created_at')

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        booking = self.get_object()
        serializer = BookingCancelSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        booking, refund = cancel_booking(booking, request.user, serializer.validated_data['reason'])
        return Response({
            'booking': BookingSerializer(booking, context={'request': request}).data,
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
        if not user or not user.is_authenticated:
            return RebookingRequest.objects.none()
        if user.role in ['PRINCIPAL', 'ADMIN']:
            return RebookingRequest.objects.all().order_by('-created_at')
        return RebookingRequest.objects.filter(requested_by=user).order_by('-created_at')

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
        return Response(RebookingRequestSerializer(rebooking, context={'request': request}).data)
