from rest_framework import serializers
from .models import Task, Comment, Attachment
from apps.users.serializers import UserMinimalSerializer
from apps.projects.serializers import ProjectListSerializer


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
        # ✅ AJOUT DE 'task' dans read_only_fields
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
    
    project = ProjectListSerializer(read_only=True)
    assigned_to = UserMinimalSerializer(read_only=True)
    created_by = UserMinimalSerializer(read_only=True)

        # 🆕 Champs supplémentaires pour compatibilité frontend
    project_name = serializers.CharField(source='project.name', read_only=True)
    assigned_to_name = serializers.CharField(source='assigned_to.username', read_only=True)
    
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
            'project_name', 
            'assigned_to',
            'assigned_to_name', 
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
        if attrs.get('due_date') and attrs['project'].end_date:
            if attrs['due_date'] > attrs['project'].end_date:
                raise serializers.ValidationError({
                    "due_date": "La date d'échéance ne peut pas dépasser la date de fin du projet."
                })
        return attrs


class TaskListSerializer(serializers.ModelSerializer):
    """Serializer léger pour la liste des tâches."""
    
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
