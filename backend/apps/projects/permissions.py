"""
🔒 Permissions personnalisées pour les projets.

RG-29 : Archivage des projets terminés.
Les projets archivés ne peuvent être modifiés que par des administrateurs.
"""

from rest_framework import permissions
from .models import Project, ProjectMember


class CanModifyArchivedProject(permissions.BasePermission):
    """
    Permission pour modifier un projet archivé.

    ✅ Autorisé :
        - Admin global (peut toujours modifier, même un projet archivé)

    ❌ Interdit :
        - Tous les autres (même le propriétaire/manager)

    RG-29 : Les projets archivés ne peuvent pas faire l'objet de modifications
    sans restauration explicite par un administrateur.
    """

    message = "Les projets archivés ne peuvent être modifiés que par un administrateur. Utilisez l'endpoint 'restore' pour déverrouiller."

    def has_object_permission(self, request, view, obj):
        """
        Vérifie les permissions pour les requêtes non-sûres sur un projet.

        Args:
            request: Requête HTTP
            view: Vue actuelle
            obj: Instance de Project

        Returns:
            bool: True si l'utilisateur peut modifier, False sinon
        """
        user = request.user

        # Lecture autorisée pour tous
        if request.method in permissions.SAFE_METHODS:
            return True

        # Écriture : Admin seulement si archivé
        if obj.status == Project.StatusChoices.ARCHIVED:
            return user.is_authenticated and user.is_admin

        # Non-archivé : autoriser la modification
        return True


class CanRestoreProject(permissions.BasePermission):
    """
    Permission pour restaurer un projet archivé.

    ✅ Autorisé :
        - Admin global uniquement

    ❌ Interdit :
        - Tous les autres (même le propriétaire/manager)

    Principe :
        Seul un administrateur peut restaurer un projet archivé.
        Cela prévient les restaurations accidentelles.
    """

    message = "Seuls les administrateurs peuvent restaurer un projet."

    def has_permission(self, request, view):
        """Vérification globale."""
        return request.user and request.user.is_authenticated and request.user.is_admin
