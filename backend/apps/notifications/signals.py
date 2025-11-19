"""Signaux pour créer automatiquement les notifications."""

from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Notification


# ═══════════════════════════════════════════════════════════
# SIGNAL : Tâche Assignée
# ═══════════════════════════════════════════════════════════

@receiver(post_save, sender='tasks.Task')
def notify_task_assigned(sender, instance, created, **kwargs):
    """Notifie quand une tâche est assignée."""
    
    # Ignore si c'est juste une création sans assignation
    if not instance.assigned_to:
        return
    
    # Récupère l'ancienne version pour détecter les changements
    if not created and instance.pk:
        try:
            old_task = sender.objects.get(pk=instance.pk)
            old_assigned = old_task.assigned_to
        except sender.DoesNotExist:
            old_assigned = None
    else:
        old_assigned = None
    
    # Vérifie si c'est une nouvelle assignation
    if old_assigned != instance.assigned_to:
        # Ne notifie pas si l'user s'assigne lui-même
        if instance.created_by and instance.assigned_to != instance.created_by:
            Notification.create_notification(
                recipient=instance.assigned_to,
                actor=instance.created_by,
                notification_type='task_assigned',
                title='Nouvelle tâche assignée',
                message=f'{instance.created_by.get_full_name() or instance.created_by.username} vous a assigné la tâche "{instance.title}"',
                task_id=instance.id,
                action_url=f'/tasks/{instance.id}'
            )


# ═══════════════════════════════════════════════════════════
# SIGNAL : Nouveau Commentaire
# ═══════════════════════════════════════════════════════════

@receiver(post_save, sender='tasks.Comment')
def notify_task_comment(sender, instance, created, **kwargs):
    """Notifie quand un commentaire est ajouté."""
    
    # Seulement pour les nouveaux commentaires
    if not created:
        return
    
    task = instance.task
    author = instance.author
    recipients = set()  # Évite les doublons
    
    # Notifie la personne assignée
    if task.assigned_to and task.assigned_to != author:
        recipients.add(task.assigned_to)
    
    # Notifie le créateur de la tâche
    if task.created_by and task.created_by != author:
        recipients.add(task.created_by)
    
    # Crée les notifications
    for recipient in recipients:
        Notification.create_notification(
            recipient=recipient,
            actor=author,
            notification_type='task_comment',
            title='Nouveau commentaire',
            message=f'{author.get_full_name() or author.username} a commenté sur "{task.title}"',
            task_id=task.id,
            action_url=f'/tasks/{task.id}'
        )


# ═══════════════════════════════════════════════════════════
# SIGNAL : Changement de Statut
# ═══════════════════════════════════════════════════════════

@receiver(post_save, sender='tasks.Task')
def notify_task_status_changed(sender, instance, created, **kwargs):
    """Notifie quand le statut d'une tâche change."""
    
    # Pas de notification à la création
    if created:
        return
    
    # Récupère l'ancien statut
    try:
        old_task = sender.objects.get(pk=instance.pk)
        old_status = old_task.status
    except sender.DoesNotExist:
        return
    
    # Vérifie si le statut a changé
    if old_status != instance.status:
        status_labels = {
            'todo': 'À faire',
            'in_progress': 'En cours',
            'in_review': 'En révision',
            'done': 'Terminée'
        }
        
        new_status_label = status_labels.get(instance.status, instance.status)
        
        # Notifie le créateur (si ce n'est pas lui qui modifie)
        if instance.created_by and instance.created_by != instance.assigned_to:
            Notification.create_notification(
                recipient=instance.created_by,
                actor=instance.assigned_to,
                notification_type='task_status',
                title='Statut modifié',
                message=f'La tâche "{instance.title}" est maintenant : {new_status_label}',
                task_id=instance.id,
                action_url=f'/tasks/{instance.id}'
            )


# ═══════════════════════════════════════════════════════════
# SIGNAL : Ajout au Projet
# ═══════════════════════════════════════════════════════════

@receiver(post_save, sender='projects.ProjectMember')
def notify_project_member_added(sender, instance, created, **kwargs):
    """Notifie quand un user est ajouté à un projet."""
    
    # Seulement pour les nouveaux membres
    if not created:
        return
    
    project = instance.project
    new_member = instance.user
    
    Notification.create_notification(
        recipient=new_member,
        actor=project.owner,
        notification_type='project_added',
        title='Ajouté à un projet',
        message=f'Vous avez été ajouté au projet "{project.name}"',
        project_id=project.id,
        action_url=f'/projects/{project.id}'
    )
