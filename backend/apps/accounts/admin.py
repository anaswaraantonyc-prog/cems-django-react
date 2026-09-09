from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, CollegeID


@admin.register(User)
class CEMSUserAdmin(UserAdmin):
    list_display = ('username', 'email', 'role', 'is_validated', 'is_active')
    list_filter = ('role', 'is_validated', 'is_active')
    fieldsets = UserAdmin.fieldsets + (
        ('CEMS Profile', {'fields': (
            'role', 'phone_number', 'department', 'is_validated',
            'validated_by', 'validated_at', 'profile_image'
        )}),
    )


@admin.register(CollegeID)
class CollegeIDAdmin(admin.ModelAdmin):
    list_display = ('id_number', 'user', 'is_active', 'issued_at')
    search_fields = ('id_number', 'user__username')
