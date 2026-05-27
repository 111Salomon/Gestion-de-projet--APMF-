from django.test import TestCase
from rest_framework.test import APIRequestFactory
from apps.users.models import User
from apps.projects.models import Project
from .models import Task
from .permissions import CanChangeTaskStatus, CanModifyTask


class RG29ArchiveTests(TestCase):
    def setUp(self):
        # Users
        self.admin = User.objects.create_user(username='admin', email='admin@example.com', password='pass', role='admin')
        self.user = User.objects.create_user(username='user', email='user@example.com', password='pass', role='membre')

        # Project owned by user
        self.project = Project.objects.create(name='P1', description='test', owner=self.user)

        # Two tasks
        self.t1 = Task.objects.create(title='T1', project=self.project)
        self.t2 = Task.objects.create(title='T2', project=self.project)

        self.factory = APIRequestFactory()

    def test_auto_archive_when_all_tasks_done(self):
        # Mark task1 done
        self.t1.status = Task.StatusChoices.DONE
        self.t1.save()
        self.project.refresh_from_db()
        # Not all done yet
        self.assertNotEqual(self.project.status, Project.StatusChoices.ARCHIVED)

        # Mark task2 done -> should trigger archive
        self.t2.status = Task.StatusChoices.DONE
        self.t2.save()
        self.project.refresh_from_db()
        self.assertEqual(self.project.status, Project.StatusChoices.ARCHIVED)

    def test_non_admin_cannot_modify_task_in_archived_project(self):
        # Archive project
        self.t1.status = Task.StatusChoices.DONE
        self.t1.save()
        self.t2.status = Task.StatusChoices.DONE
        self.t2.save()
        self.project.refresh_from_db()
        self.assertEqual(self.project.status, Project.StatusChoices.ARCHIVED)

        # Non-admin tries to change status
        request = self.factory.patch('/api/tasks/{}/change-status/'.format(self.t1.id))
        request.user = self.user

        perm = CanChangeTaskStatus()
        allowed = perm.has_object_permission(request, None, self.t1)
        self.assertFalse(allowed, "Non-admin should not be able to change status in archived project")
