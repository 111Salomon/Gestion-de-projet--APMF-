from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """Configuration de l'interface admin pour le modèle User."""
    
    # Colonnes affichées dans la liste
    list_display = [
        'username',
        'email',
        'role',
        'first_name',
        'last_name',
        'is_active',
        'created_at'
    ]
    
    # Filtres dans la barre latérale
    list_filter = ['role', 'is_active', 'is_staff', 'created_at']
    
    # Champs de recherche
    search_fields = ['username', 'email', 'first_name', 'last_name']
    
    # Ordre d'affichage
    ordering = ['-created_at']
    
    # Organisation des champs dans le formulaire
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Informations Personnalisées', {
            'fields': ('role', 'avatar', 'phone', 'bio')
        }),
        ('Dates', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',),  # Section repliée par défaut
        }),
    )
    
    # Champs en lecture seule
    readonly_fields = ['created_at', 'updated_at']
    
    # Champs dans le formulaire de création
    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        ('Informations Additionnelles', {
            'fields': ('email', 'role', 'first_name', 'last_name')
        }),
    )
