from rest_framework import serializers
from apps.tasks.models import Task
from apps.users.serializers import UserMinimalSerializer
from apps.projects.serializers import ProjectListSerializer

class CalendarTaskSerializer(serializers.ModelSerializer):
    """Serializer léger optimisé pour la vue calendrier"""
    
    assigned_to = UserMinimalSerializer(read_only=True)
    project = serializers.SerializerMethodField()
    color = serializers.SerializerMethodField()
    is_overdue = serializers.ReadOnlyField()
    
    class Meta:
        model = Task
        fields = [
            'id',
            'title',
            'status',
            'priority',
            'due_date',
            'assigned_to',
            'project',
            'color',
            'is_overdue',
        ]
    
    def get_project(self, obj):
        """Retourne infos minimales du projet"""
        if obj.project:
            return {
                'id': obj.project.id,
                'name': obj.project.name,
            }
        return None
    
    def get_color(self, obj):
        """Retourne la couleur selon la priorité (style Google Calendar)"""
        colors = {
            'urgent': '#dc2626',  # Rouge
            'high': '#2563eb',    # Bleu
            'medium': '#16a34a',  # Vert
            'low': '#eab308',     # Jaune
        }
        return colors.get(obj.priority, '#6b7280')  # Gris par défaut
