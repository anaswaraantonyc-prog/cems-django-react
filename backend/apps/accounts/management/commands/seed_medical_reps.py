from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from apps.emergency.models import MedicalStaff

User = get_user_model()

class Command(BaseCommand):
    help = "Seed medical staff members (Doctor, Nurse, Representative) with details and photos."

    def handle(self, *args, **options):
        # 1. Doctor
        doc_user, _ = User.objects.get_or_create(username="dr.smit")
        doc_user.first_name = "Dr. Smit"
        doc_user.last_name = "Patel"
        doc_user.email = "dr.smit@cems.edu"
        doc_user.phone_number = "9876543210"
        doc_user.role = "MEDICAL_STAFF"
        doc_user.is_validated = True
        doc_user.is_active = True
        doc_user.profile_image = "profile_images/jith.jpeg"
        doc_user.set_password("Medical@123")
        doc_user.save()

        doc_staff, _ = MedicalStaff.objects.get_or_create(user=doc_user)
        doc_staff.designation = "Campus Medical Doctor"
        doc_staff.contact_number = "9876543210"
        doc_staff.education = "MD, MBBS (Cardiology)"
        doc_staff.is_on_duty = True
        doc_staff.current_location = "Main Health Center, Block A"
        doc_staff.save()

        # 2. Nurse
        nurse_user, _ = User.objects.get_or_create(username="nurse.mary")
        nurse_user.first_name = "Nurse Mary"
        nurse_user.last_name = "Johnson"
        nurse_user.email = "nurse.mary@cems.edu"
        nurse_user.phone_number = "9876543211"
        nurse_user.role = "MEDICAL_STAFF"
        nurse_user.is_validated = True
        nurse_user.is_active = True
        nurse_user.profile_image = "profile_images/Anaswara_Antony.JPG.jpeg"
        nurse_user.set_password("Medical@123")
        nurse_user.save()

        nurse_staff, _ = MedicalStaff.objects.get_or_create(user=nurse_user)
        nurse_staff.designation = "Senior Campus Nurse"
        nurse_staff.contact_number = "9876543211"
        nurse_staff.education = "B.Sc Nursing (Emergency Care)"
        nurse_staff.is_on_duty = True
        nurse_staff.current_location = "Emergency Ward, Block C"
        nurse_staff.save()

        # 3. Medical Representative
        rep_user, _ = User.objects.get_or_create(username="rep.linda")
        rep_user.first_name = "Rep. Linda"
        rep_user.last_name = "Davis"
        rep_user.email = "rep.linda@cems.edu"
        rep_user.phone_number = "9876543212"
        rep_user.role = "MEDICAL_STAFF"
        rep_user.is_validated = True
        rep_user.is_active = True
        rep_user.profile_image = "profile_images/jappa.jpeg"
        rep_user.set_password("Medical@123")
        rep_user.save()

        rep_staff, _ = MedicalStaff.objects.get_or_create(user=rep_user)
        rep_staff.designation = "Campus Medical Representative"
        rep_staff.contact_number = "9876543212"
        rep_staff.education = "B.S. Healthcare Administration"
        rep_staff.is_on_duty = True
        rep_staff.current_location = "Administrative Block, Office 12"
        rep_staff.save()

        self.stdout.write(self.style.SUCCESS("Successfully seeded medical staff!"))
