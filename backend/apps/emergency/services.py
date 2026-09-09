"""
FILE: apps/emergency/services.py
PURPOSE: Helper to mark a dispatch against an emergency log entry once a
         medical staff member is contacted/en route.
"""
from .models import EmergencyAccessLog


def record_dispatch(log: EmergencyAccessLog, staff, notes=''):
    log.dispatched_staff = staff
    log.notes = notes
    log.save(update_fields=['dispatched_staff', 'notes'])
    return log
