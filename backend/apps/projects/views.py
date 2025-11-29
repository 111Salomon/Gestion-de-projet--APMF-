from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.db.models import Q
from django.utils import timezone


from .models import Project, ProjectMember
from apps.users.models import User
from .serializers import (
    ProjectSerializer,
    ProjectCreateSerializer,
    ProjectListSerializer,
    ProjectMemberSerializer,
    UserSerializer  # 🆕 Ajouté pour lister les users
)
from apps.users.permissions import IsChefOrAdmin, IsProjectMemberOrReadOnly

# Imports supplémentaires pour l'export (à ajouter en haut du fichier)
import csv
import io
import json
import zipfile
import shutil
from openpyxl import Workbook
from openpyxl.styles import Font, Alignment, PatternFill, Border, Side
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.units import cm
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from django.http import HttpResponse
from datetime import datetime
import os
from django.conf import settings



# ─── HELPER FUNCTIONS ───

def _get_role_label(role):
    """Retourne le label français d'un rôle de membre."""
    labels = {
        'owner': 'Propriétaire',
        'manager': 'Gestionnaire',
        'member': 'Membre',
        'viewer': 'Observateur',
    }
    return labels.get(role, role)


def _get_status_label(status):
    """Retourne le label français d'un statut."""
    labels = {
        'draft': 'Brouillon',
        'active': 'Actif',
        'on_hold': 'En pause',
        'completed': 'Terminé',
        'archived': 'Archivé',
        'todo': 'À faire',
        'in_progress': 'En cours',
        'in_review': 'En révision',
        'done': 'Terminée',
    }
    return labels.get(status, status)


def _get_priority_label(priority):
    """Retourne le label français d'une priorité."""
    labels = {
        'low': 'Basse',
        'medium': 'Moyenne',
        'high': 'Haute',
        'urgent': 'Urgente',
    }
    return labels.get(priority, priority)


