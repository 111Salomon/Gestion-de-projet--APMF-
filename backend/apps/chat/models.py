"""
Modèles pour le module de chat interne
"""
from django.db import models
from django.conf import settings
from django.utils import timezone


class Room(models.Model):
    """
    Salle de discussion (privée, groupe, tâche, projet)
    
    Types de rooms :
    - private : Chat 1:1 entre deux utilisateurs
    - group : Chat de groupe (équipe, projet)
    - task : Chat lié à une tâche spécifique
    - project : Chat de projet complet
    """
    
    TYPE_CHOICES = [
        ('private', 'Privé 1:1'),
        ('group', 'Groupe'),
        ('task', 'Tâche'),
        ('project', 'Projet'),
    ]
    
    # Informations de base
    name = models.CharField(
        max_length=200,
        blank=True,
        verbose_name='Nom',
        help_text='Nom du groupe/projet (optionnel pour les chats privés)'
    )
    
    type = models.CharField(
        max_length=20,
        choices=TYPE_CHOICES,
        default='group',
        verbose_name='Type'
    )
    
    # Relations optionnelles
    task = models.ForeignKey(
        'tasks.Task',
        null=True,
        blank=True,
        on_delete=models.CASCADE,
        related_name='chat_rooms',
        verbose_name='Tâche associée'
    )
    
    project = models.ForeignKey(
        'projects.Project',
        null=True,
        blank=True,
        on_delete=models.CASCADE,
        related_name='chat_rooms',
        verbose_name='Projet associé'
    )
    
    # Timestamps
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Date de création'
    )
    
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name='Dernière mise à jour'
    )
    
    class Meta:
        db_table = 'chat_rooms'
        verbose_name = 'Salle de discussion'
        verbose_name_plural = 'Salles de discussion'
        ordering = ['-updated_at']
        indexes = [
            models.Index(fields=['type'], name='chat_room_type_idx'),
            models.Index(fields=['-updated_at'], name='chat_room_updated_idx'),
        ]
    
    def __str__(self):
        if self.name:
            return f"{self.get_type_display()} - {self.name}"
        return f"{self.get_type_display()} ({self.id})"
    
    @property
    def is_private(self):
        return self.type == 'private'
    
    @property
    def is_group(self):
        return self.type == 'group'
    
    @property
    def participant_count(self):
        return self.participants.count()


class Participant(models.Model):
    """
    Participation d'un utilisateur à une room
    
    Permet de suivre :
    - Qui est dans quelle room
    - Quand l'utilisateur a rejoint
    - Quel est le dernier message lu
    """
    
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='chat_participations',
        verbose_name='Utilisateur'
    )
    
    room = models.ForeignKey(
        Room,
        on_delete=models.CASCADE,
        related_name='participants',
        verbose_name='Salle'
    )
    
    joined_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Date de jonction'
    )
    
    last_read = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Dernier message lu',
        help_text='Date du dernier message lu par l\'utilisateur'
    )
    
    is_active = models.BooleanField(
        default=True,
        verbose_name='Actif',
        help_text='Participant actif dans la room'
    )
    
    class Meta:
        db_table = 'chat_participants'
        verbose_name = 'Participant'
        verbose_name_plural = 'Participants'
        unique_together = ['user', 'room']
        indexes = [
            models.Index(fields=['user', 'room'], name='chat_participant_idx'),
            models.Index(fields=['room', 'is_active'], name='chat_participant_active_idx'),
        ]
    
    def __str__(self):
        return f"{self.user.email} in {self.room}"
    
    def mark_as_read(self):
        """Marquer tous les messages comme lus"""
        self.last_read = timezone.now()
        self.save()
    
    @property
    def unread_count(self):
        """Nombre de messages non lus"""
        if not self.last_read:
            return self.room.messages.count()
        return self.room.messages.filter(created_at__gt=self.last_read).count()


class Message(models.Model):
    """
    Message dans une room
    
    Champs :
    - room : Salle de discussion
    - sender : Expéditeur
    - content : Contenu texte
    - file : Fichier joint (optionnel)
    - created_at : Date de création
    """
    
    room = models.ForeignKey(
        Room,
        on_delete=models.CASCADE,
        related_name='messages',
        verbose_name='Salle'
    )
    
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='sent_messages',
        verbose_name='Expéditeur'
    )
    
    content = models.TextField(
        verbose_name='Contenu',
        help_text='Contenu du message'
    )
    
    file = models.FileField(
        upload_to='chat/files/%Y/%m/',
        null=True,
        blank=True,
        verbose_name='Fichier joint',
        max_length=500
    )
    
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Date d\'envoi'
    )
    
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name='Dernière modification'
    )
    
    class Meta:
        db_table = 'chat_messages'
        verbose_name = 'Message'
        verbose_name_plural = 'Messages'
        ordering = ['created_at']
        indexes = [
            models.Index(fields=['room', '-created_at'], name='chat_message_room_idx'),
            models.Index(fields=['sender', '-created_at'], name='chat_message_sender_idx'),
        ]
    
    def __str__(self):
        preview = self.content[:50] + '...' if len(self.content) > 50 else self.content
        return f"{self.sender.email}: {preview}"
    
    @property
    def is_edited(self):
        """Vérifie si le message a été édité"""
        return self.updated_at > self.created_at