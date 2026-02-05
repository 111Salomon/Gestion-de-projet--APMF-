"""
WebSocket consumers for chat.
"""
import json

from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer
from django.utils import timezone

from .models import Room, Message, Participant
from .serializers import MessageSerializer


class ChatConsumer(AsyncWebsocketConsumer):
    """Consumer pour les connexions WebSocket de chat"""
    
    async def connect(self):
        """Connexion d'un client WebSocket"""
        self.room_id = self.scope['url_route']['kwargs']['room_id']
        self.room_group_name = f'chat_{self.room_id}'
        
        # Vérifier que l'utilisateur est authentifié
        if self.scope['user'].is_anonymous:
            await self.close()
            return
        
        # Vérifier que l'utilisateur fait partie de la room
        if not await self.is_participant(self.room_id, self.scope['user']):
            await self.close()
            return
        
        # Rejoindre le groupe de room
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        
        await self.accept()
        
        # Marquer les messages comme lus pour cet utilisateur
        await self.mark_as_read()
        
        # Envoyer un message de bienvenue
        await self.send(text_data=json.dumps({
            'type': 'connection',
            'message': 'Connecté au chat',
            'user': self.scope['user'].email,
        }))
    
    async def disconnect(self, close_code):
        """Déconnexion d'un client WebSocket"""
        # Quitter le groupe
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )
    
    async def receive(self, text_data):
        """Recevoir un message du WebSocket"""
        try:
            data = json.loads(text_data)
            message_type = data.get('type', 'message')
            
            if message_type == 'message':
                await self.handle_message(data)
            elif message_type == 'typing':
                await self.handle_typing(data)
            elif message_type == 'read':
                await self.handle_read(data)
                
        except json.JSONDecodeError:
            await self.send(text_data=json.dumps({
                'error': 'Invalid JSON'
            }))
    
    async def handle_message(self, data):
        """Gérer un message texte envoyé via WebSocket"""
        content = (data.get('content') or data.get('message') or '').strip()
        if not content:
            return

        message = await self.save_message(content)
        message_data = await self.serialize_message(message)

        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'chat_message',
                'message': message_data,
            }
        )
    
    async def chat_message(self, event):
        """Recevoir un message du groupe et l'envoyer au client"""
        await self.send(text_data=json.dumps({
            'type': 'message',
            'data': event['message']
        }))
    
    async def handle_typing(self, data):
        """Gérer l'indicateur de frappe"""
        user = self.scope['user']
        
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'typing_indicator',
                'user': {
                    'id': user.id,
                    'email': user.email,
                    'full_name': user.get_full_name(),
                },
                'is_typing': data.get('is_typing', True)
            }
        )
    
    async def typing_indicator(self, event):
        """Envoyer l'indicateur de frappe aux clients"""
        await self.send(text_data=json.dumps({
            'type': 'typing',
            'data': event
        }))
    
    async def handle_read(self, data):
        """Marquer les messages comme lus"""
        await self.mark_as_read()
    
    @database_sync_to_async
    def is_participant(self, room_id, user):
        """Vérifier si l'utilisateur est participant de la room"""
        try:
            room = Room.objects.get(id=room_id)
            return room.participants.filter(user=user, is_active=True).exists()
        except Room.DoesNotExist:
            return False
    
    @database_sync_to_async
    def save_message(self, content):
        """Sauvegarder un message en base de données"""
        room = Room.objects.get(id=self.room_id)
        return Message.objects.create(
            room=room,
            sender=self.scope['user'],
            content=content,
        )

    @database_sync_to_async
    def serialize_message(self, message):
        """Formatter le message comme l'API REST"""
        serializer = MessageSerializer(message)
        return serializer.data
    
    @database_sync_to_async
    def mark_as_read(self):
        """Marquer tous les messages comme lus pour cet utilisateur"""
        try:
            participant = Participant.objects.get(
                room_id=self.room_id,
                user=self.scope['user']
            )
            participant.last_read = timezone.now()
            participant.save()
        except Participant.DoesNotExist:
            pass