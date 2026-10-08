from django.utils import timezone
from .models import CollegeID


def validate_user(admin_user, target_user):
    target_user.is_validated = True
    target_user.validated_by = admin_user
    target_user.validated_at = timezone.now()
    target_user.save(update_fields=['is_validated', 'validated_by', 'validated_at'])
    return target_user


def issue_college_id(user, id_year=None, id_number=None):
    """Create/update the physical ID-card record used by image matching."""
    val = id_year if id_year is not None else (id_number or '')
    college_id, _ = CollegeID.objects.update_or_create(
        user=user,
        defaults={'id_year': val, 'is_active': True},
    )
    return college_id
