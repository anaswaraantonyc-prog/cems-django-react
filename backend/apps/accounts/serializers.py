"""
Serializers for registration, profile display/update and JWT login.
"""

from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password

from rest_framework import serializers
from rest_framework.validators import UniqueValidator

from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import CollegeID
from .validators import (
    validate_phone_number as phone_validator,
    validate_image_file,
    validate_college_id_number,
)

User = get_user_model()


# ============================================================
# COLLEGE ID SERIALIZER
# ============================================================

class CollegeIDSerializer(serializers.ModelSerializer):

    class Meta:
        model = CollegeID
        fields = [
            'id',
            'id_number',
            'id_card_image',
            'issued_at',
            'expires_at',
            'is_active',
        ]

        read_only_fields = [
            'id',
            'issued_at',
        ]


# ============================================================
# USER SERIALIZER
# ============================================================

class UserSerializer(serializers.ModelSerializer):

    college_id = CollegeIDSerializer(read_only=True)

    class Meta:
        model = User

        fields = [
            'id',
            'username',
            'email',
            'first_name',
            'last_name',
            'role',
            'phone_number',
            'department',
            'is_validated',
            'profile_image',
            'college_id',
            'created_at',
        ]

        read_only_fields = [
            'id',
            'role',
            'is_validated',
            'created_at',
        ]


# ============================================================
# REGISTRATION SERIALIZER
# ============================================================

