from rest_framework import serializers
from .models import MedicalStaff, EmergencyAccessLog


class IDCardLoginSerializer(serializers.Serializer):
    id_card_image = serializers.ImageField(required=True)


class MedicalStaffSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source='user.get_full_name', read_only=True)
    profile_image = serializers.ImageField(source='user.profile_image', read_only=True)

    class Meta:
        model = MedicalStaff
        fields = ['id', 'name', 'designation', 'contact_number', 'is_on_duty', 'education', 'current_location', 'profile_image', 'updated_at']


class EmergencyAccessLogSerializer(serializers.ModelSerializer):
    user = serializers.StringRelatedField(read_only=True)

    class Meta:
        model = EmergencyAccessLog
        fields = ['id', 'user', 'scanned_id_number', 'accessed_at', 'dispatched_staff', 'notes']
        read_only_fields = fields