class ProjectViewSet(viewsets.ModelViewSet):
    """
    ViewSet pour gérer les projets.
    
    📌 Endpoints principaux:
        - GET    /api/projects/                    → Liste des projets
        - POST   /api/projects/                    → Créer un projet
        - GET    /api/projects/{id}/               → Détails d'un projet
        - PUT    /api/projects/{id}/               → Modifier un projet
        - DELETE /api/projects/{id}/               → Supprimer un projet
        
    📌 Endpoints membres:
        - GET    /api/projects/{id}/members/       → Liste des membres
        - POST   /api/projects/{id}/members/add/   → Ajouter un membre
        - DELETE /api/projects/{id}/members/{user_id}/remove/ → Retirer un membre
        - PATCH  /api/projects/{id}/members/{user_id}/role/   → Changer le rôle
    
    📌 Endpoints utilitaires:
        - GET    /api/projects/my_projects/        → Mes projets
        - GET    /api/projects/{id}/stats/         → Statistiques du projet
        - GET    /api/projects/available_users/    → Utilisateurs disponibles
    """
    
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """
        Retourne les projets accessibles à l'utilisateur.
        
        📌 Logique:
            - Admin → Voit TOUS les projets
            - Autres → Voient leurs projets (propriétaire OU membre)
        """
        user = self.request.user
        
        if user.is_admin:
            return Project.objects.all()
        
        # Projets où l'user est owner OU membre
        return Project.objects.filter(
            Q(owner=user) | Q(members=user)
        ).distinct()
    
    def get_serializer_class(self):
        """Choisit le serializer selon l'action."""
        if self.action == 'create':
            return ProjectCreateSerializer
        elif self.action == 'list':
            return ProjectListSerializer
        return ProjectSerializer
    
    def get_permissions(self):
        """Définit les permissions selon l'action."""
        if self.action == 'create':
            return [IsAuthenticated(), IsChefOrAdmin()]
        elif self.action in ['update', 'partial_update', 'destroy']:
            return [IsAuthenticated(), IsProjectMemberOrReadOnly()]
        return [IsAuthenticated()]
    
    def perform_create(self, serializer):
        """Sauvegarde le projet avec l'owner = user connecté."""
        serializer.save(owner=self.request.user)
    
    # ═══════════════════════════════════════════════════════════════════
    # 📊 STATISTIQUES DU PROJET
    # ═══════════════════════════════════════════════════════════════════
    
    @action(detail=True, methods=['get'])
    def stats(self, request, pk=None):
        """
        📊 Retourne les statistiques d'un projet.
        
        GET /api/projects/{id}/stats/
        
        Returns:
            - total_tasks: Nombre total de tâches
            - todo, in_progress, in_review, done: Compteurs par statut
            - completion_percentage: % de complétion
            - overdue_tasks: Nombre de tâches en retard
        """
        project = self.get_object()
        
        # Import local pour éviter circular import
        from apps.tasks.models import Task
        
        # Filtre les tâches de CE projet
        tasks = Task.objects.filter(project=project)
        
        # Compte par statut
        stats = {
            'total_tasks': tasks.count(),
            'todo': tasks.filter(status='todo').count(),
            'in_progress': tasks.filter(status='in_progress').count(),
            'in_review': tasks.filter(status='in_review').count(),
            'done': tasks.filter(status='done').count(),
        }
        
        # Calcul du % de complétion
        total = stats['total_tasks']
        if total > 0:
            stats['completion_percentage'] = round((stats['done'] / total) * 100, 1)
        else:
            stats['completion_percentage'] = 0.0
        
        # Tâches en retard (deadline passée + pas terminées)
        overdue = tasks.filter(
            due_date__lt=timezone.now().date(),
            status__in=['todo', 'in_progress', 'in_review']
        ).count()
        stats['overdue_tasks'] = overdue
        
        return Response(stats)
    
    # ═══════════════════════════════════════════════════════════════════
    # 👥 GESTION DES MEMBRES
    # ═══════════════════════════════════════════════════════════════════
    
    @action(detail=True, methods=['get'], url_path='members')
    def list_members(self, request, pk=None):
        """
        👥 Liste tous les membres d'un projet.
        
        GET /api/projects/{id}/members/
        
        Returns:
            Liste des membres avec leurs infos (user, role, joined_at)
        """
        project = self.get_object()
        
        # Utilise select_related pour optimiser (1 seule requête SQL)
        members = project.project_members.select_related('user').all()
        
        serializer = ProjectMemberSerializer(members, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'], url_path='members/add')
    def add_member(self, request, pk=None):
        """
        ➕ Ajoute un membre au projet.
        
        POST /api/projects/{id}/members/add/
        Body: {
            "user_id": 2,
            "role": "member"  // optionnel, défaut = "member"
        }
        
        📌 Permissions:
            - Admin (rôle global)
            - Chef de projet (rôle global)
            - Propriétaire du projet (champ owner OU rôle owner dans ProjectMember)
            - Gestionnaire du projet
        
        Returns:
            Données du membre ajouté (201 Created)
        """
        project = self.get_object()
        user_id = request.data.get('user_id')
        role = request.data.get('role', 'member')  # Défaut: member
        
        # ❌ Validation 1: user_id requis
        if not user_id:
            return Response(
                {'error': 'user_id est requis'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # ❌ Validation 2: User existe ?
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response(
                {'error': 'Utilisateur introuvable'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # ❌ Validation 3: Déjà membre ?
        if ProjectMember.objects.filter(project=project, user=user).exists():
            return Response(
                {'error': 'Cet utilisateur est déjà membre du projet'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # ✅ CORRECTION COMPLÈTE : Vérification de TOUTES les permissions
        is_project_owner = project.owner == request.user
        is_admin = request.user.role == 'admin'
        is_chef = request.user.role == 'chef'
        
        # 🆕 Vérifier si l'utilisateur a le rôle "owner" dans ProjectMember
        has_owner_role = ProjectMember.objects.filter(
            project=project,
            user=request.user,
            role='owner'
        ).exists()
        
        # Vérifier si gestionnaire du projet
        is_manager = ProjectMember.objects.filter(
            project=project,
            user=request.user,
            role='manager'
        ).exists()
        
        # ❌ Validation 4: Permissions (owner DB OU owner member OU admin OU chef OU manager)
        if not (is_project_owner or has_owner_role or is_admin or is_chef or is_manager):
            return Response(
                {'error': 'Vous n\'avez pas les permissions pour ajouter des membres'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # ✅ Crée le membre
        member = ProjectMember.objects.create(
            project=project,
            user=user,
            role=role
        )
        
        serializer = ProjectMemberSerializer(member)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['delete'], url_path='members/(?P<user_id>[^/.]+)/remove')
    def remove_member(self, request, pk=None, user_id=None):
        """
        ➖ Retire un membre du projet.
        
        DELETE /api/projects/{id}/members/{user_id}/remove/
        
        📌 Permissions:
            - Admin (rôle global)
            - Chef de projet (rôle global)
            - Propriétaire du projet (champ owner OU rôle owner dans ProjectMember)
            - Gestionnaire du projet
        
        Returns:
            204 No Content si succès
        """
        project = self.get_object()
        
        # ✅ CORRECTION COMPLÈTE : Vérification de TOUTES les permissions
        is_project_owner = project.owner == request.user
        is_admin = request.user.role == 'admin'
        is_chef = request.user.role == 'chef'
        
        # 🆕 Vérifier si l'utilisateur a le rôle "owner" dans ProjectMember
        has_owner_role = ProjectMember.objects.filter(
            project=project,
            user=request.user,
            role='owner'
        ).exists()
        
        # Vérifier si gestionnaire du projet
        is_manager = ProjectMember.objects.filter(
            project=project,
            user=request.user,
            role='manager'
        ).exists()
        
        # ❌ Validation: Permissions (owner DB OU owner member OU admin OU chef OU manager)
        if not (is_project_owner or has_owner_role or is_admin or is_chef or is_manager):
            return Response(
                {'error': 'Vous n\'avez pas les permissions pour retirer des membres'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            # Cherche le membre
            member = ProjectMember.objects.get(project=project, user_id=user_id)
            member.delete()
            
            return Response(status=status.HTTP_204_NO_CONTENT)
            
        except ProjectMember.DoesNotExist:
            return Response(
                {'error': 'Membre introuvable dans ce projet'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=True, methods=['patch'], url_path='members/(?P<user_id>[^/.]+)/role')
    def update_member_role(self, request, pk=None, user_id=None):
        """
        🔄 Modifie le rôle d'un membre.
        
        PATCH /api/projects/{id}/members/{user_id}/role/
        Body: {
            "role": "manager"  // manager, developer, viewer, member, owner
        }
        
        📌 Permissions:
            - Admin (rôle global)
            - Chef de projet (rôle global)
            - Propriétaire du projet (champ owner OU rôle owner dans ProjectMember)
            NOTE: Les gestionnaires NE PEUVENT PAS changer les rôles
        
        Returns:
            Données du membre mis à jour
        """
        project = self.get_object()
        new_role = request.data.get('role')
        
        # ❌ Validation 1: role requis
        if not new_role:
            return Response(
                {'error': 'role est requis'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # ✅ CORRECTION COMPLÈTE : Vérification des permissions
        is_project_owner = project.owner == request.user
        is_admin = request.user.role == 'admin'
        is_chef = request.user.role == 'chef'
        
        # 🆕 Vérifier si l'utilisateur a le rôle "owner" dans ProjectMember
        has_owner_role = ProjectMember.objects.filter(
            project=project,
            user=request.user,
            role='owner'
        ).exists()
        
        # ❌ Validation 2: Permissions (owner DB OU owner member OU admin OU chef)
        # NOTE: Les managers ne peuvent PAS changer les rôles
        if not (is_project_owner or has_owner_role or is_admin or is_chef):
            return Response(
                {'error': 'Vous n\'avez pas les permissions pour modifier les rôles'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            # Cherche et met à jour le membre
            member = ProjectMember.objects.get(project=project, user_id=user_id)
            member.role = new_role
            member.save()
            
            serializer = ProjectMemberSerializer(member)
            return Response(serializer.data)
            
        except ProjectMember.DoesNotExist:
            return Response(
                {'error': 'Membre introuvable dans ce projet'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    # ═══════════════════════════════════════════════════════════════════
    # 🛠️ UTILITAIRES
    # ═══════════════════════════════════════════════════════════════════
    
    @action(detail=False, methods=['get'])
    def my_projects(self, request):
        """
        📂 Retourne les projets de l'utilisateur connecté.
        
        GET /api/projects/my_projects/
        """
        projects = self.get_queryset().filter(owner=request.user)
        serializer = ProjectListSerializer(projects, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def available_users(self, request):
        """
        👤 Liste les utilisateurs disponibles pour être ajoutés.
        
        GET /api/projects/available_users/
        
        📌 Utile pour le frontend (autocomplete, select, etc.)
        
        Returns:
            Liste de tous les users actifs
        """
        users = User.objects.filter(is_active=True).order_by('username')
        serializer = UserSerializer(users, many=True)
        return Response(serializer.data)


    @action(detail=False, methods=['get'], url_path='dashboard/stats')
    def dashboard_stats(self, request):
        """
        📊 Retourne les statistiques complètes pour le dashboard.
        
        GET /api/projects/dashboard/stats/
        
        Returns:
            - KPIs (projets, tâches, membres)
            - Graphiques (tâches par statut, projets actifs)
            - Activités récentes
            - Tâches urgentes
        """
        from apps.tasks.models import Task
        from django.utils import timezone
        from datetime import timedelta
        
        user = request.user
        
        # ═══════════════════════════════════════════════════════════════
        # 📊 UTILISE get_queryset() pour avoir le MÊME filtrage que partout
        # ═══════════════════════════════════════════════════════════════
        
        # Projets accessibles (utilise la MÊME logique que get_queryset)
        my_projects = self.get_queryset()  # ✅ CORRECTION : Même filtrage partout
        
        # Statistiques projets
        total_projects = my_projects.count()
        active_projects = my_projects.filter(status='active').count()
        
        # Tâches des projets accessibles (MÊME logique que TaskViewSet)
        all_tasks = Task.objects.filter(project__in=my_projects)  # ✅ CORRECTION
        
        # Statistiques tâches
        total_tasks = all_tasks.count()
        completed_tasks = all_tasks.filter(status='done').count()
        in_progress_tasks = all_tasks.filter(status='in_progress').count()
        
        # Tâches terminées aujourd'hui
        today = timezone.now().date()
        completed_today = all_tasks.filter(
            status='done',
            updated_at__date=today
        ).count()
        
        # Tâches en retard
        overdue_tasks = all_tasks.filter(
            due_date__lt=today,
            status__in=['todo', 'in_progress', 'in_review']
        ).count()
        
        # Membres (compte les membres des projets accessibles)
        if user.is_admin:
            # Admin : tous les utilisateurs actifs
            total_members = User.objects.filter(is_active=True).count()
        else:
            # Utilisateur : membres uniques des projets accessibles
            member_ids = ProjectMember.objects.filter(
                project__in=my_projects
            ).values_list('user_id', flat=True).distinct()
            total_members = len(set(member_ids)) + 1  # +1 pour l'utilisateur
        
        # ═══════════════════════════════════════════════════════════════
        # 📈 Graphiques
        # ═══════════════════════════════════════════════════════════════
        
        # Tâches par statut (MÊME filtrage)
        tasks_by_status = {
            'todo': all_tasks.filter(status='todo').count(),
            'in_progress': all_tasks.filter(status='in_progress').count(),
            'in_review': all_tasks.filter(status='in_review').count(),
            'done': all_tasks.filter(status='done').count(),
        }
        
        # Top 5 projets actifs avec progression
        top_projects = []
        for project in my_projects.filter(status='active').order_by('-created_at')[:5]:
            project_tasks = Task.objects.filter(project=project)
            total = project_tasks.count()
            done = project_tasks.filter(status='done').count()
            progress = round((done / total * 100) if total > 0 else 0, 1)
            
            top_projects.append({
                'id': project.id,
                'name': project.name,
                'progress': progress,
                'total_tasks': total,
                'done_tasks': done,
            })
        
        # ═══════════════════════════════════════════════════════════════
        # 📋 Activités Récentes
        # ═══════════════════════════════════════════════════════════════
        
        recent_activities = []
        
        # Tâches récemment terminées (3 derniers jours)
        three_days_ago = timezone.now() - timedelta(days=3)
        recent_completed_tasks = all_tasks.filter(
            status='done',
            updated_at__gte=three_days_ago
        ).select_related('project', 'assigned_to').order_by('-updated_at')[:5]
        
        for task in recent_completed_tasks:
            recent_activities.append({
                'type': 'completed',
                'title': 'Tâche terminée',
                'description': f'{task.title} dans {task.project.name}',
                'timestamp': task.updated_at.isoformat(),
                'user': task.assigned_to.get_full_name() if task.assigned_to else 'Non assigné',
            })
        
        # Projets récemment créés
        recent_projects = my_projects.filter(
            created_at__gte=three_days_ago
        ).order_by('-created_at')[:3]
        
        for project in recent_projects:
            recent_activities.append({
                'type': 'created',
                'title': 'Nouveau projet',
                'description': f'{project.name} créé',
                'timestamp': project.created_at.isoformat(),
                'user': project.owner.get_full_name(),
            })
        
        # Trier par date
        recent_activities.sort(key=lambda x: x['timestamp'], reverse=True)
        recent_activities = recent_activities[:10]  # Garder les 10 plus récentes
        
        # ═══════════════════════════════════════════════════════════════
        # ⚠️ Tâches Urgentes (deadline < 7 jours)
        # ═══════════════════════════════════════════════════════════════
        
        next_week = today + timedelta(days=7)
        urgent_tasks = all_tasks.filter(
            due_date__gte=today,
            due_date__lte=next_week,
            status__in=['todo', 'in_progress', 'in_review']
        ).select_related('project', 'assigned_to').order_by('due_date')[:5]
        
        urgent_tasks_data = []
        for task in urgent_tasks:
            days_left = (task.due_date - today).days
            urgent_tasks_data.append({
                'id': task.id,
                'title': task.title,
                'project': task.project.name,
                'due_date': task.due_date.isoformat(),
                'days_left': days_left,
                'priority': task.priority,
                'assigned_to': task.assigned_to.get_full_name() if task.assigned_to else None,
            })
        
        # ═══════════════════════════════════════════════════════════════
        # 📦 Réponse Finale
        # ═══════════════════════════════════════════════════════════════
        
        return Response({
            'kpis': {
                'total_projects': total_projects,
                'active_projects': active_projects,
                'total_tasks': total_tasks,
                'completed_tasks': completed_tasks,
                'in_progress_tasks': in_progress_tasks,
                'completed_today': completed_today,
                'overdue_tasks': overdue_tasks,
                'total_members': total_members,
            },
            'charts': {
                'tasks_by_status': tasks_by_status,
                'top_projects': top_projects,
            },
            'recent_activities': recent_activities,
            'urgent_tasks': urgent_tasks_data,
        })
        






        # ─── EXPORT PDF ───
    @action(detail=True, methods=['get'], url_path='export/pdf')
    def export_project_pdf(self, request, pk=None):
        """
        📄 Exporte un projet complet en PDF avec encodage UTF-8 correct.
        """
        try:
            project = self.get_object()
            
            # Import local pour éviter circular import
            from apps.tasks.models import Task
            
            # Récupération des données
            tasks = Task.objects.filter(project=project).select_related(
                'assigned_to', 'created_by'
            ).prefetch_related('comments', 'attachments')
            
            members = project.project_members.select_related('user').all()
            
            # Création du buffer PDF
            buffer = io.BytesIO()
            doc = SimpleDocTemplate(
                buffer,
                pagesize=A4,
                rightMargin=2*cm,
                leftMargin=2*cm,
                topMargin=2*cm,
                bottomMargin=2*cm
            )
            
            # Styles
            styles = getSampleStyleSheet()
            
            title_style = ParagraphStyle(
                'CustomTitle',
                parent=styles['Heading1'],
                fontSize=24,
                textColor=colors.HexColor('#1a56db'),
                spaceAfter=20,
                alignment=TA_CENTER,
                fontName='Helvetica-Bold'
            )
            
            heading_style = ParagraphStyle(
                'CustomHeading',
                parent=styles['Heading2'],
                fontSize=16,
                textColor=colors.HexColor('#1f2937'),
                spaceAfter=12,
                spaceBefore=15,
                fontName='Helvetica-Bold'
            )
            
            normal_style = ParagraphStyle(
                'CustomNormal',
                parent=styles['Normal'],
                fontSize=10,
                textColor=colors.HexColor('#374151'),
                spaceAfter=6,
                fontName='Helvetica'
            )
            
            # Éléments du document
            elements = []
            
            # ═══════════════════════════════════════════════════════════
            # PAGE 1 : INFORMATIONS DU PROJET
            # ═══════════════════════════════════════════════════════════
            
            # Titre
            elements.append(Paragraph(f"Rapport de Projet : {project.name}", title_style))
            elements.append(Spacer(1, 0.3*cm))
            
            # Date d'export
            date_style = ParagraphStyle(
                'DateStyle',
                parent=normal_style,
                alignment=TA_CENTER,
                fontSize=9,
                textColor=colors.grey
            )
            elements.append(Paragraph(
                f"Généré le {datetime.now().strftime('%d/%m/%Y à %H:%M')}",
                date_style
            ))
            elements.append(Spacer(1, 0.8*cm))
            
            # Section Informations Générales
            elements.append(Paragraph("■ Informations Générales", heading_style))
            elements.append(Spacer(1, 0.3*cm))
            
            # Tableau des informations
            # 🆕 CORRECTION : Utiliser Paragraph pour permettre le word-wrapping
            description_text = project.description or 'Aucune description'

            # Limite à 200 caractères pour éviter un tableau trop grand
            if len(description_text) > 200:
                description_text = description_text[:200] + '...'

            info_data = [
                ['Nom du projet', Paragraph(project.name, normal_style)],
                ['Description', Paragraph(description_text, normal_style)],  # ✅ Avec Paragraph
                ['Statut', Paragraph(_get_status_label(project.status), normal_style)],
                ['Propriétaire', Paragraph(project.owner.get_full_name(), normal_style)],
                ['Date de début', Paragraph(project.start_date.strftime('%d/%m/%Y') if project.start_date else 'Non définie', normal_style)],
                ['Date de fin', Paragraph(project.end_date.strftime('%d/%m/%Y') if project.end_date else 'Non définie', normal_style)],
                ['Progression', Paragraph(f"{project.progress}%", normal_style)],
                ['Nombre de tâches', Paragraph(str(tasks.count()), normal_style)],
                ['Nombre de membres', Paragraph(str(members.count()), normal_style)],
            ]

            
            info_table = Table(info_data, colWidths=[5*cm, 11*cm], rowHeights=None) 
            info_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#f9fafb')),
                ('TEXTCOLOR', (0, 0), (-1, -1), colors.HexColor('#1f2937')),
                ('ALIGN', (0, 0), (0, -1), 'RIGHT'),
                ('ALIGN', (1, 0), (1, -1), 'LEFT'),
                ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
                ('FONTNAME', (1, 0), (1, -1), 'Helvetica'),
                ('FONTSIZE', (0, 0), (-1, -1), 10),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
                ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                ('LEFTPADDING', (0, 0), (-1, -1), 8),
                ('RIGHTPADDING', (0, 0), (-1, -1), 8),
                ('TOPPADDING', (0, 0), (-1, -1), 6),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ]))
            elements.append(info_table)
            elements.append(PageBreak())
            
            # ═══════════════════════════════════════════════════════════
            # PAGE 2 : MEMBRES DE L'ÉQUIPE
            # ═══════════════════════════════════════════════════════════
            
            elements.append(Paragraph(f"■ Membres de l'Équipe ({members.count()})", heading_style))
            elements.append(Spacer(1, 0.3*cm))
            
            if members.exists():
                members_data = [['Nom', 'Email', 'Rôle', 'Date d\'ajout']]
                
                for member in members:
                    members_data.append([
                        member.user.get_full_name(),
                        member.user.email,
                        _get_role_label(member.role),
                        member.joined_at.strftime('%d/%m/%Y')
                    ])
                
                members_table = Table(members_data, colWidths=[4*cm, 5.5*cm, 3.5*cm, 3*cm])
                members_table.setStyle(TableStyle([
                    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1a56db')),
                    ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                    ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                    ('FONTSIZE', (0, 0), (-1, 0), 10),
                    ('BOTTOMPADDING', (0, 0), (-1, 0), 10),
                    ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
                    ('FONTSIZE', (0, 1), (-1, -1), 9),
                    ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
                    ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f9fafb')]),
                    ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                    ('TOPPADDING', (0, 0), (-1, -1), 6),
                    ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
                ]))
                elements.append(members_table)
            else:
                elements.append(Paragraph("Aucun membre pour le moment.", normal_style))
            
            elements.append(PageBreak())
            
            # ═══════════════════════════════════════════════════════════
            # PAGE 3+ : TÂCHES DÉTAILLÉES
            # ═══════════════════════════════════════════════════════════
            
            elements.append(Paragraph(f"■ Tâches du Projet ({tasks.count()})", heading_style))
            elements.append(Spacer(1, 0.3*cm))
            
            if tasks.exists():
                tasks_data = [['Titre', 'Statut', 'Priorité', 'Assigné', 'Échéance']]
                
                for task in tasks:
                    # Limite le titre à 35 caractères
                    title_display = task.title[:35] + '...' if len(task.title) > 35 else task.title
                    
                    tasks_data.append([
                        title_display,
                        _get_status_label(task.status),
                        _get_priority_label(task.priority),
                        task.assigned_to.get_full_name()[:20] if task.assigned_to else 'Non assigné',
                        task.due_date.strftime('%d/%m/%Y') if task.due_date else '-'
                    ])
                
                tasks_table = Table(tasks_data, colWidths=[6*cm, 2.5*cm, 2.5*cm, 4*cm, 2.5*cm])
                tasks_table.setStyle(TableStyle([
                    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1a56db')),
                    ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                    ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                    ('FONTSIZE', (0, 0), (-1, 0), 9),
                    ('BOTTOMPADDING', (0, 0), (-1, 0), 10),
                    ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
                    ('FONTSIZE', (0, 1), (-1, -1), 8),
                    ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
                    ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f9fafb')]),
                    ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                    ('TOPPADDING', (0, 0), (-1, -1), 5),
                    ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
                ]))
                elements.append(tasks_table)
            else:
                elements.append(Paragraph("Aucune tâche pour le moment.", normal_style))
            
            elements.append(PageBreak())
            
            # ═══════════════════════════════════════════════════════════
            # PAGE N : STATISTIQUES
            # ═══════════════════════════════════════════════════════════
            
            elements.append(Paragraph("■ Statistiques", heading_style))
            elements.append(Spacer(1, 0.3*cm))
            
            stats_data = [
                ['Métrique', 'Valeur'],
                ['Tâches totales', str(tasks.count())],
                ['Tâches à faire', str(tasks.filter(status='todo').count())],
                ['Tâches en cours', str(tasks.filter(status='in_progress').count())],
                ['Tâches terminées', str(tasks.filter(status='done').count())],
                ['Taux de complétion', f"{project.progress}%"],
                ['Tâches en retard', str(tasks.filter(due_date__lt=timezone.now().date(), status__in=['todo', 'in_progress']).count())],
            ]
            
            stats_table = Table(stats_data, colWidths=[8*cm, 8*cm])
            stats_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#10b981')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, -1), 10),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
                ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#d1fae5')]),
                ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                ('TOPPADDING', (0, 0), (-1, -1), 8),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ]))
            elements.append(stats_table)
            
            # Génération du PDF
            doc.build(elements)
            buffer.seek(0)
            
            # Réponse HTTP
            response = HttpResponse(buffer.getvalue(), content_type='application/pdf')
            filename = f"projet_{project.id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
            response['Content-Disposition'] = f'attachment; filename="{filename}"'
            response['Content-Length'] = buffer.getbuffer().nbytes
            
            return response
            
        except Exception as e:
            print(f"❌ Erreur export PDF: {e}")
            import traceback
            traceback.print_exc()
            return Response(
                {'error': f'Erreur lors de l\'export PDF: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )



    # ─── EXPORT EXCEL ───

    @action(detail=True, methods=['get'], url_path='export/excel')
    def export_project_excel(self, request, pk=None):
        """
        📊 Exporte un projet complet en Excel (6 onglets).
        
        GET /api/projects/{id}/export/excel/
        
        Onglets :
        1. Vue d'ensemble
        2. Tâches détaillées
        3. Membres
        4. Commentaires
        5. Pièces jointes
        6. Statistiques
        """
        try:
            project = self.get_object()
            
            # Import local
            from apps.tasks.models import Task, Comment, Attachment
            
            # Récupération des données
            tasks = Task.objects.filter(project=project).select_related(
                'assigned_to', 'created_by'
            ).prefetch_related('comments', 'attachments')
            
            members = project.project_members.select_related('user').all()
            
            # Création du workbook
            wb = Workbook()
            wb.remove(wb.active)  # Supprime la feuille par défaut
            
            # Styles communs
            header_fill = PatternFill(start_color="1a56db", end_color="1a56db", fill_type="solid")
            header_font = Font(color="FFFFFF", bold=True, size=11)
            header_alignment = Alignment(horizontal="center", vertical="center")
            
            # ═══════════════════════════════════════════════════════════
            # ONGLET 1 : VUE D'ENSEMBLE
            # ═══════════════════════════════════════════════════════════
            
            ws1 = wb.create_sheet("Vue d'ensemble")
            
            ws1['A1'] = "RAPPORT DE PROJET"
            ws1['A1'].font = Font(size=18, bold=True, color="1a56db")
            ws1.merge_cells('A1:B1')
            
            ws1['A3'] = "Informations Générales"
            ws1['A3'].font = Font(size=14, bold=True)
            ws1.merge_cells('A3:B3')
            
            info_rows = [
                ['Nom du projet', project.name],
                ['Description', project.description or 'Aucune description'],
                ['Statut', _get_status_label(project.status)],
                ['Propriétaire', project.owner.get_full_name()],
                ['Date de début', project.start_date.strftime('%d/%m/%Y') if project.start_date else 'Non définie'],
                ['Date de fin', project.end_date.strftime('%d/%m/%Y') if project.end_date else 'Non définie'],
                ['Progression', f"{project.progress}%"],
                ['Créé le', project.created_at.strftime('%d/%m/%Y à %H:%M')],
                ['Dernière modification', project.updated_at.strftime('%d/%m/%Y à %H:%M')],
            ]
            
            for idx, (key, value) in enumerate(info_rows, start=5):
                ws1[f'A{idx}'] = key
                ws1[f'B{idx}'] = value
                ws1[f'A{idx}'].font = Font(bold=True)
                ws1[f'A{idx}'].fill = PatternFill(start_color="f3f4f6", end_color="f3f4f6", fill_type="solid")
            
            ws1.column_dimensions['A'].width = 25
            ws1.column_dimensions['B'].width = 50
            
            # ═══════════════════════════════════════════════════════════
            # ONGLET 2 : TÂCHES DÉTAILLÉES
            # ═══════════════════════════════════════════════════════════
            
            ws2 = wb.create_sheet("Tâches")
            
            headers = ['ID', 'Titre', 'Description', 'Statut', 'Priorité', 'Assigné à', 'Créé par', 'Échéance', 'Créée le', 'Modifiée le', 'Commentaires', 'Pièces jointes']
            
            for col_num, header in enumerate(headers, 1):
                cell = ws2.cell(row=1, column=col_num, value=header)
                cell.fill = header_fill
                cell.font = header_font
                cell.alignment = header_alignment
            
            for row_num, task in enumerate(tasks, 2):
                ws2.cell(row=row_num, column=1, value=task.id)
                ws2.cell(row=row_num, column=2, value=task.title)
                ws2.cell(row=row_num, column=3, value=task.description or '')
                ws2.cell(row=row_num, column=4, value=_get_status_label(task.status))
                ws2.cell(row=row_num, column=5, value=_get_priority_label(task.priority))
                ws2.cell(row=row_num, column=6, value=task.assigned_to.get_full_name() if task.assigned_to else 'Non assigné')
                ws2.cell(row=row_num, column=7, value=task.created_by.get_full_name() if task.created_by else '-')
                ws2.cell(row=row_num, column=8, value=task.due_date.strftime('%d/%m/%Y') if task.due_date else '-')
                ws2.cell(row=row_num, column=9, value=task.created_at.strftime('%d/%m/%Y %H:%M'))
                ws2.cell(row=row_num, column=10, value=task.updated_at.strftime('%d/%m/%Y %H:%M'))
                ws2.cell(row=row_num, column=11, value=task.comments.count())
                ws2.cell(row=row_num, column=12, value=task.attachments.count())
                
                # Centrage
                for col in range(1, 13):
                    ws2.cell(row=row_num, column=col).alignment = Alignment(horizontal="center", vertical="center")
            
            # Largeur des colonnes
            ws2.column_dimensions['A'].width = 8
            ws2.column_dimensions['B'].width = 30
            ws2.column_dimensions['C'].width = 40
            ws2.column_dimensions['D'].width = 12
            ws2.column_dimensions['E'].width = 12
            ws2.column_dimensions['F'].width = 20
            ws2.column_dimensions['G'].width = 20
            ws2.column_dimensions['H'].width = 12
            ws2.column_dimensions['I'].width = 18
            ws2.column_dimensions['J'].width = 18
            ws2.column_dimensions['K'].width = 12
            ws2.column_dimensions['L'].width = 12
            
            # ═══════════════════════════════════════════════════════════
            # ONGLET 3 : MEMBRES
            # ═══════════════════════════════════════════════════════════
            
            ws3 = wb.create_sheet("Membres")
            
            members_headers = ['ID', 'Nom complet', 'Email', 'Username', 'Rôle dans le projet', 'Rôle global', 'Date d\'ajout']
            
            for col_num, header in enumerate(members_headers, 1):
                cell = ws3.cell(row=1, column=col_num, value=header)
                cell.fill = header_fill
                cell.font = header_font
                cell.alignment = header_alignment
            
            for row_num, member in enumerate(members, 2):
                ws3.cell(row=row_num, column=1, value=member.user.id)
                ws3.cell(row=row_num, column=2, value=member.user.get_full_name())
                ws3.cell(row=row_num, column=3, value=member.user.email)
                ws3.cell(row=row_num, column=4, value=member.user.username)
                ws3.cell(row=row_num, column=5, value=_get_role_label(member.role))
                ws3.cell(row=row_num, column=6, value=member.user.role)
                ws3.cell(row=row_num, column=7, value=member.joined_at.strftime('%d/%m/%Y %H:%M'))
                
                for col in range(1, 8):
                    ws3.cell(row=row_num, column=col).alignment = Alignment(horizontal="center", vertical="center")
            
            ws3.column_dimensions['A'].width = 8
            ws3.column_dimensions['B'].width = 25
            ws3.column_dimensions['C'].width = 30
            ws3.column_dimensions['D'].width = 20
            ws3.column_dimensions['E'].width = 20
            ws3.column_dimensions['F'].width = 15
            ws3.column_dimensions['G'].width = 20
            
            # ═══════════════════════════════════════════════════════════
            # ONGLET 4 : COMMENTAIRES
            # ═══════════════════════════════════════════════════════════
            
            ws4 = wb.create_sheet("Commentaires")
            
            comments_headers = ['Tâche', 'Auteur', 'Commentaire', 'Date']
            
            for col_num, header in enumerate(comments_headers, 1):
                cell = ws4.cell(row=1, column=col_num, value=header)
                cell.fill = header_fill
                cell.font = header_font
                cell.alignment = header_alignment
            
            row_num = 2
            for task in tasks:
                for comment in task.comments.all():
                    ws4.cell(row=row_num, column=1, value=task.title)
                    ws4.cell(row=row_num, column=2, value=comment.author.get_full_name())
                    ws4.cell(row=row_num, column=3, value=comment.content)
                    ws4.cell(row=row_num, column=4, value=comment.created_at.strftime('%d/%m/%Y %H:%M'))
                    
                    for col in range(1, 5):
                        ws4.cell(row=row_num, column=col).alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
                    
                    row_num += 1
            
            ws4.column_dimensions['A'].width = 30
            ws4.column_dimensions['B'].width = 20
            ws4.column_dimensions['C'].width = 60
            ws4.column_dimensions['D'].width = 20
            
            # ═══════════════════════════════════════════════════════════
            # ONGLET 5 : PIÈCES JOINTES
            # ═══════════════════════════════════════════════════════════
            
            ws5 = wb.create_sheet("Pièces jointes")
            
            attachments_headers = ['Tâche', 'Nom du fichier', 'Taille (MB)', 'Uploadé par', 'Date d\'upload']
            
            for col_num, header in enumerate(attachments_headers, 1):
                cell = ws5.cell(row=1, column=col_num, value=header)
                cell.fill = header_fill
                cell.font = header_font
                cell.alignment = header_alignment
            
            row_num = 2
            for task in tasks:
                for attachment in task.attachments.all():
                    ws5.cell(row=row_num, column=1, value=task.title)
                    ws5.cell(row=row_num, column=2, value=attachment.file_name)
                    ws5.cell(row=row_num, column=3, value=attachment.file_size_mb)
                    ws5.cell(row=row_num, column=4, value=attachment.uploaded_by.get_full_name())
                    ws5.cell(row=row_num, column=5, value=attachment.uploaded_at.strftime('%d/%m/%Y %H:%M'))
                    
                    for col in range(1, 6):
                        ws5.cell(row=row_num, column=col).alignment = Alignment(horizontal="center", vertical="center")
                    
                    row_num += 1
            
            ws5.column_dimensions['A'].width = 30
            ws5.column_dimensions['B'].width = 40
            ws5.column_dimensions['C'].width = 12
            ws5.column_dimensions['D'].width = 20
            ws5.column_dimensions['E'].width = 20
            
            # ═══════════════════════════════════════════════════════════
            # ONGLET 6 : STATISTIQUES
            # ═══════════════════════════════════════════════════════════
            
            ws6 = wb.create_sheet("Statistiques")
            
            ws6['A1'] = "STATISTIQUES DU PROJET"
            ws6['A1'].font = Font(size=16, bold=True, color="10b981")
            ws6.merge_cells('A1:B1')
            
            stats_data = [
                ['Tâches totales', tasks.count()],
                ['Tâches à faire', tasks.filter(status='todo').count()],
                ['Tâches en cours', tasks.filter(status='in_progress').count()],
                ['Tâches en révision', tasks.filter(status='in_review').count()],
                ['Tâches terminées', tasks.filter(status='done').count()],
                ['Taux de complétion', f"{project.progress}%"],
                ['Tâches en retard', tasks.filter(due_date__lt=timezone.now().date(), status__in=['todo', 'in_progress']).count()],
                ['Nombre de membres', members.count()],
                ['Total commentaires', sum(task.comments.count() for task in tasks)],
                ['Total pièces jointes', sum(task.attachments.count() for task in tasks)],
            ]
            
            for idx, (key, value) in enumerate(stats_data, start=3):
                ws6[f'A{idx}'] = key
                ws6[f'B{idx}'] = value
                ws6[f'A{idx}'].font = Font(bold=True)
                ws6[f'A{idx}'].fill = PatternFill(start_color="d1fae5", end_color="d1fae5", fill_type="solid")
                ws6[f'B{idx}'].alignment = Alignment(horizontal="center")
            
            ws6.column_dimensions['A'].width = 30
            ws6.column_dimensions['B'].width = 20
            
            # Sauvegarde en mémoire
            output = io.BytesIO()
            wb.save(output)
            output.seek(0)
            
            # Réponse HTTP
            response = HttpResponse(
                output.getvalue(),
                content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            )
            filename = f"projet_{project.id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
            response['Content-Disposition'] = f'attachment; filename="{filename}"'
            
            return response
            
        except Exception as e:
            print(f"❌ Erreur export Excel: {e}")
            import traceback
            traceback.print_exc()
            return Response(
                {'error': f'Erreur lors de l\'export Excel: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


    # ─── EXPORT ARCHIVE ZIP ───

    @action(detail=True, methods=['get'], url_path='export/archive')
    def export_project_archive(self, request, pk=None):
        """
        📦 Exporte un projet complet en archive ZIP.
        
        GET /api/projects/{id}/export/archive/
        
        Contenu :
        - project_info.json
        - tasks.json
        - members.json
        - comments.json
        - attachments.json
        - attachments/ (copie des fichiers)
        - README.txt
        """
        try:
            project = self.get_object()
            
            # Import local
            from apps.tasks.models import Task, Comment, Attachment
            
            # Récupération des données
            tasks = Task.objects.filter(project=project).select_related(
                'assigned_to', 'created_by'
            ).prefetch_related('comments', 'attachments')
            
            members = project.project_members.select_related('user').all()
            
            # Création du buffer ZIP
            buffer = io.BytesIO()
            
            with zipfile.ZipFile(buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
                
                # ═══════════════════════════════════════════════════════════
                # 1. project_info.json
                # ═══════════════════════════════════════════════════════════
                
                project_data = {
                    'id': project.id,
                    'name': project.name,
                    'description': project.description,
                    'status': project.status,
                    'owner': {
                        'id': project.owner.id,
                        'username': project.owner.username,
                        'full_name': project.owner.get_full_name(),
                        'email': project.owner.email,
                    },
                    'start_date': project.start_date.isoformat() if project.start_date else None,
                    'end_date': project.end_date.isoformat() if project.end_date else None,
                    'progress': project.progress,
                    'created_at': project.created_at.isoformat(),
                    'updated_at': project.updated_at.isoformat(),
                    'statistics': {
                        'total_tasks': tasks.count(),
                        'total_members': members.count(),
                        'completion_rate': project.progress,
                    }
                }
                
                zip_file.writestr('project_info.json', json.dumps(project_data, indent=2, ensure_ascii=False))
                
                # ═══════════════════════════════════════════════════════════
                # 2. tasks.json
                # ═══════════════════════════════════════════════════════════
                
                tasks_data = []
                for task in tasks:
                    tasks_data.append({
                        'id': task.id,
                        'title': task.title,
                        'description': task.description,
                        'status': task.status,
                        'priority': task.priority,
                        'assigned_to': {
                            'id': task.assigned_to.id,
                            'full_name': task.assigned_to.get_full_name(),
                            'email': task.assigned_to.email,
                        } if task.assigned_to else None,
                        'created_by': {
                            'id': task.created_by.id,
                            'full_name': task.created_by.get_full_name(),
                        } if task.created_by else None,
                        'due_date': task.due_date.isoformat() if task.due_date else None,
                        'created_at': task.created_at.isoformat(),
                        'updated_at': task.updated_at.isoformat(),
                        'completed_at': task.completed_at.isoformat() if task.completed_at else None,
                        'is_overdue': task.is_overdue,
                    })
                
                zip_file.writestr('tasks.json', json.dumps(tasks_data, indent=2, ensure_ascii=False))
                
                # ═══════════════════════════════════════════════════════════
                # 3. members.json
                # ═══════════════════════════════════════════════════════════
                
                members_data = []
                for member in members:
                    members_data.append({
                        'user_id': member.user.id,
                        'username': member.user.username,
                        'full_name': member.user.get_full_name(),
                        'email': member.user.email,
                        'role_in_project': member.role,
                        'global_role': member.user.role,
                        'joined_at': member.joined_at.isoformat(),
                    })
                
                zip_file.writestr('members.json', json.dumps(members_data, indent=2, ensure_ascii=False))
                
                # ═══════════════════════════════════════════════════════════
                # 4. comments.json
                # ═══════════════════════════════════════════════════════════
                
                comments_data = []
                for task in tasks:
                    for comment in task.comments.all():
                        comments_data.append({
                            'id': comment.id,
                            'task_id': task.id,
                            'task_title': task.title,
                            'author': {
                                'id': comment.author.id,
                                'full_name': comment.author.get_full_name(),
                            },
                            'content': comment.content,
                            'created_at': comment.created_at.isoformat(),
                        })
                
                zip_file.writestr('comments.json', json.dumps(comments_data, indent=2, ensure_ascii=False))
                
                # ═══════════════════════════════════════════════════════════
                # 5. attachments.json + Copie des fichiers
                # ═══════════════════════════════════════════════════════════
                
                attachments_data = []
                for task in tasks:
                    for attachment in task.attachments.all():
                        attachments_data.append({
                            'id': attachment.id,
                            'task_id': task.id,
                            'task_title': task.title,
                            'file_name': attachment.file_name,
                            'file_size': attachment.file_size,
                            'file_path': f"attachments/{attachment.file_name}",
                            'uploaded_by': {
                                'id': attachment.uploaded_by.id,
                                'full_name': attachment.uploaded_by.get_full_name(),
                            },
                            'uploaded_at': attachment.uploaded_at.isoformat(),
                        })
                        
                        # Copie du fichier physique dans le ZIP
                        try:
                            if attachment.file and os.path.isfile(attachment.file.path):
                                with open(attachment.file.path, 'rb') as f:
                                    zip_file.writestr(f"attachments/{attachment.file_name}", f.read())
                        except Exception as file_error:
                            print(f"⚠️ Impossible de copier {attachment.file_name}: {file_error}")
                
                zip_file.writestr('attachments.json', json.dumps(attachments_data, indent=2, ensure_ascii=False))
                
                # ═══════════════════════════════════════════════════════════
                # 6. README.txt
                # ═══════════════════════════════════════════════════════════
                
                readme_content = f"""
    ╔═══════════════════════════════════════════════════════════╗
    ║          EXPORT COMPLET DU PROJET : {project.name}
    ╚═══════════════════════════════════════════════════════════╝

    📅 Date d'export : {datetime.now().strftime('%d/%m/%Y à %H:%M:%S')}
    🔐 Exporté par : {request.user.get_full_name()}

    📦 CONTENU DE L'ARCHIVE
    ────────────────────────────────────────────────────────────

    1. project_info.json
    → Informations complètes du projet

    2. tasks.json
    → Liste de toutes les tâches ({tasks.count()} tâches)

    3. members.json
    → Liste des membres de l'équipe ({members.count()} membres)

    4. comments.json
    → Tous les commentaires du projet

    5. attachments.json
    → Métadonnées des pièces jointes

    6. attachments/
    → Copies des fichiers uploadés

    📊 STATISTIQUES
    ────────────────────────────────────────────────────────────

    • Tâches totales : {tasks.count()}
    • Tâches terminées : {tasks.filter(status='done').count()}
    • Progression : {project.progress}%
    • Membres : {members.count()}

    💡 UTILISATION
    ────────────────────────────────────────────────────────────

    Les fichiers JSON peuvent être :
    - Consultés avec un éditeur de texte
    - Réimportés dans un autre système
    - Analysés avec des outils de traitement de données

    Les pièces jointes sont dans le dossier attachments/

    ────────────────────────────────────────────────────────────
    TaskFlow - Gestion de projets professionnelle
    """
                
                zip_file.writestr('README.txt', readme_content)
            
            # Réponse HTTP
            buffer.seek(0)
            response = HttpResponse(buffer.getvalue(), content_type='application/zip')
            filename = f"projet_{project.id}_archive_{datetime.now().strftime('%Y%m%d_%H%M%S')}.zip"
            response['Content-Disposition'] = f'attachment; filename="{filename}"'
            
            return response
            
        except Exception as e:
            print(f"❌ Erreur export archive: {e}")
            import traceback
            traceback.print_exc()
            return Response(
                {'error': f'Erreur lors de l\'export archive: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

            

    # ═══════════════════════════════════════════════════════════════════
    # 📊 ANALYTICS & RAPPORTS (AJOUTÉ - 2025-11-29)
    # ═══════════════════════════════════════════════════════════════════

    @action(detail=False, methods=['get'], url_path='analytics/performance')
    def analytics_performance(self, request):
        """
        📈 Récupère les performances d'un membre spécifique.
        
        Query Parameters:
            - user_id (requis): ID de l'utilisateur
            - days (optionnel): Période d'analyse (défaut: 30)
        
        Exemple: GET /api/projects/analytics/performance/?user_id=1&days=30
        """
        from .analytics import get_member_performance
        
        user_id = request.query_params.get('user_id')
        days = request.query_params.get('days', 30)
        
        if not user_id:
            return Response(
                {'error': 'Le paramètre user_id est requis'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            user_id = int(user_id)
            days = int(days)
        except ValueError:
            return Response(
                {'error': 'user_id et days doivent être des nombres entiers'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if days < 1 or days > 365:
            return Response(
                {'error': 'days doit être entre 1 et 365'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            performance = get_member_performance(user_id, days)
            return Response(performance, status=status.HTTP_200_OK)
            
        except User.DoesNotExist:
            return Response(
                {'error': 'Utilisateur introuvable'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            print(f"❌ Erreur analytics performance: {e}")
            import traceback
            traceback.print_exc()
            return Response(
                {'error': f'Erreur lors du calcul des performances: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


    @action(detail=False, methods=['get'], url_path='analytics/team-comparison')
    def analytics_team_comparison(self, request):
        """
        👥 Compare les performances de toute l'équipe.
        
        Query Parameters:
            - project_id (optionnel): ID du projet
            - days (optionnel): Période d'analyse (défaut: 30)
        
        Exemple: GET /api/projects/analytics/team-comparison/?days=30
        """
        from .analytics import get_team_comparison
        
        project_id = request.query_params.get('project_id')
        days = request.query_params.get('days', 30)
        
        try:
            days = int(days)
            if project_id:
                project_id = int(project_id)
        except ValueError:
            return Response(
                {'error': 'days et project_id doivent être des nombres entiers'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if days < 1 or days > 365:
            return Response(
                {'error': 'days doit être entre 1 et 365'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            comparison = get_team_comparison(project_id, days)
            
            return Response({
                'period_days': days,
                'project_id': project_id,
                'members_count': len(comparison),
                'team_stats': comparison
            }, status=status.HTTP_200_OK)
            
        except Project.DoesNotExist:
            return Response(
                {'error': 'Projet introuvable'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            print(f"❌ Erreur analytics team comparison: {e}")
            import traceback
            traceback.print_exc()
            return Response(
                {'error': f'Erreur lors de la comparaison d\'équipe: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


    @action(detail=False, methods=['get'], url_path='analytics/productivity')
    def analytics_productivity(self, request):
        """
        📉 Récupère les tendances de productivité jour par jour.
        
        Query Parameters:
            - days (optionnel): Période d'analyse (défaut: 30)
            - project_id (optionnel): Filtrer par projet
        
        Exemple: GET /api/projects/analytics/productivity/?days=7
        """
        from .analytics import get_productivity_trends
        
        days = request.query_params.get('days', 30)
        project_id = request.query_params.get('project_id')
        
        try:
            days = int(days)
            if project_id:
                project_id = int(project_id)
        except ValueError:
            return Response(
                {'error': 'days et project_id doivent être des nombres entiers'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if days < 1 or days > 365:
            return Response(
                {'error': 'days doit être entre 1 et 365'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            trends = get_productivity_trends(days, project_id)
            return Response(trends, status=status.HTTP_200_OK)
            
        except Exception as e:
            print(f"❌ Erreur analytics productivity: {e}")
            import traceback
            traceback.print_exc()
            return Response(
                {'error': f'Erreur lors du calcul des tendances: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
