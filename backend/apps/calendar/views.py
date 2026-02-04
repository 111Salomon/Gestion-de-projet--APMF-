from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q
from datetime import datetime, timedelta
from apps.tasks.models import Task
from apps.projects.models import ProjectMember
from .serializers import CalendarTaskSerializer

from apps.tasks.permissions import CanModifyTask

# import nécessaire pour la synchronisation Google Calendar
import requests
from urllib.parse import urlencode
from django.conf import settings
from django.shortcuts import redirect
from django.http import JsonResponse
from django.contrib.auth import get_user_model
from rest_framework.views import APIView
from apps.users.models import GoogleCalendarIntegration
from django.utils import timezone  # ✨ AJOUTER CET IMPORT

class CalendarViewSet(viewsets.ViewSet):
    """ViewSet pour la vue calendrier avec permissions granulaires"""
    
    permission_classes = [IsAuthenticated]
    
    def _get_user_tasks(self, user, start_date=None, end_date=None):
        """Récupère les tâches selon le rôle (logique Asana)"""
        
        # Base queryset
        queryset = Task.objects.select_related(
            'project', 'assigned_to', 'created_by'
        ).filter(due_date__isnull=False)  # Seulement tâches avec deadline
        
        # Filtrage par dates
        if start_date:
            queryset = queryset.filter(due_date__gte=start_date)
        if end_date:
            queryset = queryset.filter(due_date__lte=end_date)
        
        # Permissions selon rôle
        if user.role == 'admin':
            # Admin voit TOUT
            return queryset
        
        elif user.role == 'chef':
            # Chef voit TOUT
            return queryset
        
        else:
            # Membre voit :
            # 1. Tâches qui lui sont assignées
            # 2. Tâches des projets dont il est membre
            return queryset.filter(
                Q(assigned_to=user) | 
                Q(project__members=user) |
                Q(project__owner=user)
            ).distinct()
    
    @action(detail=False, methods=['get'], url_path='tasks')
    def calendar_tasks(self, request):
        """
        Endpoint principal du calendrier avec filtres avancés
        GET /api/calendar/tasks/?start=2025-12-01&end=2025-12-31&projects=14,23&status=todo,in_progress
        
        Query params :
        - start : Date de début (YYYY-MM-DD)
        - end : Date de fin (YYYY-MM-DD)
        - projects : IDs des projets séparés par virgule (ex: 14,23,45)
        - status : Statuts séparés par virgule (ex: todo,in_progress,done)
        - priority : Priorités séparées par virgule (ex: urgent,high)
        - assigned_to : ID utilisateur (optionnel, admin/chef only)
        """
        user = request.user
        
        # Récupération des dates
        start_date = request.query_params.get('start')
        end_date = request.query_params.get('end')
        
        # Validation des dates
        try:
            if start_date:
                start_date = datetime.strptime(start_date, '%Y-%m-%d').date()
            if end_date:
                end_date = datetime.strptime(end_date, '%Y-%m-%d').date()
        except ValueError:
            return Response(
                {'error': 'Format de date invalide. Utilisez YYYY-MM-DD'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Si pas de dates, par défaut = mois en cours
        if not start_date or not end_date:
            today = timezone.now().date()
            start_date = today.replace(day=1)
            if today.month == 12:
                end_date = today.replace(year=today.year + 1, month=1, day=1) - timedelta(days=1)
            else:
                end_date = today.replace(month=today.month + 1, day=1) - timedelta(days=1)
        
        # Récupération des tâches
        tasks = self._get_user_tasks(user, start_date, end_date)
        
        # 🆕 FILTRES AVANCÉS
        
        # Filtre par projets (multi-select)
        projects_param = request.query_params.get('projects')
        if projects_param:
            try:
                project_ids = [int(pid) for pid in projects_param.split(',') if pid]
                tasks = tasks.filter(project_id__in=project_ids)
            except ValueError:
                return Response(
                    {'error': 'IDs de projet invalides'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # Filtre par statuts (multi-select)
        statuses_param = request.query_params.get('status')
        if statuses_param:
            statuses = [s.strip() for s in statuses_param.split(',') if s.strip()]
            valid_statuses = ['todo', 'in_progress', 'in_review', 'done']
            
            # Validation
            invalid = [s for s in statuses if s not in valid_statuses]
            if invalid:
                return Response(
                    {'error': f'Statuts invalides: {", ".join(invalid)}'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            tasks = tasks.filter(status__in=statuses)
        
        # Filtre par priorités (multi-select)
        priorities_param = request.query_params.get('priority')
        if priorities_param:
            priorities = [p.strip() for p in priorities_param.split(',') if p.strip()]
            valid_priorities = ['urgent', 'high', 'medium', 'low']
            
            # Validation
            invalid = [p for p in priorities if p not in valid_priorities]
            if invalid:
                return Response(
                    {'error': f'Priorités invalides: {", ".join(invalid)}'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            tasks = tasks.filter(priority__in=priorities)
        
        # Filtre par utilisateur assigné (admin/chef seulement)
        assigned_to_param = request.query_params.get('assigned_to')
        if assigned_to_param:
            if user.role in ['admin', 'chef']:
                try:
                    assigned_to_id = int(assigned_to_param)
                    tasks = tasks.filter(assigned_to_id=assigned_to_id)
                except ValueError:
                    return Response(
                        {'error': 'ID utilisateur invalide'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            else:
                return Response(
                    {'error': 'Vous ne pouvez pas filtrer par utilisateur'},
                    status=status.HTTP_403_FORBIDDEN
                )
        
        # Tri par date puis priorité
        tasks = tasks.order_by('due_date', 'priority')
        
        # Sérialisation
        serializer = CalendarTaskSerializer(
            tasks, 
            many=True, 
            context={'request': request}
        )
        
        return Response({
            'count': tasks.count(),
            'start_date': start_date.isoformat(),
            'end_date': end_date.isoformat(),
            'filters_applied': {
                'projects': projects_param,
                'status': statuses_param,
                'priority': priorities_param,
                'assigned_to': assigned_to_param,
            },
            'tasks': serializer.data
        })

    
    @action(detail=False, methods=['get'], url_path='summary')
    def calendar_summary(self, request):
        """
        Résumé rapide pour le header
        GET /api/calendar/summary/
        
        Retourne :
        - Tâches today
        - Tâches cette semaine
        - Tâches en retard
        """
        user = request.user
        today = timezone.now().date()
        week_end = today + timedelta(days=7)
        
        all_tasks = self._get_user_tasks(user)
        
        # Compteurs
        today_tasks = all_tasks.filter(due_date=today).count()
        week_tasks = all_tasks.filter(
            due_date__gte=today,
            due_date__lte=week_end
        ).count()
        overdue_tasks = all_tasks.filter(
            due_date__lt=today,
            status__in=['todo', 'in_progress', 'in_review']
        ).count()
        
        return Response({
            'today': today_tasks,
            'this_week': week_tasks,
            'overdue': overdue_tasks,
            'total_with_deadline': all_tasks.count(),
        })
    
    @action(detail=False, methods=['get'], url_path='projects')
    def available_projects(self, request):
        """
        Liste des projets accessibles pour les filtres
        GET /api/calendar/projects/
        """
        user = request.user
        
        from apps.projects.models import Project
        
        if user.role in ['admin', 'chef']:
            projects = Project.objects.all()
        else:
            projects = Project.objects.filter(
                Q(owner=user) | Q(members=user)
            ).distinct()
        
        data = [
            {
                'id': p.id,
                'name': p.name,
                'color': self._get_project_color(p)  # Pour différencier visuellement
            }
            for p in projects
        ]
        
        return Response(data)
    
    def _get_project_color(self, project):
        """Génère une couleur unique par projet (hash simple)"""
        colors = [
            '#ef4444', '#f97316', '#f59e0b', '#eab308',
            '#84cc16', '#22c55e', '#10b981', '#14b8a6',
            '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1',
            '#8b5cf6', '#a855f7', '#d946ef', '#ec4899'
        ]
        return colors[project.id % len(colors)]

    @action(detail=True, methods=['patch'], url_path='change-date')
    def change_task_date(self, request, pk=None):
        """
        Endpoint pour changer la date d'échéance (Drag & Drop).
        PATCH /api/calendar/{task_id}/change-date/
        
        Body : { "due_date": "2025-12-15" }
        
        🔒 Permissions :
        - Admin/Chef : Peuvent tout changer
        - Manager/Owner : Peuvent changer les tâches de leur projet
        - Membre : Peuvent changer leurs propres tâches
        """
        try:
            task = Task.objects.get(pk=pk)
        except Task.DoesNotExist:
            return Response(
                {'error': 'Tâche introuvable'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        user = request.user
        
        # Vérification des permissions
        # Admin/Chef → Peut tout
        if user.role in ['admin', 'chef']:
            can_modify = True
        # Propriétaire du projet
        elif task.project.owner == user:
            can_modify = True
        # Manager du projet
        elif hasattr(task.project, 'members') and task.project.members.filter(
            id=user.id,
            projectmember__role__in=['owner', 'manager']
        ).exists():
            can_modify = True
        # Assigné à la tâche
        elif task.assigned_to == user:
            can_modify = True
        else:
            can_modify = False
        
        if not can_modify:
            return Response(
                {
                    'error': 'Permission refusée',
                    'message': 'Vous ne pouvez pas modifier cette tâche'
                },
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Récupération de la nouvelle date
        new_date_str = request.data.get('due_date')
        
        if not new_date_str:
            return Response(
                {'error': 'Le champ due_date est requis'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validation du format de date
        try:
            new_date = datetime.strptime(new_date_str, '%Y-%m-%d').date()
        except ValueError:
            return Response(
                {'error': 'Format de date invalide. Utilisez YYYY-MM-DD'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Sauvegarde de l'ancienne date (pour log)
        old_date = task.due_date
        
        # Mise à jour
        task.due_date = new_date
        task.save()
        
        # Log de l'action (optionnel)
        from django.utils import timezone
        print(f"✅ {user.username} a déplacé '{task.title}' de {old_date} vers {new_date}")
        
        # Retourne la tâche mise à jour
        from .serializers import CalendarTaskSerializer
        serializer = CalendarTaskSerializer(task, context={'request': request})
        
        return Response({
            'success': True,
            'message': 'Date d\'échéance mise à jour',
            'old_date': old_date.isoformat() if old_date else None,
            'new_date': new_date.isoformat(),
            'task': serializer.data
        }, status=status.HTTP_200_OK)


# ═══════════════════════════════════════════════════════════
# GOOGLE CALENDAR INTEGRATION VIEWS
# ═══════════════════════════════════════════════════════════

class GoogleCalendarAuthView(APIView):
    """
    Vue pour obtenir l'URL d'authentification Google Calendar
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Retourne l'URL d'authentification Google Calendar"""
        # ✨ MODIFICATION : Utiliser l'URL du backend pour le callback
        redirect_uri = f"{settings.BACKEND_URL}/api/calendar/google/callback/"
        
        params = {
            'client_id': settings.GOOGLE_CLIENT_ID,
            'redirect_uri': redirect_uri,
            'scope': ' '.join(settings.GOOGLE_CALENDAR_SCOPES),
            'response_type': 'code',
            'access_type': 'offline',
            'prompt': 'consent',
            'state': str(request.user.id)
        }
        
        auth_url = f"https://accounts.google.com/o/oauth2/auth?{urlencode(params)}"
        return JsonResponse({'auth_url': auth_url})

class GoogleCalendarCallbackView(APIView):
    """
    Vue pour gérer le callback OAuth2 Google Calendar
    """
    permission_classes = []  # ✨ MODIFICATION : Pas d'authentification requise
    
    def get(self, request):
        """Traite le code d'autorisation Google et sauvegarde les tokens"""
        code = request.GET.get('code')
        state = request.GET.get('state')  # user_id
        
        if not code or not state:
            return JsonResponse({'error': 'Missing code or state'}, status=400)
        
        try:
            user_id = int(state)
            user = get_user_model().objects.get(id=user_id)
        except (ValueError, get_user_model().DoesNotExist):
            return JsonResponse({'error': 'Invalid user'}, status=400)
        
        # Échanger le code contre les tokens
        token_url = 'https://oauth2.googleapis.com/token'
        redirect_uri = f"{settings.BACKEND_URL}/api/calendar/google/callback/"
        
        token_data = {
            'client_id': settings.GOOGLE_CLIENT_ID,
            'client_secret': settings.GOOGLE_CLIENT_SECRET,
            'code': code,
            'grant_type': 'authorization_code',
            'redirect_uri': redirect_uri
        }
        
        token_response = requests.post(token_url, data=token_data)
        if token_response.status_code != 200:
            return JsonResponse({'error': 'Failed to get tokens'}, status=400)
        
        token_json = token_response.json()
        access_token = token_json['access_token']
        refresh_token = token_json.get('refresh_token')
        expires_in = token_json['expires_in']
        
        # Sauvegarder l'intégration
        expiry = timezone.now() + timedelta(seconds=expires_in)
        
        integration, created = GoogleCalendarIntegration.objects.update_or_create(
            user=user,
            defaults={
                'access_token': access_token,
                'refresh_token': refresh_token,
                'token_expiry': expiry,
                'is_active': True
            }
        )

        # ✨ AJOUTER CES LOGS
        print(f"✅ Google Calendar intégré pour utilisateur ID: {user.id}")
        print(f"   Access token: {access_token[:20]}...")
        print(f"   Token expiry: {expiry}")
        print(f"   Créé: {created}")
        
        # ✨ MODIFICATION : Rediriger vers le frontend avec un message de succès
        frontend_redirect = f"{settings.FRONTEND_URL}/settings?google_connected=true&success=1"
        return redirect(frontend_redirect)


class GoogleCalendarListView(APIView):
    """
    Vue pour lister les calendriers Google disponibles de l'utilisateur
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Retourne la liste des calendriers Google accessibles"""
        print(f"🔍 Vérification Google Calendar pour utilisateur: {request.user.id}")
        try:
            integration = GoogleCalendarIntegration.objects.get(
                user=request.user, 
                is_active=True
            )

            # print(f"✅ Intégration trouvée: {integration}")
            print(f"   Token expiry: {integration.token_expiry}")
            print(f"   Est expiré: {timezone.now() > integration.token_expiry}")
            
            if timezone.now() > integration.token_expiry:
                # Token expiré, besoin de refresh
                return JsonResponse({'error': 'token_expired'}, status=401)
            
            # Récupérer les calendriers
            calendars_url = 'https://www.googleapis.com/calendar/v3/users/me/calendarList'
            headers = {'Authorization': f'Bearer {integration.access_token}'}
            
            response = requests.get(calendars_url, headers=headers)
            if response.status_code != 200:
                return JsonResponse({'error': 'Failed to fetch calendars'}, status=400)
            
            calendars = response.json().get('items', [])
            calendar_list = []
            
            for cal in calendars:
                if cal.get('accessRole') in ['owner', 'writer']:
                    calendar_list.append({
                        'id': cal['id'],
                        'name': cal['summary'],
                        'primary': cal.get('primary', False)
                    })
            
            return JsonResponse({'calendars': calendar_list})
            
        except GoogleCalendarIntegration.DoesNotExist:
            return JsonResponse({'error': 'Not connected to Google Calendar'}, status=404)


class GoogleCalendarSyncView(APIView):
    """
    Vue pour synchroniser les tâches avec Google Calendar
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        """Synchronise les tâches de l'utilisateur avec Google Calendar"""
        print(f"\n{'='*60}")
        print(f"🔄 GoogleCalendarSyncView appelé pour utilisateur: {request.user.id}")
        print(f"   Email: {request.user.email}")
        
        try:
            integration = GoogleCalendarIntegration.objects.get(
                user=request.user,
                is_active=True,
                google_calendar_id__isnull=False
            )
            
            print(f"✅ Intégration trouvée:")
            print(f"   Calendar ID: {integration.google_calendar_id}")
            print(f"   Calendar Name: {integration.google_calendar_name}")
            print(f"   Token expiry: {integration.token_expiry}")
            print(f"   Est expiré: {timezone.now() > integration.token_expiry}")
            
            if timezone.now() > integration.token_expiry:
                print(f"❌ Token expiré")
                return JsonResponse({'error': 'token_expired'}, status=401)
            
            # Récupérer les tâches de l'utilisateur avec deadline
            from apps.tasks.models import Task
            tasks = Task.objects.filter(
                assigned_to=request.user,
                due_date__isnull=False
            ).select_related('project')
            
            print(f"📊 Tâches trouvées: {tasks.count()}")
            for task in tasks:
                print(f"   → [{task.project.name}] {task.title} - Due: {task.due_date}")
            
            # Filtrer les tâches avec deadline dans le futur
            from datetime import date
            today = date.today()
            tasks = tasks.filter(due_date__gte=today)
            print(f"📅 Tâches avec deadline future: {tasks.count()}")
            
            if tasks.count() == 0:
                print(f"⚠️ Aucune tâche à synchroniser (deadline dans le passé ou non assignée)")
                return JsonResponse({
                    'success': True,
                    'synced_count': 0,
                    'message': 'Aucune tâche avec deadline future à synchroniser'
                })
            
            headers = {'Authorization': f'Bearer {integration.access_token}'}
            calendar_id = integration.google_calendar_id
            
            synced_count = 0
            failed_count = 0
            
            for task in tasks:
                print(f"\n📤 Synchronisation tâche: {task.title}")
                
                event_data = {
                    'summary': f"[{task.project.name}] {task.title}",
                    'description': task.description or '',
                    'start': {
                        'date': task.due_date.isoformat()
                    },
                    'end': {
                        'date': task.due_date.isoformat()
                    },
                    'colorId': self._get_color_for_priority(task.priority)
                }
                
                print(f"   Event data: {event_data}")
                
                # Créer ou mettre à jour l'événement
                event_url = f'https://www.googleapis.com/calendar/v3/calendars/{calendar_id}/events'
                print(f"   → POST {event_url}")
                
                response = requests.post(event_url, json=event_data, headers=headers)
                print(f"   ← Status: {response.status_code}")
                
    
                if response.status_code == 200:
                    # ✨ NOUVEAU : Stocker l'ID de l'événement Google
                    event_id = response.json().get('id')
                    if event_id:
                        task.google_event_id = event_id
                        task.save()
                        print(f"   ✅ Succès - Event ID: {event_id} sauvegardé")
                        synced_count += 1
                    else:
                        print(f"   ⚠️ Succès mais pas d'ID retourné")
                else:
                    failed_count += 1
                    print(f"   ❌ Échec - {response.status_code}: {response.text[:200]}")
            
            print(f"\n✅ Synchronisation terminée: {synced_count} réussies, {failed_count} échouées")
            print(f"{'='*60}\n")
            
            return JsonResponse({
                'success': True,
                'synced_count': synced_count,
                'failed_count': failed_count,
                'message': f'{synced_count} tâches synchronisées avec Google Calendar'
            })
            
        except GoogleCalendarIntegration.DoesNotExist:
            print(f"❌ Pas d'intégration Google Calendar active")
            return JsonResponse({'error': 'Not connected to Google Calendar'}, status=404)
        except Exception as e:
            print(f"❌ Erreur inattendue: {e}")
            import traceback
            traceback.print_exc()
            return JsonResponse({'error': str(e)}, status=500)    
    def _get_color_for_priority(self, priority):
        """Mappe la priorité à une couleur Google Calendar"""
        colors = {
            'urgent': '11',  # Rouge
            'high': '9',     # Bleu
            'medium': '10',  # Vert  
            'low': '6'       # Jaune
        }
        return colors.get(priority, '8')  # Gris par défaut

class GoogleCalendarSelectView(APIView):
    """
    Vue pour sélectionner un calendrier Google spécifique
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        """Sélectionne un calendrier Google pour la synchronisation"""
        calendar_id = request.data.get('calendar_id')
        
        if not calendar_id:
            return JsonResponse({'error': 'calendar_id is required'}, status=400)
        
        try:
            # Récupérer l'intégration Google Calendar de l'utilisateur
            integration = GoogleCalendarIntegration.objects.get(
                user=request.user,
                is_active=True
            )
            
            # Récupérer le nom du calendrier depuis Google
            calendars_url = f'https://www.googleapis.com/calendar/v3/calendars/{calendar_id}'
            headers = {'Authorization': f'Bearer {integration.access_token}'}
            
            response = requests.get(calendars_url, headers=headers)
            if response.status_code != 200:
                return JsonResponse({'error': 'Failed to fetch calendar details'}, status=400)
            
            calendar_data = response.json()
            calendar_name = calendar_data.get('summary', 'Calendrier Google')
            
            # Mettre à jour l'intégration avec le calendrier sélectionné
            integration.google_calendar_id = calendar_id
            integration.google_calendar_name = calendar_name
            integration.save()
            
            return JsonResponse({
                'success': True,
                'message': f'Calendrier "{calendar_name}" sélectionné avec succès',
                'calendar_id': calendar_id,
                'calendar_name': calendar_name
            })
            
        except GoogleCalendarIntegration.DoesNotExist:
            return JsonResponse({'error': 'Not connected to Google Calendar'}, status=404)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)

class GoogleCalendarDisconnectView(APIView):
    """
    Vue pour déconnecter Google Calendar
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        """Supprime l'intégration Google Calendar de l'utilisateur"""
        try:
            # Trouver et supprimer l'intégration
            integration = GoogleCalendarIntegration.objects.get(
                user=request.user
            )
            integration.delete()
            
            return JsonResponse({
                'success': True,
                'message': 'Google Calendar déconnecté avec succès'
            })
            
        except GoogleCalendarIntegration.DoesNotExist:
            return JsonResponse({
                'success': True,
                'message': 'Aucune intégration Google Calendar à supprimer'
            })