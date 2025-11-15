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


# ═══════════════════════════════════════════════════════════════
# VIEWSET TASKS
# ═══════════════════════════════════════════════════════════════

class TaskViewSet(viewsets.ModelViewSet):
    """
    ViewSet pour gérer les tâches.
    
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
    """
    
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """
        Retourne les tâches accessibles à l'utilisateur.
        
        - Admin : voit toutes les tâches
        - Utilisateur normal : voit uniquement les tâches des projets 
          dont il est propriétaire ou membre
        """
        user = self.request.user
        
        if user.is_admin:
            return Task.objects.all()
        
        # Tâches des projets dont l'utilisateur est propriétaire ou membre
        return Task.objects.filter(
            Q(project__owner=user) | Q(project__members=user)
        ).distinct()
    
    def get_serializer_class(self):
        """
        Retourne le serializer approprié selon l'action.
        
        - create : TaskCreateSerializer (validation stricte)
        - list : TaskListSerializer (données minimales)
        - autres : TaskSerializer (données complètes)
        """
        if self.action == 'create':
            return TaskCreateSerializer
        elif self.action == 'list':
            return TaskListSerializer
        return TaskSerializer
    
    def get_permissions(self):
        """
        Définit les permissions selon l'action.
        
        - update/partial_update/destroy : nécessite d'être assigné ou membre du projet
        - autres actions : authentification suffisante
        """
        if self.action in ['update', 'partial_update', 'destroy']:
            return [IsAuthenticated(), IsTaskAssignedOrProjectMember()]
        return [IsAuthenticated()]
    
    def perform_create(self, serializer):
        """
        Sauvegarde la tâche avec l'utilisateur connecté comme créateur.
        
        Calcule automatiquement l'ordre de la tâche :
        - Récupère la dernière tâche du projet
        - Ajoute 1 à son ordre (ou 1 si c'est la première)
        """
        project = serializer.validated_data['project']
        last_task = Task.objects.filter(project=project).order_by('-order').first()
        order = (last_task.order + 1) if last_task else 1
        
        serializer.save(created_by=self.request.user, order=order)
    
    # ───────────────────────────────────────────────────────────
    # ACTIONS PERSONNALISÉES
    # ───────────────────────────────────────────────────────────
    
    @action(detail=False, methods=['get'])
    def my_tasks(self, request):
        """
        Retourne les tâches assignées à l'utilisateur connecté.
        
        GET /api/tasks/my_tasks/
        
        Exemple de réponse :
        [
            {
                "id": 1,
                "title": "Implémenter le login",
                "status": "in_progress",
                "priority": "high",
                ...
            }
        ]
        """
        tasks = self.get_queryset().filter(assigned_to=request.user)
        serializer = TaskListSerializer(tasks, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def mark_as_done(self, request, pk=None):
        """
        Marque une tâche comme terminée.
        
        POST /api/tasks/{id}/mark_as_done/
        
        Actions effectuées :
        - Change le statut à "done"
        - Enregistre la date de complétion
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
        🎯 Endpoint spécial pour le Kanban - Drag & Drop
        
        Permet de mettre à jour uniquement le statut et l'ordre d'une tâche
        lors d'un drag & drop, sans toucher aux autres champs.
        
        PATCH /api/tasks/{id}/update_status/
        
        Body attendu (JSON) :
        {
            "status": "in_progress",  // Nouveau statut (optionnel)
            "order": 2                // Nouvel ordre (optionnel)
        }
        
        Réponse (200 OK) :
        {
            "id": 10,
            "title": "Ma tâche",
            "status": "in_progress",
            "order": 2,
            ...
        }
        
        Erreur (400 Bad Request) si statut invalide :
        {
            "error": "Statut invalide. Utilisez: todo, in_progress, in_review, done"
        }
        """
        # get_object() récupère la tâche ET vérifie automatiquement
        # les permissions via IsTaskAssignedOrProjectMember
        task = self.get_object()
        
        # ── Mise à jour du statut si fourni ──
        new_status = request.data.get('status')
        if new_status:
            # Liste des statuts valides (doit correspondre au modèle Task)
            valid_statuses = ['todo', 'in_progress', 'in_review', 'done']
            
            # Validation : on refuse les statuts invalides
            if new_status not in valid_statuses:
                return Response(
                    {'error': f'Statut invalide. Utilisez: {", ".join(valid_statuses)}'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            task.status = new_status
            
            # ── Gestion automatique de la date de complétion ──
            if new_status == 'done':
                # Si on marque "Terminé", on enregistre la date/heure
                from django.utils import timezone
                task.completed_at = timezone.now()
            elif task.completed_at:
                # Si on change de "done" vers autre chose, on réinitialise
                task.completed_at = None
        
        # ── Mise à jour de l'ordre si fourni ──
        new_order = request.data.get('order')
        if new_order is not None:
            task.order = new_order
        
        # Sauvegarde en base de données
        task.save()
        
        # Retour de la tâche mise à jour avec TaskListSerializer
        # (même serializer que pour la liste, cohérent avec le frontend)
        serializer = TaskListSerializer(task, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)


# ═══════════════════════════════════════════════════════════════
# VIEWSET COMMENTS
# ═══════════════════════════════════════════════════════════════

class CommentViewSet(viewsets.ModelViewSet):
    """
    ViewSet pour gérer les commentaires sur les tâches.
    
    Endpoints :
        - GET    /api/comments/      Liste des commentaires
        - POST   /api/comments/      Créer un commentaire
        - GET    /api/comments/{id}/ Détails d'un commentaire
        - PUT    /api/comments/{id}/ Modifier un commentaire
        - DELETE /api/comments/{id}/ Supprimer un commentaire
    """
    
    queryset = Comment.objects.all()
    serializer_class = CommentSerializer
    permission_classes = [IsAuthenticated]
    
    def perform_create(self, serializer):
        """Sauvegarde le commentaire avec l'auteur connecté."""
        serializer.save(author=self.request.user)


# ═══════════════════════════════════════════════════════════════
# VIEWSET ATTACHMENTS
# ═══════════════════════════════════════════════════════════════

class AttachmentViewSet(viewsets.ModelViewSet):
    """
    ViewSet pour gérer les pièces jointes des tâches.
    
    Endpoints :
        - GET    /api/attachments/      Liste des pièces jointes
        - POST   /api/attachments/      Uploader une pièce jointe
        - GET    /api/attachments/{id}/ Détails d'une pièce jointe
        - DELETE /api/attachments/{id}/ Supprimer une pièce jointe
    """
    
    queryset = Attachment.objects.all()
    serializer_class = AttachmentSerializer
    permission_classes = [IsAuthenticated]
    
    def perform_create(self, serializer):
        """Sauvegarde la pièce jointe avec l'uploader connecté."""
        serializer.save(uploaded_by=self.request.user)
