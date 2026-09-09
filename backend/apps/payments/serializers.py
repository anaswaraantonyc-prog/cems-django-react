"""
FILE: apps/payments/serializers.py
PURPOSE: Serializers for payment capture and refund review, plus the
         Master Financial Ledger summary output for the Admin dashboard.
"""
from rest_framework import serializers
from .models import Payment, Refund


class PaymentSerializer(serializers.ModelSerializer):
    paid_by = serializers.StringRelatedField(read_only=True)

    class Meta:
        model = Payment
        fields = [
            'id', 'booking', 'paid_by', 'amount', 'method', 'status',
            'transaction_reference', 'receipt', 'created_at', 'updated_at',
        ]
        read_only_fields = ['status', 'created_at', 'updated_at']

    def create(self, validated_data):
        validated_data['paid_by'] = self.context['request'].user
        validated_data['status'] = Payment.Status.SUCCESS  # assume gateway-confirmed for this API layer
        return super().create(validated_data)


class RefundSerializer(serializers.ModelSerializer):
    class Meta:
        model = Refund
        fields = [
            'id', 'booking', 'payment', 'reason', 'refund_percentage',
            'refund_amount', 'status', 'reviewed_by', 'admin_remarks',
            'settled_at', 'created_at',
        ]
        read_only_fields = fields


class RefundSettleSerializer(serializers.Serializer):
    """Admin's ledger-review decision: release funds or reject the claim."""
    decision = serializers.ChoiceField(choices=['APPROVED', 'REJECTED'])
    remarks = serializers.CharField(required=False, allow_blank=True)


class LedgerSummarySerializer(serializers.Serializer):
    """Master Financial Ledger aggregate view (SRS Module 1)."""
    total_revenue = serializers.DecimalField(max_digits=12, decimal_places=2)
    total_refunded = serializers.DecimalField(max_digits=12, decimal_places=2)
    pending_refund_count = serializers.IntegerField()
    revenue_by_channel = serializers.DictField()
