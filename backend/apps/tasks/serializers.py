from rest_framework import serializers
from .models import Task, Comment, Attachment
from apps.users.serializers import UserMinimalSerializer
from apps.projects.serializers import ProjectListSerializer
from apps.projects.models import Project, ProjectMember
from apps.users.models import User


def _raise_validation_error(error):
    if hasattr(error, 'message_dict') and error.message_dict:
        raise serializers.ValidationError(error.message_dict)
    raise serializers.ValidationError(error.messages)



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
    
    # ✅ AJOUT : Permissions calculées côté backend
    user_role_in_project = serializers.SerializerMethodField()
    user_permissions = serializers.SerializerMethodField()
    
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
            'updated_at',
            'user_role_in_project',
            'user_permissions',
        ]
        read_only_fields = [
            'id',
            'created_by',
            'completed_at',
            'created_at',
            'updated_at'
        ]

    def validate(self, attrs):
        """Valide les règles métier lors des mises à jour de tâches."""
        project = attrs.get('project', getattr(self.instance, 'project', None))
        due_date = attrs.get('due_date', getattr(self.instance, 'due_date', None))
        status = attrs.get('status', getattr(self.instance, 'status', Task.StatusChoices.TODO))
        completed_at = attrs.get('completed_at', getattr(self.instance, 'completed_at', None))

        if project is not None:
            current_project = getattr(self.instance, 'project', None)
            project_changed = current_project is not None and project.pk != current_project.pk
            if not self.instance or project_changed:
                if project.status in [Project.StatusChoices.COMPLETED, Project.StatusChoices.ARCHIVED]:
                    raise serializers.ValidationError({
                        'project': "Une tâche ne peut pas être créée dans un projet terminé ou archivé."
                    })

        task = Task(
            project=project,
            due_date=due_date,
            status=status,
            completed_at=completed_at,
        )
        task.pk = getattr(self.instance, 'pk', None)

        try:
            task.clean()
        except Exception as error:
            _raise_validation_error(error)

        return attrs
    
    def get_user_role_in_project(self, obj):
        """Retourne le rôle de l'utilisateur dans le projet de cette tâche."""
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return None
        
        user = request.user
        project = obj.project
        
        if not project:
            return None
        
        # 1. Créateur du projet
        if project.owner == user:
            return 'creator'
        
        # 2. Rôle dans ProjectMember
        try:
            membership = ProjectMember.objects.get(project=project, user=user)
            return membership.role  # 'owner', 'manager', 'member', 'viewer'
        except ProjectMember.DoesNotExist:
            return None
    
    def get_user_permissions(self, obj):
        """Retourne les permissions de l'utilisateur sur cette tâche."""
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return {
                'can_edit': False,
                'can_delete': False,
                'can_change_status': False,
            }
        
        user = request.user
        project = obj.project
        
        if not project:
            return {
                'can_edit': False,
                'can_delete': False,
                'can_change_status': False,
            }
        
        # 1️⃣ Admin/Chef global → Tous les droits
        if user.role in ['admin', 'chef']:
            return {
                'can_edit': True,
                'can_delete': True,
                'can_change_status': True,
            }
        
        # 2️⃣ Créateur du projet → Tous les droits
        if project.owner == user:
            return {
                'can_edit': True,
                'can_delete': True,
                'can_change_status': True,
            }
        
        # 3️⃣ Vérifier le rôle dans ProjectMember
        # Si les membres du projet ont été préchargés (prefetch_related), on l'utilise
        try:
            members_qs = project.project_members.all()
            # Si préchargé, this avoids DB hit inside .get()
            membership = None
            for m in members_qs:
                if m.user_id == user.id:
                    membership = m
                    break

            if membership is None:
                # Fallback : requête directe si non préchargé
                membership = ProjectMember.objects.get(project=project, user=user)

            # Propriétaire désigné → Tous les droits
            if membership.role == 'owner':
                return {
                    'can_edit': True,
                    'can_delete': True,
                    'can_change_status': True,
                }

            # Gestionnaire → Peut modifier et supprimer
            elif membership.role == 'manager':
                return {
                    'can_edit': True,
                    'can_delete': True,
                    'can_change_status': True,
                }

            # Membre → Lecture seule + changer statut si assigné
            elif membership.role == 'member':
                is_assigned = (obj.assigned_to == user)
                return {
                    'can_edit': False,
                    'can_delete': False,
                    'can_change_status': is_assigned,
                }

            # Viewer → Lecture seule
            else:
                return {
                    'can_edit': False,
                    'can_delete': False,
                    'can_change_status': False,
                }
        except ProjectMember.DoesNotExist:
            # 4️⃣ Pas membre → Vérifier si assigné à la tâche
            if obj.assigned_to == user:
                return {
                    'can_edit': False,
                    'can_delete': False,
                    'can_change_status': True,
                }
            return {
                'can_edit': False,
                'can_delete': False,
                'can_change_status': False,
            }
    
    def to_representation(self, instance):
        """
        Transforme les IDs en objets complets pour la lecture.
        
        En ÉCRITURE : on envoie assigned_to = 7
        En LECTURE : on reçoit assigned_to = { id: 7, username: "dophie", ... }
        """
        data = super().to_representation(instance)
        
        # Remplace les IDs par les objets complets
        if instance.project:
            data['project'] = ProjectListSerializer(instance.project, context=self.context).data
        
        if instance.assigned_to:
            data['assigned_to'] = UserMinimalSerializer(
                instance.assigned_to, 
                context=self.context
            ).data
        
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
        """Valide les règles métier à la création d'une tâche."""
        project = attrs.get('project')
        if project and project.status in [Project.StatusChoices.COMPLETED, Project.StatusChoices.ARCHIVED]:
            raise serializers.ValidationError({
                'project': "Une tâche ne peut pas être créée dans un projet terminé ou archivé."
            })

        task = Task(
            project=project,
            due_date=attrs.get('due_date'),
            status=attrs.get('status', Task.StatusChoices.TODO),
        )

        try:
            task.clean()
        except Exception as error:
            _raise_validation_error(error)

        return attrs



