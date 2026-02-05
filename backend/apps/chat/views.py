"""
Views pour le module de chat
"""
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response

from django.db.models import Q
from .models import Room, Participant, Message
from .serializers import (
    RoomSerializer,
    RoomCreateSerializer,
    RoomListSerializer,
    MessageSerializer,
    ParticipantSerializer
)
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

class RoomViewSet(viewsets.ModelViewSet):
    """ViewSet pour gérer les rooms de chat"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Retourne les rooms où l'utilisateur est participant"""
        user = self.request.user
        return Room.objects.filter(
            participants__user=user,
            participants__is_active=True
        ).distinct()
    
    def get_serializer_class(self):
        """Retourne le serializer selon l'action"""
        if self.action == 'create':
            return RoomCreateSerializer
        elif self.action == 'list':
            return RoomListSerializer
        return RoomSerializer
    
    def perform_create(self, serializer):
        """Sauvegarder la room avec l'utilisateur connecté"""
        serializer.save()
    
    @action(detail=True, methods=['post'], url_path='add-participant')
    def add_participant(self, request, pk=None):
        """Ajouter un participant à une room"""
        room = self.get_object()
        user_id = request.data.get('user_id')
        
        if not user_id:
            return Response(
                {'error': 'user_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            from apps.users.models import User
            user = User.objects.get(id=user_id)
            
            # Vérifier si déjà participant
            participant, created = Participant.objects.get_or_create(
                user=user,
                room=room
            )
            
            if not created:
                return Response(
                    {'message': 'User is already a participant'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            return Response({
                'message': 'Participant added successfully',
                'participant': ParticipantSerializer(participant).data
            })
            
        except User.DoesNotExist:
            return Response(
                {'error': 'User not found'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=True, methods=['post'], url_path='remove-participant')
    def remove_participant(self, request, pk=None):
        """Retirer un participant d'une room"""
        room = self.get_object()
        user_id = request.data.get('user_id')
        
        if not user_id:
            return Response(
                {'error': 'user_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            participant = Participant.objects.get(
                room=room,
                user_id=user_id
            )
            participant.delete()
            
            return Response({
                'message': 'Participant removed successfully'
            })
            
        except Participant.DoesNotExist:
            return Response(
                {'error': 'Participant not found'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=True, methods=['post'], url_path='mark-as-read')
    def mark_as_read(self, request, pk=None):
        """Marquer tous les messages comme lus"""
        room = self.get_object()
        
        try:
            participant = Participant.objects.get(
                room=room,
                user=request.user
            )
            participant.mark_as_read()
            
            return Response({
                'message': 'Messages marked as read',
                'unread_count': 0
            })
            
        except Participant.DoesNotExist:
            return Response(
                {'error': 'Participant not found'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=True, methods=['get'], url_path='messages')
    def messages(self, request, pk=None):
        """Lister les messages d'une room"""
        try:
            room = self.get_object()
        except Exception as e:
            # ✨ AJOUT : Gestion explicite de l'erreur 404
            return Response(
                {'error': 'Vous n\'êtes pas participant de cette conversation'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # ✨ AJOUT : Vérification double que l'utilisateur est participant
        if not room.participants.filter(user=request.user, is_active=True).exists():
            return Response(
                {'error': 'Vous n\'êtes pas participant de cette conversation'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Pagination
        page_size = request.query_params.get('page_size', 50)
        page_size = int(page_size)
        
        messages = room.messages.select_related('sender').order_by('-created_at')[:page_size]
        messages = list(reversed(messages))  # ✨ Correction : reversed() retourne un itérateur
        
        serializer = MessageSerializer(messages, many=True, context={'request': request})
        
        return Response(serializer.data)


class MessageViewSet(viewsets.ModelViewSet):
    """ViewSet pour gérer les messages"""
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Retourne les messages des rooms où l'utilisateur est participant"""
        user = self.request.user
        return Message.objects.filter(
            room__participants__user=user
        ).select_related('sender', 'room').distinct()
    
    def perform_create(self, serializer):
        """Créer un message avec contrôle d'accès"""
        room = serializer.validated_data['room']
        user = self.request.user
        is_participant = room.participants.filter(user=user, is_active=True).exists()

        if not is_participant:
            raise PermissionDenied("Vous n'êtes pas autorisé à écrire dans cette conversation")

        serializer.save(sender=user)
    
    def create(self, request, *args, **kwargs):
        """Créer un message et envoyer via WebSocket"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)

        # ✨ NOUVEAU : Broadcast du message via WebSocket
        message = serializer.instance

        message_serializer = MessageSerializer(message, context={'request': request})
        message_data = message_serializer.data
        
        # Envoyer à tous les clients connectés à cette room
        channel_layer = get_channel_layer()
        room_group_name = f'chat_{message.room.id}'
        async_to_sync(channel_layer.group_send)(
            room_group_name,
            {
                'type': 'chat_message',
                'message': message_data
            }
        )
        
        # Le message sera envoyé via WebSocket automatiquement
        # (géré par le ChatConsumer)
        
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)