"""
Serializers for registration, profile display/update and JWT login.
"""

from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.db.models import Q

from rest_framework import serializers
from rest_framework.validators import UniqueValidator

from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import CollegeID, RegistrationAuditLog, FaceReference
from .validators import (
    validate_phone_number as phone_validator,
    validate_image_file,
    validate_college_id_number,
    validate_id_year,
)
from .face_service import (
    extract_single_face_embedding,
    save_user_face_reference,
    FaceServiceError,
)

User = get_user_model()


# ============================================================
# REGISTRATION AUDIT LOG SERIALIZER
# ============================================================

class RegistrationAuditLogSerializer(serializers.ModelSerializer):
    id_number = serializers.CharField(source='id_year', read_only=True)

    class Meta:
        model = RegistrationAuditLog
        fields = [
            'id',
            'username',
            'first_name',
            'last_name',
            'email',
            'role',
            'department',
            'id_year',
            'id_number',
            'status',
            'notes',
            'decided_at',
        ]


# ============================================================
# COLLEGE ID SERIALIZER
# ============================================================
# ============================================================

class CollegeIDSerializer(serializers.ModelSerializer):
    id_number = serializers.CharField(source='id_year', read_only=True)

    class Meta:
        model = CollegeID
        fields = [
            'id',
            'id_year',
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
    has_face_reference = serializers.BooleanField(read_only=True)

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
            'validated_at',
            'is_active',
            'profile_image',
            'has_face_reference',
            'college_id',
            'created_at',
            'updated_at',
            'date_joined',
            'last_login',
        ]

        read_only_fields = [
            'id',
            'role',
            'is_validated',
            'validated_at',
            'created_at',
            'updated_at',
            'date_joined',
            'last_login',
        ]



class UserAdminUpdateSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(required=False)
    phone_number = serializers.CharField(required=False, allow_blank=True)
    profile_image = serializers.ImageField(required=False, allow_null=True, validators=[validate_image_file])
    id_year = serializers.CharField(required=False, allow_blank=True)
    id_number = serializers.CharField(required=False, allow_blank=True, write_only=True)
    id_card_image = serializers.ImageField(required=False, allow_null=True, validators=[validate_image_file])

    class Meta:
        model = User
        fields = [
            'first_name',
            'last_name',
            'email',
            'phone_number',
            'department',
            'role',
            'is_validated',
            'is_active',
            'profile_image',
            'id_year',
            'id_number',
            'id_card_image',
        ]

    def validate_email(self, value):
        value = value.strip().lower()
        if value:
            user_id = self.instance.pk if self.instance else None
            if User.objects.filter(email__iexact=value).exclude(pk=user_id).exists():
                raise serializers.ValidationError("An account with that email already exists.")
        return value

    def validate_phone_number(self, value):
        value = value.strip()
        if value:
            if not value.isdigit() or len(value) != 10:
                raise serializers.ValidationError("Enter a valid 10-digit phone number (digits only).")
            user_id = self.instance.pk if self.instance else None
            if User.objects.filter(phone_number=value).exclude(pk=user_id).exists():
                raise serializers.ValidationError("That phone number is already in use by another user.")
        return value

    def validate_profile_image(self, value):
        if value:
            try:
                emb, _ = extract_single_face_embedding(value, is_registration=True)
                self._new_face_embedding = emb
            except FaceServiceError as exc:
                raise serializers.ValidationError(str(exc))
            except Exception as exc:
                raise serializers.ValidationError(f"Face image processing error: {str(exc)}")
        return value

    def validate_role(self, value):
        if value not in User.Role.values:
            raise serializers.ValidationError(f"Invalid role choice '{value}'.")
        return value

    def validate_id_year(self, value):
        value = value.strip().upper() if value else ''
        if value:
            validate_id_year(value)
        return value

    def validate_id_number(self, value):
        return self.validate_id_year(value)

    def update(self, instance, validated_data):
        id_year = validated_data.pop('id_year', None)
        id_number = validated_data.pop('id_number', None)
        id_val = id_year if id_year is not None else id_number
        id_card_image = validated_data.pop('id_card_image', None)

        for attr, val in validated_data.items():
            setattr(instance, attr, val)
        instance.save()

        if hasattr(self, '_new_face_embedding') and self._new_face_embedding is not None:
            save_user_face_reference(instance, self._new_face_embedding)

        if id_val is not None or id_card_image is not None:
            college_id, _ = CollegeID.objects.get_or_create(user=instance, defaults={'id_year': ''})
            if id_val is not None:
                college_id.id_year = id_val.strip()
            if id_card_image is not None:
                college_id.id_card_image = id_card_image
            college_id.save()

        return instance


