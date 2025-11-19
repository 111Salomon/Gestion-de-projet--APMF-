"""Admin pour les notifications."""

from django.contrib import admin
from .models import Notification


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    """Interface admin pour gérer les notifications."""
    
    # Colonnes affichées dans la liste
    list_display = [
        'id',
        'recipient',
        'notification_type',
        'title',
        'is_read',
        'created_at'
    ]
    
    # Filtres dans la barre latérale
    list_filter = [
        'notification_type',
        'is_read',
        'created_at'
    ]
    
    # Champs de recherche
    search_fields = [
        'recipient__username',
        'recipient__email',
        'title',
        'message'
    ]
    
    # Champs en lecture seule
    readonly_fields = ['created_at', 'read_at']
    
    # Désactive l'ajout manuel (créées par signaux)
    def has_add_permission(self, request):
        return False
