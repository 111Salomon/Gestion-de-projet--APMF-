from django.apps import AppConfig


class NotificationsConfig(AppConfig):
    """
    Configuration de l'application Notifications.
    
    Cette app gère toutes les notifications en temps réel :
    - Notifications de tâches assignées
    - Notifications de commentaires
    - Notifications de changements de statut
    - Notifications d'ajout à un projet
    """
    
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.notifications'
    verbose_name = 'Notifications'
    
    def ready(self):
        """
        Méthode appelée au démarrage de Django.
        
        Importe les signaux pour qu'ils soient actifs.
        Les signaux vont créer automatiquement les notifications
        quand certaines actions se produisent (assignation, commentaire, etc.)
        """
        import apps.notifications.signals
