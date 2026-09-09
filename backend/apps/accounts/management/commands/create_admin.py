"""
FILE: apps/accounts/management/commands/create_admin.py
PURPOSE: Creates (or resets) an admin user with role=ADMIN, is_validated=True,
         is_superuser=True so they can immediately log in via the CEMS login page.

Usage:
    python manage.py create_admin
    python manage.py create_admin --username myadmin --password MyPass123!
"""
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

User = get_user_model()


class Command(BaseCommand):
    help = "Create or reset an ADMIN user that can log in to CEMS immediately."

    def add_arguments(self, parser):
        parser.add_argument(
            "--username",
            default="admin",
            help="Username for the admin account (default: admin)",
        )
        parser.add_argument(
            "--password",
            default="Admin@1234",
            help="Password for the admin account (default: Admin@1234)",
        )
        parser.add_argument(
            "--email",
            default="admin@cems.edu",
            help="Email for the admin account (default: admin@cems.edu)",
        )

    def handle(self, *args, **options):
        username = options["username"]
        password = options["password"]
        email = options["email"]

        user, created = User.objects.get_or_create(username=username)

        user.set_password(password)
        user.email = email
        user.first_name = "Admin"
        user.last_name = "User"
        user.role = "ADMIN"
        user.is_validated = True   # ← Required to pass CEMS login check
        user.is_active = True
        user.is_staff = True
        user.is_superuser = True
        user.save()

        action = "Created" if created else "Reset"
        self.stdout.write(self.style.SUCCESS(
            f"\n[OK] {action} admin account successfully!\n"
            f"   Username : {username}\n"
            f"   Password : {password}\n"
            f"   Role     : ADMIN\n"
            f"   Validated: True\n\n"
            f"   >> You can now log in at http://localhost:5173\n"
        ))
