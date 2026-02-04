"""
Signals pour la synchronisation Google Calendar
"""
import requests
from django.db.models.signals import post_delete
from django.dispatch import receiver
from django.utils import timezone
from .models import Task
from apps.users.models import GoogleCalendarIntegration

@receiver(post_delete, sender=Task)
def delete_google_calendar_event(sender, instance, **kwargs):
    """
    Supprime l'événement Google Calendar quand la tâche est supprimée.
    
    Conditions :
    - La tâche a un google_event_id (donc a été synchronisée)
    - L'utilisateur assigné a une intégration Google Calendar active
    - Le token Google est valide
    """
    # ✨ NE PAS SUPPRIMER si google_event_id est NULL
    if not instance.google_event_id:
        print(f"ℹ️ Tâche {instance.id} supprimée (pas d'événement Google)")
        return
    
    # ✨ NE PAS SUPPRIMER si pas d'utilisateur assigné
    if not instance.assigned_to:
        print(f"⚠️ Tâche {instance.id} supprimée (pas d'utilisateur assigné)")
        return
    
    try:
        # Récupérer l'intégration Google Calendar de l'utilisateur
        integration = GoogleCalendarIntegration.objects.get(
            user=instance.assigned_to,
            is_active=True,
            google_calendar_id__isnull=False
        )
        
        # ✨ Vérifier si token expiré
        if timezone.now() > integration.token_expiry:
            print(f"⚠️ Token Google expiré pour {instance.assigned_to.email}")
            return
        
        # Supprimer l'événement Google
        event_url = f'https://www.googleapis.com/calendar/v3/calendars/{integration.google_calendar_id}/events/{instance.google_event_id}'
        headers = {
            'Authorization': f'Bearer {integration.access_token}',
            'Accept': 'application/json'
        }
        
        print(f"🗑️ Suppression événement Google: {instance.google_event_id}")
        print(f"   → DELETE {event_url}")
        
        response = requests.delete(event_url, headers=headers, timeout=10)
        
        if response.status_code == 204:
            print(f"✅ Événement Google supprimé: {instance.google_event_id}")
        elif response.status_code == 404:
            print(f"ℹ️ Événement Google déjà supprimé ou inexistant: {instance.google_event_id}")
        elif response.status_code == 401:
            print(f"❌ Token Google invalide pour {instance.assigned_to.email}")
        else:
            print(f"⚠️ Erreur suppression Google ({response.status_code}): {response.text[:200]}")
            
    except GoogleCalendarIntegration.DoesNotExist:
        print(f"ℹ️ Pas d'intégration Google pour {instance.assigned_to.email}")
    except requests.exceptions.RequestException as e:
        print(f"❌ Erreur réseau suppression Google: {e}")
    except Exception as e:
        print(f"❌ Erreur inattendue suppression Google: {e}")
        import traceback
        traceback.print_exc()