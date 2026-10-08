"""
FILE: apps/accounts/management/commands/backfill_face_references.py
PURPOSE: Safely generate Biometric FaceReference embeddings for existing
         registered CEMS users from their uploaded profile photos.
         Preserves all database records and reports clear diagnostic statuses.
"""
import os
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from apps.accounts.models import FaceReference
from apps.accounts.face_service import extract_single_face_embedding, save_user_face_reference, FaceServiceError

User = get_user_model()


class Command(BaseCommand):
    help = "Generate FaceReference biometric embeddings for existing registered users with profile images."

    def add_arguments(self, parser):
        parser.add_argument(
            '--force',
            action='store_true',
            help='Re-generate FaceReference even if one already exists.',
        )

    def handle(self, *args, **options):
        force = options['force']
        users_with_photos = User.objects.exclude(profile_image='').exclude(profile_image__isnull=True)
        total = users_with_photos.count()

        self.stdout.write(self.style.NOTICE(f"Found {total} user(s) with registered profile images."))

        success_count = 0
        skipped_count = 0
        failed_count = 0

        for user in users_with_photos:
            if not force and hasattr(user, 'face_reference') and user.face_reference.is_active:
                self.stdout.write(f"  [-] {user.username}: already has active FaceReference. (Skipped)")
                skipped_count += 1
                continue

            try:
                img_path = user.profile_image.path if hasattr(user.profile_image, 'path') else str(user.profile_image)
                if not os.path.exists(img_path):
                    self.stdout.write(self.style.WARNING(f"  [x] {user.username}: image file not found at {img_path}"))
                    failed_count += 1
                    continue

                emb, score = extract_single_face_embedding(img_path, is_registration=False)
                save_user_face_reference(user, emb)
                self.stdout.write(self.style.SUCCESS(f"  [+] {user.username}: successfully generated FaceReference (score: {score:.3f})"))
                success_count += 1
            except FaceServiceError as exc:
                self.stdout.write(self.style.WARNING(f"  [!] {user.username}: {exc.message}"))
                failed_count += 1
            except Exception as exc:
                self.stdout.write(self.style.ERROR(f"  [x] {user.username}: Unexpected error: {exc}"))
                failed_count += 1

        self.stdout.write(self.style.NOTICE(
            f"\nFinished: {success_count} created/updated, {skipped_count} skipped, {failed_count} failed."
        ))
