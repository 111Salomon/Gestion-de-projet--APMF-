from django.db import models
from django.conf import settings
from django.core.validators import MinLengthValidator, FileExtensionValidator
from django.core.exceptions import ValidationError


class Task(models.Model):
    """
    Modèle représentant une tâche liée à un projet.
    
    Relations:
        - project: Projet parent (1:N)
        - assigned_to: User assigné à la tâche (1:N)
        - created_by: User qui a créé la tâche (1:N)
        - comments: Commentaires sur la tâche (1:N)
        - attachments: Pièces jointes (1:N)
    
    Statuts:
        - todo: À faire
        - in_progress: En cours
        - in_review: En révision
        - done: Terminée
    
    Priorités:
        - low: Basse
        - medium: Moyenne
        - high: Haute
        - urgent: Urgente
    """
    
    class StatusChoices(models.TextChoices):
        """Statuts disponibles pour une tâche."""
        TODO = 'todo', 'À faire'
        IN_PROGRESS = 'in_progress', 'En cours'
        IN_REVIEW = 'in_review', 'En révision'
        DONE = 'done', 'Terminée'
    
    class PriorityChoices(models.TextChoices):
        """Niveaux de priorité pour une tâche."""
        LOW = 'low', 'Basse'
        MEDIUM = 'medium', 'Moyenne'
        HIGH = 'high', 'Haute'
        URGENT = 'urgent', 'Urgente'
    
    # Informations de base
    title = models.CharField(
        max_length=200,
        validators=[MinLengthValidator(3)],
        verbose_name='Titre',
        help_text='Titre de la tâche (minimum 3 caractères)'
    )
    
    description = models.TextField(
        blank=True,
        verbose_name='Description',
        help_text='Description détaillée de la tâche'
    )
    
    # Relations
    project = models.ForeignKey(
        'projects.Project',
        on_delete=models.CASCADE,
        related_name='tasks',
        verbose_name='Projet'
    )
    
    assigned_to = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_tasks',
        verbose_name='Assigné à',
        help_text='Utilisateur responsable de la tâche'
    )
    
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_tasks',
        verbose_name='Créé par'
    )
    
    # Statut et priorité
    status = models.CharField(
        max_length=20,
        choices=StatusChoices.choices,
        default=StatusChoices.TODO,
        verbose_name='Statut'
    )
    
    priority = models.CharField(
        max_length=10,
        choices=PriorityChoices.choices,
        default=PriorityChoices.MEDIUM,
        verbose_name='Priorité'
    )
    
    # Dates
    due_date = models.DateField(
        null=True,
        blank=True,
        verbose_name='Date d\'échéance',
        help_text='Date limite pour terminer la tâche'
    )
    
    completed_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Complétée le',
        help_text='Date et heure de complétion de la tâche'
    )
    
    # Ordre dans le projet (pour tri manuel)
    order = models.PositiveIntegerField(
        default=0,
        verbose_name='Ordre',
        help_text='Ordre d\'affichage dans le projet'
    )
    
    # Timestamps automatiques
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Date de création'
    )
    
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name='Dernière modification'
    )
    
    class Meta:
        """Métadonnées du modèle."""
        db_table = 'tasks'
        verbose_name = 'Tâche'
        verbose_name_plural = 'Tâches'
        ordering = ['order', '-created_at']
        indexes = [
            models.Index(fields=['project', 'status'], name='task_proj_status_idx'),
            models.Index(fields=['assigned_to', 'status'], name='task_assigned_status_idx'),
            models.Index(fields=['due_date'], name='task_due_date_idx'),
            models.Index(fields=['priority'], name='task_priority_idx'),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=['project', 'order'],
                name='unique_task_order_per_project'
            )
        ]
    
    def __str__(self):
        """Représentation textuelle de la tâche."""
        return f"{self.title} ({self.get_status_display()})"
    
    def clean(self):
        """Validation métier."""
        if self.due_date and self.project.end_date:
            if self.due_date > self.project.end_date:
                raise ValidationError(
                    "La date d'échéance ne peut pas dépasser la date de fin du projet."
                )
        
        if self.completed_at and self.status != self.StatusChoices.DONE:
            raise ValidationError(
                "Une tâche ne peut avoir une date de complétion que si son statut est 'Terminée'."
            )
    
    @property
    def is_overdue(self):
        """Vérifie si la tâche est en retard."""
        if not self.due_date or self.status == self.StatusChoices.DONE:
            return False
        from django.utils import timezone
        return timezone.now().date() > self.due_date
    
    @property
    def is_completed(self):
        """Vérifie si la tâche est terminée."""
        return self.status == self.StatusChoices.DONE


