"""
FILE: apps/bookings/permissions.py
PURPOSE: Object-level permissions for bookings — owners manage their own
          bookings; only the Principal may review rebooking requests.

          Also the single source of truth for *which* bookings a user may
          see (`visible_bookings_for`). Every booking list/detail endpoint
          is built on top of it so ownership is enforced on the backend,
          never by frontend filtering.
"""
from rest_framework.permissions import BasePermission, SAFE_METHODS

# Roles with campus-wide oversight of every booking.
OVERSIGHT_ROLES = ('ADMIN', 'PRINCIPAL')

# Operational staff: may view (read-only) bookings of their own sub-system.
STAFF_BOOKING_SCOPE = {
    'WARDEN': 'HOSTEL',
    'CANTEEN_STAFF': 'CANTEEN',
}


def visible_bookings_for(user, queryset):
    """
    Restrict a Booking queryset to what `user` is allowed to see.

    - Admin / Principal  -> all bookings
    - Warden             -> own bookings + all HOSTEL bookings
    - Canteen staff      -> own bookings + all CANTEEN bookings
    - Everyone else      -> ONLY their own bookings (Booking.user == user)
    """
    from django.db.models import Q

    role = getattr(user, 'role', None)
    if role in OVERSIGHT_ROLES:
        return queryset
    scope = STAFF_BOOKING_SCOPE.get(role)
    if scope:
        return queryset.filter(Q(user=user) | Q(booking_type=scope))
    return queryset.filter(user=user)


class IsBookingOwnerOrReadOnlyAdmin(BasePermission):
    def has_object_permission(self, request, view, obj):
        role = getattr(request.user, 'role', None)
        if role in OVERSIGHT_ROLES:
            return True
        if obj.user_id == request.user.id:
            return True
        if request.method in SAFE_METHODS:
            return STAFF_BOOKING_SCOPE.get(role) == obj.booking_type
        return False


class IsPrincipalForReview(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == 'PRINCIPAL')


class IsPrincipalOrAdmin(BasePermission):
    """Booking approval/decline from the administrative clearance log."""
    def has_permission(self, request, view):
        return bool(
            request.user and request.user.is_authenticated
            and getattr(request.user, 'role', None) in OVERSIGHT_ROLES
        )
