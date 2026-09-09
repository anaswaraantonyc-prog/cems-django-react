"""
FILE: apps/campus_issue/serializers.py
PURPOSE: Serializers for submitting complaints (anonymous or open) and
         the Principal's direct reply action.
"""
from rest_framework import serializers
from .models import Complaint


class ComplaintSerializer(serializers.ModelSerializer):
    submitted_by = serializers.StringRelatedField(read_only=True)

    class Meta:
        model = Complaint
        fields = [
            'id', 'submitted_by', 'is_anonymous', 'subject', 'description',
            'priority', 'status', 'principal_reply', 'replied_at', 'submitted_at', 'updated_at',
        ]
        read_only_fields = ['status', 'principal_reply', 'replied_at', 'submitted_at', 'updated_at']

    def create(self, validated_data):
        request = self.context['request']
        if not validated_data.get('is_anonymous'):
            validated_data['submitted_by'] = request.user
        return super().create(validated_data)


class ComplaintReplySerializer(serializers.Serializer):
    """Principal replies securely and can move the status forward."""
    reply = serializers.CharField()
    status = serializers.ChoiceField(choices=['IN_PROGRESS', 'RESOLVED'], required=False)
