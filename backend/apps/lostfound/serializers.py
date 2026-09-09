"""
FILE: apps/lostfound/serializers.py
PURPOSE: Serializers for reporting lost/found items and viewing matches.
"""
from rest_framework import serializers
from .models import LostFoundItem


class LostFoundItemSerializer(serializers.ModelSerializer):
    reported_by = serializers.StringRelatedField(read_only=True)

    class Meta:
        model = LostFoundItem
        fields = [
            'id', 'reported_by', 'item_status', 'title', 'description', 'category',
            'location', 'image', 'matched_with', 'reported_at', 'resolved_at',
        ]
        read_only_fields = ['matched_with', 'resolved_at', 'reported_at']

    def create(self, validated_data):
        validated_data['reported_by'] = self.context['request'].user
        return super().create(validated_data)


class MatchConfirmSerializer(serializers.Serializer):
    matched_item_id = serializers.IntegerField()
