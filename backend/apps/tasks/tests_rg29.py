from django.test import TestCase
from django.db import transaction
from rest_framework.test import APIRequestFactory
from apps.users.models import User
from apps.projects.models import Project, ProjectMember
from .models import Task
from .permissions import CanChangeTaskStatus, CanModifyTask, CanDeleteTask, CanCreateTask


class RG29ArchiveTests(TestCase):
    """Tests for RG-29 archiving system with race condition handling."""

    def setUp(self):
        self.factory = APIRequestFactory()

        # Users
        self.admin = User.objects.create_user(
            username='admin', email='admin@example.com', password='pass', role='admin'
        )
        self.owner = User.objects.create_user(
            username='owner', email='owner@example.com', password='pass', role='membre'
        )
        self.manager = User.objects.create_user(
            username='manager', email='manager@example.com', password='pass', role='membre'
        )
        self.member = User.objects.create_user(
            username='member', email='member@example.com', password='pass', role='membre'
        )

        # Project owned by owner user
        self.project = Project.objects.create(
            name='Test Project', description='test', owner=self.owner
        )

        # Add manager and member to project
        ProjectMember.objects.create(project=self.project, user=self.manager, role='manager')
        ProjectMember.objects.create(project=self.project, user=self.member, role='member')

    def test_auto_archive_when_all_tasks_done(self):
        """Test that project archives when all tasks are marked done."""
        t1 = Task.objects.create(title='T1', project=self.project)
        t2 = Task.objects.create(title='T2', project=self.project)

        # Mark first task done - project should not archive yet
        t1.status = Task.StatusChoices.DONE
        t1.save()
        self.project.refresh_from_db()
        self.assertNotEqual(self.project.status, Project.StatusChoices.ARCHIVED)

        # Mark second task done - project should auto-archive
        t2.status = Task.StatusChoices.DONE
        t2.save()
        self.project.refresh_from_db()
        self.assertEqual(self.project.status, Project.StatusChoices.ARCHIVED)

    def test_auto_unarchive_when_task_not_done(self):
        """Test that project unarchives when a task is marked not done in archived project."""
        t1 = Task.objects.create(title='T1', project=self.project)
        t2 = Task.objects.create(title='T2', project=self.project)

        # Archive project by marking all tasks done
        t1.status = Task.StatusChoices.DONE
        t1.save()
        t2.status = Task.StatusChoices.DONE
        t2.save()
        self.project.refresh_from_db()
        self.assertEqual(self.project.status, Project.StatusChoices.ARCHIVED)

        # Mark a task as in_progress - project should unarchive to COMPLETED
        t1.status = Task.StatusChoices.IN_PROGRESS
        t1.save()
        self.project.refresh_from_db()
        self.assertEqual(self.project.status, Project.StatusChoices.COMPLETED)

    def test_empty_project_not_auto_archived(self):
        """Test that a project with no tasks is NOT auto-archived."""
        # Project has no tasks
        self.assertEqual(self.project.tasks.count(), 0)

        # Manually set to COMPLETED
        self.project.status = Project.StatusChoices.COMPLETED
        self.project.save()

        # Trigger signal by adding a task (this calls post_save)
        t = Task.objects.create(title='T1', project=self.project)

        # Project should remain COMPLETED (not auto-archive with 0 tasks)
        self.project.refresh_from_db()
        self.assertEqual(self.project.status, Project.StatusChoices.COMPLETED)

    def test_admin_can_modify_archived_project_tasks(self):
        """Test that admin can modify tasks in archived project."""
        t = Task.objects.create(title='T1', project=self.project, status=Task.StatusChoices.DONE)
        t2 = Task.objects.create(title='T2', project=self.project, status=Task.StatusChoices.DONE)
        self.project.status = Project.StatusChoices.ARCHIVED
        self.project.save()

        request = self.factory.patch('/api/tasks/{}/'.format(t.id))
        request.user = self.admin

        # Admin should be able to modify
        perm = CanModifyTask()
        self.assertTrue(perm.has_object_permission(request, None, t))

    def test_non_admin_cannot_modify_task_in_archived_project(self):
        """Test that non-admin users cannot modify tasks in archived project."""
        t1 = Task.objects.create(title='T1', project=self.project)
        t2 = Task.objects.create(title='T2', project=self.project)

        # Archive project
        t1.status = Task.StatusChoices.DONE
        t1.save()
        t2.status = Task.StatusChoices.DONE
        t2.save()
        self.project.refresh_from_db()
        self.assertEqual(self.project.status, Project.StatusChoices.ARCHIVED)

        # Non-admin (owner) tries to modify task
        request = self.factory.patch('/api/tasks/{}/'.format(t1.id))
        request.user = self.owner

        perm = CanModifyTask()
        self.assertFalse(perm.has_object_permission(request, None, t1))

    def test_non_admin_cannot_change_task_status_in_archived_project(self):
        """Test that non-admin cannot change task status in archived project."""
        t1 = Task.objects.create(title='T1', project=self.project)
        t2 = Task.objects.create(title='T2', project=self.project)

        # Archive project
        t1.status = Task.StatusChoices.DONE
        t1.save()
        t2.status = Task.StatusChoices.DONE
        t2.save()
        self.project.refresh_from_db()

        # Non-admin tries to change status
        request = self.factory.patch('/api/tasks/{}/change-status/'.format(t1.id))
        request.user = self.owner

        perm = CanChangeTaskStatus()
        self.assertFalse(perm.has_object_permission(request, None, t1))

    def test_non_admin_cannot_delete_task_in_archived_project(self):
        """Test that non-admin cannot delete tasks in archived project."""
        t1 = Task.objects.create(title='T1', project=self.project)
        t2 = Task.objects.create(title='T2', project=self.project)

        # Archive project
        t1.status = Task.StatusChoices.DONE
        t1.save()
        t2.status = Task.StatusChoices.DONE
        t2.save()
        self.project.refresh_from_db()

        # Non-admin tries to delete
        request = self.factory.delete('/api/tasks/{}/'.format(t1.id))
        request.user = self.owner

        perm = CanDeleteTask()
        self.assertFalse(perm.has_object_permission(request, None, t1))

    def test_non_admin_cannot_create_task_in_archived_project(self):
        """Test that non-admin cannot create tasks in archived project."""
        t1 = Task.objects.create(title='T1', project=self.project)
        t2 = Task.objects.create(title='T2', project=self.project)

        # Archive project
        t1.status = Task.StatusChoices.DONE
        t1.save()
        t2.status = Task.StatusChoices.DONE
        t2.save()
        self.project.refresh_from_db()

        # Non-admin tries to create task
        request = self.factory.post('/api/tasks/')
        request.user = self.owner

        perm = CanCreateTask()
        self.assertFalse(perm.has_project_permission(request, self.project))

    def test_manager_cannot_modify_archived_project_tasks(self):
        """Test that manager cannot modify tasks when project is archived."""
        t = Task.objects.create(title='T1', project=self.project, status=Task.StatusChoices.DONE)
        t2 = Task.objects.create(title='T2', project=self.project, status=Task.StatusChoices.DONE)
        self.project.status = Project.StatusChoices.ARCHIVED
        self.project.save()

        request = self.factory.patch('/api/tasks/{}/'.format(t.id))
        request.user = self.manager

        perm = CanModifyTask()
        self.assertFalse(perm.has_object_permission(request, None, t))

    def test_admin_can_create_task_in_archived_project(self):
        """Test that admin can create tasks even in archived project."""
        t1 = Task.objects.create(title='T1', project=self.project, status=Task.StatusChoices.DONE)
        t2 = Task.objects.create(title='T2', project=self.project, status=Task.StatusChoices.DONE)
        self.project.status = Project.StatusChoices.ARCHIVED
        self.project.save()

        request = self.factory.post('/api/tasks/')
        request.user = self.admin

        perm = CanCreateTask()
        self.assertTrue(perm.has_project_permission(request, self.project))

    def test_bulk_task_status_update_with_locking(self):
        """Test that bulk updates don't cause race conditions with locking."""
        t1 = Task.objects.create(title='T1', project=self.project)
        t2 = Task.objects.create(title='T2', project=self.project)

        # Simulate bulk update with transaction
        with transaction.atomic():
            Task.objects.filter(project=self.project).update(status=Task.StatusChoices.DONE)

            # Manually trigger signal for each task
            for task in self.project.tasks.all():
                from apps.tasks.signals import auto_archive_project_when_all_tasks_done
                auto_archive_project_when_all_tasks_done(
                    sender=Task, instance=task, created=False
                )

        self.project.refresh_from_db()
        # Should be archived after all tasks are done
        self.assertEqual(self.project.status, Project.StatusChoices.ARCHIVED)
