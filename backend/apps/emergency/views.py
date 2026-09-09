from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from apps.accounts.models import CollegeID
from .models import MedicalStaff, EmergencyAccessLog
from .serializers import IDCardLoginSerializer, MedicalStaffSerializer, EmergencyAccessLogSerializer
from .id_card_matcher import match_id_card, IDCardMatchError
from .face_matcher import match_face


class IDCardLoginView(APIView):
    """
    POST /api/emergency/id-card-login/

    Public emergency entry point. The camera sends a photo of the physical
    ID card. The server compares it against registered card images using
    deterministic OpenCV feature matching, without QR and without AI.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = IDCardLoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        uploaded = serializer.validated_data['id_card_image']

        matches = []
        for college_id in CollegeID.objects.select_related('user').filter(is_active=True):
            if not college_id.id_card_image:
                continue
            try:
                matched, score = match_id_card(uploaded, college_id.id_card_image.file)
            except IDCardMatchError:
                continue
            if matched:
                matches.append((score, college_id))

        if not matches:
            return Response(
                {'detail': 'ID card not recognized. Hold the complete card clearly inside the camera frame and try again.'},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        matches.sort(key=lambda item: item[0], reverse=True)
        college_id = matches[0][1]
        user = college_id.user

        # Emergency access: only block accounts that are explicitly disabled.
        # is_validated is an admin workflow gate and must NOT block medical emergencies.
        if not user.is_active:
            return Response(
                {'detail': 'This account has been disabled. Please contact the administrator.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        refresh = RefreshToken.for_user(user)
        responder = MedicalStaff.objects.filter(is_on_duty=True).select_related('user').first()

        def abs_url(field):
            if not field:
                return None
            try:
                return request.build_absolute_uri(field.url)
            except ValueError:
                return None

        EmergencyAccessLog.objects.create(
            user=user,
            scanned_id_number=college_id.id_number,
            dispatched_staff=responder,
            notes='Emergency login authenticated by deterministic physical ID-card image matching.',
        )

        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'identity': {
                'name': user.get_full_name() or user.username,
                'id_number': college_id.id_number,
                'profile_image': abs_url(user.profile_image),
                'id_card_image': abs_url(college_id.id_card_image),
            },
            'responder': {
                'name': responder.user.get_full_name() or responder.user.username,
                'designation': responder.designation,
                'contact_number': responder.contact_number,
            } if responder else None,
        })


class FaceLoginView(APIView):
    """
    POST /api/emergency/face-login/

    Public emergency entry point. The camera sends a live face photo.
    The server compares it against the registered profile image using
    OpenCV Haar cascade face detection + ORB + histogram matching.
    No AI or cloud APIs are used.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        live_image = request.FILES.get('face_image')
        if not live_image:
            return Response(
                {'detail': 'No face image provided. Please capture your face with the camera.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        matches = []
        for college_id in CollegeID.objects.select_related('user').filter(is_active=True):
            user = college_id.user
            if not user.profile_image:
                continue
            try:
                matched, detail = match_face(live_image, user.profile_image.file)
            except Exception:
                continue
            if matched:
                matches.append((detail, college_id))

        if not matches:
            return Response(
                {'detail': 'Face not recognised. Look directly at the camera in good lighting and try again.'},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        # Use the first confident match
        _, college_id = matches[0]
        user = college_id.user

        if not user.is_active:
            return Response(
                {'detail': 'This account has been disabled.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        refresh = RefreshToken.for_user(user)
        responder = MedicalStaff.objects.filter(is_on_duty=True).select_related('user').first()

        def abs_url(field):
            if not field:
                return None
            try:
                return request.build_absolute_uri(field.url)
            except ValueError:
                return None

        EmergencyAccessLog.objects.create(
            user=user,
            scanned_id_number=college_id.id_number,
            dispatched_staff=responder,
            notes='Emergency login authenticated by face-to-profile-photo matching (OpenCV).',
        )

        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'identity': {
                'name': user.get_full_name() or user.username,
                'id_number': college_id.id_number,
                'profile_image': abs_url(user.profile_image),
                'id_card_image': abs_url(college_id.id_card_image),
            },
            'responder': {
                'name': responder.user.get_full_name() or responder.user.username,
                'designation': responder.designation,
                'contact_number': responder.contact_number,
            } if responder else None,
        })


class OnDutyMedicalStaffListView(generics.ListAPIView):
    serializer_class = MedicalStaffSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        return MedicalStaff.objects.filter(is_on_duty=True).order_by('-updated_at')



class EmergencyAccessLogListView(generics.ListAPIView):
    serializer_class = EmergencyAccessLogSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'ADMIN':
            return EmergencyAccessLog.objects.all()
        return EmergencyAccessLog.objects.filter(user=user)
