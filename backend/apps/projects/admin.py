from django.contrib import admin
from .models import Project, ProjectMember
from apps.tasks.models import Task


class ProjectMemberInline(admin.TabularInline):
    """Affichage inline des membres d'un projet."""
    model = ProjectMember
    extra = 1
    autocomplete_fields = ['user']
    fields = ['user', 'role', 'joined_at']
    readonly_fields = ['joined_at']


class TaskInline(admin.TabularInline):
    """
    Affichage inline des tâches d'un projet.
    Permet de voir et modifier les tâches directement depuis la page du projet.
    """
    model = Task
    extra = 0
    fields = ['title', 'assigned_to', 'status', 'priority', 'due_date']
    autocomplete_fields = ['assigned_to']
    max_num = 10
    can_delete = False


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    """Configuration de l'interface admin pour le modèle Project."""
    
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
    
    list_filter = [
        'status',
        'created_at',
        'start_date',
        'end_date'
    ]
    
    search_fields = [
        'name',
        'description',
        'owner__username',
        'owner__email'
    ]
    
    ordering = ['-created_at']
    
    date_hierarchy = 'created_at'
    
    list_per_page = 25
    
    inlines = [ProjectMemberInline, TaskInline]
    
    autocomplete_fields = ['owner']
    
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
            'classes': ('collapse',),
        }),
    )
    
    readonly_fields = ['created_at', 'updated_at']
    
    @admin.display(description='Progression', ordering='id')
    def get_progress(self, obj):
        """Affiche la progression du projet en %."""
        return f"{obj.progress}%"
    
    @admin.display(description='Nombre de tâches')
    def get_tasks_count(self, obj):
        """Affiche le nombre de tâches du projet."""
        return obj.tasks.count()
    
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
    """Configuration de l'interface admin pour ProjectMember."""
    
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
    
    @admin.display(description='Utilisateur', ordering='user__username')
    def get_user_name(self, obj):
        """Affiche le nom complet de l'utilisateur."""
        return obj.user.get_full_name()
    
    @admin.display(description='Projet', ordering='project__name')
    def get_project_name(self, obj):
        """Affiche le nom du projet."""
        return obj.project.name
