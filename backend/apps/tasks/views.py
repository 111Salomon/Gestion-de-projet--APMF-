# backend/apps/tasks/views.py

import os 
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
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
    ViewSet pour gérer les tâches avec pagination et filtrage serveur.
    
    Endpoints disponibles :
        - GET    /api/tasks/                      Liste des tâches
        - POST   /api/tasks/                      Créer une tâche
        - GET    /api/tasks/{id}/                 Détails d'une tâche
        - PUT    /api/tasks/{id}/                 Modifier une tâche
        - PATCH  /api/tasks/{id}/                 Modification partielle
        - DELETE /api/tasks/{id}/                 Supprimer une tâche
        - GET    /api/tasks/my_tasks/             Tâches assignées à l'utilisateur
        - POST   /api/tasks/{id}/mark_as_done/    Marquer comme terminée
        - PATCH  /api/tasks/{id}/update_status/   Kanban drag & drop
        
    Paramètres de filtrage (GET /api/tasks/) :
        ?status=done         Filtre par statut
        ?priority=high       Filtre par priorité
        ?search=design       Recherche dans titre et description
        ?project=14          Filtre par projet
    """
    
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """
        Retourne les tâches accessibles avec filtrage côté serveur.
        
        Permissions :
        - Admin : voit toutes les tâches
        - Utilisateur : voit ses tâches et celles de ses projets
        
        Filtres supportés :
        - status : Filtre par statut (todo, in_progress, in_review, done)
        - priority : Filtre par priorité (low, medium, high)
        - search : Recherche textuelle (titre + description)
        - project : Filtre par projet
        """
        user = self.request.user
        
        # Queryset de base selon les permissions
        if user.is_admin:
            queryset = Task.objects.all()
        else:
            queryset = Task.objects.filter(
                Q(project__owner=user) | Q(project__members=user)
            ).distinct()
        
        # 🆕 FILTRAGE PAR STATUT (?status=done)
        status_param = self.request.query_params.get('status', None)
        if status_param and status_param != 'all':
            queryset = queryset.filter(status=status_param)
        
        # 🆕 FILTRAGE PAR PRIORITÉ (?priority=high)
        priority = self.request.query_params.get('priority', None)
        if priority and priority != 'all':
            queryset = queryset.filter(priority=priority)
        
        # 🆕 FILTRAGE PAR RECHERCHE (?search=design)
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) | Q(description__icontains=search)
            )
        
        # Filtre par projet (?project=14)
        project_id = self.request.query_params.get('project', None)
        if project_id:
            queryset = queryset.filter(project_id=project_id)
        
        # Tri par date de création (plus récent en premier)
        return queryset.order_by('-created_at')
    
    def get_serializer_class(self):
        """Retourne le serializer approprié selon l'action."""
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
        """
        Sauvegarde la tâche avec l'utilisateur connecté comme créateur.
        Calcule automatiquement l'ordre de la tâche.
        """
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
    
    @action(detail=True, methods=['patch'])
    def update_status(self, request, pk=None):
        """
        Endpoint spécial pour le Kanban - Drag & Drop
        PATCH /api/tasks/{id}/update_status/
        
        Body : { "status": "in_progress", "order": 2 }
        """
        task = self.get_object()
        
        # Mise à jour du statut
        new_status = request.data.get('status')
        if new_status:
            valid_statuses = ['todo', 'in_progress', 'in_review', 'done']
            
            if new_status not in valid_statuses:
                return Response(
                    {'error': f'Statut invalide. Utilisez: {", ".join(valid_statuses)}'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            task.status = new_status
            
            # Gestion de la date de complétion
            if new_status == 'done':
                from django.utils import timezone
                task.completed_at = timezone.now()
            elif task.completed_at:
                task.completed_at = None
        
        # Mise à jour de l'ordre
        new_order = request.data.get('order')
        if new_order is not None:
            task.order = new_order
        
        task.save()
        
        serializer = TaskListSerializer(task, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['get', 'post'], url_path='comments')
    def task_comments(self, request, pk=None):
        """
        Endpoint pour les commentaires d'une tâche.
        
        GET  /api/tasks/{id}/comments/  → Liste des commentaires
        POST /api/tasks/{id}/comments/  → Ajouter un commentaire
        """
        task = self.get_object()
        
        if request.method == 'GET':
            comments = task.comments.all().order_by('-created_at')
            serializer = CommentSerializer(comments, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        
        elif request.method == 'POST':
            serializer = CommentSerializer(data=request.data)
            if serializer.is_valid():
                serializer.save(task=task, author=request.user)
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class CommentViewSet(viewsets.ModelViewSet):
    """
    ViewSet pour gérer les commentaires.
    
    Endpoints :
    - GET    /api/comments/              Liste tous les commentaires
    - POST   /api/comments/              Créer un commentaire
    - GET    /api/comments/{id}/         Détails d'un commentaire
    - PUT    /api/comments/{id}/         Modifier (son propre commentaire)
    - PATCH  /api/comments/{id}/         Modification partielle
    - DELETE /api/comments/{id}/         Supprimer (son propre commentaire)
    """
    queryset = Comment.objects.all()
    serializer_class = CommentSerializer
    permission_classes = [IsAuthenticated]
    
    def perform_create(self, serializer):
        """Sauvegarde le commentaire avec l'auteur connecté."""
        serializer.save(author=self.request.user)
    
    def get_queryset(self):
        """
        Filtre les commentaires par tâche si ?task={id} fourni.
        Exemple : GET /api/comments/?task=17
        """
        queryset = super().get_queryset()
        task_id = self.request.query_params.get('task', None)
        if task_id is not None:
            queryset = queryset.filter(task_id=task_id)
        return queryset.order_by('-created_at')
    
    def update(self, request, *args, **kwargs):
        """Modifie un commentaire (uniquement si auteur)."""
        comment = self.get_object()
        
        if comment.author != request.user:
            return Response(
                {'error': 'Vous ne pouvez modifier que vos propres commentaires.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        return super().update(request, *args, **kwargs)
    
    def destroy(self, request, *args, **kwargs):
        """Supprime un commentaire (uniquement si auteur)."""
        comment = self.get_object()
        
        if comment.author != request.user:
            return Response(
                {'error': 'Vous ne pouvez supprimer que vos propres commentaires.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        return super().destroy(request, *args, **kwargs)


class AttachmentViewSet(viewsets.ModelViewSet):
    """
    ViewSet pour gérer les pièces jointes.
    
    Endpoints :
    - GET    /api/attachments/              Liste tous les attachments
    - POST   /api/attachments/              Upload un fichier
    - GET    /api/attachments/{id}/         Détails d'un attachment
    - DELETE /api/attachments/{id}/         Supprimer un attachment
    """
    queryset = Attachment.objects.all()
    serializer_class = AttachmentSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]
    
    def get_queryset(self):
        """Filtre les attachments par tâche si ?task={id} fourni."""
        queryset = super().get_queryset().select_related('uploaded_by', 'task')
        task_id = self.request.query_params.get('task', None)
        if task_id:
            queryset = queryset.filter(task_id=task_id)
        return queryset
    
    def perform_create(self, serializer):
        """
        Sauvegarde l'attachment avec validation de taille et type.
        Limite : 10 MB max.
        """
        file_obj = self.request.FILES.get('file')
        
        # Validation de taille (10 MB max)
        if file_obj and file_obj.size > 10 * 1024 * 1024:
            from rest_framework import serializers
            raise serializers.ValidationError({
                'file': 'La taille du fichier ne peut pas dépasser 10 MB.'
            })
        
        # Validation de type
        allowed_extensions = [
            '.pdf', '.doc', '.docx', '.xls', '.xlsx',
            '.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg',
            '.zip', '.rar', '.txt', '.csv'
        ]
        if file_obj:
            ext = os.path.splitext(file_obj.name)[1].lower()
            if ext not in allowed_extensions:
                from rest_framework import serializers
                raise serializers.ValidationError({
                    'file': f'Type de fichier non autorisé. Extensions autorisées : {", ".join(allowed_extensions)}'
                })
        
        serializer.save(uploaded_by=self.request.user)
    
    def destroy(self, request, *args, **kwargs):
        """Supprime l'attachment ET le fichier physique."""
        attachment = self.get_object()
        
        # Vérification : seul l'uploader ou l'admin peut supprimer
        if attachment.uploaded_by != request.user and not request.user.is_admin:
            return Response(
                {'error': 'Vous ne pouvez supprimer que vos propres fichiers.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Le fichier physique sera supprimé par la méthode delete() du modèle
        return super().destroy(request, *args, **kwargs)
