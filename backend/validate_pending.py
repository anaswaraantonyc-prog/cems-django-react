"""
Validates all pending (is_validated=False) users in the database.
Run with the venv Python:
  & "C:\...\env\Scripts\python.exe" validate_pending.py
"""
import django, os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.accounts.models import User

pending = User.objects.filter(is_validated=False)
if not pending.exists():
    print("No pending users found.")
else:
    print(f"Found {pending.count()} pending user(s):\n")
    for u in pending:
        u.is_validated = True
        u.save(update_fields=['is_validated'])
        print(f"  [OK] Validated: {u.username} ({u.role})")
    print("\nDone! All users can now log in.")
