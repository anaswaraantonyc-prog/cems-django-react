from django.conf import settings
from django.db import models


class MedicalStaff(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='medical_profile')
    designation = models.CharField(max_length=100, help_text="e.g., Campus Doctor, First-Responder, Nurse.")
    contact_number = models.CharField(max_length=15)
    is_on_duty = models.BooleanField(default=True)
    education = models.CharField(max_length=200, blank=True)
    current_location = models.CharField(max_length=150, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user} ({self.designation}) - {'On Duty' if self.is_on_duty else 'Off Duty'}"


class EmergencyAccessLog(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='emergency_logs')
    # Kept nullable so old databases can be migrated without losing old logs.
    scanned_qr_token = models.UUIDField(null=True, blank=True)
    scanned_id_number = models.CharField(max_length=50, blank=True)
    accessed_at = models.DateTimeField(auto_now_add=True)
    dispatched_staff = models.ForeignKey(
        MedicalStaff, null=True, blank=True, on_delete=models.SET_NULL, related_name='dispatch_logs',
    )
    notes = models.TextField(blank=True)

    class Meta:
        ordering = ['-accessed_at']

    def __str__(self):
        return f"EmergencyAccess by {self.user} at {self.accessed_at}"
