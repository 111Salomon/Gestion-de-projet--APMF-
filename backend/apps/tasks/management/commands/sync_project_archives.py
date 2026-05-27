from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = 'Synchronise les statuts des projets selon l\'état des tâches (RG-29) : archive/désarchive.'

    def handle(self, *args, **options):
        from apps.projects.models import Project
        from apps.tasks.models import Task

        total_checked = 0
        archived_count = 0
        unarchived_count = 0

        qs = Project.objects.all()
        for project in qs:
            total_checked += 1
            total_tasks = project.tasks.count()
            done_tasks = project.tasks.filter(status=Task.StatusChoices.DONE).count()

            # Cas : toutes les tâches sont terminées -> archiver
            if total_tasks > 0 and done_tasks == total_tasks:
                if project.status != Project.StatusChoices.ARCHIVED:
                    project.status = Project.StatusChoices.ARCHIVED
                    project.save(update_fields=['status', 'updated_at'])
                    archived_count += 1
                    self.stdout.write(self.style.SUCCESS(f"Archivé: {project.id} - {project.name}"))
            else:
                # Si projet était archivé mais il n'est plus complet -> remettre en completed
                if project.status == Project.StatusChoices.ARCHIVED:
                    project.status = Project.StatusChoices.COMPLETED
                    project.save(update_fields=['status', 'updated_at'])
                    unarchived_count += 1
                    self.stdout.write(self.style.WARNING(f"Désarchivé: {project.id} - {project.name}"))

        self.stdout.write(self.style.NOTICE(f"Vérifiés: {total_checked}, archivés: {archived_count}, désarchivés: {unarchived_count}"))