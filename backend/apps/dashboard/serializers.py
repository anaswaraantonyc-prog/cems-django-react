"""
FILE: apps/dashboard/serializers.py
PURPOSE: Generic passthrough serializer for dashboard aggregate dicts
         (each build_*_dashboard() function returns a plain dict).
"""
from rest_framework import serializers


class DashboardSerializer(serializers.Serializer):
    def to_representation(self, instance):
        return instance
