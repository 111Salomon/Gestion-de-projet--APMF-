from django.core.management.base import BaseCommand

from apps.users.models import User


class Command(BaseCommand):
    help = 'Liste et supprime les utilisateurs dont l\'email commence par "demo+" ou dont le username commence par "demo"'

    def handle(self, *args, **options):
        qs = User.objects.filter(
            email__startswith='demo+'
        ) | User.objects.filter(username__istartswith='demo')

        # also include plain 'demo' in email
        qs = qs | User.objects.filter(email__icontains='demo@')

        qs = qs.distinct()
        count = qs.count()
        if count == 0:
            self.stdout.write('Aucun utilisateur fictif trouvé.')
            return

        self.stdout.write(f"{count} utilisateur(s) trouvé(s) :")
        for u in qs.order_by('id'):
            self.stdout.write(f" - {u.id}: {u.get_full_name() or u.username} <{u.email}>")

        confirm = input('Tapez "yes" pour supprimer ces utilisateurs définitivement : ')
        if confirm.strip().lower() == 'yes':
            deleted, _ = qs.delete()
            self.stdout.write(self.style.SUCCESS(f'Suppression terminée. {deleted} enregistrements supprimés.'))
        else:
            self.stdout.write('Annulé par l\'utilisateur. Aucune suppression effectuée.')
