# backend/apps/tasks/views.py

import os 
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from django.db.models import Q
from apps.projects.models import ProjectMember
from .models import Task, Comment, Attachment
from .serializers import (
    TaskSerializer,
    TaskCreateSerializer,
    TaskListSerializer,
    CommentSerializer,
    AttachmentSerializer
)
# from apps.users.permissions import IsTaskAssignedOrProjectMember
from .permissions import (
    CanModifyTask,
    CanDeleteTask,
    CanChangeTaskStatus,
    CanCreateTask
)

class TaskViewSet(viewsets.ModelViewSet):
    """
    ViewSet pour gérer les tâches avec permissions granulaires.
    
    🔒 SYSTÈME DE PERMISSIONS :
    
    Endpoints disponibles :
        - GET    /api/tasks/                      Liste des tâches (Tous)
        - POST   /api/tasks/                      Créer une tâche (Manager+)
        - GET    /api/tasks/{id}/                 Détails d'une tâche (Tous)
        - PUT    /api/tasks/{id}/                 Modifier une tâche (Manager+)
        - PATCH  /api/tasks/{id}/                 Modification partielle (Manager+)
        - DELETE /api/tasks/{id}/                 Supprimer une tâche (Manager+)
        - GET    /api/tasks/my_tasks/             Tâches assignées (Tous)
        - POST   /api/tasks/{id}/mark_as_done/    Marquer terminée (Assigné+)
        - PATCH  /api/tasks/{id}/change-status/   Changer statut (Assigné+)
        - PATCH  /api/tasks/{id}/update-order/    Réorganiser (Manager+)
    
    Permissions par action :
        - Créer : Manager/Owner/Admin
        - Modifier : Manager/Owner/Admin
        - Supprimer : Manager/Owner/Admin
        - Changer statut : Assigné OU Manager+
    """
    
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """
        Retourne les tâches accessibles avec filtrage côté serveur.
        
        Règles :
        - Admin : Voit TOUTES les tâches
        - Autres : Voit les tâches des projets dont il est propriétaire OU membre
        
        Filtres supportés :
        - status : Filtre par statut (todo, in_progress, in_review, done)
        - priority : Filtre par priorité (low, medium, high, urgent)
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
        
        # 🔍 FILTRAGE PAR STATUT (?status=done)
        status_param = self.request.query_params.get('status', None)
        if status_param and status_param != 'all':
            queryset = queryset.filter(status=status_param)
        
        # 🔍 FILTRAGE PAR PRIORITÉ (?priority=high)
        priority = self.request.query_params.get('priority', None)
        if priority and priority != 'all':
            queryset = queryset.filter(priority=priority)
        
        # 🔍 FILTRAGE PAR RECHERCHE (?search=design)
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) | Q(description__icontains=search)
            )
        
        # 🔍 Filtre par projet (?project=14)
        project_id = self.request.query_params.get('project', None)
        if project_id:
            queryset = queryset.filter(project_id=project_id)
        
        # Optimisation ORM : charger relations fréquentes pour éviter N+1
        queryset = queryset.select_related('project', 'assigned_to', 'created_by')
        # Précharger les membres du projet (utilisé dans les serializers)
        queryset = queryset.prefetch_related('project__project_members')

        # Tri par date de création (plus récent en premier)
        return queryset.order_by('-created_at')
    
    def get_serializer_class(self):
        """Retourne le serializer approprié selon l'action."""
        if self.action == 'create':
            return TaskCreateSerializer
        elif self.action == 'list':
            return TaskListSerializer
        return TaskSerializer
    
    # ✅ CHANGEMENT 2 : Permissions granulaires selon l'action
    def get_permissions(self):
        """
        Définit les permissions selon l'action.
        
        Logique :
        - create → CanCreateTask (Manager+)
        - update/partial_update → CanModifyTask (Manager+)
        - destroy → CanDeleteTask (Manager+)
        - change_status/mark_as_done → CanChangeTaskStatus (Assigné+)
        - update_order → CanModifyTask (Manager+ pour réorganiser)
        - autres actions → IsAuthenticated seulement
        """
        if self.action == 'create':
            return [IsAuthenticated(), CanCreateTask()]
        elif self.action in ['update', 'partial_update']:
            return [IsAuthenticated(), CanModifyTask()]
        elif self.action == 'destroy':
            return [IsAuthenticated(), CanDeleteTask()]
        elif self.action in ['change_status', 'mark_as_done']:
            return [IsAuthenticated(), CanChangeTaskStatus()]
        elif self.action == 'update_order':
            return [IsAuthenticated(), CanModifyTask()]
        return [IsAuthenticated()]
    
    # ✅ CHANGEMENT 3 : Vérification du projet lors de la création
    def perform_create(self, serializer):
        """
        Sauvegarde la tâche avec vérification des permissions sur le projet.
        
        Étapes :
        1. Récupère le projet de la tâche
        2. Vérifie que l'utilisateur peut créer dans ce projet
        3. Calcule l'ordre de la tâche
        4. Sauvegarde avec created_by
        """
        project = serializer.validated_data['project']
        
        # Vérifie que l'utilisateur peut créer dans CE projet
        permission = CanCreateTask()
        if not permission.has_project_permission(self.request, project):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied(
                "Vous n'avez pas les droits pour créer une tâche dans ce projet."
            )
        
        # Calcul de l'ordre (pour tri manuel)
        last_task = Task.objects.filter(project=project).order_by('-order').first()
        order = (last_task.order + 1) if last_task else 1
        
        # Sauvegarde avec created_by
        serializer.save(created_by=self.request.user, order=order)
    
    @action(detail=False, methods=['get'])
    def my_tasks(self, request):
        """
        Retourne les tâches assignées à l'utilisateur connecté.
        GET /api/tasks/my_tasks/
        
        🔒 Permission : IsAuthenticated (tous les utilisateurs connectés)
        """
        tasks = self.get_queryset().filter(assigned_to=request.user)
        serializer = TaskListSerializer(tasks, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def mark_as_done(self, request, pk=None):
        """
        Marque une tâche comme terminée.
        POST /api/tasks/{id}/mark_as_done/
        
        🔒 Permission : CanChangeTaskStatus (assigné OU manager+)
        
        Fonctionnement :
        1. Récupère la tâche
        2. Vérifie les permissions (automatique via get_permissions)
        3. Change le statut en 'done'
        4. Enregistre la date de complétion
        """
        task = self.get_object()
        
        # ✅ AJOUTÉ : Vérification explicite de permission
        # (Déjà fait automatiquement, mais on le met pour clarté)
        self.check_object_permissions(request, task)
        
        from django.utils import timezone
        task.status = 'done'
        task.completed_at = timezone.now()
        task.save()
        
        serializer = self.get_serializer(task)
        return Response(serializer.data)
    
    # ✅ CHANGEMENT 4 : Renommage et amélioration de l'endpoint
    @action(detail=True, methods=['patch'], url_path='change-status')
    def change_status(self, request, pk=None):
        """
        Endpoint pour changer SON statut (membre assigné).
        PATCH /api/tasks/{id}/change-status/
        
        Body : { "status": "in_progress" }
        
        🔒 Permission : CanChangeTaskStatus (assigné OU manager+)
        
        Différence avec update() :
        - update() : Modifie TOUS les champs (Manager+)
        - change_status() : Modifie SEULEMENT le statut (Assigné+)
        
        Exemple d'utilisation :
        Jean (membre simple) assigné à une tâche peut :
        ✅ Changer le statut : todo → in_progress → done
        ❌ Ne peut PAS modifier le titre, description, etc.
        """
        task = self.get_object()
        
        # ✅ Vérification explicite de permission
        self.check_object_permissions(request, task)
        
        # Validation : champ status requis
        new_status = request.data.get('status')
        if not new_status:
            return Response(
                {'error': 'Le champ status est requis'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validation : statut valide
        valid_statuses = ['todo', 'in_progress', 'in_review', 'done']
        if new_status not in valid_statuses:
            return Response(
                {'error': f'Statut invalide. Utilisez: {", ".join(valid_statuses)}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Mise à jour du statut
        task.status = new_status
        
        # Gestion de la date de complétion
        if new_status == 'done':
            from django.utils import timezone
            task.completed_at = timezone.now()
        elif task.completed_at:
            # Si on repasse la tâche en "en cours", on supprime la date de complétion
            task.completed_at = None
        
        task.save()
        
        serializer = TaskListSerializer(task, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    # ✅ CHANGEMENT 5 : Nouvel endpoint pour le Kanban (drag & drop)
    @action(detail=True, methods=['patch'], url_path='update-order')
    def update_order(self, request, pk=None):
        """
        Endpoint pour le Kanban - Drag & Drop (ordre ET statut).
        PATCH /api/tasks/{id}/update-order/
        
        Body : { "status": "in_progress", "order": 2 }
        
        🔒 Permission : CanModifyTask (Manager+ seulement)
        
        Pourquoi Manager+ ?
        Réorganiser les tâches affecte toute l'équipe.
        C'est une responsabilité de gestion, pas une action individuelle.
        
        Différence avec change_status() :
        - change_status() : Un membre change le statut de SA tâche
        - update_order() : Un manager réorganise le tableau Kanban complet
        """
        task = self.get_object()
        
        # ✅ Vérification explicite de permission
        # (Déjà fait via get_permissions, mais on le met pour clarté)
        permission = CanModifyTask()
        if not permission.has_object_permission(request, self, task):
            return Response(
                {
                    'error': 'Accès refusé',
                    'message': 'Seuls les gestionnaires peuvent réorganiser les tâches',
                    'code': 'PERMISSION_DENIED'
                },
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Mise à jour du statut (optionnel)
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
        
        # Mise à jour de l'ordre (optionnel)
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
        
        🔒 Permission : IsAuthenticated (tous les membres du projet)
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



# ═══════════════════════════════════════════════════════════════════
# CommentViewSet et AttachmentViewSet restent INCHANGÉS
# ═══════════════════════════════════════════════════════════════════

class CommentViewSet(viewsets.ModelViewSet):
    """
    ViewSet pour gérer les commentaires.
    
    🔒 Permissions :
    - Ajouter : Tous les membres
    - Modifier : Seulement l'auteur
    - Supprimer : Seulement l'auteur
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
    
    🔒 Permissions :
    - Upload : Tous les membres
    - Supprimer : Seulement l'uploader OU admin
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
        
        # Vérification des droits : l'utilisateur doit être membre du projet
        # ou être l'utilisateur assigné de la tâche, ou un admin/chef/owner.
        task = serializer.validated_data.get('task')
        from rest_framework.exceptions import PermissionDenied
        user = self.request.user

        if task is None:
            from rest_framework import serializers
            raise serializers.ValidationError({'task': 'Le champ task est requis.'})

        from apps.projects.models import Project

        project = task.project

        # Si le projet est archivé, seul l'admin global peut uploader
        if project.status == Project.StatusChoices.ARCHIVED and user.role != 'admin':
            raise PermissionDenied('Le projet est archivé.')

        # Admin / Chef global ou propriétaire du projet
        if user.role in ['admin', 'chef'] or project.owner == user:
            serializer.save(uploaded_by=user)
            return

        # Membre du projet (owner/manager/member) autorisé à uploader
        try:
            membership = ProjectMember.objects.get(project=project, user=user)
            if membership.role in ['owner', 'manager', 'member']:
                serializer.save(uploaded_by=user)
                return
        except ProjectMember.DoesNotExist:
            pass

        # Utilisateur assigné à la tâche (même s'il n'est pas membre du projet)
        if task.assigned_to == user:
            serializer.save(uploaded_by=user)
            return

        # Sinon refus
        raise PermissionDenied('Vous n\'avez pas le droit d\'ajouter une pièce jointe à cette tâche.')
    
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
        
        # Vérification des droits : l'utilisateur doit être membre du projet
        # ou être l'utilisateur assigné de la tâche, ou un admin/chef/owner.
        task = serializer.validated_data.get('task')
        from rest_framework.exceptions import PermissionDenied
        user = self.request.user

        if task is None:
            from rest_framework import serializers
            raise serializers.ValidationError({'task': 'Le champ task est requis.'})

        from apps.projects.models import Project

        project = task.project

        # Si le projet est archivé, seul l'admin global peut uploader
        if project.status == Project.StatusChoices.ARCHIVED and user.role != 'admin':
            raise PermissionDenied('Le projet est archivé.')

        # Admin / Chef global ou propriétaire du projet
        if user.role in ['admin', 'chef'] or project.owner == user:
            serializer.save(uploaded_by=user)
            return

        # Membre du projet (owner/manager/member) autorisé à uploader
        try:
            membership = ProjectMember.objects.get(project=project, user=user)
            if membership.role in ['owner', 'manager', 'member']:
                serializer.save(uploaded_by=user)
                return
        except ProjectMember.DoesNotExist:
            pass

        # Utilisateur assigné à la tâche (même s'il n'est pas membre du projet)
        if task.assigned_to == user:
            serializer.save(uploaded_by=user)
            return

        # Sinon refus
        raise PermissionDenied('Vous n\'avez pas le droit d\'ajouter une pièce jointe à cette tâche.')
    
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
