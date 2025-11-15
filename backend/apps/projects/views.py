from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q
from .models import Project, ProjectMember
from .serializers import (
    ProjectSerializer,
    ProjectCreateSerializer,
    ProjectListSerializer,
    ProjectMemberSerializer
)
from apps.users.permissions import IsChefOrAdmin, IsProjectMemberOrReadOnly


class ProjectViewSet(viewsets.ModelViewSet):
    """
    ViewSet pour gérer les projets.
    
    Endpoints:
        - GET    /api/projects/              Liste des projets
        - POST   /api/projects/              Créer un projet (chef/admin)
        - GET    /api/projects/{id}/         Détails d'un projet
        - PUT    /api/projects/{id}/         Modifier un projet
        - DELETE /api/projects/{id}/         Supprimer un projet
        - GET    /api/projects/my_projects/  Projets de l'utilisateur
        - POST   /api/projects/{id}/add_member/    Ajouter un membre
        - POST   /api/projects/{id}/remove_member/ Retirer un membre
    """
    
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """
        Retourne les projets accessibles à l'utilisateur.
        
        Returns:
            QuerySet: Projets filtrés
        """
        user = self.request.user
        
        if user.is_admin:
            # Admin voit tous les projets
            return Project.objects.all()
        
        # Les autres voient leurs projets (owned ou member)
        return Project.objects.filter(
            Q(owner=user) | Q(members=user)
        ).distinct()
    
    def get_serializer_class(self):
        """Retourne le serializer approprié."""
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
        """
        Sauvegarde le projet avec l'utilisateur connecté comme owner.
        
        Args:
            serializer: Serializer du projet
        """
        serializer.save(owner=self.request.user)
    
    @action(detail=False, methods=['get'])
    def my_projects(self, request):
        """
        Retourne les projets de l'utilisateur connecté.
        
        GET /api/projects/my_projects/
        
        Returns:
            Response: Liste des projets
        """
        projects = self.get_queryset().filter(owner=request.user)
        serializer = ProjectListSerializer(projects, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def add_member(self, request, pk=None):
        """
        Ajoute un membre au projet.
        
        POST /api/projects/{id}/add_member/
        Body: {"user_id": 2, "role": "member"}
        
        Args:
            request: Requête HTTP
            pk: ID du projet
        
        Returns:
            Response: Données du membre ajouté
        """
        project = self.get_object()
        
        # Vérifier que l'utilisateur peut ajouter des membres
        if project.owner != request.user and not request.user.is_admin:
            return Response(
                {"detail": "Seul le propriétaire peut ajouter des membres."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        user_id = request.data.get('user_id')
        role = request.data.get('role', 'member')
        
        if not user_id:
            return Response(
                {"detail": "user_id est requis."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Vérifier si le membre existe déjà
        if ProjectMember.objects.filter(project=project, user_id=user_id).exists():
            return Response(
                {"detail": "Cet utilisateur est déjà membre du projet."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Créer le membre
        member = ProjectMember.objects.create(
            project=project,
            user_id=user_id,
            role=role
        )
        
        serializer = ProjectMemberSerializer(member)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['post'])
    def remove_member(self, request, pk=None):
        """
        Retire un membre du projet.
        
        POST /api/projects/{id}/remove_member/
        Body: {"user_id": 2}
        
        Args:
            request: Requête HTTP
            pk: ID du projet
        
        Returns:
            Response: Message de confirmation
        """
        project = self.get_object()
        
        # Vérifier les permissions
        if project.owner != request.user and not request.user.is_admin:
            return Response(
                {"detail": "Seul le propriétaire peut retirer des membres."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        user_id = request.data.get('user_id')
        
        if not user_id:
            return Response(
                {"detail": "user_id est requis."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Supprimer le membre
        deleted = ProjectMember.objects.filter(
            project=project,
            user_id=user_id
        ).delete()
        
        if deleted[0] == 0:
            return Response(
                {"detail": "Membre non trouvé dans ce projet."},
                status=status.HTTP_404_NOT_FOUND
            )
        
        return Response(
            {"detail": "Membre retiré avec succès."},
            status=status.HTTP_200_OK
        )
    
    # @action(detail=True, methods=['get'])  # Décore la fonction pour créer une route custom
    # def stats(self, request, pk=None):
    #     """Retourne les stats d'un projet"""
    #     project = self.get_object()  # Récupère le projet par son ID
    #     tasks = project.tasks.all()  # Toutes les tâches du projet
        
    #     # Compte les tâches par statut
    #     total = tasks.count()
    #     done_count = tasks.filter(status='DONE').count()
        
    #     # Calcule le %
    #     completion = round((done_count / total) * 100, 1) if total > 0 else 0
        
    #     return Response({
    #         'total_tasks': total,
    #         'todo': tasks.filter(status='TODO').count(),
    #         'in_progress': tasks.filter(status='IN_PROGRESS').count(),
    #         'in_review': tasks.filter(status='IN_REVIEW').count(),
    #         'done': done_count,
    #         'completion_percentage': completion,
    #     })
    @action(detail=True, methods=['get'])
    def stats(self, request, pk=None):
        """
        Retourne les statistiques d'un projet.
        
        GET /api/projects/{id}/stats/
        """
        project = self.get_object()
        
        # ✅ IMPORTANT : Importe Task ici
        from apps.tasks.models import Task
        
        # ✅ BON : Filtre les tâches PAR PROJET
        tasks = Task.objects.filter(project=project)
        
        # Compte les tâches par statut
        stats = {
            'total_tasks': tasks.count(),
            'todo': tasks.filter(status='todo').count(),
            'in_progress': tasks.filter(status='in_progress').count(),
            'in_review': tasks.filter(status='in_review').count(),
            'done': tasks.filter(status='done').count(),
        }
        
        # Calcul du pourcentage de completion
        total = stats['total_tasks']
        if total > 0:
            stats['completion_percentage'] = round((stats['done'] / total) * 100, 1)
        else:
            stats['completion_percentage'] = 0.0
        
        # Tâches en retard (deadline dépassée et pas terminées)
        from django.utils import timezone
        overdue = tasks.filter(
            due_date__lt=timezone.now().date(),
            status__in=['todo', 'in_progress', 'in_review']
        ).count()
        stats['overdue_tasks'] = overdue
        
        return Response(stats)
