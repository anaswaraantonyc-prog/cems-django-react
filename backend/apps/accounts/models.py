"""
FILE: apps/accounts/models.py
PURPOSE: Defines the custom User model with role-based access control
         (SRS Module 1 & 2) and the CollegeID model whose QR code powers
         the passwordless Medical Emergency login (SRS Module 4).
"""
import uuid
from django.contrib.auth.models import AbstractUser
from django.db import models

from django.utils import timezone
from .validators import validate_phone_number, validate_college_id_number, validate_id_year


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

    @property
    def has_face_reference(self):
        return hasattr(self, 'face_reference') and self.face_reference.is_active


class CollegeID(models.Model):
    """
    Physical college ID record. The emergency scanner now compares a camera photo of this
    card against the registered card image using deterministic OpenCV matching.
    The legacy qr_token field remains only for database compatibility and is not used.
    """
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='college_id')
    id_year = models.CharField(
        max_length=50,
        blank=True,
        default='',
        verbose_name="ID Year",
        validators=[validate_id_year],
    )
    qr_token = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)  # legacy field; not used for emergency login
    id_card_image = models.ImageField(upload_to='college_ids/', null=True, blank=True)
    issued_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)

    @property
    def id_number(self):
        return self.id_year

    @id_number.setter
    def id_number(self, value):
        self.id_year = value

    def __str__(self):
        return f"CollegeID({self.id_year} -> {self.user})"


class RegistrationAuditLog(models.Model):
    """
    Stores admin decision history logs (Accepted / Rejected) for student, faculty,
    and staff registration requests.
    """
    STATUS_CHOICES = [
        ('Accepted', 'Accepted'),
        ('Rejected', 'Rejected'),
    ]

    username = models.CharField(max_length=150)
    first_name = models.CharField(max_length=150, blank=True)
    last_name = models.CharField(max_length=150, blank=True)
    email = models.EmailField(blank=True)
    role = models.CharField(max_length=30, blank=True)
    department = models.CharField(max_length=100, blank=True)
    id_year = models.CharField(max_length=50, blank=True, verbose_name="ID Year")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Accepted')
    notes = models.TextField(blank=True)
    decided_at = models.DateTimeField(default=timezone.now)

    @property
    def id_number(self):
        return self.id_year

    @id_number.setter
    def id_number(self, value):
        self.id_year = value

    class Meta:
        ordering = ['-decided_at']

    def __str__(self):
        return f"{self.username} ({self.status}) - {self.decided_at}"


class FaceReference(models.Model):
    """
    Biometric face reference embedding model for CEMS Face Recognition authentication.
    Stores genuine deep-learning facial embeddings (512-D float32) generated by ArcFace/InsightFace.
    The raw binary vector is strictly protected and never serialized to APIs or frontend clients.
    """
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='face_reference')
    embedding = models.BinaryField(help_text="512-D float32 normalized face embedding stored as bytes.")
    model_name = models.CharField(max_length=64, default='buffalo_sc')
    model_version = models.CharField(max_length=32, default='1.0')
    embedding_dim = models.PositiveIntegerField(default=512)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def get_embedding_vector(self):
        """Decode stored bytes back to 1D float32 numpy array."""
        if not self.embedding:
            return None
        import numpy as np
        return np.frombuffer(self.embedding, dtype=np.float32)

    def set_embedding_vector(self, vector):
        """Store 1D float32 numpy array as bytes."""
        import numpy as np
        arr = np.asarray(vector, dtype=np.float32)
        self.embedding = arr.tobytes()
        self.embedding_dim = arr.size

    def __str__(self):
        return f"FaceReference({self.user.username} - {self.model_name})"

