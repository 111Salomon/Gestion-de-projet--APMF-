"""
🔒 Permissions personnalisées pour les tâches.

Principe :
- Chaque action a sa propre classe de permission
- Vérification en 2 étapes : has_permission (global) + has_object_permission (objet)
- Ordre de vérification : Admin → Chef → Propriétaire → Manager → Membre

Auteur: TaskFlow Security Layer
Date: 2025-12-01
"""

from rest_framework import permissions
from apps.projects.models import ProjectMember



class CanModifyTask(permissions.BasePermission):
    """
    Permission pour MODIFIER une tâche (titre, description, assignation, priorité, etc.).
    
    ✅ Autorisé :
        - Admin global
        - Chef de projet global
        - Propriétaire (owner) du projet
        - Gestionnaire (manager) du projet
    
    ❌ Interdit :
        - Membre simple (member) - même s'il est assigné
        - Observateur (viewer)
    
    Principe :
        Seuls ceux qui gèrent le projet peuvent modifier les détails des tâches.
        Un membre assigné peut juste changer le statut (voir CanChangeTaskStatus).
    """
    
    message = "Seuls les gestionnaires, propriétaires et administrateurs peuvent modifier les tâches."
    
    def has_permission(self, request, view):
        """
        Vérification globale : utilisateur authentifié ?
        
        Cette méthode est appelée AVANT has_object_permission.
        Si elle retourne False, la requête est refusée immédiatement.
        """
        return request.user and request.user.is_authenticated
    
    def has_object_permission(self, request, view, obj):
        """
        Vérification au niveau de l'objet (la tâche).
        
        Args:
            obj: Instance de Task
        
        Logique :
            1. Vérifie si Admin/Chef global
            2. Vérifie si propriétaire du projet
            3. Vérifie si manager du projet
        """
        user = request.user
        project = obj.project
        
        # 1️⃣ Admin ou Chef de projet global → Accès total
        if user.role in ['admin', 'chef']:
            return True
        
        # 2️⃣ Propriétaire du projet (champ owner)
        if project.owner == user:
            return True
        
        # 3️⃣ Manager du projet (via ProjectMember)
        try:
            membership = ProjectMember.objects.get(project=project, user=user)
            # Accepte owner (propriétaire via membership) et manager
            return membership.role in ['owner', 'manager']
        except ProjectMember.DoesNotExist:
            # L'utilisateur n'est même pas membre du projet
            return False



class CanDeleteTask(permissions.BasePermission):
    """
    Permission pour SUPPRIMER une tâche.
    
    ✅ Autorisé :
        - Admin global
        - Chef de projet global
        - Propriétaire (owner) du projet
        - Gestionnaire (manager) du projet
    
    ❌ Interdit :
        - Membre simple (member)
        - Observateur (viewer)
        - Même l'utilisateur assigné NE PEUT PAS supprimer
    
    Principe :
        La suppression est une action critique.
        Seuls les gestionnaires peuvent supprimer des tâches.
    """
    
    message = "Seuls les gestionnaires, propriétaires et administrateurs peuvent supprimer des tâches."
    
    def has_permission(self, request, view):
        """Vérification globale : utilisateur authentifié."""
        return request.user and request.user.is_authenticated
    
    def has_object_permission(self, request, view, obj):
        """
        Vérification au niveau de l'objet.
        
        Logique identique à CanModifyTask (mêmes rôles autorisés).
        """
        user = request.user
        project = obj.project
        
        # 1️⃣ Admin ou Chef global
        if user.role in ['admin', 'chef']:
            return True
        
        # 2️⃣ Propriétaire du projet
        if project.owner == user:
            return True
        
        # 3️⃣ Manager du projet
        try:
            membership = ProjectMember.objects.get(project=project, user=user)
            return membership.role in ['owner', 'manager']
        except ProjectMember.DoesNotExist:
            return False



class CanChangeTaskStatus(permissions.BasePermission):
    """
    Permission pour CHANGER LE STATUT d'une tâche.
    
    ✅ Autorisé :
        - Utilisateur assigné à la tâche (seulement SA tâche)
        - + Tous ceux autorisés par CanModifyTask (Admin, Chef, Owner, Manager)
    
    ❌ Interdit :
        - Membre simple qui N'EST PAS assigné à la tâche
        - Observateur (viewer)
    
    Principe :
        Un membre peut progresser dans SON travail (todo → in_progress → done).
        Mais il ne peut pas toucher aux tâches des autres.
    """
    
    message = "Vous ne pouvez changer que le statut des tâches qui vous sont assignées."
    
    def has_permission(self, request, view):
        """Vérification globale : utilisateur authentifié."""
        return request.user and request.user.is_authenticated
    
    def has_object_permission(self, request, view, obj):
        """
        Vérification au niveau de l'objet.
        
        Logique :
            1. Vérifie si Admin/Chef/Owner/Manager (peut tout changer)
            2. Sinon, vérifie si assigné à cette tâche précise
        """
        user = request.user
        project = obj.project
        
        # 1️⃣ Admin ou Chef global
        if user.role in ['admin', 'chef']:
            return True
        
        # 2️⃣ Propriétaire du projet
        if project.owner == user:
            return True
        
        # 3️⃣ Manager du projet
        try:
            membership = ProjectMember.objects.get(project=project, user=user)
            if membership.role in ['owner', 'manager']:
                return True
        except ProjectMember.DoesNotExist:
            pass
        
        # 4️⃣ Utilisateur assigné à CETTE tâche (membre simple)
        if obj.assigned_to == user:
            return True
        
        # ❌ Sinon refusé
        return False



class CanCreateTask(permissions.BasePermission):
    """
    Permission pour CRÉER une tâche dans un projet.
    
    ✅ Autorisé :
        - Admin global
        - Chef de projet global
        - Propriétaire (owner) du projet
        - Gestionnaire (manager) du projet
    
    ❌ Interdit :
        - Membre simple (member)
        - Observateur (viewer)
    
    Principe :
        Seuls ceux qui gèrent le projet peuvent créer des tâches.
        Cela évite le spam et maintient l'organisation.
    """
    
    message = "Seuls les gestionnaires et propriétaires peuvent créer des tâches."
    
    def has_permission(self, request, view):
        """
        Vérification globale.
        
        Note : On vérifie juste l'authentification ici.
        La vérification du projet se fait dans has_project_permission.
        """
        user = request.user
        
        if not user or not user.is_authenticated:
            return False
        
        # Admin/Chef global → Peut créer dans n'importe quel projet
        if user.role in ['admin', 'chef']:
            return True
        
        # Pour les autres, on autorise ici et vérifie dans has_project_permission
        return True
    
    def has_project_permission(self, request, project):
        """
        Méthode personnalisée pour vérifier les permissions sur un projet.
        
        Cette méthode sera appelée manuellement dans perform_create.
        
        Args:
            project: Instance de Project
        
        Returns:
            bool: True si autorisé, False sinon
        """
        user = request.user
        
        # 1️⃣ Admin/Chef global
        if user.role in ['admin', 'chef']:
            return True
        
        # 2️⃣ Propriétaire du projet
        if project.owner == user:
            return True
        
        # 3️⃣ Manager du projet
        try:
            membership = ProjectMember.objects.get(project=project, user=user)
            return membership.role in ['owner', 'manager']
        except ProjectMember.DoesNotExist:
            return False
