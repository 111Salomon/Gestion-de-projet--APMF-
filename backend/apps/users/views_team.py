"""
Vues pour la gestion de l'équipe.
"""

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Q, Count, Avg
from django.contrib.auth import get_user_model 

# 🆕 NOUVEAUX IMPORTS POUR EXPORT
import csv
import io
from openpyxl import Workbook
from openpyxl.styles import Font, Alignment, PatternFill
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4, landscape
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from django.http import HttpResponse
from datetime import datetime

User = get_user_model()

from django.contrib.auth.hashers import make_password
import secrets

from apps.users.models import User
from apps.users.serializers_team import TeamMemberSerializer, TeamStatsSerializer
from apps.tasks.models import Task

from django.core.mail import send_mail
from django.conf import settings
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode
from django.utils.encoding import force_bytes

from django.core.files.storage import default_storage
from PIL import Image
import os


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
        
        # Générer le token et le lien
        token = default_token_generator.make_token(user)
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        reset_link = f"{settings.FRONTEND_URL}/reset-password?uid={uid}&token={token}"
        
        # Préparer l'email
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
        
        # Envoyer l'email
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
            'reset_link': reset_link
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        return Response(
            {'error': f'Erreur : {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def add_member(request):
    """
    Ajoute un nouveau membre directement via formulaire complet.
    Différence avec invite_member : pas d'email envoyé, création immédiate.
    
    Données requises :
        - email : Email unique (requis)
        - first_name : Prénom (requis)
        - last_name : Nom (requis)
        - role : Rôle (admin/chef/membre, requis)
        - password : Mot de passe (requis, min 8 caractères)
        - password_confirm : Confirmation mot de passe (requis)
        - phone : Téléphone (optionnel)
        - bio : Biographie (optionnel, max 500 caractères)
    
    Restrictions :
        - Seuls les administrateurs peuvent ajouter des membres
    
    Returns :
        201 : Membre créé avec succès
        400 : Données invalides
        403 : Permission refusée
        500 : Erreur serveur
    """
    
    # ─── Vérification Permission Admin ───
    if request.user.role != 'admin':
        return Response(
            {'error': 'Seuls les administrateurs peuvent ajouter des membres'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    # ─── Récupération des Données ───
    email = request.data.get('email', '').strip()
    first_name = request.data.get('first_name', '').strip()
    last_name = request.data.get('last_name', '').strip()
    role = request.data.get('role', 'membre')
    password = request.data.get('password', '')
    password_confirm = request.data.get('password_confirm', '')
    phone = request.data.get('phone', '').strip()
    bio = request.data.get('bio', '').strip()
    
    # ─── Validations ───
    errors = {}
    
    # Email
    if not email:
        errors['email'] = 'L\'email est requis'
    elif User.objects.filter(email=email).exists():
        errors['email'] = 'Cet email est déjà utilisé'
    
    # Prénom
    if not first_name:
        errors['first_name'] = 'Le prénom est requis'
    elif len(first_name) < 2:
        errors['first_name'] = 'Le prénom doit contenir au moins 2 caractères'
    
    # Nom
    if not last_name:
        errors['last_name'] = 'Le nom est requis'
    elif len(last_name) < 2:
        errors['last_name'] = 'Le nom doit contenir au moins 2 caractères'
    
    # Rôle
    valid_roles = ['admin', 'chef', 'membre']
    if role not in valid_roles:
        errors['role'] = f'Rôle invalide. Choix possibles : {", ".join(valid_roles)}'
    
    # Mot de passe
    if not password:
        errors['password'] = 'Le mot de passe est requis'
    elif len(password) < 8:
        errors['password'] = 'Le mot de passe doit contenir au moins 8 caractères'
    
    # Confirmation mot de passe
    if not password_confirm:
        errors['password_confirm'] = 'La confirmation du mot de passe est requise'
    elif password != password_confirm:
        errors['password_confirm'] = 'Les mots de passe ne correspondent pas'
    
    # Bio (max 500 caractères)
    if bio and len(bio) > 500:
        errors['bio'] = 'La biographie ne peut pas dépasser 500 caractères'
    
    # Si erreurs, retourner
    if errors:
        return Response(
            {'errors': errors},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # ─── Création du Membre ───
    try:
        # Générer un username unique
        username = email.split('@')[0]
        base_username = username
        counter = 1
        while User.objects.filter(username=username).exists():
            username = f"{base_username}{counter}"
            counter += 1
        
        # Créer l'utilisateur
        user = User.objects.create(
            username=username,
            email=email,
            first_name=first_name,
            last_name=last_name,
            role=role,
            phone=phone,
            bio=bio,
            is_active=True
        )
        
        # Hash et enregistrer le mot de passe
        user.set_password(password)
        user.save()
        
        # Sérialiser la réponse
        serializer = TeamMemberSerializer(user, context={'request': request})
        
        # Préparer le message
        role_display = {
            'admin': 'Administrateur',
            'chef': 'Chef de projet',
            'membre': 'Membre'
        }.get(role, 'Membre')
        
        return Response({
            'message': f'{user.get_full_name()} a été ajouté en tant que {role_display}',
            'member': serializer.data
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        # Log l'erreur pour debug
        import traceback
        traceback.print_exc()
        
        return Response(
            {'error': f'Erreur lors de la création du membre : {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )



@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def update_member_role(request, user_id):
    """
    Met à jour le rôle d'un membre.
    
    Données requises :
        - role : Nouveau rôle (admin, chef, membre)
    
    Restrictions :
        - Seuls les admins peuvent modifier les rôles
        - On ne peut pas retirer ses propres droits admin
        - Au moins un admin doit rester
    """
    
    # Vérifier que l'utilisateur est admin
    if request.user.role != 'admin':
        return Response(
            {'error': 'Seuls les administrateurs peuvent modifier les rôles'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Récupérer le nouveau rôle
    new_role = request.data.get('role')
    
    # Validation
    if not new_role:
        return Response(
            {'error': 'Le rôle est requis'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    valid_roles = ['admin', 'chef', 'membre']
    if new_role not in valid_roles:
        return Response(
            {'error': f'Rôle invalide. Choix : {", ".join(valid_roles)}'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        # Récupérer le membre
        user = User.objects.get(id=user_id)
        
        # Protection : Ne pas retirer ses propres droits admin
        if request.user.id == user_id and request.user.role == 'admin' and new_role != 'admin':
            return Response(
                {'error': 'Vous ne pouvez pas retirer vos propres droits administrateur'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Protection : Au moins un admin doit rester
        if user.role == 'admin' and new_role != 'admin':
            admin_count = User.objects.filter(role='admin', is_active=True).count()
            if admin_count <= 1:
                return Response(
                    {'error': 'Au moins un administrateur actif doit rester'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # Mettre à jour le rôle
        old_role = user.role
        user.role = new_role
        user.save()
        
        # Sérialiser
        serializer = TeamMemberSerializer(user, context={'request': request})
        
        role_names = {
            'admin': 'Administrateur',
            'chef': 'Chef de projet',
            'membre': 'Membre'
        }
        
        return Response({
            'message': f'Rôle modifié de {role_names[old_role]} à {role_names[new_role]}',
            'member': serializer.data
        }, status=status.HTTP_200_OK)
        
    except User.DoesNotExist:
        return Response(
            {'error': 'Utilisateur non trouvé'},
            status=status.HTTP_404_NOT_FOUND
        )


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def toggle_member_active(request, user_id):
    """
    Active ou désactive un membre (toggle).
    
    Restrictions :
        - Seuls les admins peuvent activer/désactiver
        - On ne peut pas se désactiver soi-même
        - Au moins un admin actif doit rester
    """
    
    # Vérifier que l'utilisateur est admin
    if request.user.role != 'admin':
        return Response(
            {'error': 'Seuls les administrateurs peuvent activer/désactiver des membres'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    try:
        # Récupérer le membre
        user = User.objects.get(id=user_id)
        
        # Protection : Ne pas se désactiver soi-même
        if request.user.id == user_id:
            return Response(
                {'error': 'Vous ne pouvez pas désactiver votre propre compte'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Protection : Au moins un admin actif doit rester
        if user.role == 'admin' and user.is_active:
            admin_count = User.objects.filter(role='admin', is_active=True).count()
            if admin_count <= 1:
                return Response(
                    {'error': 'Au moins un administrateur actif doit rester'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # Toggle l'état
        user.is_active = not user.is_active
        user.save()
        
        # Sérialiser
        serializer = TeamMemberSerializer(user, context={'request': request})
        
        status_text = 'activé' if user.is_active else 'désactivé'
        
        return Response({
            'message': f'Membre {status_text} avec succès',
            'is_active': user.is_active,
            'member': serializer.data
        }, status=status.HTTP_200_OK)
        
    except User.DoesNotExist:
        return Response(
            {'error': 'Utilisateur non trouvé'},
            status=status.HTTP_404_NOT_FOUND
        )


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_member(request, user_id):
    """
    Supprime un membre de l'équipe.
    
    Restrictions :
        - Seuls les admins peuvent supprimer
        - On ne peut pas se supprimer soi-même
        - Au moins un admin doit rester
        - Les tâches du membre sont réassignées ou conservées
    """
    
    # Vérifier que l'utilisateur est admin
    if request.user.role != 'admin':
        return Response(
            {'error': 'Seuls les administrateurs peuvent supprimer des membres'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    try:
        # Récupérer le membre à supprimer
        user = User.objects.get(id=user_id)
        
        # Protection : Ne pas se supprimer soi-même
        if request.user.id == user_id:
            return Response(
                {'error': 'Vous ne pouvez pas supprimer votre propre compte'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Protection : Au moins un admin doit rester
        if user.role == 'admin':
            admin_count = User.objects.filter(role='admin').count()
            if admin_count <= 1:
                return Response(
                    {'error': 'Impossible de supprimer le dernier administrateur'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # Récupérer les infos avant suppression (pour le message)
        member_name = user.get_full_name()
        member_email = user.email
        tasks_count = user.assigned_tasks.count()
        
        # Supprimer définitivement
        user.delete()
        
        return Response({
            'message': f'{member_name} a été supprimé de l\'équipe',
            'deleted_user': {
                'id': user_id,
                'name': member_name,
                'email': member_email,
                'tasks_count': tasks_count
            }
        }, status=status.HTTP_200_OK)
        
    except User.DoesNotExist:
        return Response(
            {'error': 'Utilisateur non trouvé'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {'error': f'Erreur lors de la suppression : {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def upload_avatar(request, user_id):
    """
    Upload l'avatar d'un membre.
    
    Validations :
        - Format : jpg, jpeg, png, gif, webp
        - Taille : max 2 MB
        - Dimensions : redimensionné à 400x400
    """
    
    # Vérifier que l'utilisateur peut modifier cet avatar
    if request.user.id != user_id and request.user.role != 'admin':
        return Response(
            {'error': 'Vous n\'êtes pas autorisé à modifier cet avatar'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    try:
        # Récupérer l'utilisateur
        user = User.objects.get(id=user_id)
        
        # Vérifier qu'un fichier a été envoyé
        if 'avatar' not in request.FILES:
            return Response(
                {'error': 'Aucun fichier fourni'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        avatar_file = request.FILES['avatar']
        
        # Validation du format
        ext = avatar_file.name.split('.')[-1].lower()
        allowed_extensions = ['jpg', 'jpeg', 'png', 'gif', 'webp']
        
        if ext not in allowed_extensions:
            return Response(
                {'error': f'Format non autorisé. Formats acceptés : {", ".join(allowed_extensions)}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validation de la taille (2 MB max)
        if avatar_file.size > 2 * 1024 * 1024:
            return Response(
                {'error': 'Le fichier est trop volumineux. Taille maximale : 2 MB'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Supprimer l'ancien avatar si existant
        if user.avatar:
            try:
                if os.path.isfile(user.avatar.path):
                    os.remove(user.avatar.path)
            except Exception as e:
                print(f"Erreur lors de la suppression de l'ancien avatar: {e}")
        
        # Sauvegarder le nouveau fichier
        user.avatar = avatar_file
        user.save()
        
        # Construire l'URL complète
        avatar_url = request.build_absolute_uri(user.avatar.url) if user.avatar else None
        
        return Response({
            'message': 'Avatar mis à jour avec succès',
            'avatar_url': avatar_url,
            'user': {
                'id': user.id,
                'full_name': user.get_full_name(),
                'avatar_url': avatar_url
            }
        }, status=status.HTTP_200_OK)
        
    except User.DoesNotExist:
        return Response(
            {'error': 'Utilisateur non trouvé'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {'error': f'Erreur lors de l\'upload : {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def update_member_profile(request, user_id):
    """
    Met à jour les informations du profil d'un membre.
    
    Champs modifiables :
        - first_name : Prénom
        - last_name : Nom
        - email : Email (doit rester unique)
        - phone : Téléphone
        - bio : Biographie
    
    Restrictions :
        - Seul l'utilisateur lui-même ou un admin peut modifier
        - Email doit rester unique
    """
    
    # Vérifier les permissions
    if request.user.id != user_id and request.user.role != 'admin':
        return Response(
            {'error': 'Vous n\'êtes pas autorisé à modifier ce profil'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    try:
        # Récupérer l'utilisateur
        user = User.objects.get(id=user_id)
        
        # Récupérer les données
        first_name = request.data.get('first_name')
        last_name = request.data.get('last_name')
        email = request.data.get('email')
        phone = request.data.get('phone', '')
        bio = request.data.get('bio', '')
        
        # Validation : Prénom et nom requis
        if not first_name or not first_name.strip():
            return Response(
                {'error': 'Le prénom est requis'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not last_name or not last_name.strip():
            return Response(
                {'error': 'Le nom est requis'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validation : Email requis et unique
        if not email or not email.strip():
            return Response(
                {'error': 'L\'email est requis'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Vérifier l'unicité de l'email (sauf si c'est le même)
        if email != user.email:
            if User.objects.filter(email=email).exists():
                return Response(
                    {'error': 'Cet email est déjà utilisé'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # Validation : Bio max 500 caractères
        if bio and len(bio) > 500:
            return Response(
                {'error': 'La biographie ne peut pas dépasser 500 caractères'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Mettre à jour les champs
        user.first_name = first_name.strip()
        user.last_name = last_name.strip()
        user.email = email.strip()
        user.phone = phone.strip()
        user.bio = bio.strip()
        user.save()
        
        # Sérialiser la réponse
        serializer = TeamMemberSerializer(user, context={'request': request})
        
        return Response({
            'message': 'Profil mis à jour avec succès',
            'user': serializer.data
        }, status=status.HTTP_200_OK)
        
    except User.DoesNotExist:
        return Response(
            {'error': 'Utilisateur non trouvé'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {'error': f'Erreur lors de la mise à jour : {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


# ═══════════════════════════════════════════════════════════
# 🆕 FONCTIONS HELPER POUR L'EXPORT (AJOUTÉES)
# ═══════════════════════════════════════════════════════════

def _get_role_label(role):
    """
    Fonction helper pour obtenir le label français d'un rôle.
    
    Args:
        role (str): Code du rôle ('admin', 'chef', 'membre')
    
    Returns:
        str: Label français du rôle
    """
    labels = {
        'admin': 'Administrateur',
        'chef': 'Chef de projet',
        'membre': 'Membre'
    }
    return labels.get(role, role)


def _get_filtered_members(request):
    """
    Fonction helper pour récupérer les membres filtrés selon les query params.
    Réutilise la même logique que team_list() pour cohérence.
    
    Args:
        request: HttpRequest avec les query params
    
    Returns:
        QuerySet: Membres filtrés avec annotations de stats
    """
    # Récupération des query params
    search = request.GET.get('search', '')
    role = request.GET.get('role', '')
    is_active = request.GET.get('is_active', '')
    
    # Base queryset avec annotations
    users = User.objects.annotate(
        tasks_total=Count('assigned_tasks'),
        tasks_in_progress=Count('assigned_tasks', filter=Q(assigned_tasks__status='in_progress')),
        tasks_completed=Count('assigned_tasks', filter=Q(assigned_tasks__status='done'))
    )
    
    # Application des filtres
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
    
    return users.order_by('-date_joined')


# ═══════════════════════════════════════════════════════════
# 🆕 VUES D'EXPORT - Liste de l'Équipe
# ═══════════════════════════════════════════════════════════

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def export_team_csv(request):
    """
    📄 Exporte la liste des membres de l'équipe en CSV.
    """
    try:
        users = _get_filtered_members(request)
        
        output = io.StringIO()
        writer = csv.writer(output)
        
        writer.writerow([
            'Nom Complet',
            'Email',
            'Rôle',
            'Statut',
            'Tâches Totales',
            'Tâches En Cours',
            'Tâches Terminées',
            'Taux de Complétion (%)',
            'Date d\'Inscription'
        ])
        
        for user_obj in users:
            completion_rate = 0
            if user_obj.tasks_total > 0:
                completion_rate = round((user_obj.tasks_completed / user_obj.tasks_total) * 100)
            
            full_name = user_obj.get_full_name() or user_obj.username
            
            writer.writerow([
                full_name,
                user_obj.email,
                _get_role_label(user_obj.role),
                'Actif' if user_obj.is_active else 'Inactif',
                user_obj.tasks_total or 0,
                user_obj.tasks_in_progress or 0,
                user_obj.tasks_completed or 0,
                completion_rate,
                user_obj.date_joined.strftime('%d/%m/%Y')
            ])
        
        output.seek(0)
        csv_content = '\ufeff' + output.getvalue()
        
        response = HttpResponse(csv_content, content_type='text/csv; charset=utf-8')
        response['Content-Disposition'] = f'attachment; filename="equipe_{datetime.now().strftime("%Y%m%d_%H%M%S")}.csv"'
        
        return response
    
    except Exception as e:
        print(f"❌ Erreur export CSV: {e}")
        import traceback
        traceback.print_exc()
        return HttpResponse(f'Erreur: {str(e)}', status=500)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def export_team_excel(request):
    """
    📊 Exporte la liste des membres de l'équipe en Excel (.xlsx).
    """
    try:
        users = _get_filtered_members(request)
        
        wb = Workbook()
        ws = wb.active
        ws.title = "Équipe"
        
        header_fill = PatternFill(start_color="4472C4", end_color="4472C4", fill_type="solid")
        header_font = Font(color="FFFFFF", bold=True, size=12)
        header_alignment = Alignment(horizontal="center", vertical="center")
        
        headers = [
            'Nom Complet', 'Email', 'Rôle', 'Statut', 'Tâches Totales',
            'Tâches En Cours', 'Tâches Terminées', 'Taux de Complétion (%)', 'Date d\'Inscription'
        ]
        
        for col_num, header in enumerate(headers, 1):
            cell = ws.cell(row=1, column=col_num, value=header)
            cell.fill = header_fill
            cell.font = header_font
            cell.alignment = header_alignment
        
        for row_num, user_obj in enumerate(users, 2):
            completion_rate = 0
            if user_obj.tasks_total > 0:
                completion_rate = round((user_obj.tasks_completed / user_obj.tasks_total) * 100)
            
            full_name = user_obj.get_full_name() or user_obj.username
            
            ws.cell(row=row_num, column=1, value=full_name)
            ws.cell(row=row_num, column=2, value=user_obj.email)
            ws.cell(row=row_num, column=3, value=_get_role_label(user_obj.role))
            ws.cell(row=row_num, column=4, value='Actif' if user_obj.is_active else 'Inactif')
            ws.cell(row=row_num, column=5, value=user_obj.tasks_total or 0)
            ws.cell(row=row_num, column=6, value=user_obj.tasks_in_progress or 0)
            ws.cell(row=row_num, column=7, value=user_obj.tasks_completed or 0)
            ws.cell(row=row_num, column=8, value=completion_rate)
            ws.cell(row=row_num, column=9, value=user_obj.date_joined.strftime('%d/%m/%Y'))
            
            for col_num in range(1, 10):
                cell = ws.cell(row=row_num, column=col_num)
                cell.alignment = Alignment(horizontal="center", vertical="center")
        
        for column in ws.columns:
            max_length = 0
            column_letter = column[0].column_letter
            for cell in column:
                try:
                    if len(str(cell.value)) > max_length:
                        max_length = len(str(cell.value))
                except:
                    pass
            adjusted_width = min(max_length + 2, 50)
            ws.column_dimensions[column_letter].width = adjusted_width
        
        output = io.BytesIO()
        wb.save(output)
        output.seek(0)
        
        response = HttpResponse(
            output.getvalue(),
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        response['Content-Disposition'] = f'attachment; filename="equipe_{datetime.now().strftime("%Y%m%d_%H%M%S")}.xlsx"'
        
        return response
    
    except Exception as e:
        print(f"❌ Erreur export Excel: {e}")
        import traceback
        traceback.print_exc()
        return HttpResponse(f'Erreur: {str(e)}', status=500)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def export_team_pdf(request):
    """
    📄 Exporte la liste des membres de l'équipe en PDF.
    """
    try:
        users = _get_filtered_members(request)
        
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=landscape(A4),
            rightMargin=1*cm,
            leftMargin=1*cm,
            topMargin=2*cm,
            bottomMargin=2*cm
        )
        
        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=24,
            textColor=colors.HexColor('#4472C4'),
            spaceAfter=30,
            alignment=1
        )
        
        elements = []
        title = Paragraph(
            f"Liste de l'Équipe - {datetime.now().strftime('%d/%m/%Y')}",
            title_style
        )
        elements.append(title)
        elements.append(Spacer(1, 12))
        
        data = [
            ['Nom', 'Email', 'Rôle', 'Statut', 'Tâches\nTotales', 'En\nCours', 'Terminées', 'Taux\n(%)']
        ]
        
        for user_obj in users:
            completion_rate = 0
            if user_obj.tasks_total > 0:
                completion_rate = round((user_obj.tasks_completed / user_obj.tasks_total) * 100)
            
            full_name = user_obj.get_full_name() or user_obj.username
            
            data.append([
                full_name,
                user_obj.email,
                _get_role_label(user_obj.role),
                'Actif' if user_obj.is_active else 'Inactif',
                str(user_obj.tasks_total or 0),
                str(user_obj.tasks_in_progress or 0),
                str(user_obj.tasks_completed or 0),
                f"{completion_rate}%"
            ])
        
        table = Table(data, repeatRows=1)
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#4472C4')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 10),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 1), (-1, -1), 9),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#F0F0F0')]),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('LEFTPADDING', (0, 0), (-1, -1), 6),
            ('RIGHTPADDING', (0, 0), (-1, -1), 6),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ]))
        
        elements.append(table)
        doc.build(elements)
        
        buffer.seek(0)
        response = HttpResponse(buffer.getvalue(), content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="equipe_{datetime.now().strftime("%Y%m%d_%H%M%S")}.pdf"'
        
        return response
    
    except Exception as e:
        print(f"❌ Erreur export PDF: {e}")
        import traceback
        traceback.print_exc()
        return HttpResponse(f'Erreur: {str(e)}', status=500)
