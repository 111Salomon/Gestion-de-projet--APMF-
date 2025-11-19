"""Views pour les notifications."""

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from .models import Notification
from .serializers import NotificationSerializer


class NotificationViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet pour les notifications.
    
    Endpoints:
    - GET /api/notifications/              → Liste toutes les notifications
    - GET /api/notifications/unread/       → Notifications non lues
    - GET /api/notifications/unread_count/ → Nombre de non lues
    - POST /api/notifications/{id}/mark_as_read/  → Marquer comme lue
    - POST /api/notifications/mark_all_read/      → Tout marquer comme lu
    """
    
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Retourne uniquement les notifications de l'utilisateur connecté."""
        return Notification.objects.filter(
            recipient=self.request.user
        ).select_related('actor')  # Optimisation : charge l'acteur en 1 requête
    
    @action(detail=False, methods=['get'])
    def unread(self, request):
        """Retourne les notifications non lues."""
        notifications = self.get_queryset().filter(is_read=False)
        serializer = self.get_serializer(notifications, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def unread_count(self, request):
        """Retourne le nombre de notifications non lues."""
        count = self.get_queryset().filter(is_read=False).count()
        return Response({'count': count})
    
    @action(detail=True, methods=['post'])
    def mark_as_read(self, request, pk=None):
        """Marque une notification comme lue."""
        notification = self.get_object()
        notification.mark_as_read()
        serializer = self.get_serializer(notification)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def mark_all_read(self, request):
        """Marque toutes les notifications comme lues."""
        updated = self.get_queryset().filter(is_read=False).update(
            is_read=True,
            read_at=timezone.now()
        )
        return Response({
            'message': f'{updated} notification(s) marquée(s) comme lue(s)',
            'count': updated
        })