class TaskListSerializer(serializers.ModelSerializer):
    """Serializer léger pour la liste des tâches."""
    
    project = ProjectListSerializer(read_only=True)
    assigned_to = serializers.SerializerMethodField()
    is_overdue = serializers.ReadOnlyField()
    
    # ✅ AJOUT : Permissions aussi dans la liste
    user_permissions = serializers.SerializerMethodField()
    
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
            'created_at',
            'user_permissions',
        ]
    
    # ✅ MÉTHODE MANQUANTE AJOUTÉE ICI
    def get_assigned_to(self, obj):
        """Retourne les infos de l'utilisateur assigné avec avatar_url complet."""
        if obj.assigned_to:
            return UserMinimalSerializer(
                obj.assigned_to, 
                context=self.context
            ).data
        return None
    
    def get_user_permissions(self, obj):
        """Même logique que TaskSerializer."""
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return {'can_edit': False, 'can_delete': False, 'can_change_status': False}
        
        user = request.user
        project = obj.project
        
        if not project:
            return {'can_edit': False, 'can_delete': False, 'can_change_status': False}
        
        # Admin/Chef
        if user.role in ['admin', 'chef']:
            return {'can_edit': True, 'can_delete': True, 'can_change_status': True}
        
        # Créateur
        if project.owner == user:
            return {'can_edit': True, 'can_delete': True, 'can_change_status': True}
        
        # ProjectMember — use prefetched members when possible to avoid N+1
        try:
            members_qs = project.project_members.all()
            membership = None
            for m in members_qs:
                if m.user_id == user.id:
                    membership = m
                    break

            if membership is None:
                membership = ProjectMember.objects.get(project=project, user=user)

            if membership.role == 'owner':
                return {'can_edit': True, 'can_delete': True, 'can_change_status': True}
            elif membership.role == 'manager':
                return {'can_edit': True, 'can_delete': True, 'can_change_status': True}
            elif membership.role == 'member':
                is_assigned = (obj.assigned_to == user)
                return {'can_edit': False, 'can_delete': False, 'can_change_status': is_assigned}
            else:
                return {'can_edit': False, 'can_delete': False, 'can_change_status': False}
        except ProjectMember.DoesNotExist:
            if obj.assigned_to == user:
                return {'can_edit': False, 'can_delete': False, 'can_change_status': True}
            return {'can_edit': False, 'can_delete': False, 'can_change_status': False}
