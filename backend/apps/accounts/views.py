"""
FILE: apps/accounts/views.py
PURPOSE: API endpoints for registration, login (JWT), profile management,
         and Admin-side user validation (SRS Module 1: Access Control &
         User Validations).
"""
from django.contrib.auth import get_user_model
from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView

from .models import CollegeID
from .permissions import IsAdmin
from .serializers import (
    RegisterSerializer, UserSerializer, CEMSTokenObtainPairSerializer, CollegeIDSerializer,
)
from .services import validate_user, issue_college_id

User = get_user_model()


class RegisterView(generics.CreateAPIView):
    """POST /api/auth/register/ — public sign-up; account stays unvalidated until Admin clears it."""
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]


class CEMSTokenObtainPairView(TokenObtainPairView):
    """POST /api/auth/login/ — returns JWT pair embedding role for client RBAC."""
    serializer_class = CEMSTokenObtainPairSerializer


class MeView(generics.RetrieveUpdateAPIView):
    """GET/PATCH /api/auth/me/ — the logged-in user's own profile."""
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


class PendingUsersListView(generics.ListAPIView):
    """GET /api/auth/pending/ — Admin-only queue of unvalidated profiles."""
    serializer_class = UserSerializer
    permission_classes = [IsAdmin]

    def get_queryset(self):
        return User.objects.filter(is_validated=False)


class ValidateUserView(APIView):
    """POST /api/auth/pending/<id>/validate/ — Admin activates a pending profile."""
    permission_classes = [IsAdmin]

    def post(self, request, pk):
        try:
            target = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({'detail': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)
        validate_user(request.user, target)
        return Response(UserSerializer(target).data, status=status.HTTP_200_OK)


class RejectUserView(APIView):
    """DELETE /api/auth/pending/<id>/reject/ — Admin rejects and deletes a pending registration."""
    permission_classes = [IsAdmin]

    def delete(self, request, pk):
        try:
            target = User.objects.get(pk=pk, is_validated=False)
        except User.DoesNotExist:
            return Response({'detail': 'Pending user not found.'}, status=status.HTTP_404_NOT_FOUND)
        username = target.username
        target.delete()
        return Response({'detail': f'User "{username}" has been rejected and removed.'}, status=status.HTTP_200_OK)


class IssueCollegeIDView(APIView):
    """POST /api/auth/college-id/ — Admin issues/refreshes a digital college ID + QR token."""
    permission_classes = [IsAdmin]

    def post(self, request):
        user_id = request.data.get('user')
        id_number = request.data.get('id_number')
        try:
            target = User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return Response({'detail': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)
        college_id = issue_college_id(target, id_number)
        return Response(CollegeIDSerializer(college_id).data, status=status.HTTP_201_CREATED)
