"""
FILE: apps/payments/views.py
PURPOSE: API endpoints for making payments, the Admin's refund review
         queue + settlement action, and the Master Financial Ledger
         summary (SRS Module 1: Centralized Refund Settlement).
"""
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Payment, Refund
from .serializers import (
    PaymentSerializer, RefundSerializer, RefundSettleSerializer, LedgerSummarySerializer,
)
from .refund_service import settle_refund
from .services import get_ledger_summary
from .permissions import IsAdminForLedger


class PaymentViewSet(viewsets.ModelViewSet):
    """/api/payments/payments/ — students pay & view own payments; Admin sees all."""
    serializer_class = PaymentSerializer
    permission_classes = [permissions.IsAuthenticated]
    http_method_names = ['get', 'post', 'head']
    filterset_fields = ['status', 'method']

    def get_queryset(self):
        user = self.request.user
        if user.role in ['ADMIN', 'PRINCIPAL']:
            return Payment.objects.all()
        return Payment.objects.filter(paid_by=user)
 
 
class RefundViewSet(viewsets.ReadOnlyModelViewSet):
    """
    /api/payments/refunds/                Admin's centralized review queue
    /api/payments/refunds/{id}/settle/    Admin signs off on releasing funds
    """
    serializer_class = RefundSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['status']

    def get_queryset(self):
        user = self.request.user
        if user.role in ['ADMIN', 'PRINCIPAL']:
            return Refund.objects.all()
        return Refund.objects.filter(booking__user=user)

    @action(detail=True, methods=['post'], permission_classes=[IsAdminForLedger])
    def settle(self, request, pk=None):
        refund = self.get_object()
        serializer = RefundSettleSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        settle_refund(refund, request.user, serializer.validated_data['decision'],
                       serializer.validated_data.get('remarks', ''))
        return Response(RefundSerializer(refund).data)


class LedgerSummaryView(APIView):
    """GET /api/payments/ledger/ — Admin's Master Financial Ledger dashboard feed."""
    permission_classes = [IsAdminForLedger]

    def get(self, request):
        data = get_ledger_summary()
        return Response(LedgerSummarySerializer(data).data, status=status.HTTP_200_OK)
