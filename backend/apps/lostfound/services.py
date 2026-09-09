"""
FILE: apps/lostfound/services.py
PURPOSE: Notifies the reporter when a candidate match is found for their item.
"""
from .matching import find_candidate_matches


def notify_possible_matches(item):
    matches = find_candidate_matches(item)
    if matches.exists():
        from apps.notifications.services import create_notification
        create_notification(item.reported_by, f"{matches.count()} possible match(es) found for '{item.title}'.")
    return matches
