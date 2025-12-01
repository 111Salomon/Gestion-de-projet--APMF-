"""
📊 Module Analytics pour les Rapports & Statistiques
Calculs de performance, productivité et comparaison d'équipe

Auteur: TaskFlow Analytics Engine
Date: 2025-11-29
"""

from django.db.models import Count, Q, Avg, Sum, F
from django.utils import timezone
from datetime import timedelta, datetime
from apps.tasks.models import Task
from apps.projects.models import Project, ProjectMember
from apps.users.models import User


# ═══════════════════════════════════════════════════════════════════
# 📈 PERFORMANCE INDIVIDUELLE
# ═══════════════════════════════════════════════════════════════════

def get_member_performance(user_id, days=30):
    """
    📊 Calcule les performances détaillées d'un membre sur une période.
    
    Métriques calculées:
        - Nombre total de tâches assignées
        - Nombre de tâches complétées
        - Taux de complétion (%)
        - Vélocité (tâches/semaine)
        - Temps moyen de complétion (jours)
        - Tâches en retard
        - Répartition par priorité
    
    Args:
        user_id (int): ID de l'utilisateur à analyser
        days (int): Nombre de jours d'historique (défaut: 30)
        
    Returns:
        dict: Statistiques complètes de performance
        
    Raises:
        User.DoesNotExist: Si l'utilisateur n'existe pas
    """
    # Calcul des dates de période
    end_date = timezone.now()
    start_date = end_date - timedelta(days=days)
    
    # Récupération de l'utilisateur
    user = User.objects.get(id=user_id)
    
    # ─────────────────────────────────────────────────────
    # 1️⃣ TÂCHES ASSIGNÉES PENDANT LA PÉRIODE
    # ─────────────────────────────────────────────────────
    assigned_tasks = Task.objects.filter(
        assigned_to=user,
        created_at__gte=start_date,
        created_at__lte=end_date
    )
    
    # ─────────────────────────────────────────────────────
    # 2️⃣ TÂCHES COMPLÉTÉES (status='done')
    # ─────────────────────────────────────────────────────
    completed_tasks = assigned_tasks.filter(status='done')
    
    # ─────────────────────────────────────────────────────
    # 3️⃣ TÂCHES EN RETARD (due_date dépassée + pas terminée)
    # ─────────────────────────────────────────────────────
    overdue_tasks = assigned_tasks.filter(
        due_date__lt=timezone.now().date(),
        status__in=['todo', 'in_progress', 'in_review']
    )
    
    # ─────────────────────────────────────────────────────
    # 4️⃣ CALCULS STATISTIQUES
    # ─────────────────────────────────────────────────────
    
    # Compteurs de base
    total = assigned_tasks.count()
    completed = completed_tasks.count()
    in_progress = assigned_tasks.filter(status='in_progress').count()
    overdue = overdue_tasks.count()
    
    # Taux de complétion (%)
    completion_rate = round((completed / total * 100) if total > 0 else 0, 1)
    
    # Vélocité (tâches complétées par semaine)
    weeks = days / 7
    velocity = round(completed / weeks if weeks > 0 else 0, 1)
    
    # ─────────────────────────────────────────────────────
    # 5️⃣ TEMPS MOYEN DE COMPLÉTION (en jours)
    # ─────────────────────────────────────────────────────
    
    # Filtrer seulement les tâches avec completed_at ET created_at
    completed_with_dates = completed_tasks.filter(
        completed_at__isnull=False,
        created_at__isnull=False
    )
    
    avg_completion_time = 0.0
    if completed_with_dates.exists():
        # Calcul du temps moyen en jours (décimales)
        total_days = 0
        for task in completed_with_dates:
            delta = task.completed_at - task.created_at
            total_days += delta.total_seconds() / 86400  # Convertir secondes en jours
        
        avg_completion_time = round(total_days / completed_with_dates.count(), 1)
    
    # ─────────────────────────────────────────────────────
    # 6️⃣ RÉPARTITION PAR PRIORITÉ
    # ─────────────────────────────────────────────────────
    priority_breakdown = {
        'low': assigned_tasks.filter(priority='low').count(),
        'medium': assigned_tasks.filter(priority='medium').count(),
        'high': assigned_tasks.filter(priority='high').count(),
        'urgent': assigned_tasks.filter(priority='urgent').count(),
    }
    
    # ─────────────────────────────────────────────────────
    # 7️⃣ RÉPARTITION PAR STATUT
    # ─────────────────────────────────────────────────────
    status_breakdown = {
        'todo': assigned_tasks.filter(status='todo').count(),
        'in_progress': in_progress,
        'in_review': assigned_tasks.filter(status='in_review').count(),
        'done': completed,
    }
    
    # ─────────────────────────────────────────────────────
    # 8️⃣ CONSTRUCTION DU RÉSULTAT
    # ─────────────────────────────────────────────────────
    return {
        'user': {
            'id': user.id,
            'username': user.username,
            'full_name': user.get_full_name(),
            'email': user.email,
            'avatar': user.avatar.url if user.avatar else None,
            'role': user.role,
        },
        'period': {
            'days': days,
            'start_date': start_date.strftime('%Y-%m-%d'),
            'end_date': end_date.strftime('%Y-%m-%d'),
        },
        'summary': {
            'total_assigned': total,
            'completed': completed,
            'in_progress': in_progress,
            'overdue': overdue,
            'completion_rate': completion_rate,
            'velocity': velocity,
            'avg_completion_time_days': avg_completion_time,
        },
        'breakdown': {
            'by_priority': priority_breakdown,
            'by_status': status_breakdown,
        }
    }


