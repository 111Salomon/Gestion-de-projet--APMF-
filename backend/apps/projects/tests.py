from datetime import date

from django.test import TestCase

from apps.tasks.models import Task
from apps.users.models import User
from .models import Project
from .serializers import ProjectSerializer


class ProjectBusinessRulesTests(TestCase):
    def setUp(self):
        self.owner = User.objects.create_user(
            username='owner',
            email='owner@example.com',
            password='pass',
            role='membre',
        )
        self.project = Project.objects.create(
            name='Project A',
            description='Demo project',
            owner=self.owner,
            start_date=date(2026, 6, 21),
            end_date=date(2026, 6, 30),
        )
        Task.objects.create(
            title='Task A',
            project=self.project,
            due_date=date(2026, 6, 24),
        )
        Task.objects.create(
            title='Task B',
            project=self.project,
            due_date=date(2026, 6, 29),
        )

    def test_project_update_is_rejected_when_task_becomes_out_of_range(self):
        serializer = ProjectSerializer(
            instance=self.project,
            data={'end_date': date(2026, 6, 25)},
            partial=True,
        )

        self.assertFalse(serializer.is_valid())
        self.assertIn('non_field_errors', serializer.errors)
        self.assertIn('Task B', str(serializer.errors))
