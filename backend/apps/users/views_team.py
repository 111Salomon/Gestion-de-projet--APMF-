"""
Vues pour la gestion de l'équipe.

Endpoints :
    - /api/users/team/ → Liste des membres avec stats
    - /api/users/team/stats/ → Statistiques globales
    - /api/users/team/<id>/ → Détails d'un membre
"""

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Count, Q
from django.utils import timezone
from datetime import timedelta

from .models import User
from apps.tasks.models import Task
from .serializers_team import TeamMemberSerializer, TeamStatsSerializer


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def team_list(request):
    """
    Liste tous les membres de l'équipe avec leurs statistiques.
    
    Filtres disponibles (query params) :
        - role : Filtre par rôle (admin, chef, membre)
        - search : Recherche par nom ou email
        - is_active : true/false pour actif/inactif
    
    Exemple :
        GET /api/users/team/?role=membre&search=dophie
    
    Retourne :
        Liste des utilisateurs avec leurs stats
    """
    
    # Récupère tous les utilisateurs
    users = User.objects.all().order_by('-date_joined')
    
    # Filtres
    role_filter = request.query_params.get('role', None)
    search_query = request.query_params.get('search', None)
    is_active_filter = request.query_params.get('is_active', None)
    
    # Filtre par rôle
    if role_filter:
        users = users.filter(role=role_filter)
    
    # Filtre par recherche (nom ou email)
    if search_query:
        users = users.filter(
            Q(first_name__icontains=search_query) |
            Q(last_name__icontains=search_query) |
            Q(email__icontains=search_query) |
            Q(username__icontains=search_query)
        )
    
    # Filtre par statut actif
    if is_active_filter:
        is_active = is_active_filter.lower() == 'true'
        users = users.filter(is_active=is_active)
    
    # Sérialise les données
    serializer = TeamMemberSerializer(
        users,
        many=True,
        context={'request': request}
    )
    
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def team_stats(request):
    """
    Retourne les statistiques globales de l'équipe.
    
    Calculs :
        - total_members : Nombre total d'utilisateurs actifs
        - active_members : Connectés dans les 7 derniers jours
        - avg_workload : Nombre moyen de tâches par membre
        - completion_rate : % moyen de tâches terminées
    
    Retourne :
        {
            "total_members": 5,
            "active_members": 4,
            "avg_workload": 7.2,
            "completion_rate": 68.5
        }
    """
    
    # Total de membres actifs
    total_members = User.objects.filter(is_active=True).count()
    
    # Membres actifs (connectés récemment)
    seven_days_ago = timezone.now() - timedelta(days=7)
    active_members = User.objects.filter(
        is_active=True,
        last_login__gte=seven_days_ago
    ).count()
    
    # Statistiques des tâches
    total_tasks = Task.objects.count()
    done_tasks = Task.objects.filter(status='done').count()
    
    # Charge de travail moyenne
    if total_members > 0:
        avg_workload = round(total_tasks / total_members, 1)
    else:
        avg_workload = 0
    
    # Taux de complétion global
    if total_tasks > 0:
        completion_rate = round((done_tasks / total_tasks) * 100, 1)
    else:
        completion_rate = 0
    
    # Prépare les données
    stats_data = {
        'total_members': total_members,
        'active_members': active_members,
        'avg_workload': avg_workload,
        'completion_rate': completion_rate,
    }
    
    # Sérialise
    serializer = TeamStatsSerializer(stats_data)
    
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def team_member_detail(request, user_id):
    """
    Détails d'un membre spécifique.
    
    Args:
        user_id : ID de l'utilisateur
    
    Retourne :
        Informations complètes + liste de ses tâches récentes
    """
    
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response(
            {'error': 'Utilisateur non trouvé'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Sérialise l'utilisateur
    user_data = TeamMemberSerializer(user, context={'request': request}).data
    
    # Ajoute ses tâches récentes (10 dernières)
    tasks = Task.objects.filter(assigned_to=user).order_by('-created_at')[:10]
    task_list = [{
        'id': task.id,
        'title': task.title,
        'status': task.status,
        'priority': task.priority,
        'due_date': task.due_date,
    } for task in tasks]
    
    user_data['recent_tasks'] = task_list
    
    return Response(user_data)
