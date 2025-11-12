from rest_framework import permissions


class IsAdminUser(permissions.BasePermission):
    """
    Permission pour les administrateurs uniquement.
    
    Usage:
        - Création/suppression d'utilisateurs
        - Accès aux données sensibles
    """
    
    def has_permission(self, request, view):
        """Vérifie si l'utilisateur est admin."""
        return request.user and request.user.is_authenticated and request.user.is_admin


class IsChefOrAdmin(permissions.BasePermission):
    """
    Permission pour les chefs de projet et administrateurs.
    
    Usage:
        - Création de projets
        - Gestion des membres de projets
    """
    
    def has_permission(self, request, view):
        """Vérifie si l'utilisateur est chef ou admin."""
        return (
            request.user and 
            request.user.is_authenticated and 
            (request.user.is_admin or request.user.is_chef)
        )


class IsOwnerOrReadOnly(permissions.BasePermission):
    """
    Permission en lecture pour tous, écriture pour le propriétaire uniquement.
    
    Usage:
        - Profil utilisateur (peut modifier son propre profil)
    """
    
    def has_object_permission(self, request, view, obj):
        """
        Vérifie les permissions au niveau objet.
        
        Args:
            request: Requête HTTP
            view: Vue actuelle
            obj: Objet concerné
        
        Returns:
            bool: True si autorisé, False sinon
        """
        # Lecture autorisée pour tout le monde
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Écriture : seulement si c'est son propre objet
        return obj == request.user


class IsProjectMemberOrReadOnly(permissions.BasePermission):
    """
    Permission pour les membres d'un projet.
    
    - Lecture : Tous les membres du projet
    - Écriture : Propriétaire et managers du projet
    """
    
    def has_object_permission(self, request, view, obj):
        """Vérifie si l'utilisateur est membre du projet."""
        # Lecture : membres du projet
        if request.method in permissions.SAFE_METHODS:
            return (
                obj.owner == request.user or 
                obj.members.filter(id=request.user.id).exists()
            )
        
        # Écriture : propriétaire ou managers
        if obj.owner == request.user:
            return True
        
        membership = obj.project_members.filter(
            user=request.user,
            role__in=['owner', 'manager']
        ).first()
        
        return membership is not None


class IsTaskAssignedOrProjectMember(permissions.BasePermission):
    """
    Permission pour les tâches.
    
    - Lecture : Membres du projet
    - Écriture : Utilisateur assigné ou managers du projet
    """
    
    def has_object_permission(self, request, view, obj):
        """Vérifie les permissions sur une tâche."""
        project = obj.project
        
        # Lecture : membres du projet
        if request.method in permissions.SAFE_METHODS:
            return (
                project.owner == request.user or
                project.members.filter(id=request.user.id).exists()
            )
        
        # Écriture : assigné à la tâche ou manager du projet
        if obj.assigned_to == request.user or project.owner == request.user:
            return True
        
        membership = project.project_members.filter(
            user=request.user,
            role='manager'
        ).first()
        
        return membership is not None
