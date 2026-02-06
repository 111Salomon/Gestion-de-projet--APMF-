"""

Serializers pour le module de chat

"""

from rest_framework import serializers

from django.conf import settings

import os

from .models import Room, Participant, Message
"""
Serializers pour le module de chat
"""

from rest_framework import serializers
from django.conf import settings
import os

from .models import Room, Participant, Message
from apps.users.serializers import UserMinimalSerializer


class MessageSerializer(serializers.ModelSerializer):
    sender = UserMinimalSerializer(read_only=True)
    content = serializers.CharField(required=False, allow_blank=True, allow_null=True, default='')
    file = serializers.FileField(write_only=True, required=False, allow_null=True)
    file_url = serializers.SerializerMethodField()
    file_name = serializers.SerializerMethodField()
    file_size = serializers.SerializerMethodField()
    file_type = serializers.SerializerMethodField()
    file_is_image = serializers.SerializerMethodField()
    is_edited = serializers.ReadOnlyField()

    class Meta:
        model = Message
        fields = [
            'id', 'room', 'sender', 'content', 'file', 'file_url', 'file_name', 'file_size',
            'file_type', 'file_is_image', 'created_at', 'updated_at', 'is_edited'
        ]
        read_only_fields = ['sender', 'created_at', 'updated_at', 'file_url', 'file_name', 'file_size', 'file_type', 'file_is_image', 'is_edited']

    def validate(self, attrs):
        content = attrs.get('content')
        file = attrs.get('file')
        if (content is None or not content.strip()) and not file:
            raise serializers.ValidationError('Un message doit contenir du texte ou un fichier.')

        if file:
            max_size = 10 * 1024 * 1024
            if getattr(file, 'size', 0) > max_size:
                raise serializers.ValidationError('Le fichier ne doit pas dépasser 10 MB.')

            allowed_exts = {'jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf', 'doc', 'docx', 'xls', 'xlsx'}
            ext = os.path.splitext(getattr(file, 'name', '') or '')[1].lstrip('.').lower()
            if ext and ext not in allowed_exts:
                raise serializers.ValidationError('Type de fichier non supporté. Formats acceptés: images, PDF, Word, Excel.')

            if content is None:
                attrs['content'] = ''

        return attrs

    def get_file_url(self, obj):
        if obj.file:
            request = self.context.get('request') if self.context else None
            if request:
                return request.build_absolute_uri(obj.file.url)
            return obj.file.url
        return None

    def get_file_name(self, obj):
        if obj.file:
            return os.path.basename(obj.file.name)
        return None

    def get_file_size(self, obj):
        if obj.file:
            try:
                return obj.file.size
            except Exception:
                return None
        return None

    def get_file_type(self, obj):
        if not obj.file:
            return None
        name = getattr(obj.file, 'name', '') or ''
        ext = os.path.splitext(name)[1].lstrip('.').lower()
        return ext or None

    def get_file_is_image(self, obj):
        if not obj.file:
            return False
        name = getattr(obj.file, 'name', '') or ''
        ext = os.path.splitext(name)[1].lstrip('.').lower()
        allowed_images = getattr(settings, 'ALLOWED_IMAGE_EXTENSIONS', ['jpg', 'jpeg', 'png', 'gif', 'webp'])
        return ext in [e.lower() for e in allowed_images]

    def create(self, validated_data):
        request = self.context.get('request') if self.context else None
        if request and request.user and request.user.is_authenticated:
            validated_data['sender'] = request.user
        return super().create(validated_data)


class ParticipantSerializer(serializers.ModelSerializer):
    user = UserMinimalSerializer(read_only=True)
    unread_count = serializers.ReadOnlyField()

    class Meta:
        model = Participant
        fields = ['id', 'user', 'room', 'joined_at', 'last_read', 'is_active', 'unread_count']
        read_only_fields = ['user', 'joined_at']


class RoomSerializer(serializers.ModelSerializer):
    participants = ParticipantSerializer(many=True, read_only=True)
    participant_count = serializers.ReadOnlyField()
    last_message = serializers.SerializerMethodField()

    class Meta:
        model = Room
        fields = ['id', 'name', 'type', 'task', 'project', 'participants', 'participant_count', 'last_message', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']

    def get_last_message(self, obj):
        last_msg = obj.messages.order_by('-created_at').first()
        if last_msg:
            return MessageSerializer(last_msg, context=self.context).data
        return None

    def create(self, validated_data):
        request = self.context.get('request')
        room = Room.objects.create(**validated_data)
        Participant.objects.create(user=request.user, room=room)
        return room


class RoomCreateSerializer(serializers.ModelSerializer):
    participant_ids = serializers.ListField(child=serializers.IntegerField(), write_only=True, required=False)

    class Meta:
        model = Room
        fields = ['name', 'type', 'task', 'project', 'participant_ids']

    def create(self, validated_data):
        participant_ids = validated_data.pop('participant_ids', [])
        request = self.context['request']
        room = Room.objects.create(**validated_data)
        Participant.objects.create(user=request.user, room=room)
        from apps.users.models import User
        for user_id in participant_ids:
            try:
                user = User.objects.get(id=user_id)
                Participant.objects.get_or_create(user=user, room=room)
            except User.DoesNotExist:
                continue
        return room


class RoomListSerializer(serializers.ModelSerializer):
    participant_count = serializers.ReadOnlyField()
    unread_count = serializers.SerializerMethodField()
    last_message_preview = serializers.SerializerMethodField()
    other_user = serializers.SerializerMethodField()

    class Meta:
        model = Room
        fields = ['id', 'name', 'type', 'participant_count', 'unread_count', 'last_message_preview', 'other_user', 'updated_at']

    def get_unread_count(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            try:
                participant = obj.participants.get(user=request.user)
                return participant.unread_count
            except Participant.DoesNotExist:
                return 0
        return 0

    def get_last_message_preview(self, obj):
        last_msg = obj.messages.order_by('-created_at').first()
        if last_msg:
            return {
                'content': last_msg.content[:100] + '...' if len(last_msg.content) > 100 else last_msg.content,
                'sender': last_msg.sender.get_full_name(),
                'created_at': last_msg.created_at.isoformat(),
            }
        return None

    def get_other_user(self, obj):
        request = self.context.get('request') if self.context else None
        if obj.type != 'private':
            return None
        try:
            if request and request.user and request.user.is_authenticated:
                participant = obj.participants.exclude(user=request.user).select_related('user').first()
            else:
                participant = obj.participants.select_related('user').first()
            if not participant:
                return None
            return UserMinimalSerializer(participant.user, context={'request': request}).data
        except Exception:
            return None

        last_msg = obj.messages.order_by('-created_at').first()

        if last_msg:

            return {

                'content': last_msg.content[:100] + '...' if len(last_msg.content) > 100 else last_msg.content,

                'sender': last_msg.sender.get_full_name(),

                'created_at': last_msg.created_at.isoformat(),

            }

        return None