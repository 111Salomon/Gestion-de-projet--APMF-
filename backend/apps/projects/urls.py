from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ProjectViewSet

"""
Configuration des URLs pour l'app Projects.

URLs générées automatiquement:
    - GET    /api/projects/              Liste des projets
    - POST   /api/projects/              Créer un projet
    - GET    /api/projects/{id}/         Détails d'un projet
    - PUT    /api/projects/{id}/         Modifier un projet
    - PATCH  /api/projects/{id}/         Modifier partiellement
    - DELETE /api/projects/{id}/         Supprimer un projet
    
    Endpoints personnalisés:
    - GET    /api/projects/my_projects/          Mes projets
    - POST   /api/projects/{id}/add_member/      Ajouter un membre
    - POST   /api/projects/{id}/remove_member/   Retirer un membre
"""

router = DefaultRouter()
router.register(r'', ProjectViewSet, basename='project')

urlpatterns = [
    path('', include(router.urls)),
]
