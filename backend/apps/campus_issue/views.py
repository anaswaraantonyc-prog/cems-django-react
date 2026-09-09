"""
FILE: apps/campus_issue/views.py
PURPOSE: API endpoints for submitting complaints and the Principal's
         real-time feed + direct reply action (SRS Module 5).
"""
from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Complaint
from .serializers import ComplaintSerializer, ComplaintReplySerializer
from .services import reply_to_complaint
from .permissions import IsPrincipal


class ComplaintViewSet(viewsets.ModelViewSet):
    """
    /api/campus-issues/complaints/            submit / list
    /api/campus-issues/complaints/{id}/reply/  Principal replies directly
    """
    serializer_class = ComplaintSerializer
    permission_classes = [permissions.IsAuthenticated]
    http_method_names = ['get', 'post', 'head']
    filterset_fields = ['priority', 'status']

    def get_queryset(self):
        user = self.request.user
        if user.role == 'PRINCIPAL' or user.role == 'ADMIN':
            return Complaint.objects.all()
        return Complaint.objects.filter(submitted_by=user, is_anonymous=False)

    @action(detail=True, methods=['post'], permission_classes=[IsPrincipal])
    def reply(self, request, pk=None):
        complaint = self.get_object()
        serializer = ComplaintReplySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        reply_to_complaint(complaint, serializer.validated_data['reply'], serializer.validated_data.get('status'))
        return Response(ComplaintSerializer(complaint).data)
