from rest_framework import serializers
from .models import Task, Comment, Attachment
from apps.users.serializers import UserMinimalSerializer
from apps.projects.serializers import ProjectListSerializer
from apps.projects.models import Project
from apps.users.models import User

class CommentSerializer(serializers.ModelSerializer):
    """Serializer pour les commentaires."""
    
    author = UserMinimalSerializer(read_only=True)
    
    class Meta:
        model = Comment
        fields = [
            'id',
            'task',
            'author',
            'content',
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['id', 'task', 'author', 'created_at', 'updated_at']


class AttachmentSerializer(serializers.ModelSerializer):
    """Serializer pour les pièces jointes."""
    
    uploaded_by = UserMinimalSerializer(read_only=True)
    file_size_mb = serializers.ReadOnlyField()
    file_extension = serializers.ReadOnlyField()
    is_image = serializers.ReadOnlyField()
    file_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Attachment
        fields = [
            'id',
            'task',
            'file',
            'file_url',
            'file_name',
            'file_size',
            'file_size_mb',
            'file_extension',
            'is_image',
            'uploaded_by',
            'uploaded_at'
        ]
        read_only_fields = [
            'id',
            'file_name',
            'file_size',
            'file_extension',
            'is_image',
            'uploaded_by',
            'uploaded_at'
        ]
    
    def get_file_url(self, obj):
        """Retourne l'URL complète du fichier."""
        request = self.context.get('request')
        if obj.file and hasattr(obj.file, 'url'):
            if request:
                return request.build_absolute_uri(obj.file.url)
            return obj.file.url
        return None


class TaskSerializer(serializers.ModelSerializer):
    """Serializer détaillé pour les tâches."""
    
    # En ÉCRITURE : accepte les IDs
    project = serializers.PrimaryKeyRelatedField(
        queryset=Project.objects.all(),
        required=False,
        allow_null=True
    )
    assigned_to = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(),
        required=False,
        allow_null=True
    )
    
    # Toujours en read-only
    created_by = UserMinimalSerializer(read_only=True)
    
    comments = CommentSerializer(many=True, read_only=True)
    attachments = AttachmentSerializer(many=True, read_only=True)
    
    is_overdue = serializers.ReadOnlyField()
    is_completed = serializers.ReadOnlyField()
    
    class Meta:
        model = Task
        fields = [
            'id',
            'title',
            'description',
            'project',
            'assigned_to',
            'created_by',
            'status',
            'priority',
            'due_date',
            'completed_at',
            'order',
            'is_overdue',
            'is_completed',
            'comments',
            'attachments',
            'created_at',
            'updated_at'
        ]
        read_only_fields = [
            'id',
            'created_by',
            'completed_at',
            'created_at',
            'updated_at'
        ]
    
    def to_representation(self, instance):
        """
        Transforme les IDs en objets complets pour la lecture.
        
        En ÉCRITURE : on envoie assigned_to = 7
        En LECTURE : on reçoit assigned_to = { id: 7, username: "dophie", ... }
        """
        data = super().to_representation(instance)
        
        # Remplace les IDs par les objets complets
        if instance.project:
            data['project'] = ProjectListSerializer(instance.project).data
        
        if instance.assigned_to:
            data['assigned_to'] = UserMinimalSerializer(instance.assigned_to).data
        
        return data


class TaskCreateSerializer(serializers.ModelSerializer):
    """Serializer pour la création de tâches."""
    
    class Meta:
        model = Task
        fields = [
            'id',
            'title',
            'description',
            'project',
            'assigned_to',
            'status',
            'priority',
            'due_date'
        ]
        read_only_fields = ['id']
    
    def validate(self, attrs):
        """Valide que la date d'échéance ne dépasse pas la fin du projet."""
        if attrs.get('due_date') and attrs.get('project') and attrs['project'].end_date:
            if attrs['due_date'] > attrs['project'].end_date:
                raise serializers.ValidationError({
                    "due_date": "La date d'échéance ne peut pas dépasser la date de fin du projet."
                })
        return attrs


class TaskListSerializer(serializers.ModelSerializer):
    """Serializer léger pour la liste des tâches."""
    
    project = ProjectListSerializer(read_only=True)
    assigned_to = UserMinimalSerializer(read_only=True)
    is_overdue = serializers.ReadOnlyField()
    
    class Meta:
        model = Task
        fields = [
            'id',
            'title',
            'project',
            'assigned_to',
            'status',
            'priority',
            'due_date',
            'is_overdue',
            'created_at'
        ]
