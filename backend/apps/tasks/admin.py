from django.contrib import admin
from .models import Task, Comment, Attachment


class CommentInline(admin.TabularInline):
    """
    Affichage inline des commentaires d'une tâche.
    """
    model = Comment
    extra = 1
    fields = ['author', 'content', 'created_at']
    readonly_fields = ['created_at']
    autocomplete_fields = ['author']


class AttachmentInline(admin.TabularInline):
    """
    Affichage inline des pièces jointes d'une tâche.
    """
    model = Attachment
    extra = 1
    fields = ['file', 'file_name', 'file_size', 'uploaded_by', 'uploaded_at']
    readonly_fields = ['file_name', 'file_size', 'uploaded_at']
    autocomplete_fields = ['uploaded_by']


@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    """
    Configuration de l'interface admin pour le modèle Task.
    """
    
    list_display = [
        'title',
        'project',
        'assigned_to',
        'status',
        'priority',
        'due_date',
        'is_overdue_display',
        'created_at'
    ]
    
    list_filter = [
        'status',
        'priority',
        'due_date',
        'created_at',
        'project'
    ]
    
    search_fields = [
        'title',
        'description',
        'project__name',
        'assigned_to__username'
    ]
    
    ordering = ['order', '-created_at']
    
    date_hierarchy = 'created_at'
    
    list_per_page = 50
    
    inlines = [CommentInline, AttachmentInline]
    
    autocomplete_fields = ['project', 'assigned_to', 'created_by']
    
    fieldsets = (
        ('Informations Générales', {
            'fields': ('title', 'description', 'project')
        }),
        ('Attribution', {
            'fields': ('assigned_to', 'created_by')
        }),
        ('Statut et Priorité', {
            'fields': ('status', 'priority')
        }),
        ('Dates', {
            'fields': ('due_date', 'completed_at')
        }),
        ('Métadonnées', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',),
        }),
    )
    
    readonly_fields = ['created_at', 'updated_at']
    
    # Méthode d'affichage personnalisée
    
    @admin.display(description='En retard ?', boolean=True)
    def is_overdue_display(self, obj):
        """Affiche si la tâche est en retard (avec icône)."""
        return obj.is_overdue
    
    # Actions personnalisées
    
    def mark_as_in_progress(self, request, queryset):
        """Marque les tâches comme 'En cours'."""
        updated = queryset.update(status='in_progress')
        self.message_user(request, f"{updated} tâche(s) marquée(s) comme 'En cours'.")
    mark_as_in_progress.short_description = "Marquer comme 'En cours'"
    
    def mark_as_done(self, request, queryset):
        """Marque les tâches comme 'Terminée'."""
        from django.utils import timezone
        updated = queryset.update(status='done', completed_at=timezone.now())
        self.message_user(request, f"{updated} tâche(s) marquée(s) comme 'Terminée'.")
    mark_as_done.short_description = "Marquer comme 'Terminée'"
    
    actions = [mark_as_in_progress, mark_as_done]

    ## une méthode pour calculer l'ordre automatiquement pour eviter le problème de la création de tâche 2 
    def save_model(self, request, obj, form, change):
        """
        Méthode appelée avant de sauvegarder une tâche.
        Calcule automatiquement l'ordre si c'est une nouvelle tâche.
        """
        if not change:  # Si c'est une nouvelle tâche (pas une modification)
            # Trouve le dernier ordre utilisé dans ce projet
            last_task = Task.objects.filter(project=obj.project).order_by('-order').first()
            if last_task:
                obj.order = last_task.order + 1
            else:
                obj.order = 1
        super().save_model(request, obj, form, change)


@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    """
    Configuration de l'interface admin pour Comment.
    """
    
    list_display = [
        'get_task_title',
        'author',
        'get_content_preview',
        'created_at'
    ]
    
    list_filter = [
        'created_at',
        'author'
    ]
    
    search_fields = [
        'content',
        'task__title',
        'author__username'
    ]
    
    ordering = ['-created_at']
    
    date_hierarchy = 'created_at'
    
    autocomplete_fields = ['task', 'author']
    
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('Commentaire', {
            'fields': ('task', 'author', 'content')
        }),
        ('Métadonnées', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',),
        }),
    )
    
    @admin.display(description='Tâche')
    def get_task_title(self, obj):
        """Affiche le titre de la tâche."""
        return obj.task.title
    
    @admin.display(description='Aperçu')
    def get_content_preview(self, obj):
        """Affiche un aperçu du commentaire."""
        return obj.content[:50] + '...' if len(obj.content) > 50 else obj.content


@admin.register(Attachment)
class AttachmentAdmin(admin.ModelAdmin):
    """
    Configuration de l'interface admin pour Attachment.
    """
    
    list_display = [
        'file_name',
        'get_task_title',
        'uploaded_by',
        'get_file_size_display',
        'uploaded_at'
    ]
    
    list_filter = [
        'uploaded_at',
        'uploaded_by'
    ]
    
    search_fields = [
        'file_name',
        'task__title',
        'uploaded_by__username'
    ]
    
    ordering = ['-uploaded_at']
    
    date_hierarchy = 'uploaded_at'
    
    autocomplete_fields = ['task', 'uploaded_by']
    
    readonly_fields = ['file_name', 'file_size', 'uploaded_at']
    
    fieldsets = (
        ('Pièce Jointe', {
            'fields': ('task', 'file', 'uploaded_by')
        }),
        ('Informations', {
            'fields': ('file_name', 'file_size', 'uploaded_at'),
            'classes': ('collapse',),
        }),
    )
    
    @admin.display(description='Tâche')
    def get_task_title(self, obj):
        """Affiche le titre de la tâche."""
        return obj.task.title
    
    @admin.display(description='Taille')
    def get_file_size_display(self, obj):
        """Affiche la taille du fichier en MB."""
        return f"{obj.file_size_mb} MB"
