"""
Script: create_neethu.py
Purpose: Creates user 'Neethu' as CANTEEN_STAFF (or updates role if already exists as STUDENT).
Run: python manage.py shell < create_neethu.py
"""
import django, os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.accounts.models import User, CollegeID

username = 'neethu'
email = 'neethu@cems.edu'
password = 'Passw0rd!123'
role = 'CANTEEN_STAFF'

existing = User.objects.filter(username=username).first()

if existing:
    old_role = existing.role
    existing.role = role
    existing.is_validated = True
    existing.is_active = True
    existing.first_name = 'Neethu'
    existing.set_password('Passw0rd!123')
    existing.save()
    print(f"[OK] Updated user '{username}': role changed from {old_role} -> {role} with password Passw0rd!123")
else:
    user = User.objects.create_user(
        username=username,
        password=password,
        email=email,
        role=role,
        is_validated=True,
        first_name='Neethu',
        last_name='',
    )
    # Create CollegeID for the user
    if not CollegeID.objects.filter(user=user).exists():
        CollegeID.objects.create(user=user, id_number='CEMS-CAN-002')

    print(f"✅ Created new user:")
    print(f"   Username : {username}")
    print(f"   Password : {password}")
    print(f"   Role     : {role}")
    print(f"   Email    : {email}")
    print(f"   Validated: True")

print("\nNeethu can now log in and will see the Canteen Staff dashboard.")
