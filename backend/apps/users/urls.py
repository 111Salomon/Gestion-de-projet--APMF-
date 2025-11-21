from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UserViewSet
from . import views_team  # ← Importe views_team
from apps.users import views, views_team, views_password 

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
# urlpatterns = [
#     path('', include(router.urls)),
# ]


# Les URLs sont générées automatiquement par le router
urlpatterns = [
    # ═══════════════════════════════════════════════════════════
    # Routes Team (Function-based views) ✅ NOUVEAU
    # ═══════════════════════════════════════════════════════════
    # IMPORTANT : Ces routes doivent venir AVANT le router
    # Sinon, /api/users/team/ sera intercepté par le ViewSet
    
    path('team/stats/', views_team.team_stats, name='team-stats'),
    path('team/<int:user_id>/', views_team.team_member_detail, name='team-member-detail'),
    path('team/', views_team.team_list, name='team-list'),
    path('team/invite/', views_team.invite_member, name='team-invite'),
    # Password Reset  ✅ NOUVEAU
    path('reset-password/', views_password.reset_password, name='reset-password'),
    
    # ═══════════════════════════════════════════════════════════
    # Routes générées par le Router (ViewSet)
    # ═══════════════════════════════════════════════════════════
    path('', include(router.urls)),
] 
