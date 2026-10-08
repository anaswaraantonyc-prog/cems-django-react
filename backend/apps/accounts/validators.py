"""
Validation helpers for CEMS accounts.
"""
import re
from django.core.exceptions import ValidationError


def validate_phone_number(value):
    value = str(value).strip()
    if not re.fullmatch(r'\d{10}', value):
        raise ValidationError('Enter a valid 10-digit phone number.')


def validate_id_year(value):
    if not value:
        return
    value = str(value).strip().upper()
    if not re.fullmatch(r'[A-Z0-9][A-Z0-9\-]{2,49}', value):
        raise ValidationError('ID Year must contain 3-50 letters, numbers or hyphens (e.g. MCA-2025-2027).')


# Backward compatibility alias
validate_college_id_number = validate_id_year


def validate_image_file(value):
    if not value:
        return
    content_type = getattr(value, 'content_type', '')
    if content_type not in ('image/jpeg', 'image/png', 'image/webp'):
        raise ValidationError('Upload a JPG, PNG or WEBP image.')
    if value.size > 5 * 1024 * 1024:
        raise ValidationError('Image must be 5 MB or smaller.')
