from django.contrib import admin
from .models import Project, ProjectMember


class ProjectMemberInline(admin.TabularInline):
    """
    Affichage inline des membres d'un projet.
    Permet d'ajouter/modifier les membres directement depuis la page du projet.
    
    TabularInline affiche les membres sous forme de tableau compact.
    """
    model = ProjectMember
    extra = 1  # Nombre de formulaires vides à afficher
    autocomplete_fields = ['user']  # Autocomplétion pour choisir un user
    fields = ['user', 'role', 'joined_at']
    readonly_fields = ['joined_at']  # Date d'ajout en lecture seule

    


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    """
    Configuration de l'interface admin pour le modèle Project.
    
    Fonctionnalités:
        - Liste des projets avec filtres et recherche
        - Affichage des membres inline
        - Calcul automatique de la progression
        - Organisation par sections dans le formulaire
    """
    
    # Affichage dans la liste des projets
    list_display = [
        'name',
        'owner',
        'status',
        'start_date',
        'end_date',
        'get_progress',
        'get_tasks_count',
        'created_at'
    ]
    
    # Filtres dans la barre latérale droite
    list_filter = [
        'status',
        'created_at',
        'start_date',
        'end_date'
    ]
    
    # Champs de recherche (barre en haut)
    search_fields = [
        'name',
        'description',
        'owner__username',
        'owner__email'
    ]
    
    # Ordre d'affichage par défaut
    ordering = ['-created_at']
    
    # Date hierarchy (navigation par date en haut)
    date_hierarchy = 'created_at'
    
    # Nombre de projets par page
    list_per_page = 25
    
    # Affichage inline des membres
    inlines = [ProjectMemberInline]
    
    # Autocomplétion pour le champ owner
    autocomplete_fields = ['owner']
    
    # Organisation du formulaire en sections
    fieldsets = (
        ('Informations Générales', {
            'fields': ('name', 'description', 'owner')
        }),
        ('Statut et Dates', {
            'fields': ('status', 'start_date', 'end_date'),
            'description': 'Définissez le statut et les dates du projet'
        }),
        ('Métadonnées', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',),  # Section repliée par défaut
        }),
    )
    
    # Champs en lecture seule
    readonly_fields = ['created_at', 'updated_at']
    
    # Méthodes personnalisées pour l'affichage
    
    @admin.display(description='Progression', ordering='id')
    def get_progress(self, obj):
        """Affiche la progression du projet en %."""
        return f"{obj.progress}%"
    
    @admin.display(description='Nombre de tâches')
    def get_tasks_count(self, obj):
        """Affiche le nombre de tâches du projet."""
        return obj.tasks.count()
    
    # Actions personnalisées (actions de masse)
    
    def make_active(self, request, queryset):
        """Action pour rendre les projets sélectionnés actifs."""
        updated = queryset.update(status='active')
        self.message_user(request, f"{updated} projet(s) marqué(s) comme actif(s).")
    make_active.short_description = "Marquer comme actif"
    
    def make_completed(self, request, queryset):
        """Action pour marquer les projets sélectionnés comme terminés."""
        updated = queryset.update(status='completed')
        self.message_user(request, f"{updated} projet(s) marqué(s) comme terminé(s).")
    make_completed.short_description = "Marquer comme terminé"
    
    actions = [make_active, make_completed]


@admin.register(ProjectMember)
class ProjectMemberAdmin(admin.ModelAdmin):
    """
    Configuration de l'interface admin pour ProjectMember.
    
    Permet de gérer les membres des projets individuellement.
    """
    
    list_display = [
        'get_user_name',
        'get_project_name',
        'role',
        'joined_at'
    ]
    
    list_filter = [
        'role',
        'joined_at'
    ]
    
    search_fields = [
        'user__username',
        'user__email',
        'project__name'
    ]
    
    autocomplete_fields = ['project', 'user']
    
    ordering = ['-joined_at']
    
    date_hierarchy = 'joined_at'
    
    # Méthodes d'affichage personnalisées
    
    @admin.display(description='Utilisateur', ordering='user__username')
    def get_user_name(self, obj):
        """Affiche le nom complet de l'utilisateur."""
        return obj.user.get_full_name()
    
    @admin.display(description='Projet', ordering='project__name')
    def get_project_name(self, obj):
        """Affiche le nom du projet."""
        return obj.project.name
