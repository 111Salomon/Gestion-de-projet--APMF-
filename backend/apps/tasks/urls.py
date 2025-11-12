from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TaskViewSet, CommentViewSet, AttachmentViewSet

"""
Configuration des URLs pour l'app Tasks.

URLs générées pour les tâches:
    - GET    /api/tasks/             Liste des tâches
    - POST   /api/tasks/             Créer une tâche
    - GET    /api/tasks/{id}/        Détails d'une tâche
    - PUT    /api/tasks/{id}/        Modifier une tâche
    - DELETE /api/tasks/{id}/        Supprimer une tâche
    
    Endpoints personnalisés:
    - GET    /api/tasks/my_tasks/            Mes tâches
    - POST   /api/tasks/{id}/mark_as_done/   Marquer comme terminée

URLs pour les commentaires:
    - GET    /api/comments/          Liste des commentaires
    - POST   /api/comments/          Créer un commentaire
    - etc.

URLs pour les pièces jointes:
    - GET    /api/attachments/       Liste des pièces jointes
    - POST   /api/attachments/       Upload une pièce jointe
    - etc.
"""

router = DefaultRouter()
router.register(r'tasks', TaskViewSet, basename='task')
router.register(r'comments', CommentViewSet, basename='comment')
router.register(r'attachments', AttachmentViewSet, basename='attachment')

urlpatterns = [
    path('', include(router.urls)),
]
