"""
FILE: apps/lostfound/views.py
PURPOSE: API endpoints to report lost/found items, list them, view
         auto-suggested matches, and confirm a match/claim.
"""
from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import LostFoundItem
from .serializers import LostFoundItemSerializer, MatchConfirmSerializer
from .matching import find_candidate_matches, link_match
from .services import notify_possible_matches
from .permissions import IsReporterOrReadOnly


class LostFoundItemViewSet(viewsets.ModelViewSet):
    """
    /api/lostfound/items/                list / report
    /api/lostfound/items/{id}/matches/   suggested candidate matches
    /api/lostfound/items/{id}/confirm-match/  link + close both records
    """
    queryset = LostFoundItem.objects.all()
    serializer_class = LostFoundItemSerializer
    permission_classes = [permissions.IsAuthenticated, IsReporterOrReadOnly]
    filterset_fields = ['item_status', 'category']
    search_fields = ['title', 'description']

    def perform_create(self, serializer):
        item = serializer.save()
        notify_possible_matches(item)

    @action(detail=True, methods=['get'])
    def matches(self, request, pk=None):
        item = self.get_object()
        candidates = find_candidate_matches(item)
        return Response(LostFoundItemSerializer(candidates, many=True).data)

    @action(detail=True, methods=['post'], url_path='confirm-match')
    def confirm_match(self, request, pk=None):
        item = self.get_object()
        serializer = MatchConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        other = LostFoundItem.objects.get(pk=serializer.validated_data['matched_item_id'])
        link_match(item, other)
        return Response(LostFoundItemSerializer(item).data)
