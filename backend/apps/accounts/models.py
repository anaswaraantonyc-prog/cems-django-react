"""
FILE: apps/accounts/models.py
PURPOSE: Defines the custom User model with role-based access control
         (SRS Module 1 & 2) and the CollegeID model whose QR code powers
         the passwordless Medical Emergency login (SRS Module 4).
"""
import uuid
from django.contrib.auth.models import AbstractUser
from django.db import models

from .validators import validate_phone_number, validate_college_id_number


class User(AbstractUser):
    """
    Custom user model. `role` drives Financial RBAC across the whole
    system: Students/Faculty use standard flows, Principal gets policy
    override + rebooking authorization + complaint portal access, Admin
    gets the master financial ledger, and Canteen/Warden get their own
    operational dashboards.
    """

    class Role(models.TextChoices):
        STUDENT = 'STUDENT', 'Student'
        CLASS_REP = 'CLASS_REP', 'Class Representative'
        FACULTY = 'FACULTY', 'Faculty'
        PRINCIPAL = 'PRINCIPAL', 'Principal'
        ADMIN = 'ADMIN', 'Admin'
        CANTEEN_STAFF = 'CANTEEN_STAFF', 'Canteen Staff'
        WARDEN = 'WARDEN', 'Warden'
        MEDICAL_STAFF = 'MEDICAL_STAFF', 'Medical Staff'
        EXTERNAL_PARTICIPANT = 'EXTERNAL_PARTICIPANT', 'External Participant'

    role = models.CharField(max_length=30, choices=Role.choices, default=Role.STUDENT)
    phone_number = models.CharField(max_length=10, blank=True, validators=[validate_phone_number])
    department = models.CharField(max_length=100, blank=True)

    # Admin must validate & activate profiles before platform clearance
    # (SRS Module 1: Access Control & User Validations)
    is_validated = models.BooleanField(default=False)
    validated_by = models.ForeignKey(
        'self', null=True, blank=True, on_delete=models.SET_NULL,
        related_name='validated_users', limit_choices_to={'role': Role.ADMIN},
    )
    validated_at = models.DateTimeField(null=True, blank=True)

    profile_image = models.ImageField(upload_to='profile_images/', null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.get_full_name() or self.username} ({self.role})"

    @property
    def is_principal(self):
        return self.role == self.Role.PRINCIPAL

    @property
    def is_admin_role(self):
        return self.role == self.Role.ADMIN


class CollegeID(models.Model):
    """
    Physical college ID record. The emergency scanner now compares a camera photo of this
    card against the registered card image using deterministic OpenCV matching.
    The legacy qr_token field remains only for database compatibility and is not used.
    """
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='college_id')
    id_number = models.CharField(max_length=50, unique=True, validators=[validate_college_id_number])
    qr_token = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)  # legacy field; not used for emergency login
    id_card_image = models.ImageField(upload_to='college_ids/', null=True, blank=True)
    issued_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"CollegeID({self.id_number} -> {self.user})"
