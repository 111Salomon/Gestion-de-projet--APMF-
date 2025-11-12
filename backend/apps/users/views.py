from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from .models import User
from .serializers import (
    UserSerializer,
    UserCreateSerializer,
    UserMinimalSerializer
)
from .permissions import IsAdminUser, IsOwnerOrReadOnly


class UserViewSet(viewsets.ModelViewSet):
    """
    ViewSet pour gérer les utilisateurs.
    
    Endpoints:
        - GET    /api/users/          Liste des utilisateurs
        - POST   /api/users/          Créer un utilisateur (admin)
        - GET    /api/users/{id}/     Détails d'un utilisateur
        - PUT    /api/users/{id}/     Modifier un utilisateur
        - DELETE /api/users/{id}/     Supprimer un utilisateur (admin)
        - GET    /api/users/me/       Profil de l'utilisateur connecté
    """
    
    queryset = User.objects.all()
    
    def get_serializer_class(self):
        """
        Retourne le serializer approprié selon l'action.
        
        Returns:
            Serializer class
        """
        if self.action == 'create':
            return UserCreateSerializer
        elif self.action == 'list':
            return UserMinimalSerializer
        return UserSerializer
    
    def get_permissions(self):
        """
        Définit les permissions selon l'action.
        
        Returns:
            List de permissions
        """
        if self.action == 'create':
            # Tout le monde peut créer un compte
            return [AllowAny()]
        elif self.action in ['update', 'partial_update']:
            # Seul le propriétaire peut modifier son profil
            return [IsAuthenticated(), IsOwnerOrReadOnly()]
        elif self.action == 'destroy':
            # Seul un admin peut supprimer un utilisateur
            return [IsAuthenticated(), IsAdminUser()]
        
        # Par défaut : utilisateur authentifié
        return [IsAuthenticated()]
    
    @action(detail=False, methods=['get'])
    def me(self, request):
        """
        Endpoint personnalisé pour récupérer le profil de l'utilisateur connecté.
        
        GET /api/users/me/
        
        Returns:
            Response: Données de l'utilisateur connecté
        """
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def set_role(self, request, pk=None):
        """
        Endpoint pour changer le rôle d'un utilisateur (admin uniquement).
        
        POST /api/users/{id}/set_role/
        Body: {"role": "chef"}
        
        Args:
            request: Requête HTTP
            pk: ID de l'utilisateur
        
        Returns:
            Response: Données de l'utilisateur mis à jour
        """
        if not request.user.is_admin:
            return Response(
                {"detail": "Seuls les administrateurs peuvent changer les rôles."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        user = self.get_object()
        new_role = request.data.get('role')
        
        if new_role not in ['admin', 'chef', 'membre']:
            return Response(
                {"detail": "Rôle invalide. Valeurs acceptées: admin, chef, membre"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        user.role = new_role
        user.save()
        
        serializer = self.get_serializer(user)
        return Response(serializer.data)
