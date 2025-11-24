"""
Serializers pour la gestion de l'équipe.
"""

from rest_framework import serializers
from .models import User
from apps.tasks.models import Task


class TeamMemberSerializer(serializers.ModelSerializer):
    """Serializer pour afficher un membre de l'équipe avec ses stats."""
    
    # Champs calculés
    full_name = serializers.SerializerMethodField()
    tasks_total = serializers.SerializerMethodField()
    tasks_in_progress = serializers.SerializerMethodField()
    tasks_done = serializers.SerializerMethodField()
    completion_rate = serializers.SerializerMethodField()
    avatar_url = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id',
            'username',
            'email',
            'first_name',
            'last_name',
            'full_name',
            'role',
            'avatar_url',
            'tasks_total',
            'tasks_in_progress',
            'tasks_done',
            'completion_rate',
            'avatar_url',
            'is_active',
            'date_joined',
        ]
        read_only_fields = ['id', 'date_joined']
    
    def get_full_name(self, obj):
        """Retourne le nom complet via la méthode du modèle."""
        return obj.get_full_name()  # ✅ Appelle la méthode du modèle
    
    def get_tasks_total(self, obj):
        """Nombre total de tâches assignées."""
        return Task.objects.filter(assigned_to=obj).count()
    
    def get_tasks_in_progress(self, obj):
        """Nombre de tâches en cours."""
        return Task.objects.filter(
            assigned_to=obj,
            status='in_progress'
        ).count()
    
    def get_tasks_done(self, obj):
        """Nombre de tâches terminées."""
        return Task.objects.filter(
            assigned_to=obj,
            status='done'
        ).count()
    
    def get_completion_rate(self, obj):
        """Taux de complétion en pourcentage."""
        total = self.get_tasks_total(obj)
        if total == 0:
            return 0
        done = self.get_tasks_done(obj)
        return round((done / total) * 100, 1)
    
    def get_avatar_url(self, obj):
        """URL complète de l'avatar ou None."""
        if obj.avatar:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.avatar.url)
            return obj.avatar.url
        return None


class TeamStatsSerializer(serializers.Serializer):
    """Serializer pour les statistiques globales de l'équipe."""
    
    total_members = serializers.IntegerField()
    active_members = serializers.IntegerField()
    avg_workload = serializers.FloatField()
    completion_rate = serializers.FloatField()
