"""
Backend d'authentification Email Only
Authentification moderne et professionnelle
"""

from django.contrib.auth.backends import ModelBackend
from apps.users.models import User


class EmailAuthenticationBackend(ModelBackend):
    """
    Backend d'authentification par email uniquement.
    
    Pratique moderne utilisée par Slack, Notion, LinkedIn, etc.
    
    Exemple:
        POST /api/token/
        {
            "username": "salomon@gmail.com",
            "password": "password123"
        }
    
    Note: Le champ s'appelle "username" pour compatibilité JWT,
    mais on accepte uniquement un email.
    """
    
    def authenticate(self, request, username=None, password=None, **kwargs):
        """
        Authentifie un utilisateur avec son EMAIL uniquement.
        
        Args:
            username: L'adresse email de l'utilisateur (nom trompeur mais standard JWT)
            password: Le mot de passe
            
        Returns:
            User si authentification réussie, None sinon
        """
        # Sécurité : Vérifier que les champs sont présents
        if username is None or password is None:
            return None
        
        # Normalise l'email (lowercase pour éviter les doublons)
        email = username.lower().strip()
        
        try:
            # Cherche l'utilisateur par EMAIL uniquement
            user = User.objects.get(email__iexact=email)
            
            # Vérifie le mot de passe avec hash
            if user.check_password(password):
                return user
                
        except User.DoesNotExist:
            # Sécurité : Ne pas révéler si l'email existe ou non
            # On retourne None dans tous les cas
            return None
        except User.MultipleObjectsReturned:
            # Cas improbable mais on le gère quand même
            return None
        
        return None
    
    def get_user(self, user_id):
        """
        Récupère un utilisateur par son ID.
        Requis par Django pour les sessions.
        """
        try:
            return User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return None
