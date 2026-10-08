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

from django.db import models
from django.utils import timezone
from .models import CollegeID, RegistrationAuditLog
from .permissions import IsAdmin
from .serializers import (
    RegisterSerializer, UserSerializer, UserAdminUpdateSerializer, UserSelfProfileSerializer,
    CEMSTokenObtainPairSerializer, CollegeIDSerializer, RegistrationAuditLogSerializer,
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
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return UserSelfProfileSerializer
        return UserSerializer

    def get_object(self):
        # Retrieve user with college_id pre-fetched safely
        return User.objects.filter(pk=self.request.user.pk).select_related('college_id').first() or self.request.user

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', True)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        fresh_user = User.objects.filter(pk=instance.pk).select_related('college_id').first() or instance
        return Response(UserSerializer(fresh_user).data)




class UserListView(generics.ListAPIView):
    """GET /api/auth/users/ — Admin-only list of all users."""
    serializer_class = UserSerializer
    permission_classes = [IsAdmin]

    def get_queryset(self):
        qs = User.objects.all().select_related('college_id').order_by('-created_at')
        role = self.request.query_params.get('role')
        if role and role != 'ALL':
            qs = qs.filter(role=role)
        q = self.request.query_params.get('q')
        if q:
            q = q.strip()
            qs = qs.filter(
                models.Q(username__icontains=q) |
                models.Q(first_name__icontains=q) |
                models.Q(last_name__icontains=q) |
                models.Q(email__icontains=q) |
                models.Q(department__icontains=q) |
                models.Q(college_id__id_year__icontains=q)
            )
        return qs


class UserDetailView(generics.RetrieveUpdateAPIView):
    """GET/PUT/PATCH /api/auth/users/<int:pk>/ — Admin-only retrieve or update user profile."""
    queryset = User.objects.all().select_related('college_id')
    permission_classes = [IsAdmin]

    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return UserAdminUpdateSerializer
        return UserSerializer

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', True)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        fresh_user = User.objects.filter(pk=instance.pk).select_related('college_id').first() or instance
        return Response(UserSerializer(fresh_user).data)



class PendingUsersListView(generics.ListAPIView):
    """GET /api/auth/pending/ — Admin-only queue of unvalidated profiles."""
    serializer_class = UserSerializer
    permission_classes = [IsAdmin]

    def get_queryset(self):
        return User.objects.filter(is_validated=False)


class RegistrationHistoryListView(generics.ListAPIView):
    """GET /api/auth/history/ — Admin-only audit history of registration decisions."""
    serializer_class = RegistrationAuditLogSerializer
    permission_classes = [IsAdmin]
    pagination_class = None

    def get_queryset(self):
        # Sync validated users into RegistrationAuditLog if missing
        validated_users = User.objects.filter(is_validated=True).exclude(role='ADMIN')
        existing_accepted_usernames = set(
            RegistrationAuditLog.objects.filter(status='Accepted').values_list('username', flat=True)
        )
        for u in validated_users:
            if u.username not in existing_accepted_usernames:
                id_yr = ""
                if hasattr(u, 'college_id') and u.college_id:
                    id_yr = u.college_id.id_year
                decided_time = u.validated_at or u.created_at or timezone.now()
                RegistrationAuditLog.objects.create(
                    username=u.username,
                    first_name=u.first_name,
                    last_name=u.last_name,
                    email=u.email,
                    role=u.role,
                    department=u.department,
                    id_year=id_yr,
                    status='Accepted',
                    notes="Approved by Admin; platform clearance issued.",
                    decided_at=decided_time,
                )
        return RegistrationAuditLog.objects.all().order_by('-decided_at')


class ValidateUserView(APIView):
    """POST /api/auth/pending/<id>/validate/ — Admin activates a pending profile."""
    permission_classes = [IsAdmin]

    def post(self, request, pk):
        try:
            target = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({'detail': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)
        validate_user(request.user, target)

        id_year = ""
        if hasattr(target, 'college_id') and target.college_id:
            id_year = target.college_id.id_year

        RegistrationAuditLog.objects.create(
            username=target.username,
            first_name=target.first_name,
            last_name=target.last_name,
            email=target.email,
            role=target.role,
            department=target.department,
            id_year=id_year or "Verified",
            status='Accepted',
            notes="Approved by Admin; platform clearance issued.",
            decided_at=timezone.now(),
        )

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
        id_year = ""
        if hasattr(target, 'college_id') and target.college_id:
            id_year = target.college_id.id_year

        RegistrationAuditLog.objects.create(
            username=target.username,
            first_name=target.first_name,
            last_name=target.last_name,
            email=target.email,
            role=target.role,
            department=target.department,
            id_year=id_year or "Rejected",
            status='Rejected',
            notes="Registration rejected and account removed by Admin.",
            decided_at=timezone.now(),
        )

        target.delete()
        return Response({'detail': f'User "{username}" has been rejected and removed.'}, status=status.HTTP_200_OK)


class IssueCollegeIDView(APIView):
    """POST /api/auth/college-id/ — Admin issues/refreshes a digital college ID + QR token."""
    permission_classes = [IsAdmin]

    def post(self, request):
        user_id = request.data.get('user')
        id_year = request.data.get('id_year') or request.data.get('id_number')
        try:
            target = User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return Response({'detail': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)
        college_id = issue_college_id(target, id_year=id_year)
        return Response(CollegeIDSerializer(college_id).data, status=status.HTTP_201_CREATED)

