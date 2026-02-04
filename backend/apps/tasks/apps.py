from django.apps import AppConfig


class TasksConfig(AppConfig):
    #Configuration de l'application Tasks.
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.tasks'
    verbose_name = 'Gestion des Tâches'
    
    def ready(self):
        # Importer les signals pour les activer
        import apps.tasks.signals
