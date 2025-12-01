"""
🔒 Permissions pour les endpoints Analytics
"""

from rest_framework import permissions


class CanViewGlobalAnalytics(permissions.BasePermission):
    """
    Permission pour accéder aux analytics globales.
    
    Autorisé uniquement pour :
    - ADMIN (rôle global)
    - CHEF DE PROJET (rôle global)
    """
    
    def has_permission(self, request, view):
        # Vérifie que l'utilisateur est authentifié
        if not request.user.is_authenticated:
            return False
        
        # ✅ CORRIGÉ : Utilise 'chef' au lieu de 'project_manager'
        return request.user.role in ['admin', 'chef']
    
    message = "Accès refusé. Cette section est réservée aux administrateurs et chefs de projet."


class CanViewProjectAnalytics(permissions.BasePermission):
    """
    Permission pour les analytics d'un projet spécifique.
    Réservé au PROPRIÉTAIRE et GESTIONNAIRE du projet.
    """
    def has_object_permission(self, request, view, project):
        if not request.user.is_authenticated:
            return False
        
        # 1. Si ADMIN global → accès total
        if request.user.role == 'admin':
            return True
        
        # 2. Si PROPRIÉTAIRE du projet
        if project.owner == request.user:
            return True
        
        # 3. Si GESTIONNAIRE du projet
        try:
            membership = project.project_members.get(user=request.user)
            return membership.role in ['owner', 'manager']
        except:
            return False
