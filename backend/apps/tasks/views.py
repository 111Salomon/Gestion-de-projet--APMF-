from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q
from .models import Task, Comment, Attachment
from .serializers import (
    TaskSerializer,
    TaskCreateSerializer,
    TaskListSerializer,
    CommentSerializer,
    AttachmentSerializer
)
from apps.users.permissions import IsTaskAssignedOrProjectMember


class TaskViewSet(viewsets.ModelViewSet):
    """
    ViewSet pour gérer les tâches.
    
    Endpoints:
        - GET    /api/tasks/             Liste des tâches
        - POST   /api/tasks/             Créer une tâche
        - GET    /api/tasks/{id}/        Détails d'une tâche
        - PUT    /api/tasks/{id}/        Modifier une tâche
        - DELETE /api/tasks/{id}/        Supprimer une tâche
        - GET    /api/tasks/my_tasks/    Tâches assignées à l'utilisateur
        - POST   /api/tasks/{id}/mark_as_done/  Marquer comme terminée
    """
    
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Retourne les tâches accessibles à l'utilisateur."""
        user = self.request.user
        
        if user.is_admin:
            return Task.objects.all()
        
        # Tâches des projets dont l'utilisateur est membre
        return Task.objects.filter(
            Q(project__owner=user) | Q(project__members=user)
        ).distinct()
    
    def get_serializer_class(self):
        """Retourne le serializer approprié."""
        if self.action == 'create':
            return TaskCreateSerializer
        elif self.action == 'list':
            return TaskListSerializer
        return TaskSerializer
    
    def get_permissions(self):
        """Définit les permissions selon l'action."""
        if self.action in ['update', 'partial_update', 'destroy']:
            return [IsAuthenticated(), IsTaskAssignedOrProjectMember()]
        return [IsAuthenticated()]
    
    def perform_create(self, serializer):
        """Sauvegarde la tâche avec l'utilisateur connecté comme créateur."""
        # Calcule l'ordre automatiquement
        project = serializer.validated_data['project']
        last_task = Task.objects.filter(project=project).order_by('-order').first()
        order = (last_task.order + 1) if last_task else 1
        
        serializer.save(created_by=self.request.user, order=order)
    
    @action(detail=False, methods=['get'])
    def my_tasks(self, request):
        """
        Retourne les tâches assignées à l'utilisateur connecté.
        
        GET /api/tasks/my_tasks/
        """
        tasks = self.get_queryset().filter(assigned_to=request.user)
        serializer = TaskListSerializer(tasks, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def mark_as_done(self, request, pk=None):
        """
        Marque une tâche comme terminée.
        
        POST /api/tasks/{id}/mark_as_done/
        """
        task = self.get_object()
        
        from django.utils import timezone
        task.status = 'done'
        task.completed_at = timezone.now()
        task.save()
        
        serializer = self.get_serializer(task)
        return Response(serializer.data)


class CommentViewSet(viewsets.ModelViewSet):
    """ViewSet pour gérer les commentaires."""
    
    queryset = Comment.objects.all()
    serializer_class = CommentSerializer
    permission_classes = [IsAuthenticated]
    
    def perform_create(self, serializer):
        """Sauvegarde le commentaire avec l'auteur."""
        serializer.save(author=self.request.user)


class AttachmentViewSet(viewsets.ModelViewSet):
    """ViewSet pour gérer les pièces jointes."""
    
    queryset = Attachment.objects.all()
    serializer_class = AttachmentSerializer
    permission_classes = [IsAuthenticated]
    
    def perform_create(self, serializer):
        """Sauvegarde la pièce jointe avec l'uploader."""
        serializer.save(uploaded_by=self.request.user)
