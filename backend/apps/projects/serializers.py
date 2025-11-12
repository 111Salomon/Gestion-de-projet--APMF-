from rest_framework import serializers
from .models import Project, ProjectMember
from apps.users.serializers import UserMinimalSerializer
from apps.users.models import User


class ProjectMemberSerializer(serializers.ModelSerializer):
    """
    Serializer pour ProjectMember.
    Affiche les membres d'un projet avec leurs rôles.
    """
    
    user = UserMinimalSerializer(read_only=True)
    user_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(),
        source='user',
        write_only=True
    )
    
    class Meta:
        model = ProjectMember
        fields = [
            'id',
            'user',
            'user_id',
            'role',
            'joined_at'
        ]
        read_only_fields = ['id', 'joined_at']


class ProjectSerializer(serializers.ModelSerializer):
    """
    Serializer pour le modèle Project.
    """
    
    owner = UserMinimalSerializer(read_only=True)
    project_members = ProjectMemberSerializer(many=True, read_only=True)
    
    # Champs calculés
    progress = serializers.ReadOnlyField()
    tasks_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Project
        fields = [
            'id',
            'name',
            'description',
            'owner',
            'status',
            'start_date',
            'end_date',
            'progress',
            'tasks_count',
            'project_members',
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['id', 'owner', 'created_at', 'updated_at']
    
    def get_tasks_count(self, obj):
        """Retourne le nombre de tâches du projet."""
        return obj.tasks.count()


class ProjectCreateSerializer(serializers.ModelSerializer):
    """
    Serializer pour la création de projets.
    """
    
    class Meta:
        model = Project
        fields = [
            'id',
            'name',
            'description',
            'status',
            'start_date',
            'end_date'
        ]

        read_only_fields = ['id']
    
    def validate(self, attrs):
        """Valide que la date de fin est après la date de début."""
        if attrs.get('start_date') and attrs.get('end_date'):
            if attrs['end_date'] < attrs['start_date']:
                raise serializers.ValidationError({
                    "end_date": "La date de fin doit être postérieure à la date de début."
                })
        return attrs


class ProjectListSerializer(serializers.ModelSerializer):
    """
    Serializer léger pour la liste des projets.
    N'inclut pas les membres pour optimiser les performances.
    """
    
    owner = UserMinimalSerializer(read_only=True)
    progress = serializers.ReadOnlyField()
    tasks_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Project
        fields = [
            'id',
            'name',
            'owner',
            'status',
            'progress',
            'tasks_count',
            'start_date',
            'end_date',
            'created_at'
        ]
    
    def get_tasks_count(self, obj):
        return obj.tasks.count()
