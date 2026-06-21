from rest_framework import serializers
from .models import Project, ProjectMember
from apps.users.models import User
from apps.users.serializers import UserMinimalSerializer


def _raise_validation_error(error):
    if hasattr(error, 'message_dict') and error.message_dict:
        raise serializers.ValidationError(error.message_dict)
    raise serializers.ValidationError(error.messages)


# ═══════════════════════════════════════════════════════════════════
# 👤 USER SERIALIZER (pour la gestion des membres)
# ═══════════════════════════════════════════════════════════════════

class UserSerializer(serializers.ModelSerializer):
    """
    Serializer complet pour les utilisateurs.
    Utilisé dans la liste des membres et les users disponibles.
    """
    full_name = serializers.CharField(source='get_full_name', read_only=True)
    avatar_url = serializers.SerializerMethodField() 

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'full_name', 'avatar', 'avatar_url', 'role']
        read_only_fields = ['id']

    # ✅ AJOUTER CETTE MÉTHODE
    def get_avatar_url(self, obj):
        """Retourne l'URL complète de l'avatar ou None."""
        if obj.avatar:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.avatar.url)
            return obj.avatar.url
        return None
# ═══════════════════════════════════════════════════════════════════
# 👥 PROJECT MEMBER SERIALIZER
# ═══════════════════════════════════════════════════════════════════

class ProjectMemberSerializer(serializers.ModelSerializer):
    """
    Serializer pour ProjectMember.
    Affiche les membres d'un projet avec leurs rôles.
    
    📌 Utilisé dans:
        - GET /api/projects/{id}/members/
        - POST /api/projects/{id}/members/add/
        - PATCH /api/projects/{id}/members/{user_id}/role/
    """
    
    # Relations
    user = UserSerializer(read_only=True)  # Infos complètes du user
    user_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(),
        source='user',
        write_only=True  # Utilisé seulement en création
    )
    
    # Champs calculés
    role_display = serializers.CharField(
        source='get_role_display', 
        read_only=True  # Ex: "member" → "Membre"
    )
    
    class Meta:
        model = ProjectMember
        fields = [
            'id',
            'user',           # Objet user complet (lecture)
            'user_id',        # ID pour création (écriture)
            'role',           # manager/developer/viewer/member
            'role_display',   # Libellé français
            'joined_at'       # Date d'ajout au projet
        ]
        read_only_fields = ['id', 'joined_at']


# ═══════════════════════════════════════════════════════════════════
# 📦 PROJECT SERIALIZERS
# ═══════════════════════════════════════════════════════════════════

class ProjectSerializer(serializers.ModelSerializer):
    """
    Serializer complet pour un projet (détail).
    Inclut tous les champs + membres.
    
    📌 Utilisé dans:
        - GET /api/projects/{id}/
        - PUT /api/projects/{id}/
    """
    
    # Relations
    owner = UserMinimalSerializer(read_only=True)
    project_members = ProjectMemberSerializer(many=True, read_only=True)
    
    # Champs calculés
    progress = serializers.ReadOnlyField()  # % calculé dans le modèle
    tasks_count = serializers.SerializerMethodField()
    members_count = serializers.SerializerMethodField()  # 🆕 Nombre de membres
    
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
            'members_count',      # 🆕 Ajouté
            'project_members',    # Liste complète des membres
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['id', 'owner', 'created_at', 'updated_at']

    def validate(self, attrs):
        """Valide les dates du projet et la compatibilité avec les tâches existantes."""
        start_date = attrs.get('start_date', getattr(self.instance, 'start_date', None))
        end_date = attrs.get('end_date', getattr(self.instance, 'end_date', None))

        project = Project(
            start_date=start_date,
            end_date=end_date,
        )
        project.pk = getattr(self.instance, 'pk', None)

        try:
            project.clean()
        except Exception as error:
            _raise_validation_error(error)

        return attrs
    
    def get_tasks_count(self, obj):
        """Retourne le nombre de tâches du projet."""
        return obj.tasks.count()
    
    def get_members_count(self, obj):
        """Retourne le nombre de membres du projet."""
        return obj.project_members.count()


class ProjectCreateSerializer(serializers.ModelSerializer):
    """
    Serializer pour la création de projets.
    Plus léger, sans relations complexes.
    
    📌 Utilisé dans:
        - POST /api/projects/
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
        """Valide les dates du projet à la création."""
        project = Project(
            start_date=attrs.get('start_date'),
            end_date=attrs.get('end_date'),
        )

        try:
            project.clean()
        except Exception as error:
            _raise_validation_error(error)

        return attrs


class ProjectListSerializer(serializers.ModelSerializer):
    """
    Serializer léger pour la liste des projets.
    N'inclut PAS les membres (optimisation).
    
    📌 Utilisé dans:
        - GET /api/projects/
        - GET /api/projects/my_projects/
    """
    
    owner = UserMinimalSerializer(read_only=True)
    progress = serializers.ReadOnlyField()
    tasks_count = serializers.SerializerMethodField()
    members_count = serializers.SerializerMethodField()  # 🆕 Ajouté
    members = serializers.SerializerMethodField()  # ✅ AJOUTE

    class Meta:
        model = Project
        fields = [
            'id',
            'name',
            'owner',
            'status',
            'progress',
            'tasks_count',
            'members_count', 
            'members',
            'start_date',
            'end_date',
            'created_at'
        ]
    
    def get_tasks_count(self, obj):
        return obj.tasks.count()
    
    def get_members_count(self, obj):
        return obj.project_members.count()


    def get_members(self, obj):  # ✅ AJOUTE CETTE MÉTHODE
        """Retourne les 3 premiers membres pour les avatars."""
        members = obj.project_members.select_related('user').all()[:3]
        return ProjectMemberSerializer(members, many=True, context=self.context).data