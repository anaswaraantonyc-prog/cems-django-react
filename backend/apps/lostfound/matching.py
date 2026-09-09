"""
FILE: apps/lostfound/matching.py
PURPOSE: Simple keyword/category-based matching engine that suggests
         candidate FOUND items for a LOST report (and vice versa).
"""
from django.db.models import Q
from .models import LostFoundItem


def find_candidate_matches(item: LostFoundItem):
    """
    Returns a queryset of opposite-status items sharing the category or
    overlapping keywords from the title/description.
    """
    opposite_status = LostFoundItem.ItemStatus.FOUND if item.item_status == LostFoundItem.ItemStatus.LOST else LostFoundItem.ItemStatus.LOST

    keywords = [w for w in item.title.split() if len(w) > 3]
    query = Q(category__iexact=item.category) if item.category else Q()
    for word in keywords:
        query |= Q(title__icontains=word) | Q(description__icontains=word)

    return LostFoundItem.objects.filter(item_status=opposite_status).filter(query).exclude(id=item.id).distinct()


def link_match(item_a: LostFoundItem, item_b: LostFoundItem):
    """Marks two items as matched and resolved (e.g., after manual confirmation)."""
    from django.utils import timezone
    item_a.matched_with = item_b
    item_a.item_status = LostFoundItem.ItemStatus.CLAIMED
    item_a.resolved_at = timezone.now()
    item_a.save(update_fields=['matched_with', 'item_status', 'resolved_at'])

    item_b.matched_with = item_a
    item_b.item_status = LostFoundItem.ItemStatus.CLAIMED
    item_b.resolved_at = timezone.now()
    item_b.save(update_fields=['matched_with', 'item_status', 'resolved_at'])
    return item_a, item_b
