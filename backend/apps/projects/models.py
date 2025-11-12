from django.db import models
from django.conf import settings
from django.core.validators import MinLengthValidator
from django.core.exceptions import ValidationError


class Project(models.Model):
    """
    Modèle représentant un projet.
    
    Relations:
        - owner: User qui a créé le projet (1:N)
        - members: Users membres du projet (N:N via ProjectMember)
        - tasks: Tâches du projet (1:N)
    
    Statuts:
        - draft: Brouillon (en préparation)
        - active: Actif (en cours)
        - on_hold: En pause
        - completed: Terminé
        - archived: Archivé
    """
    
    class StatusChoices(models.TextChoices):
        """Statuts disponibles pour un projet."""
        DRAFT = 'draft', 'Brouillon'
        ACTIVE = 'active', 'Actif'
        ON_HOLD = 'on_hold', 'En pause'
        COMPLETED = 'completed', 'Terminé'
        ARCHIVED = 'archived', 'Archivé'
    
    # Informations de base
    name = models.CharField(
        max_length=200,
        validators=[MinLengthValidator(3)],
        verbose_name='Nom du projet',
        help_text='Nom du projet (minimum 3 caractères)'
    )
    
    description = models.TextField(
        verbose_name='Description',
        help_text='Description détaillée du projet'
    )
    
    # Propriétaire du projet
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,  # Empêche la suppression si projets actifs
        related_name='owned_projects',
        verbose_name='Propriétaire',
        help_text='Utilisateur qui a créé le projet'
    )
    
    # Membres du projet (relation N:N)
    members = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        through='ProjectMember',
        related_name='projects',
        verbose_name='Membres',
        blank=True
    )
    
    # Statut du projet
    status = models.CharField(
        max_length=20,
        choices=StatusChoices.choices,
        default=StatusChoices.DRAFT,
        verbose_name='Statut'
    )
    
    # Dates du projet
    start_date = models.DateField(
        null=True,
        blank=True,
        verbose_name='Date de début',
        help_text='Date de début prévue du projet'
    )
    
    end_date = models.DateField(
        null=True,
        blank=True,
        verbose_name='Date de fin',
        help_text='Date de fin prévue du projet'
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
        db_table = 'projects'
        verbose_name = 'Projet'
        verbose_name_plural = 'Projets'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['owner', 'status'], name='proj_owner_status_idx'),
            models.Index(fields=['status'], name='proj_status_idx'),
            models.Index(fields=['end_date'], name='proj_end_date_idx'),
        ]
    
    def __str__(self):
        """Représentation textuelle du projet."""
        return f"{self.name} ({self.get_status_display()})"
    
    def clean(self):
        """Validation métier."""
        if self.start_date and self.end_date:
            if self.end_date < self.start_date:
                raise ValidationError(
                    "La date de fin doit être postérieure à la date de début."
                )
    
    @property
    def progress(self):
        """Calcule le pourcentage de progression du projet."""
        total_tasks = self.tasks.count()
        if total_tasks == 0:
            return 0
        completed_tasks = self.tasks.filter(status='done').count()
        return round((completed_tasks / total_tasks) * 100, 2)
    
    @property
    def is_active(self):
        """Vérifie si le projet est actif."""
        return self.status == self.StatusChoices.ACTIVE
    
    @property
    def is_completed(self):
        """Vérifie si le projet est terminé."""
        return self.status == self.StatusChoices.COMPLETED


class ProjectMember(models.Model):
    """
    Table de liaison pour la relation N:N entre Project et User.
    Permet d'ajouter des attributs à la relation (rôle dans le projet, date d'ajout).
    
    Cette table normalise la relation Many-to-Many en ajoutant des informations
    sur le rôle de chaque membre dans le projet.
    """
    
    class RoleChoices(models.TextChoices):
        """Rôles disponibles dans un projet."""
        OWNER = 'owner', 'Propriétaire'
        MANAGER = 'manager', 'Gestionnaire'
        MEMBER = 'member', 'Membre'
        VIEWER = 'viewer', 'Observateur'
    
    # Relations
    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name='project_members',
        verbose_name='Projet'
    )
    
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='project_memberships',
        verbose_name='Utilisateur'
    )
    
    # Rôle dans le projet
    role = models.CharField(
        max_length=10,
        choices=RoleChoices.choices,
        default=RoleChoices.MEMBER,
        verbose_name='Rôle dans le projet'
    )
    
    # Date d'ajout au projet
    joined_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Date d\'ajout'
    )
    
    class Meta:
        """Métadonnées du modèle."""
        db_table = 'project_members'
        verbose_name = 'Membre du projet'
        verbose_name_plural = 'Membres des projets'
        unique_together = [['project', 'user']]  # Un user ne peut être ajouté qu'une fois par projet
        indexes = [
            models.Index(fields=['project', 'user'], name='projmem_proj_user_idx'),
        ]
    
    def __str__(self):
        """Représentation textuelle."""
        return f"{self.user.get_full_name()} - {self.project.name} ({self.get_role_display()})"
