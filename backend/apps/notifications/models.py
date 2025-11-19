"""
Modèles pour l'app Notifications.

Ce fichier contient le modèle Notification qui stocke toutes les notifications
envoyées aux utilisateurs de l'application.
"""

from django.db import models
from django.conf import settings
from django.utils import timezone


class Notification(models.Model):
    """
    Modèle pour stocker les notifications utilisateur.
    
    Une notification est créée automatiquement quand :
    - Une tâche est assignée à un utilisateur
    - Un commentaire est ajouté sur une tâche
    - Le statut d'une tâche change
    - Un utilisateur est ajouté à un projet
    
    Attributs:
        recipient: L'utilisateur qui reçoit la notification
        actor: L'utilisateur qui a déclenché l'action (peut être null)
        notification_type: Le type de notification (choix prédéfinis)
        title: Titre court de la notification
        message: Message descriptif complet
        task_id: ID de la tâche concernée (optionnel)
        project_id: ID du projet concerné (optionnel)
        action_url: URL vers la page concernée (ex: /tasks/15)
        is_read: Si la notification a été lue
        read_at: Date/heure de lecture
        created_at: Date/heure de création
    
    Exemple:
        notification = Notification.objects.create(
            recipient=user,
            actor=current_user,
            notification_type='task_assigned',
            title='Nouvelle tâche assignée',
            message='John vous a assigné la tâche "Design UI"',
            task_id=15,
            action_url='/tasks/15'
        )
    """
    
    # ───────────────────────────────────────────────────────────
    # TYPES DE NOTIFICATIONS
    # ───────────────────────────────────────────────────────────
    
    TYPE_CHOICES = [
        ('task_assigned', 'Tâche assignée'),
        ('task_comment', 'Nouveau commentaire'),
        ('task_status', 'Statut modifié'),
        ('project_added', 'Ajouté au projet'),
    ]
    
    # ───────────────────────────────────────────────────────────
    # CHAMPS PRINCIPAUX
    # ───────────────────────────────────────────────────────────
    
    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notifications',
        verbose_name='Destinataire',
        help_text='Utilisateur qui reçoit la notification'
    )
    
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notifications_sent',
        null=True,
        blank=True,
        verbose_name='Acteur',
        help_text='Utilisateur qui a déclenché la notification'
    )
    
    notification_type = models.CharField(
        max_length=50,
        choices=TYPE_CHOICES,
        verbose_name='Type',
        help_text='Type de notification'
    )
    
    title = models.CharField(
        max_length=255,
        verbose_name='Titre',
        help_text='Titre court de la notification'
    )
    
    message = models.TextField(
        verbose_name='Message',
        help_text='Message descriptif complet'
    )
    
    # ───────────────────────────────────────────────────────────
    # LIENS VERS D'AUTRES OBJETS (optionnels)
    # ───────────────────────────────────────────────────────────
    
    task_id = models.IntegerField(
        null=True,
        blank=True,
        verbose_name='ID Tâche',
        help_text='ID de la tâche concernée'
    )
    
    project_id = models.IntegerField(
        null=True,
        blank=True,
        verbose_name='ID Projet',
        help_text='ID du projet concerné'
    )
    
    action_url = models.CharField(
        max_length=255,
        blank=True,
        verbose_name='URL',
        help_text='URL de redirection (ex: /tasks/15)'
    )
    
    # ───────────────────────────────────────────────────────────
    # STATUT DE LECTURE
    # ───────────────────────────────────────────────────────────
    
    is_read = models.BooleanField(
        default=False,
        verbose_name='Lu',
        help_text='Si la notification a été lue'
    )
    
    read_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Lu le',
        help_text='Date et heure de lecture'
    )
    
    # ───────────────────────────────────────────────────────────
    # TIMESTAMPS
    # ───────────────────────────────────────────────────────────
    
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Créée le',
        help_text='Date et heure de création'
    )
    
    # ───────────────────────────────────────────────────────────
    # META ET CONFIGURATION
    # ───────────────────────────────────────────────────────────
    
    class Meta:
        """Configuration du modèle."""
        ordering = ['-created_at']  # Les plus récentes en premier
        db_table = 'notifications'
        verbose_name = 'Notification'
        verbose_name_plural = 'Notifications'
        indexes = [
            # Index pour accélérer les requêtes fréquentes
            models.Index(fields=['recipient', '-created_at']),
            models.Index(fields=['recipient', 'is_read']),
        ]
    
    # ───────────────────────────────────────────────────────────
    # MÉTHODES
    # ───────────────────────────────────────────────────────────
    
    def __str__(self):
        """Représentation textuelle de la notification."""
        return f"{self.title} pour {self.recipient.username}"
    
    def mark_as_read(self):
        """
        Marque la notification comme lue.
        
        Met à jour is_read à True et enregistre la date/heure.
        Ne fait rien si déjà lue.
        
        Usage:
            notification = Notification.objects.get(id=1)
            notification.mark_as_read()
        """
        if not self.is_read:
            self.is_read = True
            self.read_at = timezone.now()
            self.save(update_fields=['is_read', 'read_at'])
    
    @classmethod
    def create_notification(cls, recipient, notification_type, title, message,
                           actor=None, task_id=None, project_id=None, action_url=''):
        """
        Méthode helper pour créer une notification facilement.
        
        Args:
            recipient: Utilisateur qui reçoit la notification
            notification_type: Type de notification ('task_assigned', etc.)
            title: Titre court
            message: Message descriptif
            actor: Utilisateur qui a déclenché l'action (optionnel)
            task_id: ID de la tâche concernée (optionnel)
            project_id: ID du projet concerné (optionnel)
            action_url: URL de redirection (optionnel)
        
        Returns:
            L'instance Notification créée
        
        Usage:
            Notification.create_notification(
                recipient=user,
                notification_type='task_assigned',
                title='Nouvelle tâche',
                message='John vous a assigné "Design UI"',
                actor=john,
                task_id=15,
                action_url='/tasks/15'
            )
        """
        return cls.objects.create(
            recipient=recipient,
            actor=actor,
            notification_type=notification_type,
            title=title,
            message=message,
            task_id=task_id,
            project_id=project_id,
            action_url=action_url
        )
