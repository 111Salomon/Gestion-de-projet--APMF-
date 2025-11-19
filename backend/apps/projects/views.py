from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.db.models import Q
from django.utils import timezone

from .models import Project, ProjectMember
from apps.users.models import User
from .serializers import (
    ProjectSerializer,
    ProjectCreateSerializer,
    ProjectListSerializer,
    ProjectMemberSerializer,
    UserSerializer  # 🆕 Ajouté pour lister les users
)
from apps.users.permissions import IsChefOrAdmin, IsProjectMemberOrReadOnly


class ProjectViewSet(viewsets.ModelViewSet):
    """
    ViewSet pour gérer les projets.
    
    📌 Endpoints principaux:
        - GET    /api/projects/                    → Liste des projets
        - POST   /api/projects/                    → Créer un projet
        - GET    /api/projects/{id}/               → Détails d'un projet
        - PUT    /api/projects/{id}/               → Modifier un projet
        - DELETE /api/projects/{id}/               → Supprimer un projet
        
    📌 Endpoints membres:
        - GET    /api/projects/{id}/members/       → Liste des membres
        - POST   /api/projects/{id}/members/add/   → Ajouter un membre
        - DELETE /api/projects/{id}/members/{user_id}/remove/ → Retirer un membre
        - PATCH  /api/projects/{id}/members/{user_id}/role/   → Changer le rôle
    
    📌 Endpoints utilitaires:
        - GET    /api/projects/my_projects/        → Mes projets
        - GET    /api/projects/{id}/stats/         → Statistiques du projet
        - GET    /api/projects/available_users/    → Utilisateurs disponibles
    """
    
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """
        Retourne les projets accessibles à l'utilisateur.
        
        📌 Logique:
            - Admin → Voit TOUS les projets
            - Autres → Voient leurs projets (propriétaire OU membre)
        """
        user = self.request.user
        
        if user.is_admin:
            return Project.objects.all()
        
        # Projets où l'user est owner OU membre
        return Project.objects.filter(
            Q(owner=user) | Q(members=user)
        ).distinct()
    
    def get_serializer_class(self):
        """Choisit le serializer selon l'action."""
        if self.action == 'create':
            return ProjectCreateSerializer
        elif self.action == 'list':
            return ProjectListSerializer
        return ProjectSerializer
    
    def get_permissions(self):
        """Définit les permissions selon l'action."""
        if self.action == 'create':
            return [IsAuthenticated(), IsChefOrAdmin()]
        elif self.action in ['update', 'partial_update', 'destroy']:
            return [IsAuthenticated(), IsProjectMemberOrReadOnly()]
        return [IsAuthenticated()]
    
    def perform_create(self, serializer):
        """Sauvegarde le projet avec l'owner = user connecté."""
        serializer.save(owner=self.request.user)
    
    # ═══════════════════════════════════════════════════════════════════
    # 📊 STATISTIQUES DU PROJET
    # ═══════════════════════════════════════════════════════════════════
    
    @action(detail=True, methods=['get'])
    def stats(self, request, pk=None):
        """
        📊 Retourne les statistiques d'un projet.
        
        GET /api/projects/{id}/stats/
        
        Returns:
            - total_tasks: Nombre total de tâches
            - todo, in_progress, in_review, done: Compteurs par statut
            - completion_percentage: % de complétion
            - overdue_tasks: Nombre de tâches en retard
        """
        project = self.get_object()
        
        # Import local pour éviter circular import
        from apps.tasks.models import Task
        
        # Filtre les tâches de CE projet
        tasks = Task.objects.filter(project=project)
        
        # Compte par statut
        stats = {
            'total_tasks': tasks.count(),
            'todo': tasks.filter(status='todo').count(),
            'in_progress': tasks.filter(status='in_progress').count(),
            'in_review': tasks.filter(status='in_review').count(),
            'done': tasks.filter(status='done').count(),
        }
        
        # Calcul du % de complétion
        total = stats['total_tasks']
        if total > 0:
            stats['completion_percentage'] = round((stats['done'] / total) * 100, 1)
        else:
            stats['completion_percentage'] = 0.0
        
        # Tâches en retard (deadline passée + pas terminées)
        overdue = tasks.filter(
            due_date__lt=timezone.now().date(),
            status__in=['todo', 'in_progress', 'in_review']
        ).count()
        stats['overdue_tasks'] = overdue
        
        return Response(stats)
    
    # ═══════════════════════════════════════════════════════════════════
    # 👥 GESTION DES MEMBRES
    # ═══════════════════════════════════════════════════════════════════
    
    @action(detail=True, methods=['get'], url_path='members')
    def list_members(self, request, pk=None):
        """
        👥 Liste tous les membres d'un projet.
        
        GET /api/projects/{id}/members/
        
        Returns:
            Liste des membres avec leurs infos (user, role, joined_at)
        """
        project = self.get_object()
        
        # Utilise select_related pour optimiser (1 seule requête SQL)
        members = project.project_members.select_related('user').all()
        
        serializer = ProjectMemberSerializer(members, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'], url_path='members/add')
    def add_member(self, request, pk=None):
        """
        ➕ Ajoute un membre au projet.
        
        POST /api/projects/{id}/members/add/
        Body: {
            "user_id": 2,
            "role": "member"  // optionnel, défaut = "member"
        }
        
        📌 Permissions:
            - Seul le propriétaire ou un admin peut ajouter des membres
        
        Returns:
            Données du membre ajouté (201 Created)
        """
        project = self.get_object()
        user_id = request.data.get('user_id')
        role = request.data.get('role', 'member')  # Défaut: member
        
        # ❌ Validation 1: user_id requis
        if not user_id:
            return Response(
                {'error': 'user_id est requis'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # ❌ Validation 2: User existe ?
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response(
                {'error': 'Utilisateur introuvable'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # ❌ Validation 3: Déjà membre ?
        if ProjectMember.objects.filter(project=project, user=user).exists():
            return Response(
                {'error': 'Cet utilisateur est déjà membre du projet'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # ❌ Validation 4: Permissions (owner ou admin seulement)
        if project.owner != request.user and not request.user.is_admin:
            return Response(
                {'error': 'Seul le propriétaire peut ajouter des membres'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # ✅ Crée le membre
        member = ProjectMember.objects.create(
            project=project,
            user=user,
            role=role
        )
        
        serializer = ProjectMemberSerializer(member)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['delete'], url_path='members/(?P<user_id>[^/.]+)/remove')
    def remove_member(self, request, pk=None, user_id=None):
        """
        ➖ Retire un membre du projet.
        
        DELETE /api/projects/{id}/members/{user_id}/remove/
        
        📌 Permissions:
            - Seul le propriétaire ou un admin peut retirer des membres
        
        Returns:
            204 No Content si succès
        """
        project = self.get_object()
        
        # ❌ Validation: Permissions
        if project.owner != request.user and not request.user.is_admin:
            return Response(
                {'error': 'Seul le propriétaire peut retirer des membres'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            # Cherche le membre
            member = ProjectMember.objects.get(project=project, user_id=user_id)
            member.delete()
            
            return Response(status=status.HTTP_204_NO_CONTENT)
            
        except ProjectMember.DoesNotExist:
            return Response(
                {'error': 'Membre introuvable dans ce projet'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=True, methods=['patch'], url_path='members/(?P<user_id>[^/.]+)/role')
    def update_member_role(self, request, pk=None, user_id=None):
        """
        🔄 Modifie le rôle d'un membre.
        
        PATCH /api/projects/{id}/members/{user_id}/role/
        Body: {
            "role": "manager"  // manager, developer, viewer, member
        }
        
        📌 Permissions:
            - Seul le propriétaire ou un admin peut changer les rôles
        
        Returns:
            Données du membre mis à jour
        """
        project = self.get_object()
        new_role = request.data.get('role')
        
        # ❌ Validation 1: role requis
        if not new_role:
            return Response(
                {'error': 'role est requis'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # ❌ Validation 2: Permissions
        if project.owner != request.user and not request.user.is_admin:
            return Response(
                {'error': 'Seul le propriétaire peut modifier les rôles'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            # Cherche et met à jour le membre
            member = ProjectMember.objects.get(project=project, user_id=user_id)
            member.role = new_role
            member.save()
            
            serializer = ProjectMemberSerializer(member)
            return Response(serializer.data)
            
        except ProjectMember.DoesNotExist:
            return Response(
                {'error': 'Membre introuvable dans ce projet'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    # ═══════════════════════════════════════════════════════════════════
    # 🛠️ UTILITAIRES
    # ═══════════════════════════════════════════════════════════════════
    
    @action(detail=False, methods=['get'])
    def my_projects(self, request):
        """
        📂 Retourne les projets de l'utilisateur connecté.
        
        GET /api/projects/my_projects/
        """
        projects = self.get_queryset().filter(owner=request.user)
        serializer = ProjectListSerializer(projects, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def available_users(self, request):
        """
        👤 Liste les utilisateurs disponibles pour être ajoutés.
        
        GET /api/projects/available_users/
        
        📌 Utile pour le frontend (autocomplete, select, etc.)
        
        Returns:
            Liste de tous les users actifs
        """
        users = User.objects.filter(is_active=True).order_by('username')
        serializer = UserSerializer(users, many=True)
        return Response(serializer.data)
