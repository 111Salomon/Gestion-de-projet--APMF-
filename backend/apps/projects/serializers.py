from rest_framework import serializers
from .models import Project, ProjectMember
from apps.users.models import User
from apps.users.serializers import UserMinimalSerializer


# ═══════════════════════════════════════════════════════════════════
# 👤 USER SERIALIZER (pour la gestion des membres)
# ═══════════════════════════════════════════════════════════════════

class UserSerializer(serializers.ModelSerializer):
    """
    Serializer complet pour les utilisateurs.
    Utilisé dans la liste des membres et les users disponibles.
    """
    full_name = serializers.CharField(source='get_full_name', read_only=True)
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'full_name', 'avatar', 'role']
        read_only_fields = ['id']


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
        return ProjectMemberSerializer(members, many=True).data