# ═══════════════════════════════════════════════════════════════════
# 👥 COMPARAISON D'ÉQUIPE
# ═══════════════════════════════════════════════════════════════════

def get_team_comparison(project_id=None, days=30):
    """
    🏆 Compare les performances de tous les membres d'une équipe.
    
    Permet de:
        - Voir le classement des membres par taux de complétion
        - Identifier les top performers
        - Détecter les membres en difficulté
        - Comparer la charge de travail
    
    Args:
        project_id (int, optional): ID du projet (None = tous les projets)
        days (int): Nombre de jours d'historique (défaut: 30)
        
    Returns:
        list: Liste des performances triées par completion_rate DESC
    """
    end_date = timezone.now()
    start_date = end_date - timedelta(days=days)
    
    # ─────────────────────────────────────────────────────
    # 1️⃣ SÉLECTION DES MEMBRES À ANALYSER
    # ─────────────────────────────────────────────────────
    
    if project_id:
        # Membres d'un projet spécifique
        member_ids = ProjectMember.objects.filter(
            project_id=project_id
        ).values_list('user_id', flat=True)
        
        users = User.objects.filter(
            id__in=member_ids,
            is_active=True
        )
    else:
        # Tous les utilisateurs actifs de la plateforme
        users = User.objects.filter(is_active=True)
    
    # ─────────────────────────────────────────────────────
    # 2️⃣ CALCUL DES PERFORMANCES POUR CHAQUE MEMBRE
    # ─────────────────────────────────────────────────────
    
    team_stats = []
    
    for user in users:
        # Récupérer les performances du membre
        stats = get_member_performance(user.id, days)
        
        # Filtrer: garder seulement les membres avec au moins 1 tâche
        if stats['summary']['total_assigned'] > 0:
            team_stats.append(stats)
    
    # ─────────────────────────────────────────────────────
    # 3️⃣ TRI PAR TAUX DE COMPLÉTION DÉCROISSANT
    # ─────────────────────────────────────────────────────
    
    team_stats.sort(
        key=lambda x: x['summary']['completion_rate'],
        reverse=True
    )
    
    # ─────────────────────────────────────────────────────
    # 4️⃣ AJOUT DU RANG (1er, 2ème, 3ème...)
    # ─────────────────────────────────────────────────────
    
    for index, stats in enumerate(team_stats, start=1):
        stats['rank'] = index
    
    return team_stats


# ═══════════════════════════════════════════════════════════════════
# 📉 TENDANCES DE PRODUCTIVITÉ
# ═══════════════════════════════════════════════════════════════════