class RegisterSerializer(serializers.ModelSerializer):

    # --------------------------------------------------------
    # USERNAME
    # --------------------------------------------------------

    username = serializers.CharField(
        min_length=4,
        max_length=150,
        validators=[
            UniqueValidator(
                queryset=User.objects.all(),
                message='That username is already taken.',
            )
        ],
    )

    # --------------------------------------------------------
    # EMAIL
    # --------------------------------------------------------

    email = serializers.EmailField(
        validators=[
            UniqueValidator(
                queryset=User.objects.all(),
                message='An account with that email already exists.',
            )
        ],
    )

    # --------------------------------------------------------
    # NAME
    # --------------------------------------------------------

    first_name = serializers.CharField(
        min_length=2,
        max_length=150,
    )

    last_name = serializers.CharField(
        min_length=2,
        max_length=150,
    )

    # --------------------------------------------------------
    # PHONE NUMBER
    # --------------------------------------------------------

    phone_number = serializers.CharField(
        min_length=10,
        max_length=10,
        validators=[
            UniqueValidator(
                queryset=User.objects.all(),
                message='That phone number is already registered.',
            )
        ],
    )

    # --------------------------------------------------------
    # PASSWORD
    # --------------------------------------------------------

    password = serializers.CharField(
        write_only=True,
        min_length=8,
        validators=[validate_password],
    )

    password_confirm = serializers.CharField(
        write_only=True,
    )

    # --------------------------------------------------------
    # PROFILE IMAGE
    # --------------------------------------------------------

    profile_image = serializers.ImageField(
        required=True,
        validators=[validate_image_file],
    )

    # --------------------------------------------------------
    # COLLEGE ID
    # --------------------------------------------------------

    id_number = serializers.CharField(
        write_only=True,
        required=True,
        min_length=4,
        max_length=50,
    )

    id_card_image = serializers.ImageField(
        write_only=True,
        required=True,
        validators=[validate_image_file],
    )

    # --------------------------------------------------------
    # ROLE
    # --------------------------------------------------------

    role = serializers.ChoiceField(
        choices=User.Role.choices,
        default='STUDENT',
    )

    designation = serializers.CharField(
        write_only=True,
        required=False,
        allow_blank=True,
    )

    education = serializers.CharField(
        write_only=True,
        required=False,
        allow_blank=True,
    )

    # --------------------------------------------------------
    # META
    # --------------------------------------------------------

    class Meta:
        model = User

        fields = [
            'username',
            'email',
            'first_name',
            'last_name',
            'password',
            'password_confirm',
            'role',
            'phone_number',
            'department',
            'profile_image',
            'id_number',
            'id_card_image',
            'designation',
            'education',
        ]

    # ========================================================
    # USERNAME VALIDATION
    # ========================================================

    def validate_username(self, value):

        value = value.strip()

        if not value:
            raise serializers.ValidationError(
                'Username is required.'
            )

        if not value.replace('_', '').replace('.', '').isalnum():
            raise serializers.ValidationError(
                'Username may contain only letters, numbers, dots and underscores.'
            )

        return value

    # ========================================================
    # FIRST NAME VALIDATION
    # ========================================================

    def validate_first_name(self, value):

        value = value.strip()

        if not value:
            raise serializers.ValidationError(
                'First name is required.'
            )

        if not value.replace(' ', '').replace('-', '').isalpha():
            raise serializers.ValidationError(
                'First name may contain only letters, spaces and hyphens.'
            )

        return value

    # ========================================================
    # LAST NAME VALIDATION
    # ========================================================

    def validate_last_name(self, value):

        value = value.strip()

        if not value:
            raise serializers.ValidationError(
                'Last name is required.'
            )

        if not value.replace(' ', '').replace('-', '').isalpha():
            raise serializers.ValidationError(
                'Last name may contain only letters, spaces and hyphens.'
            )

        return value

    # ========================================================
    # EMAIL VALIDATION
    # ========================================================

    def validate_email(self, value):

        value = value.strip().lower()

        if not value:
            raise serializers.ValidationError(
                'Email address is required.'
            )

        return value

    # ========================================================
    # PHONE VALIDATION
    # ========================================================

    def validate_phone_number(self, value):

        value = value.strip()

        if not value:
            raise serializers.ValidationError(
                'Phone number is required.'
            )

        if not value.isdigit() or len(value) != 10:
            raise serializers.ValidationError(
                'Enter a valid 10-digit phone number (digits only).'
            )

        try:
            phone_validator(value)
        except serializers.ValidationError:
            raise
        except Exception:
            raise serializers.ValidationError(
                'Enter a valid 10-digit phone number.'
            )

        return value

    # ========================================================
    # COLLEGE ID VALIDATION
    # ========================================================

    def validate_id_number(self, value):

        value = value.strip().upper()

        if not value:
            raise serializers.ValidationError(
                'College ID number is required.'
            )

        try:
            validate_college_id_number(value)
        except serializers.ValidationError:
            raise
        except Exception:
            raise serializers.ValidationError(
                'Enter a valid college ID number.'
            )

        if CollegeID.objects.filter(
            id_number__iexact=value
        ).exists():

            raise serializers.ValidationError(
                'That college ID number is already registered.'
            )

        return value

    # ========================================================
    # PASSWORD CONFIRMATION
    # ========================================================

    def validate(self, attrs):

        password = attrs.get('password')
        password_confirm = attrs.get('password_confirm')

        if password != password_confirm:

            raise serializers.ValidationError({
                'password_confirm':
                    'Passwords do not match.'
            })

        return attrs

    # ========================================================
    # CREATE USER
    # ========================================================

    def create(self, validated_data):
        password = validated_data.pop('password')
        validated_data.pop('password_confirm', None)
        id_number = validated_data.pop('id_number')
        id_card_image = validated_data.pop('id_card_image')
        designation = validated_data.pop('designation', '')
        education = validated_data.pop('education', '')

        # ----------------------------------------------------
        # Create user
        # ----------------------------------------------------
        user = User(**validated_data)
        user.set_password(password)

        # New registrations must be approved by admin before login is allowed.
        user.is_validated = False

        # Validate model data before saving.
        user.full_clean(
            exclude=['password']
        )
        user.save()

        # ----------------------------------------------------
        # Create college ID record
        # ----------------------------------------------------
        CollegeID.objects.create(
            user=user,
            id_number=id_number,
            id_card_image=id_card_image,
            is_active=True,
        )

        # ----------------------------------------------------
        # Create medical staff profile if role is MEDICAL_STAFF
        # ----------------------------------------------------
        if user.role == 'MEDICAL_STAFF':
            from apps.emergency.models import MedicalStaff
            MedicalStaff.objects.create(
                user=user,
                designation=designation or 'Campus Medical Officer',
                contact_number=user.phone_number,
                education=education,
                is_on_duty=True,
            )

        return user


# ============================================================
# JWT TOKEN SERIALIZER
# ============================================================

class CEMSTokenObtainPairSerializer(
    TokenObtainPairSerializer
):

    @classmethod
    def get_token(cls, user):

        token = super().get_token(user)

        token['role'] = user.role

        token['is_validated'] = user.is_validated

        token['full_name'] = user.get_full_name()

        return token

    def validate(self, attrs):

        data = super().validate(attrs)

        # ----------------------------------------------------
        # Check active account
        # ----------------------------------------------------

        if not self.user.is_active:

            raise serializers.ValidationError(
                'This account is inactive.'
            )

        # ----------------------------------------------------
        # Check admin validation
        # ----------------------------------------------------

        if not self.user.is_validated:

            raise serializers.ValidationError(
                'Your account is waiting for Admin validation.'
            )

        return data