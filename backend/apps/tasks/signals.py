"""
Signals pour la synchronisation Google Calendar et l'archivage automatique des projets.
"""
import logging
import requests
from django.db.models.signals import post_delete, post_save
from django.dispatch import receiver
from django.utils import timezone
from .models import Task
from apps.users.models import GoogleCalendarIntegration

logger = logging.getLogger(__name__)


@receiver(post_delete, sender=Task)
def delete_google_calendar_event(sender, instance, **kwargs):
    """
    Supprime l'événement Google Calendar quand la tâche est supprimée.

    Conditions :
    - La tâche a un google_event_id (donc a été synchronisée)
    - L'utilisateur assigné a une intégration Google Calendar active
    - Le token Google est valide
    """
    if not instance.google_event_id:
        logger.info(f"Task {instance.id} deleted (no Google event)")
        return

    if not instance.assigned_to:
        logger.warning(f"Task {instance.id} deleted (no assigned user)")
        return

    try:
        integration = GoogleCalendarIntegration.objects.get(
            user=instance.assigned_to,
            is_active=True,
            google_calendar_id__isnull=False
        )

        if timezone.now() > integration.token_expiry:
            logger.warning(f"Google token expired for {instance.assigned_to.email}")
            return

        event_url = f'https://www.googleapis.com/calendar/v3/calendars/{integration.google_calendar_id}/events/{instance.google_event_id}'
        headers = {
            'Authorization': f'Bearer {integration.access_token}',
            'Accept': 'application/json'
        }

        logger.debug(f"Deleting Google event: {instance.google_event_id} from {event_url}")

        response = requests.delete(event_url, headers=headers, timeout=10)

        if response.status_code == 204:
            logger.info(f"Google event deleted: {instance.google_event_id}")
        elif response.status_code == 404:
            logger.info(f"Google event already deleted or not found: {instance.google_event_id}")
        elif response.status_code == 401:
            logger.error(f"Invalid Google token for {instance.assigned_to.email}")
        else:
            logger.warning(f"Error deleting Google event ({response.status_code}): {response.text[:200]}")

    except GoogleCalendarIntegration.DoesNotExist:
        logger.debug(f"No Google integration for {instance.assigned_to.email}")
    except requests.exceptions.RequestException as e:
        logger.error(f"Network error deleting Google event: {e}", exc_info=True)
    except Exception as e:
        logger.error(f"Unexpected error deleting Google event: {e}", exc_info=True)


@receiver(post_save, sender=Task)
def auto_archive_project_when_all_tasks_done(sender, instance, created, **kwargs):
    """
    RG-29 : Archive/désarchive automatiquement un projet selon l'état de ses tâches.

    Déclenché quand :
    - Une tâche est créée ou mise à jour (post_save)

    Logique :
    1. Récupère le projet de la tâche
    2. Compte les tâches totales et terminées (done)
    3. Si TOUTES les tâches (>0) sont done → archive le projet
    4. Si une tâche n'est pas done ET projet était archivé → désarchive en COMPLETED
    5. Projets sans tâches → restent en COMPLETED (pas d'archivage automatique)

    Utilise select_for_update() pour éviter les race conditions.
    """
    from django.db import transaction
    from apps.projects.models import Project

    try:
        with transaction.atomic():
            # Lock le projet pour éviter les race conditions en cas d'updates parallèles
            project = Project.objects.select_for_update().get(pk=instance.project_id)

            total_tasks = project.tasks.count()
            done_tasks = project.tasks.filter(status=Task.StatusChoices.DONE).count()

            # Détermine le nouveau statut
            new_status = None

            # Cas 1 : Toutes les tâches sont terminées (ET au moins une tâche existe)
            if total_tasks > 0 and done_tasks == total_tasks:
                if project.status != Project.StatusChoices.ARCHIVED:
                    new_status = Project.StatusChoices.ARCHIVED
                    logger.info(f"Project {project.id} auto-archiving - all {total_tasks} tasks done")

            # Cas 2 : Une tâche n'est pas terminée dans un projet archivé
            elif project.status == Project.StatusChoices.ARCHIVED:
                new_status = Project.StatusChoices.COMPLETED
                logger.info(f"Project {project.id} auto-unarchiving - {total_tasks - done_tasks} task(s) not done")

            # Cas 3 : Projet sans tâches → ne rien faire (reste en statut actuel)
            # Cas 4 : Projet complété avec tâches partiellement done → ne rien faire

            # Appliquer le changement de statut si nécessaire
            if new_status and project.status != new_status:
                project.status = new_status
                project.save(update_fields=['status', 'updated_at'])
                logger.info(f"Project {project.id} status changed to {new_status}")

    except Exception as e:
        logger.error(f"Error in auto_archive_project signal: {e}", exc_info=True)