def get_productivity_trends(days=30, project_id=None):
    """
    📈 Calcule les tendances de productivité jour par jour.
    
    Métriques par jour:
        - Nombre de tâches créées
        - Nombre de tâches complétées
        - Évolution dans le temps
    
    Permet de visualiser:
        - Si l'équipe est productive
        - Si on crée plus qu'on termine (risque d'accumulation)
        - Les pics et creux d'activité
    
    Args:
        days (int): Nombre de jours d'historique (défaut: 30)
        project_id (int, optional): Filtrer par projet
        
    Returns:
        dict: Données pour graphiques de tendance
    """
    end_date = timezone.now()
    start_date = end_date - timedelta(days=days)
    
    # ─────────────────────────────────────────────────────
    # 1️⃣ FILTRAGE PAR PROJET (OPTIONNEL)
    # ─────────────────────────────────────────────────────
    
    task_filter = {}
    if project_id:
        task_filter['project_id'] = project_id
    
    # ─────────────────────────────────────────────────────
    # 2️⃣ CALCUL JOUR PAR JOUR
    # ─────────────────────────────────────────────────────
    
    daily_created = []
    daily_completed = []
    
    for i in range(days + 1):  # +1 pour inclure aujourd'hui
        current_date = start_date.date() + timedelta(days=i)
        next_date = current_date + timedelta(days=1)
        
        # Tâches créées ce jour
        created_count = Task.objects.filter(
            created_at__date=current_date,
            **task_filter
        ).count()
        
        # Tâches complétées ce jour (completed_at dans cette journée)
        completed_count = Task.objects.filter(
            completed_at__date=current_date,
            status='done',
            **task_filter
        ).count()
        
        daily_created.append({
            'date': current_date.strftime('%Y-%m-%d'),
            'count': created_count
        })
        
        daily_completed.append({
            'date': current_date.strftime('%Y-%m-%d'),
            'count': completed_count
        })
    
    # ─────────────────────────────────────────────────────
    # 3️⃣ CALCULS GLOBAUX
    # ─────────────────────────────────────────────────────
    
    total_created = sum(day['count'] for day in daily_created)
    total_completed = sum(day['count'] for day in daily_completed)
    
    # Vélocité moyenne (tâches/semaine)
    weeks = days / 7
    avg_velocity = round(total_completed / weeks if weeks > 0 else 0, 1)
    
    # Taux de complétion global
    completion_rate = round((total_completed / total_created * 100) if total_created > 0 else 0, 1)
    
    # ─────────────────────────────────────────────────────
    # 4️⃣ RETOUR DES DONNÉES
    # ─────────────────────────────────────────────────────
    
    return {
        'period': {
            'days': days,
            'start_date': start_date.strftime('%Y-%m-%d'),
            'end_date': end_date.strftime('%Y-%m-%d'),
        },
        'daily_data': {
            'created': daily_created,
            'completed': daily_completed,
        },
        'summary': {
            'total_created': total_created,
            'total_completed': total_completed,
            'completion_rate': completion_rate,
            'avg_velocity_per_week': avg_velocity,
        }
    }


# ═══════════════════════════════════════════════════════════════════
# 📊 STATISTIQUES GLOBALES (BONUS)
# ═══════════════════════════════════════════════════════════════════

def get_global_stats(days=30):
    """
    🌍 Statistiques globales de la plateforme.
    
    Utile pour:
        - Admin dashboard
        - Rapports executives
        - Vue d'ensemble plateforme
    
    Args:
        days (int): Période d'analyse
        
    Returns:
        dict: Statistiques globales
    """
    end_date = timezone.now()
    start_date = end_date - timedelta(days=days)
    
    # Compteurs globaux
    total_users = User.objects.filter(is_active=True).count()
    total_projects = Project.objects.filter(status='active').count()
    total_tasks = Task.objects.count()
    
    # Tâches dans la période
    tasks_in_period = Task.objects.filter(
        created_at__gte=start_date,
        created_at__lte=end_date
    )
    
    completed_in_period = tasks_in_period.filter(status='done').count()
    
    return {
        'platform': {
            'total_users': total_users,
            'total_projects': total_projects,
            'total_tasks': total_tasks,
        },
        'period_stats': {
            'tasks_created': tasks_in_period.count(),
            'tasks_completed': completed_in_period,
            'completion_rate': round((completed_in_period / tasks_in_period.count() * 100) if tasks_in_period.count() > 0 else 0, 1),
        }
    }
