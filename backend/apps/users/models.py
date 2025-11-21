from django.contrib.auth.models import AbstractUser
from django.db import models
from django.core.validators import FileExtensionValidator


class User(AbstractUser):
    """
    Modèle utilisateur personnalisé avec gestion des rôles.
    Hérite de AbstractUser pour conserver les fonctionnalités Django de base.
    
    Champs hérités de AbstractUser:
        - username: Nom d'utilisateur unique
        - password: Mot de passe haché
        - first_name: Prénom
        - last_name: Nom de famille
        - email: Adresse email
        - is_staff: Accès à l'interface admin
        - is_active: Compte actif
        - date_joined: Date d'inscription
    
    Champs ajoutés:
        - role: Rôle de l'utilisateur (admin, chef, membre)
        - avatar: Photo de profil
        - phone: Numéro de téléphone
        - bio: Biographie courte
        - created_at: Date de création du compte
        - updated_at: Date de dernière modification
    """
    
    class RoleChoices(models.TextChoices):
        """Choix de rôles disponibles pour les utilisateurs."""
        ADMIN = 'admin', 'Administrateur' # admin : valeur stocké dans la base /  Administrateur : valeur affichée à l'utilisateur
        CHEF = 'chef', 'Chef de projet'
        MEMBRE = 'membre', 'Membre'
    
    # Redéfinition de email pour le rendre unique et obligatoire
    email = models.EmailField(
        unique=True,
        verbose_name='Adresse email',
        help_text='Adresse email unique pour chaque utilisateur'
    )
    
    # Champ rôle
    role = models.CharField(
        max_length=10,
        choices=RoleChoices.choices,
        default=RoleChoices.MEMBRE,
        verbose_name='Rôle',
        help_text='Rôle de l\'utilisateur dans la plateforme'
    )
    
    # Photo de profil
    avatar = models.ImageField(
        upload_to='avatars/%Y/%m/',
        null=True,
        blank=True,
        validators=[FileExtensionValidator(['jpg', 'jpeg', 'png', 'gif'])],
        verbose_name='Photo de profil',
        help_text='Formats acceptés : JPG, PNG, GIF'
    )
    
    # Numéro de téléphone
    phone = models.CharField(
        max_length=20,
        blank=True,
        verbose_name='Téléphone',
        help_text='Numéro de téléphone (optionnel)'
    )
    
    # Biographie
    bio = models.TextField(
        blank=True,
        max_length=500,
        verbose_name='Biographie',
        help_text='Courte description (max 500 caractères)'
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
        db_table = 'users'
        verbose_name = 'Utilisateur'
        verbose_name_plural = 'Utilisateurs'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['email'], name='users_email_idx'),
            models.Index(fields=['role'], name='users_role_idx'),
        ]
    
    def __str__(self):
        """Représentation textuelle de l'utilisateur."""
        return f"{self.get_full_name()} ({self.get_role_display()})"
    
    def get_full_name(self):
        """Retourne le nom complet de l'utilisateur."""
        full_name = f"{self.first_name} {self.last_name}".strip()
        return full_name if full_name else self.username
    
    @property
    def is_admin(self):
        """Vérifie si l'utilisateur est administrateur."""
        return self.role == self.RoleChoices.ADMIN
    
    @property
    def is_chef(self):
        """Vérifie si l'utilisateur est chef de projet."""
        return self.role == self.RoleChoices.CHEF