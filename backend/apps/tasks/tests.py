from datetime import date

from django.test import TestCase

from apps.projects.models import Project
from apps.users.models import User
from .serializers import TaskCreateSerializer


class TaskBusinessRulesTests(TestCase):
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

    def test_create_task_rejected_when_project_completed(self):
        self.project.status = Project.StatusChoices.COMPLETED
        self.project.save(update_fields=['status'])

        serializer = TaskCreateSerializer(data={
            'title': 'Task 1',
            'project': self.project.id,
            'due_date': date(2026, 6, 25),
        })

        self.assertFalse(serializer.is_valid())
        self.assertIn('project', serializer.errors)

    def test_create_task_rejected_when_due_date_outside_project_window(self):
        serializer = TaskCreateSerializer(data={
            'title': 'Task 1',
            'project': self.project.id,
            'due_date': date(2026, 7, 5),
        })

        self.assertFalse(serializer.is_valid())
        self.assertIn('due_date', serializer.errors)

    def test_create_task_rejected_when_due_date_before_project_start(self):
        serializer = TaskCreateSerializer(data={
            'title': 'Task 1',
            'project': self.project.id,
            'due_date': date(2026, 6, 19),
        })

        self.assertFalse(serializer.is_valid())
        self.assertIn('due_date', serializer.errors)
