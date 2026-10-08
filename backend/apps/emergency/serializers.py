from rest_framework import serializers
from .models import MedicalStaff, EmergencyAccessLog


class IDCardLoginSerializer(serializers.Serializer):
    id_card_image = serializers.ImageField(required=False, allow_null=True)
    id_year = serializers.CharField(required=False, allow_blank=True, max_length=100)
    id_number = serializers.CharField(required=False, allow_blank=True, max_length=100)
    email = serializers.CharField(required=False, allow_blank=True, max_length=254)
    name = serializers.CharField(required=False, allow_blank=True, max_length=150)


class MedicalStaffSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source='user.get_full_name', read_only=True)
    profile_image = serializers.ImageField(source='user.profile_image', read_only=True)

    class Meta:
        model = MedicalStaff
        fields = ['id', 'name', 'designation', 'contact_number', 'is_on_duty', 'education', 'current_location', 'profile_image', 'updated_at']


class EmergencyAccessLogSerializer(serializers.ModelSerializer):
    user = serializers.StringRelatedField(read_only=True)
    scanned_id_number = serializers.CharField(source='scanned_id_year', read_only=True)

    class Meta:
        model = EmergencyAccessLog
        fields = ['id', 'user', 'scanned_id_year', 'scanned_id_number', 'accessed_at', 'dispatched_staff', 'notes']
        read_only_fields = fields
