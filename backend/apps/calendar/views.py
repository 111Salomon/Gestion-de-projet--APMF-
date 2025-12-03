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
        Endpoint principal du calendrier
        GET /api/calendar/tasks/?start=2025-12-01&end=2025-12-31
        
        Query params :
        - start : Date de début (YYYY-MM-DD)
        - end : Date de fin (YYYY-MM-DD)
        - project : ID du projet (optionnel)
        - status : Statut des tâches (optionnel)
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
            today = datetime.now().date()
            start_date = today.replace(day=1)
            # Dernier jour du mois
            if today.month == 12:
                end_date = today.replace(year=today.year + 1, month=1, day=1) - timedelta(days=1)
            else:
                end_date = today.replace(month=today.month + 1, day=1) - timedelta(days=1)
        
        # Récupération des tâches
        tasks = self._get_user_tasks(user, start_date, end_date)
        
        # Filtres additionnels
        project_id = request.query_params.get('project')
        if project_id:
            tasks = tasks.filter(project_id=project_id)
        
        status_filter = request.query_params.get('status')
        if status_filter and status_filter != 'all':
            tasks = tasks.filter(status=status_filter)
        
        # Filtre assigned_to (admin/chef seulement)
        assigned_to_id = request.query_params.get('assigned_to')
        if assigned_to_id:
            if user.role in ['admin', 'chef']:
                tasks = tasks.filter(assigned_to_id=assigned_to_id)
            else:
                return Response(
                    {'error': 'Vous ne pouvez pas filtrer par utilisateur'},
                    status=status.HTTP_403_FORBIDDEN
                )
        
        # Tri par date
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
        today = datetime.now().date()
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