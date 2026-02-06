"""
Permissions personnalisées pour le module de chat
"""
from rest_framework import permissions

class IsMessageOwner(permissions.BasePermission):
    """
    Permission personnalisée pour vérifier que l'utilisateur est le propriétaire du message.
    Seul l'expéditeur d'un message peut l'éditer ou le supprimer.
    """
    
    def has_object_permission(self, request, view, obj):
        """
        Vérifie si l'utilisateur est le propriétaire du message.
        
        Args:
            request: La requête HTTP
            view: La vue en cours
            obj: L'objet Message à vérifier
            
        Returns:
            bool: True si l'utilisateur est le propriétaire, False sinon
        """
        # Lecture autorisée pour tous les participants (GET)
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Édition/Suppression uniquement pour l'expéditeur
        return obj.sender == request.user