class Comment(models.Model):
    """
    Modèle représentant un commentaire sur une tâche.
    
    Relations:
        - task: Tâche parent (1:N)
        - author: User qui a écrit le commentaire (1:N)
    """
    
    # Relations
    task = models.ForeignKey(
        Task,
        on_delete=models.CASCADE,
        related_name='comments',
        verbose_name='Tâche'
    )
    
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='comments',
        verbose_name='Auteur'
    )
    
    # Contenu du commentaire
    content = models.TextField(
        validators=[MinLengthValidator(1)],
        verbose_name='Contenu',
        help_text='Contenu du commentaire'
    )
    
    # Timestamps
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Date de création'
    )
    
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name='Dernière modification'
    )
    
    class Meta:
        """Métadonnées du modèle."""
        db_table = 'comments'
        verbose_name = 'Commentaire'
        verbose_name_plural = 'Commentaires'
        ordering = ['created_at']
        indexes = [
            models.Index(fields=['task', 'created_at'], name='comment_task_created_idx'),
        ]
    
    def __str__(self):
        """Représentation textuelle du commentaire."""
        preview = self.content[:50] + '...' if len(self.content) > 50 else self.content
        return f"Commentaire de {self.author.username} sur {self.task.title}: {preview}"


import os


class Attachment(models.Model):
    """
    Modèle représentant une pièce jointe liée à une tâche.
    
    Relations:
        - task: Tâche parent (1:N)
        - uploaded_by: User qui a uploadé le fichier (1:N)
    
    Types de fichiers acceptés:
        - Documents: pdf, doc, docx, xls, xlsx
        - Images: jpg, jpeg, png, gif, webp
        - Archives: zip, rar
        - Autres: txt, csv
    """
    
    # Relations
    task = models.ForeignKey(
        Task,
        on_delete=models.CASCADE,
        related_name='attachments',
        verbose_name='Tâche'
    )
    
    # Fichier
    file = models.FileField(
        upload_to='uploads/tasks/%Y/%m/',  # ✅ Changé
        validators=[
            FileExtensionValidator([
                'pdf', 'doc', 'docx', 'xls', 'xlsx',
                'jpg', 'jpeg', 'png', 'gif', 'webp', 'svg',
                'zip', 'rar', 'txt', 'csv'
            ])
        ],
        verbose_name='Fichier',
        max_length=500,
        help_text='Formats acceptés: PDF, DOC, XLS, images, ZIP, TXT, CSV'
    )
    
    # Métadonnées du fichier
    file_name = models.CharField(
        max_length=255,
        blank=True,  # ✅ Ajouté
        verbose_name='Nom du fichier'
    )
    
    file_size = models.PositiveIntegerField(
        default=0,  # ✅ Ajouté
        verbose_name='Taille (bytes)',
        help_text='Taille du fichier en bytes'
    )
    
    # User qui a uploadé
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='uploaded_attachments',  # ✅ Changé pour éviter conflits
        verbose_name='Uploadé par'
    )
    
    # Timestamp
    uploaded_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Date d\'upload'
    )
    
    class Meta:
        """Métadonnées du modèle."""
        db_table = 'attachments'
        verbose_name = 'Pièce jointe'
        verbose_name_plural = 'Pièces jointes'
        ordering = ['-uploaded_at']
        indexes = [
            models.Index(fields=['task'], name='attach_task_idx'),
        ]
    
    def __str__(self):
        """Représentation textuelle de la pièce jointe."""
        return self.file_name or self.file.name
    
    def save(self, *args, **kwargs):
        """Capture automatiquement le nom et la taille du fichier."""
        if self.file:
            self.file_name = os.path.basename(self.file.name)
            self.file_size = self.file.size
        super().save(*args, **kwargs)
    
    def delete(self, *args, **kwargs):
        """Supprime le fichier physique lors de la suppression."""
        if self.file:
            if os.path.isfile(self.file.path):
                os.remove(self.file.path)
        super().delete(*args, **kwargs)
    
    @property
    def file_size_mb(self):
        """Retourne la taille du fichier en MB."""
        return round(self.file_size / (1024 * 1024), 2)
    
    @property
    def file_extension(self):
        """Retourne l'extension du fichier."""
        return os.path.splitext(self.file_name or self.file.name)[1].lower()
    
    @property
    def is_image(self):
        """Vérifie si c'est une image."""
        return self.file_extension in ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg']
