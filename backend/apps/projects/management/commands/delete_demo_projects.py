from django.core.management.base import BaseCommand

from apps.projects.models import Project


class Command(BaseCommand):
    help = 'Liste et supprime les projets dont le nom commence par "Demo Project"'

    def handle(self, *args, **options):
        qs = Project.objects.filter(name__istartswith='Demo Project')
        count = qs.count()
        if count == 0:
            self.stdout.write('Aucun projet fictif trouvé (nom commençant par "Demo Project").')
            return

        self.stdout.write(f"{count} projet(s) trouvé(s) :")
        for p in qs.order_by('id'):
            self.stdout.write(f" - {p.id}: {p.name}")

        confirm = input('Tapez "yes" pour supprimer ces projets définitivement : ')
        if confirm.strip().lower() == 'yes':
            deleted, _ = qs.delete()
            self.stdout.write(self.style.SUCCESS(f'Suppression terminée. {deleted} enregistrements supprimés.'))
        else:
            self.stdout.write('Annulé par l\'utilisateur. Aucune suppression effectuée.')
