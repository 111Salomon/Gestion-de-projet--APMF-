from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UserViewSet

"""
Configuration des URLs pour l'app Users.

Le Router génère automatiquement les URLs suivantes:
    - GET    /api/users/          Liste des utilisateurs
    - POST   /api/users/          Créer un utilisateur
    - GET    /api/users/{id}/     Détails d'un utilisateur
    - PUT    /api/users/{id}/     Modifier un utilisateur
    - PATCH  /api/users/{id}/     Modifier partiellement
    - DELETE /api/users/{id}/     Supprimer un utilisateur
    
    Endpoints personnalisés:
    - GET    /api/users/me/               Profil de l'utilisateur connecté
    - POST   /api/users/{id}/set_role/    Changer le rôle (admin)
"""

# Crée un router pour enregistrer les ViewSets
router = DefaultRouter()
router.register(r'', UserViewSet, basename='user')

# Les URLs sont générées automatiquement par le router
urlpatterns = [
    path('', include(router.urls)),
]
