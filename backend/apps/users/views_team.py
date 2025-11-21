"""
Vues pour la gestion de l'équipe.
"""

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Q, Count, Avg
from django.contrib.auth.hashers import make_password  # ✅ NOUVEAU
import secrets  # ✅ NOUVEAU

from apps.users.models import User
from apps.users.serializers_team import TeamMemberSerializer, TeamStatsSerializer
from apps.tasks.models import Task

from django.core.mail import send_mail
from django.conf import settings
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode
from django.utils.encoding import force_bytes


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def team_list(request):
    """
    Retourne la liste de tous les membres de l'équipe avec leurs statistiques.
    """
    search = request.GET.get('search', '')
    role = request.GET.get('role', '')
    is_active = request.GET.get('is_active', '')
    
    users = User.objects.all()
    
    if search:
        users = users.filter(
            Q(first_name__icontains=search) |
            Q(last_name__icontains=search) |
            Q(email__icontains=search) |
            Q(username__icontains=search)
        )
    
    if role:
        users = users.filter(role=role)
    
    if is_active:
        is_active_bool = is_active.lower() == 'true'
        users = users.filter(is_active=is_active_bool)
    
    users = users.order_by('-date_joined')
    
    serializer = TeamMemberSerializer(users, many=True, context={'request': request})
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def team_stats(request):
    """
    Retourne les statistiques globales de l'équipe.
    """
    total_members = User.objects.count()
    active_members = User.objects.filter(is_active=True).count()
    
    workload_data = User.objects.annotate(
        task_count=Count('assigned_tasks', filter=Q(assigned_tasks__status__in=['todo', 'in_progress']))
    ).aggregate(avg_workload=Avg('task_count'))
    
    avg_workload = round(workload_data['avg_workload'] or 0, 1)
    
    total_tasks = Task.objects.count()
    done_tasks = Task.objects.filter(status='done').count()
    completion_rate = round((done_tasks / total_tasks * 100) if total_tasks > 0 else 0, 1)
    
    data = {
        'total_members': total_members,
        'active_members': active_members,
        'avg_workload': avg_workload,
        'completion_rate': completion_rate,
    }
    
    serializer = TeamStatsSerializer(data)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def team_member_detail(request, user_id):
    """
    Retourne les détails d'un membre spécifique avec ses tâches récentes.
    """
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response(
            {'error': 'Utilisateur non trouvé'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    serializer = TeamMemberSerializer(user, context={'request': request})
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def invite_member(request):
    """
    Invite un nouveau membre avec envoi d'email contenant un lien de création de mot de passe.
    """
    
    # Vérifier que l'utilisateur est admin
    if request.user.role != 'admin':
        return Response(
            {'error': 'Seuls les administrateurs peuvent inviter des membres'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Récupérer les données
    email = request.data.get('email')
    role = request.data.get('role', 'membre')
    first_name = request.data.get('first_name', '')
    last_name = request.data.get('last_name', '')
    
    # Validation
    if not email:
        return Response(
            {'error': 'L\'email est requis'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Vérifier si l'email existe déjà
    if User.objects.filter(email=email).exists():
        return Response(
            {'error': 'Cet email est déjà utilisé'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Valider le rôle
    valid_roles = ['admin', 'chef', 'membre']
    if role not in valid_roles:
        return Response(
            {'error': f'Rôle invalide. Choix possibles : {", ".join(valid_roles)}'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        # Créer le username
        username = email.split('@')[0]
        base_username = username
        counter = 1
        while User.objects.filter(username=username).exists():
            username = f"{base_username}{counter}"
            counter += 1
        
        # Générer un mot de passe temporaire
        random_password = secrets.token_urlsafe(12)
        
        # Créer l'utilisateur
        user = User.objects.create(
            username=username,
            email=email,
            first_name=first_name,
            last_name=last_name,
            role=role,
            password=make_password(random_password),
            is_active=True
        )
        
        # ✅ NOUVEAU : Générer le token et le lien
        token = default_token_generator.make_token(user)
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        reset_link = f"{settings.FRONTEND_URL}/reset-password?uid={uid}&token={token}"
        
        # ✅ NOUVEAU : Préparer l'email
        role_display = {
            'admin': 'Administrateur',
            'chef': 'Chef de projet',
            'membre': 'Membre'
        }.get(role, 'Membre')
        
        subject = f"Bienvenue sur TaskFlow - Invitation en tant que {role_display}"
        message = f"""
Bonjour {user.get_full_name() or user.username},

Vous avez été invité(e) à rejoindre TaskFlow en tant que {role_display} !

Pour activer votre compte et créer votre mot de passe, cliquez sur le lien ci-dessous :

{reset_link}

⚠️ Ce lien est valide pendant 24 heures.

Une fois votre mot de passe créé, vous pourrez vous connecter avec :
📧 Email : {email}
🔑 Mot de passe : celui que vous aurez défini

Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.

Cordialement,
L'équipe TaskFlow
        """
        
        # ✅ NOUVEAU : Envoyer l'email
        try:
            send_mail(
                subject=subject,
                message=message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[email],
                fail_silently=False,
            )
            email_sent = True
        except Exception as email_error:
            print(f"Erreur d'envoi d'email : {email_error}")
            email_sent = False
        
        # Sérialiser
        serializer = TeamMemberSerializer(user, context={'request': request})
        
        return Response({
            'message': f'Invitation envoyée à {email}' if email_sent else 'Membre créé, erreur d\'envoi d\'email',
            'member': serializer.data,
            'reset_link': reset_link  # Pour debug
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        return Response(
            {'error': f'Erreur : {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
