"""Signaux pour créer automatiquement les notifications."""

from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from .models import Notification


# ═══════════════════════════════════════════════════════════
# VARIABLES GLOBALES pour stocker les anciennes valeurs
# ═══════════════════════════════════════════════════════════

_task_old_values = {}
_processed_comments = set()  # ✅ NOUVEAU : Évite les doublons


# ═══════════════════════════════════════════════════════════
# PRE_SAVE : Stocke les anciennes valeurs AVANT la sauvegarde
# ═══════════════════════════════════════════════════════════

@receiver(pre_save, sender='tasks.Task')
def store_old_task_values(sender, instance, **kwargs):
    """Stocke les anciennes valeurs de la tâche AVANT sauvegarde."""
    if instance.pk:  # Seulement pour les mises à jour
        try:
            old_task = sender.objects.get(pk=instance.pk)
            _task_old_values[instance.pk] = {
                'assigned_to': old_task.assigned_to,
                'status': old_task.status,
            }
        except sender.DoesNotExist:
            _task_old_values[instance.pk] = {
                'assigned_to': None,
                'status': None,
            }


# ═══════════════════════════════════════════════════════════
# SIGNAL : Tâche Assignée
# ═══════════════════════════════════════════════════════════

@receiver(post_save, sender='tasks.Task')
def notify_task_assigned(sender, instance, created, **kwargs):
    """Notifie quand une tâche est assignée."""
    
    # Ignore si pas d'assigné
    if not instance.assigned_to:
        return
    
    # Récupère les anciennes valeurs
    old_values = _task_old_values.get(instance.pk, {})
    old_assigned = old_values.get('assigned_to')
    
    # Vérifie si c'est une nouvelle assignation
    if old_assigned != instance.assigned_to:
        # Détermine l'acteur (celui qui a assigné)
        actor = getattr(instance, 'created_by', None)
        
        # Ne notifie pas si l'user s'assigne lui-même
        if actor and instance.assigned_to != actor:
            Notification.create_notification(
                recipient=instance.assigned_to,
                actor=None,
                notification_type='task_assigned',
                title='Nouvelle tâche assignée',
                message=f'Vous avez été assigné à la tâche "{instance.title}"',  # ✅ Plus générique
                task_id=instance.id,
                action_url=f'/tasks/{instance.id}'
            )
    
    # Nettoie la variable globale
    _task_old_values.pop(instance.pk, None)


# ═══════════════════════════════════════════════════════════
# SIGNAL : Nouveau Commentaire ✅ CORRIGÉ
# ═══════════════════════════════════════════════════════════

@receiver(post_save, sender='tasks.Comment')
def notify_task_comment(sender, instance, created, **kwargs):
    """Notifie quand un commentaire est ajouté."""
    
    # Seulement pour les nouveaux commentaires
    if not created:
        return
    
    # ✅ NOUVEAU : Évite les doublons (si le signal se déclenche 2x)
    comment_key = f"comment_{instance.pk}"
    if comment_key in _processed_comments:
        return  # Déjà traité
    
    _processed_comments.add(comment_key)
    
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
    
    # ✅ Nettoie après 10 secondes (évite la croissance infinie)
    import threading
    def cleanup():
        import time
        time.sleep(10)
        _processed_comments.discard(comment_key)
    
    threading.Thread(target=cleanup, daemon=True).start()


# ═══════════════════════════════════════════════════════════
# SIGNAL : Changement de Statut
# ═══════════════════════════════════════════════════════════

@receiver(post_save, sender='tasks.Task')
def notify_task_status_changed(sender, instance, created, **kwargs):
    """Notifie quand le statut d'une tâche change."""
    
    # Pas de notification à la création
    if created:
        return
    
    # Récupère les anciennes valeurs
    old_values = _task_old_values.get(instance.pk, {})
    old_status = old_values.get('status')
    
    # Vérifie si le statut a changé
    if old_status and old_status != instance.status:
        status_labels = {
            'todo': 'À faire',
            'in_progress': 'En cours',
            'in_review': 'En révision',
            'done': 'Terminée'
        }
        
        new_status_label = status_labels.get(instance.status, instance.status)
        
        # Notifie le créateur
        if instance.created_by:
            Notification.create_notification(
                recipient=instance.created_by,
                actor=instance.assigned_to or instance.created_by,
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
