"""
Serializers pour le module de chat
"""
from rest_framework import serializers
from .models import Room, Participant, Message
from apps.users.serializers import UserMinimalSerializer


class MessageSerializer(serializers.ModelSerializer):
    """Serializer pour les messages"""
    sender = UserMinimalSerializer(read_only=True)
    file = serializers.FileField(write_only=True, required=False, allow_null=True)
    file_url = serializers.SerializerMethodField()
    is_edited = serializers.ReadOnlyField()
    
    class Meta:
        model = Message
        fields = [
            'id',
            'room',
            'sender',
            'content',
            'file',
            'file_url',
            'created_at',
            'updated_at',
            'is_edited',
        ]
        read_only_fields = ['sender', 'created_at', 'updated_at', 'file_url', 'is_edited']
    
    def validate(self, attrs):
        """Valider qu'au moins un contenu (texte ou fichier) est présent"""
        content = attrs.get('content')
        file = attrs.get('file')
        if (content is None or not content.strip()) and not file:
            raise serializers.ValidationError('Un message doit contenir du texte ou un fichier.')
        return attrs
    
    def get_file_url(self, obj):
        """Retourne l'URL complète du fichier"""
        if obj.file:
            request = self.context.get('request') if self.context else None
            if request:
                return request.build_absolute_uri(obj.file.url)
            return obj.file.url
        return None
    
    def create(self, validated_data):
        """Créer un message avec l'expéditeur automatique"""
        request = self.context.get('request') if self.context else None
        if request and request.user and request.user.is_authenticated:
            validated_data['sender'] = request.user
        return super().create(validated_data)


class ParticipantSerializer(serializers.ModelSerializer):
    """Serializer pour les participants"""
    user = UserMinimalSerializer(read_only=True)
    unread_count = serializers.ReadOnlyField()
    
    class Meta:
        model = Participant
        fields = [
            'id',
            'user',
            'room',
            'joined_at',
            'last_read',
            'is_active',
            'unread_count',
        ]
        read_only_fields = ['user', 'joined_at']


class RoomSerializer(serializers.ModelSerializer):
    """Serializer pour les rooms"""
    participants = ParticipantSerializer(many=True, read_only=True)
    participant_count = serializers.ReadOnlyField()
    last_message = serializers.SerializerMethodField()
    
    class Meta:
        model = Room
        fields = [
            'id',
            'name',
            'type',
            'task',
            'project',
            'participants',
            'participant_count',
            'last_message',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['created_at', 'updated_at']
    
    def get_last_message(self, obj):
        """Retourne le dernier message de la room"""
        last_msg = obj.messages.order_by('-created_at').first()
        if last_msg:
            return MessageSerializer(last_msg, context=self.context).data
        return None
    
    def create(self, validated_data):
        """Créer une room et ajouter automatiquement le créateur comme participant"""
        request = self.context['request']
        room = Room.objects.create(**validated_data)
        
        # Ajouter le créateur comme participant
        Participant.objects.create(
            user=request.user,
            room=room
        )
        
        return room


class RoomCreateSerializer(serializers.ModelSerializer):
    """Serializer simplifié pour créer une room"""
    participant_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False,
        help_text='IDs des utilisateurs à ajouter à la room'
    )
    
    class Meta:
        model = Room
        fields = [
            'name',
            'type',
            'task',
            'project',
            'participant_ids',
        ]
    
    def create(self, validated_data):
        """Créer une room avec des participants"""
        participant_ids = validated_data.pop('participant_ids', [])
        request = self.context['request']
        
        # Créer la room
        room = Room.objects.create(**validated_data)
        
        # Ajouter le créateur
        Participant.objects.create(
            user=request.user,
            room=room
        )
        
        # Ajouter les autres participants
        from apps.users.models import User
        for user_id in participant_ids:
            try:
                user = User.objects.get(id=user_id)
                Participant.objects.get_or_create(
                    user=user,
                    room=room
                )
            except User.DoesNotExist:
                continue
        
        return room


class RoomListSerializer(serializers.ModelSerializer):
    """Serializer léger pour lister les rooms"""
    participant_count = serializers.ReadOnlyField()
    unread_count = serializers.SerializerMethodField()
    last_message_preview = serializers.SerializerMethodField()
    
    class Meta:
        model = Room
        fields = [
            'id',
            'name',
            'type',
            'participant_count',
            'unread_count',
            'last_message_preview',
            'updated_at',
        ]
    
    def get_unread_count(self, obj):
        """Nombre de messages non lus pour l'utilisateur connecté"""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            try:
                participant = obj.participants.get(user=request.user)
                return participant.unread_count
            except Participant.DoesNotExist:
                return 0
        return 0
    
    def get_last_message_preview(self, obj):
        """Aperçu du dernier message"""
        last_msg = obj.messages.order_by('-created_at').first()
        if last_msg:
            return {
                'content': last_msg.content[:100] + '...' if len(last_msg.content) > 100 else last_msg.content,
                'sender': last_msg.sender.get_full_name(),
                'created_at': last_msg.created_at.isoformat(),
            }
        return None