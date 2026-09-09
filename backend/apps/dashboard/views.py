"""
FILE: apps/dashboard/views.py
PURPOSE: One dashboard endpoint per role, each restricted to that role
         (or Admin), returning the aggregated data described in SRS
         Module 1, 2, 3 & 5.
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from .admin_dashboard import build_admin_dashboard
from .principal_dashboard import build_principal_dashboard
from .faculty_dashboard import build_faculty_dashboard
from .student_dashboard import build_student_dashboard
from .canteen_dashboard import build_canteen_dashboard
from .warden_dashboard import build_warden_dashboard


class RoleRestrictedDashboardView(APIView):
    permission_classes = [IsAuthenticated]
    allowed_roles = []
    builder = None
    needs_user = False

    def get(self, request):
        if request.user.role not in self.allowed_roles and request.user.role != 'ADMIN':
            return Response({'detail': 'Not authorized for this dashboard.'}, status=403)
        data = self.builder(request.user) if self.needs_user else self.builder()
        return Response(data)


class AdminDashboardView(RoleRestrictedDashboardView):
    """GET /api/dashboard/admin/"""
    allowed_roles = ['ADMIN']
    builder = staticmethod(build_admin_dashboard)


class PrincipalDashboardView(RoleRestrictedDashboardView):
    """GET /api/dashboard/principal/"""
    allowed_roles = ['PRINCIPAL']
    builder = staticmethod(build_principal_dashboard)


class FacultyDashboardView(RoleRestrictedDashboardView):
    """GET /api/dashboard/faculty/"""
    allowed_roles = ['FACULTY']
    builder = staticmethod(build_faculty_dashboard)
    needs_user = True


class StudentDashboardView(RoleRestrictedDashboardView):
    """GET /api/dashboard/student/"""
    allowed_roles = ['STUDENT']
    builder = staticmethod(build_student_dashboard)
    needs_user = True


class CanteenDashboardView(RoleRestrictedDashboardView):
    """GET /api/dashboard/canteen/"""
    allowed_roles = ['CANTEEN_STAFF']
    builder = staticmethod(build_canteen_dashboard)


class WardenDashboardView(RoleRestrictedDashboardView):
    """GET /api/dashboard/warden/"""
    allowed_roles = ['WARDEN']
    builder = staticmethod(build_warden_dashboard)