class UserSelfProfileSerializer(serializers.ModelSerializer):
    username = serializers.CharField(required=False)
    email = serializers.EmailField(required=False)
    phone_number = serializers.CharField(required=False, allow_blank=True)
    profile_image = serializers.ImageField(required=False, allow_null=True, validators=[validate_image_file])

    id_year = serializers.CharField(required=False, allow_blank=True)
    id_number = serializers.CharField(required=False, allow_blank=True, write_only=True)
    id_card_image = serializers.ImageField(required=False, allow_null=True, validators=[validate_image_file])

    class Meta:
        model = User
        fields = [
            'username',
            'first_name',
            'last_name',
            'email',
            'phone_number',
            'department',
            'profile_image',
            'id_year',
            'id_number',
            'id_card_image',
        ]

    def validate_username(self, value):
        value = value.strip()
        if value:
            user_id = self.instance.pk if self.instance else None
            if User.objects.filter(username__iexact=value).exclude(pk=user_id).exists():
                raise serializers.ValidationError("That username is already taken.")
        return value

    def validate_email(self, value):
        value = value.strip().lower()
        if value:
            user_id = self.instance.pk if self.instance else None
            if User.objects.filter(email__iexact=value).exclude(pk=user_id).exists():
                raise serializers.ValidationError("An account with that email already exists.")
        return value

    def validate_phone_number(self, value):
        value = value.strip()
        if value:
            if not value.isdigit() or len(value) != 10:
                raise serializers.ValidationError("Enter a valid 10-digit phone number (digits only).")
            user_id = self.instance.pk if self.instance else None
            if User.objects.filter(phone_number=value).exclude(pk=user_id).exists():
                raise serializers.ValidationError("That phone number is already in use by another user.")
        return value

    def validate_profile_image(self, value):
        if value:
            try:
                emb, _ = extract_single_face_embedding(value, is_registration=True)
                self._new_face_embedding = emb
            except FaceServiceError as exc:
                raise serializers.ValidationError(str(exc))
            except Exception as exc:
                raise serializers.ValidationError(f"Face image processing error: {str(exc)}")
        return value

    def validate_id_year(self, value):
        value = value.strip().upper() if value else ''
        if value:
            validate_id_year(value)
        return value

    def validate_id_number(self, value):
        return self.validate_id_year(value)

    def update(self, instance, validated_data):
        id_year = validated_data.pop('id_year', None)
        id_number = validated_data.pop('id_number', None)
        id_val = id_year if id_year is not None else id_number
        id_card_image = validated_data.pop('id_card_image', None)

        for attr, val in validated_data.items():
            setattr(instance, attr, val)
        instance.save()

        if hasattr(self, '_new_face_embedding') and self._new_face_embedding is not None:
            save_user_face_reference(instance, self._new_face_embedding)

        if id_val is not None or id_card_image is not None:
            college_id, _ = CollegeID.objects.get_or_create(user=instance, defaults={'id_year': ''})
            if id_val is not None:
                college_id.id_year = id_val.strip()
            if id_card_image is not None:
                college_id.id_card_image = id_card_image
            college_id.save()

        return instance





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
    # COLLEGE ID / ID YEAR
    # --------------------------------------------------------

    id_year = serializers.CharField(
        write_only=True,
        required=False,
        allow_blank=True,
        max_length=50,
    )

    id_number = serializers.CharField(
        write_only=True,
        required=False,
        allow_blank=True,
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
            'id_year',
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

    def validate_profile_image(self, value):
        if not value:
            raise serializers.ValidationError('Profile photograph is required.')
        try:
            emb, score = extract_single_face_embedding(value, is_registration=True)
            self._face_embedding = emb
        except FaceServiceError as exc:
            raise serializers.ValidationError(str(exc))
        except Exception as exc:
            raise serializers.ValidationError(f"Face image processing error: {str(exc)}")
        return value

    # ========================================================
    # ID YEAR VALIDATION (Format only — Non-unique batch field)
    # ========================================================

    def validate_id_year(self, value):
        if not value:
            return value
        value = value.strip().upper()
        try:
            validate_id_year(value)
        except Exception:
            raise serializers.ValidationError(
                'Enter a valid ID Year (e.g. MCA-2025-2027).'
            )
        # Multiple students can have the same ID Year. No uniqueness check.
        return value

    def validate_id_number(self, value):
        return self.validate_id_year(value)

    # ========================================================
    # PASSWORD CONFIRMATION & ID YEAR REQUIRED CHECK
    # ========================================================

    def validate(self, attrs):
        password = attrs.get('password')
        password_confirm = attrs.get('password_confirm')

        if password != password_confirm:
            raise serializers.ValidationError({
                'password_confirm': 'Passwords do not match.'
            })

        id_val = attrs.get('id_year') or attrs.get('id_number')
        if not id_val or not str(id_val).strip():
            raise serializers.ValidationError({
                'id_year': 'Enter the course and duration exactly as printed on your college ID card (e.g. MCA-2025-2027).'
            })
        attrs['id_year'] = str(id_val).strip().upper()
        attrs.pop('id_number', None)

        return attrs

    # ========================================================
    # CREATE USER
    # ========================================================

    def create(self, validated_data):
        password = validated_data.pop('password')
        validated_data.pop('password_confirm', None)
        id_year = validated_data.pop('id_year', '')
        validated_data.pop('id_number', None)
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
        # Save Biometric Face Reference (ArcFace 512-D)
        # ----------------------------------------------------
        if hasattr(self, '_face_embedding') and self._face_embedding is not None:
            save_user_face_reference(user, self._face_embedding)

        # ----------------------------------------------------
        # Create college ID record (Non-unique ID Year)
        # ----------------------------------------------------
        CollegeID.objects.create(
            user=user,
            id_year=id_year,
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
        raw_username = attrs.get('username', '')
        if raw_username:
            raw_username = str(raw_username).strip()
            matched = User.objects.filter(
                Q(username__iexact=raw_username) | Q(email__iexact=raw_username)
            ).first()
            if matched:
                attrs['username'] = matched.username

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

        data['role'] = self.user.role
        data['username'] = self.user.username
        data['full_name'] = self.user.get_full_name()

        return data