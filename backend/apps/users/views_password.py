"""
Vues pour la gestion des mots de passe.
"""

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_decode
from django.utils.encoding import force_str
from django.contrib.auth.hashers import make_password

from apps.users.models import User


@api_view(['POST'])
@permission_classes([AllowAny])  # Accessible sans authentification
def reset_password(request):
    """
    Réinitialise le mot de passe d'un utilisateur.
    
    Données requises :
        - uid : ID utilisateur encodé
        - token : Token de validation
        - password : Nouveau mot de passe
    """
    
    uid = request.data.get('uid')
    token = request.data.get('token')
    password = request.data.get('password')
    
    # Validation des données
    if not all([uid, token, password]):
        return Response(
            {'error': 'Données manquantes (uid, token, password requis)'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Validation de la longueur du mot de passe
    if len(password) < 8:
        return Response(
            {'error': 'Le mot de passe doit contenir au moins 8 caractères'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        # Décoder l'UID
        user_id = force_str(urlsafe_base64_decode(uid))
        user = User.objects.get(pk=user_id)
        
        # Vérifier le token
        if not default_token_generator.check_token(user, token):
            return Response(
                {'error': 'Lien invalide ou expiré'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Changer le mot de passe
        user.password = make_password(password)
        user.is_active = True  # Activer le compte
        user.save()
        
        return Response({
            'message': 'Mot de passe créé avec succès',
            'email': user.email
        }, status=status.HTTP_200_OK)
        
    except (TypeError, ValueError, OverflowError, User.DoesNotExist):
        return Response(
            {'error': 'Lien invalide'},
            status=status.HTTP_400_BAD_REQUEST
        )
