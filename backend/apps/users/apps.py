from django.apps import AppConfig


class UsersConfig(AppConfig):
    # configuration de l'app users
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.users" #chemin complet de l'app
    verbose_name = 'Gestion des Utilisateurs' # nom qui s'affiche dans l'admin
