"""
FILE: seed_data.py
PURPOSE: Populates the database with demo users (one per role), a sample
         booking, and a sample complaint, for quick local testing.
Run with: python manage.py shell < seed_data.py
"""
import django, os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from datetime import timedelta
from django.utils import timezone
from apps.accounts.models import User, CollegeID
from apps.bookings.models import Booking

ROLES = ['ADMIN', 'PRINCIPAL', 'FACULTY', 'STUDENT', 'CANTEEN_STAFF', 'WARDEN', 'MEDICAL_STAFF']

for role in ROLES:
    username = role.lower()
    if not User.objects.filter(username=username).exists():
        user = User.objects.create_user(
            username=username, password='Passw0rd!123', email=f'{username}@cems.edu',
            role=role, is_validated=True, first_name=role.title(),
        )
        CollegeID.objects.create(user=user, id_number=f'CEMS-{role[:3]}-001')
        print(f'Created {username} / Passw0rd!123')

student = User.objects.get(username='student')
if not Booking.objects.filter(title='Tech Fest 2026').exists():
    Booking.objects.create(
        user=student, booking_type='AUDITORIUM', title='Tech Fest 2026',
        event_datetime=timezone.now() + timedelta(days=10), amount=1500, status='CONFIRMED',
    )
    print('Created sample booking.')

print('Seeding complete.')
