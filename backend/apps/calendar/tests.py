from django.test import TestCase
from django.contrib.auth import get_user_model
from apps.tasks.models import Task
from apps.projects.models import Project
from datetime import date, timedelta

User = get_user_model()

class CalendarAPITestCase(TestCase):
    
    def setUp(self):
        # Créer utilisateurs
        self.admin = User.objects.create_user(
            username='admin',
            email='admin@test.com',
            password='test123',
            role='admin'
        )
        self.membre = User.objects.create_user(
            username='clara',
            email='clara@test.com',
            password='test123',
            role='membre'
        )
        
        # Créer projet
        self.project = Project.objects.create(
            name='Test Project',
            owner=self.admin,
            description='test'
        )
        
        # Créer tâches
        today = date.today()
        self.task1 = Task.objects.create(
            title='Tâche 1',
            project=self.project,
            assigned_to=self.membre,
            due_date=today,
            priority='high'
        )
        self.task2 = Task.objects.create(
            title='Tâche 2',
            project=self.project,
            assigned_to=self.admin,
            due_date=today + timedelta(days=5),
            priority='medium'
        )
    
    def test_member_sees_only_assigned_tasks(self):
        """Un membre voit seulement ses tâches"""
        self.client.force_login(self.membre)
        response = self.client.get('/api/calendar/tasks/')
        
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['count'], 1)  # Seulement task1
    
    def test_admin_sees_all_tasks(self):
        """Un admin voit toutes les tâches"""
        self.client.force_login(self.admin)
        response = self.client.get('/api/calendar/tasks/')
        
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['count'], 2)  # task1 + task2
