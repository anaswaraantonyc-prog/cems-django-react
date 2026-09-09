"""
FILE: apps/gallery/serializers.py
PURPOSE: Serializer for uploading and listing gallery photos.
"""
from rest_framework import serializers
from .models import GalleryItem


class GalleryItemSerializer(serializers.ModelSerializer):
    uploaded_by = serializers.StringRelatedField(read_only=True)

    class Meta:
        model = GalleryItem
        fields = ['id', 'booking', 'uploaded_by', 'caption', 'image', 'is_public', 'uploaded_at']
        read_only_fields = ['uploaded_at']

    def create(self, validated_data):
        validated_data['uploaded_by'] = self.context['request'].user
        return super().create(validated_data)
