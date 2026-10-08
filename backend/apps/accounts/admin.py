from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, CollegeID, FaceReference


@admin.register(User)
class CEMSUserAdmin(UserAdmin):
    list_display = ('username', 'email', 'role', 'is_validated', 'is_active', 'face_verification_status')
    list_filter = ('role', 'is_validated', 'is_active')
    readonly_fields = ('face_verification_status',)
    fieldsets = UserAdmin.fieldsets + (
        ('CEMS Profile', {'fields': (
            'role', 'phone_number', 'department', 'is_validated',
            'validated_by', 'validated_at', 'profile_image', 'face_verification_status'
        )}),
    )

    @admin.display(description='Face Verification')
    def face_verification_status(self, obj):
        if hasattr(obj, 'face_reference') and obj.face_reference.is_active:
            return "Registered"
        return "Not Registered"


@admin.register(CollegeID)
class CollegeIDAdmin(admin.ModelAdmin):
    list_display = ('id_year', 'user', 'is_active', 'issued_at')
    search_fields = ('id_year', 'user__username')


@admin.register(FaceReference)
class FaceReferenceAdmin(admin.ModelAdmin):
    list_display = ('user', 'model_name', 'model_version', 'is_active', 'updated_at')
    list_filter = ('model_name', 'is_active')
    search_fields = ('user__username', 'user__first_name', 'user__last_name', 'user__email')
    readonly_fields = ('user', 'model_name', 'model_version', 'embedding_dim', 'created_at', 'updated_at')
    exclude = ('embedding',)  # Strictly protect raw biometric embedding from display

