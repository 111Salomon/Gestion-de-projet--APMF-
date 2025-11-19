"""Serializers pour les notifications."""

from rest_framework import serializers
from .models import Notification
from apps.users.serializers import UserMinimalSerializer


class NotificationSerializer(serializers.ModelSerializer):
    """Serializer pour les notifications."""
    
    # Affiche les infos de l'acteur (qui a déclenché la notif)
    actor = UserMinimalSerializer(read_only=True)
    
    # Champ calculé : "Il y a 5 min"
    time_ago = serializers.SerializerMethodField()
    
    class Meta:
        model = Notification
        fields = [
            'id', 'recipient', 'actor', 'notification_type',
            'title', 'message', 'task_id', 'project_id',
            'action_url', 'is_read', 'read_at', 'created_at', 'time_ago'
        ]
        read_only_fields = ['id', 'recipient', 'actor', 'created_at']
    
    def get_time_ago(self, obj):
        """Calcule le temps écoulé."""
        from django.utils import timezone
        from datetime import timedelta
        
        diff = timezone.now() - obj.created_at
        
        if diff < timedelta(minutes=1):
            return "À l'instant"
        elif diff < timedelta(hours=1):
            minutes = int(diff.total_seconds() / 60)
            return f"Il y a {minutes} min"
        elif diff < timedelta(days=1):
            hours = int(diff.total_seconds() / 3600)
            return f"Il y a {hours}h"
        else:
            return f"Il y a {diff.days}j"
