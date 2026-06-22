import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Edit,
  Trash2,
  Calendar,
  Users,
  UserPlus,
  BarChart3,
  Download,
  ChevronDown,
  Clock,
  Target,
  TrendingUp,
  CheckCircle2,
  Folder,
  MoreVertical,
  Plus,
  Check,
  Lock,
  RotateCcw
} from 'lucide-react';
import toast from 'react-hot-toast';

import { Layout } from '../../components/layout/Layout';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { ConfirmModal } from '../../components/common/ConfirmModal';
import { ProjectStats } from '../../components/projects/ProjectStats';
import { TaskCard } from '../../components/tasks/TaskCard';
import { ProjectForm } from '../../components/forms/ProjectForm';
import { TaskForm } from '../../components/forms/TaskForm';
import { MemberList } from '../../components/projects/MemberList';
import { AddMemberModal } from '../../components/projects/AddMemberModal';
import { projectsAPI } from '../../api/projects';
import { Avatar } from '../../components/common/Avatar'; // ✅ AJOUTER
import { useAuth } from '../../context/AuthContext';
import { getApiErrorMessage } from '../../utils/apiError';
import { useStats } from '../../context/StatsContext';
import { tasksAPI } from '../../api/tasks';


export const ProjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();

  // États
  const [project, setProject] = useState(null);
  const [stats, setStats] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [members, setMembers] = useState([]);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [addingMember, setAddingMember] = useState(false);
  const [isExportDropdownOpen, setIsExportDropdownOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isActionsMenuOpen, setIsActionsMenuOpen] = useState(false);
  const [showAllTasks, setShowAllTasks] = useState(false);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isTaskSubmitting, setIsTaskSubmitting] = useState(false);
  const [initialTaskFormData, setInitialTaskFormData] = useState(null);
  const [isIncompleteConfirmOpen, setIsIncompleteConfirmOpen] = useState(false);
  const [pendingStatusToSet, setPendingStatusToSet] = useState(null);
  const [isConfirmingIncomplete, setIsConfirmingIncomplete] = useState(false);

  // Refs
  const exportDropdownRef = useRef(null);
  const actionsMenuRef = useRef(null);
  const statusDropdownRef = useRef(null);

  // Chargement
  useEffect(() => {
    loadProjectData();
    loadMembers();
    loadAvailableUsers();
  }, [id]);

  // Fermer dropdowns au clic extérieur
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (exportDropdownRef.current && !exportDropdownRef.current.contains(event.target)) {
        setIsExportDropdownOpen(false);
      }
      if (actionsMenuRef.current && !actionsMenuRef.current.contains(event.target)) {
        setIsActionsMenuOpen(false);
      }
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target)) {
        setIsStatusDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadProjectData = async () => {
    try {
      setLoading(true);
      const [projectData, statsData, tasksData] = await Promise.all([
        projectsAPI.getById(id),
        projectsAPI.getStats(id),
        projectsAPI.getTasks(id),
      ]);

      setProject(projectData);
      setStats(statsData);

      const tasksList = Array.isArray(tasksData) ? tasksData : (tasksData.results || []);
      setTasks(tasksList);
    } catch (error) {
      console.error('❌ Erreur chargement:', error);
      toast.error(getApiErrorMessage(error, 'Impossible de charger le projet'));
      navigate('/projects');
    } finally {
      setLoading(false);
    }
  };

  const loadMembers = async () => {
    try {
      setLoadingMembers(true);
      const data = await projectsAPI.getMembers(id);
      setMembers(data);
    } catch (error) {
      console.error('❌ Erreur chargement membres:', error);
      toast.error(getApiErrorMessage(error, 'Impossible de charger les membres'));
    } finally {
      setLoadingMembers(false);
    }
  };

  const loadAvailableUsers = async () => {
    try {
      const data = await projectsAPI.getAvailableUsers();
      setAvailableUsers(data);
    } catch (error) {
      console.error('❌ Erreur chargement utilisateurs:', error);
    }
  };

  const handleAddMember = async (userId, role) => {
    try {
      setAddingMember(true);
      await projectsAPI.addMember(id, userId, role);
      toast.success('Membre ajouté avec succès');
      await loadMembers();
      setIsAddMemberModalOpen(false);
    } catch (error) {
      console.error('❌ Erreur ajout membre:', error);
      toast.error(getApiErrorMessage(error, 'Impossible d\'ajouter le membre'));
    } finally {
      setAddingMember(false);
    }
  };

  const handleRemoveMember = async (userId) => {
    try {
      await projectsAPI.removeMember(id, userId);
      toast.success('Membre retiré avec succès');
      await loadMembers();
    } catch (error) {
      console.error('❌ Erreur suppression membre:', error);
      toast.error(getApiErrorMessage(error, 'Impossible de retirer le membre'));
    }
  };

  const handleChangeRole = async (userId, newRole) => {
    try {
      await projectsAPI.updateMemberRole(id, userId, newRole);
      toast.success('Rôle modifié avec succès');
      await loadMembers();
    } catch (error) {
      console.error('❌ Erreur changement rôle:', error);
      toast.error(getApiErrorMessage(error, 'Impossible de modifier le rôle'));
    }
  };

  const handleStatusChange = async (newStatus) => {
    if (newStatus === project.status) {
      setIsStatusDropdownOpen(false);
      return;
    }

    // Si on tente de marquer comme "completed" alors qu'il y a des tâches inachevées,
    // afficher une confirmation à l'utilisateur.
    if (newStatus === 'completed') {
      const incompleteCount = Array.isArray(tasks) ? tasks.filter(t => t.status !== 'done').length : 0;
      if (incompleteCount > 0) {
        setPendingStatusToSet(newStatus);
        setIsIncompleteConfirmOpen(true);
        setIsStatusDropdownOpen(false);
        return;
      }
    }
    try {
      setIsUpdatingStatus(true);
      
      await projectsAPI.update(project.id, {
        ...project,
        status: newStatus
      });
      
      toast.success('Statut mis à jour');
      
      const updatedProject = await projectsAPI.getById(project.id);
      setProject(updatedProject);

      // Met à jour les stats globales (dashboard, login, sidebar)
      try { refreshStats(); } catch (e) { /* noop */ }

      setIsStatusDropdownOpen(false);
      
    } catch (error) {
      console.error('❌ Erreur changement statut:', error);
      toast.error(getApiErrorMessage(error, 'Impossible de changer le statut'));
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const confirmSetStatusDespiteIncompleteTasks = async () => {
    if (!pendingStatusToSet) return;
    try {
      setIsConfirmingIncomplete(true);
      setIsUpdatingStatus(true);

      await projectsAPI.update(project.id, {
        ...project,
        status: pendingStatusToSet
      });

      toast.success('Statut mis à jour');

      const updatedProject = await projectsAPI.getById(project.id);
      setProject(updatedProject);
      setIsIncompleteConfirmOpen(false);
      setPendingStatusToSet(null);
      // Met à jour les stats globaux
      try { refreshStats(); } catch (e) { /* noop */ }
    } catch (error) {
      console.error('❌ Erreur changement statut (confirmation):', error);
      toast.error(getApiErrorMessage(error, 'Impossible de changer le statut'));
    } finally {
      setIsConfirmingIncomplete(false);
      setIsUpdatingStatus(false);
    }
  };

  const handleExport = async (format) => {
    try {
      setIsExporting(true);
      setIsExportDropdownOpen(false);
      setIsActionsMenuOpen(false);

      let blob;
      let extension;

      if (format === 'pdf') {
        blob = await projectsAPI.exportProjectPDF(id);
        extension = 'pdf';
      } else if (format === 'excel') {
        blob = await projectsAPI.exportProjectExcel(id);
        extension = 'xlsx';
      } else if (format === 'zip') {
        blob = await projectsAPI.exportProjectArchive(id);
        extension = 'zip';
      }

      if (!blob || blob.size === 0) {
        throw new Error('Fichier vide reçu');
      }

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      const safeName = project.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      link.download = `projet_${safeName}_${Date.now()}.${extension}`;
      
      document.body.appendChild(link);
      link.click();
      
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 100);

      const formatLabels = { pdf: 'PDF', excel: 'Excel', zip: 'Archive ZIP' };
      toast.success(`Export ${formatLabels[format]} réussi ! 📥`);
      
    } catch (error) {
      console.error('❌ Erreur export:', error);
      if (error.response) {
        toast.error(getApiErrorMessage(error, `Erreur serveur: ${error.response.status}`));
      } else if (error.message === 'Fichier vide reçu') {
        toast.error('Le fichier exporté est vide');
      } else {
        toast.error(getApiErrorMessage(error, 'Impossible d\'exporter le projet'));
      }
    } finally {
      setIsExporting(false);
    }
  };

  const handleUpdate = async (values) => {
    try {
      setUpdating(true);
      await projectsAPI.update(id, values);
      toast.success('Projet mis à jour');
      await loadProjectData();
      setIsEditModalOpen(false);
    } catch (error) {
      console.error('❌ Erreur mise à jour:', error);
      toast.error(getApiErrorMessage(error, 'Impossible de mettre à jour le projet'));
    } finally {
      setUpdating(false);
    }
  };

  const handleTaskSubmit = async (formData) => {
    try {
      setIsTaskSubmitting(true);
      await tasksAPI.create(formData);
      toast.success('Tâche créée avec succès !');
      await loadProjectData();
      // Met à jour les stats globales (dashboard / login etc.)
      try { refreshStats(); } catch (e) { /* noop */ }
      setIsTaskModalOpen(false);
      setInitialTaskFormData(null);
    } catch (error) {
      console.error('❌ Erreur création tâche:', error);
      toast.error(getApiErrorMessage(error, 'Impossible de créer la tâche'));
    } finally {
      setIsTaskSubmitting(false);
    }
  };

  const { refreshStats } = useStats();

  const handleDelete = async () => {
    try {
      await projectsAPI.delete(id);
      toast.success('Projet supprimé');
      navigate('/projects');
    } catch (error) {
      console.error('❌ Erreur suppression:', error);
      toast.error(getApiErrorMessage(error, 'Impossible de supprimer le projet'));
    }
  };

  const handleRestore = async () => {
    try {
      setIsRestoring(true);
      await projectsAPI.restore(id);
      toast.success('Projet restauré');
      await loadProjectData();
      setIsRestoreModalOpen(false);
    } catch (error) {
      console.error('❌ Erreur restauration:', error);
      toast.error(getApiErrorMessage(error, 'Impossible de restaurer le projet'));
    } finally {
      setIsRestoring(false);
    }
  };

  const canViewProjectAnalytics = () => {
    if (!project || !currentUser) return false;
    
    const isAdminOrChef = currentUser?.role === 'admin' || currentUser?.role === 'chef';
    if (isAdminOrChef) return true;
    
    const isOwner = Number(project?.owner?.id) === Number(currentUser?.id);
    if (isOwner) return true;
    
    const myMembership = members?.find(m => Number(m.user?.id) === Number(currentUser.id));
    const isManager = myMembership?.role === 'manager' || 
                      myMembership?.role === 'gestionnaire' ||
                      myMembership?.role === 'owner' ||
                      myMembership?.role === 'proprietaire';
    
    return isManager;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Non définie';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const getStatusConfig = (status) => {
    const configs = {
      planning: {
        label: 'En planification',
        dotColor: 'bg-neutral-500',
        textColor: 'text-neutral-700',
        badgeColor: 'bg-neutral-50 text-neutral-700',
        badgeAccent: 'bg-neutral-500',
      },
      active: {
        label: 'Actif',
        dotColor: 'bg-green-500',
        textColor: 'text-green-700',
        badgeColor: 'bg-green-50 text-green-700',
        badgeAccent: 'bg-green-500',
      },
      on_hold: {
        label: 'En attente',
        dotColor: 'bg-amber-500',
        textColor: 'text-amber-700',
        badgeColor: 'bg-amber-50 text-amber-700',
        badgeAccent: 'bg-amber-500',
      },
      completed: {
        label: 'Terminé',
        dotColor: 'bg-blue-500',
        textColor: 'text-blue-700',
        badgeColor: 'bg-blue-50 text-blue-700',
        badgeAccent: 'bg-blue-500',
      },
      archived: {
        label: 'Archivé',
        dotColor: 'bg-neutral-400',
        textColor: 'text-neutral-700',
        badgeColor: 'bg-neutral-50 text-neutral-700',
        badgeAccent: 'bg-neutral-400',
      },
      cancelled: {
        label: 'Annulé',
        dotColor: 'bg-red-500',
        textColor: 'text-red-700',
        badgeColor: 'bg-red-50 text-red-700',
        badgeAccent: 'bg-red-500',
      },
    };
    return configs[status] || configs.active;
  };

  // Permissions
  const isProjectOwner = currentUser && Number(project?.owner?.id) === Number(currentUser?.id);
  const isAdmin = currentUser && currentUser.role === 'admin';
  const isChef = currentUser && currentUser.role === 'chef';
  const hasOwnerRole = currentUser && members.some(
    member => {
      const isSameUser = Number(member.user?.id) === Number(currentUser.id);
      const isOwnerRole = member.role === 'owner' || 
                          member.role === 'proprietaire' ||
                          member.role === 'Propriétaire';
      return isSameUser && isOwnerRole;
    }
  );
  const isManager = currentUser && members.some(
    member => Number(member.user?.id) === Number(currentUser.id) && 
              (member.role === 'manager' || member.role === 'gestionnaire')
  );
  const isOwner = isProjectOwner || hasOwnerRole;
  const canManageMembers = isOwner || isAdmin || isChef || isManager;

  // Loading
  if (loading) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-neutral-600 text-sm font-medium">Chargement du projet...</p>
        </div>
      </Layout>
    );
  }

  if (!project) {
    return (
      <Layout>
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Folder className="w-8 h-8 text-neutral-400" />
          </div>
          <p className="text-neutral-600 font-medium">Projet introuvable</p>
        </div>
      </Layout>
    );
  }

  const statusConfig = getStatusConfig(project.status);

  // Détecte si le projet est considéré comme terminé
  const isCompleted = project && (
    project.status === 'done' || project.status === 'completed' || (project.progress && project.progress >= 100)
  );

  // Liste des statuts pour le dropdown
  const allStatuses = [
    { value: 'active', ...getStatusConfig('active') },
    { value: 'on_hold', ...getStatusConfig('on_hold') },
    { value: 'completed', ...getStatusConfig('completed') },
    { value: 'archived', ...getStatusConfig('archived') },
  ];

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        
        {/* 🧭 HEADER STICKY AVEC BREADCRUMBS */}
        <div className="sticky top-0 z-40 -mx-6 px-6 py-4 
                      bg-white/70 backdrop-blur-xl 
                      border-b border-neutral-200/50 
                      rounded-b-2xl shadow-sm mb-6">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            
            {/* Breadcrumbs */}
            <nav className="flex items-center gap-2 text-sm flex-1 min-w-0">
              <button
                onClick={() => navigate('/projects')}
                className="text-neutral-600 hover:text-neutral-900 font-medium
                         transition-colors duration-200"
              >
                Projets
              </button>
              <span className="text-neutral-400 select-none">/</span>
              <span className="text-neutral-900 font-semibold truncate">
                {project?.name}
              </span>
            </nav>

            {/* Quick Actions: Dropdown Statut + Menu 3 points */}
            <div className="flex items-center gap-2">
              
              {/* 🎯 DROPDOWN STATUT (Quick Action) */}
              <div className="relative" ref={statusDropdownRef}>
                <button
                  onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                  disabled={isUpdatingStatus}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg 
                             text-sm font-medium text-neutral-700
                             bg-white border border-neutral-200
                             hover:bg-neutral-50 hover:border-neutral-300
                             transition-all duration-200
                             ${isUpdatingStatus ? 'opacity-50 cursor-not-allowed' : ''}
                             group`}
                >
                  <span>Statut</span>
                  <ChevronDown 
                    className={`w-4 h-4 text-neutral-500 transition-transform duration-200 
                             ${isStatusDropdownOpen ? 'rotate-180' : ''}`} 
                    strokeWidth={2} 
                  />
                </button>

                {/* Dropdown Menu */}
                {isStatusDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 
                                bg-white
                                rounded-lg border border-neutral-200
                                shadow-lg
                                z-50 overflow-hidden py-1
                                animate-in fade-in slide-in-from-top-2 duration-200">
                    
                    {allStatuses.map((status) => (
                      <button
                        key={status.value}
                        onClick={() => handleStatusChange(status.value)}
                        disabled={project.status === status.value || isUpdatingStatus}
                        className={`w-full flex items-center gap-3 px-4 py-2.5
                                 transition-colors duration-150
                                 ${project.status === status.value 
                                   ? 'bg-neutral-50' 
                                   : 'hover:bg-neutral-50'}
                                 ${isUpdatingStatus ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <span className={`w-2 h-2 rounded-full ${status.dotColor}`} />
                        <span className={`flex-1 text-left text-sm font-medium ${status.textColor}`}>
                          {status.label}
                        </span>
                        {project.status === status.value && (
                          <CheckCircle2 className="w-4 h-4 text-green-600" strokeWidth={2} />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Menu Actions (3 points) */}
              <div className="relative" ref={actionsMenuRef}>
                <button
                  onClick={() => setIsActionsMenuOpen(!isActionsMenuOpen)}
                  className="p-2.5 hover:bg-white/60 rounded-xl transition-all duration-200
                           group relative"
                  aria-label="Actions du projet"
                >
                  <MoreVertical className="w-5 h-5 text-neutral-600 group-hover:text-neutral-900" strokeWidth={2.5} />
                </button>

                {/* Dropdown Actions */}
                {isActionsMenuOpen && (
                  <div className="absolute right-0 mt-2 w-64 
                                bg-white/95 backdrop-blur-xl
                                rounded-2xl border border-neutral-200/50
                                shadow-xl shadow-neutral-900/10
                                z-50 overflow-hidden py-2
                                animate-in fade-in slide-in-from-top-2 duration-200">
                    
                    {/* Analytics */}
                    {canViewProjectAnalytics() && (
                      <Link
                        to={`/projects/${project.id}/analytics`}
                        className="flex items-center gap-3 px-4 py-3
                                 hover:bg-neutral-50 transition-all duration-200
                                 group"
                        onClick={() => setIsActionsMenuOpen(false)}
                      >
                        <BarChart3 className="w-5 h-5 text-neutral-400 group-hover:text-blue-600 
                                            transition-colors flex-shrink-0" strokeWidth={2} />
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-neutral-900 text-sm">Analytics</div>
                          <div className="text-xs text-neutral-500">Statistiques avancées</div>
                        </div>
                      </Link>
                    )}

                    {/* Exporter */}
                    <div className="relative" ref={exportDropdownRef}>
                      <button
                        onClick={() => setIsExportDropdownOpen(!isExportDropdownOpen)}
                        disabled={isExporting}
                        className="w-full flex items-center gap-3 px-4 py-3
                                 hover:bg-neutral-50 transition-all duration-200 text-left
                                 group"
                      >
                        <Download className="w-5 h-5 text-neutral-400 group-hover:text-green-600 
                                          transition-colors flex-shrink-0" strokeWidth={2} />
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-neutral-900 text-sm">
                            {isExporting ? 'Export en cours...' : 'Exporter'}
                          </div>
                          <div className="text-xs text-neutral-500">PDF, Excel ou ZIP</div>
                        </div>
                        <ChevronDown 
                          className={`w-4 h-4 text-neutral-400 flex-shrink-0
                                    transition-transform duration-200
                                    ${isExportDropdownOpen ? 'rotate-180' : ''}`}
                          strokeWidth={2}
                        />
                      </button>

                      {/* Sous-menu Export */}
                      {isExportDropdownOpen && (
                        <div className="bg-neutral-50/50 py-1.5 px-2 mx-2 rounded-lg space-y-0.5">
                          <button
                            onClick={() => handleExport('pdf')}
                            className="w-full flex items-center gap-2.5 px-3 py-2
                                     hover:bg-white rounded-md transition-colors text-left
                                     group"
                          >
                            <div className="w-1 h-1 rounded-full bg-neutral-300 group-hover:bg-red-500 
                                          transition-colors flex-shrink-0" />
                            <span className="text-sm text-neutral-600 group-hover:text-neutral-900 
                                           font-medium transition-colors">
                              PDF Complet
                            </span>
                          </button>
                          <button
                            onClick={() => handleExport('excel')}
                            className="w-full flex items-center gap-2.5 px-3 py-2
                                     hover:bg-white rounded-md transition-colors text-left
                                     group"
                          >
                            <div className="w-1 h-1 rounded-full bg-neutral-300 group-hover:bg-green-500 
                                          transition-colors flex-shrink-0" />
                            <span className="text-sm text-neutral-600 group-hover:text-neutral-900 
                                           font-medium transition-colors">
                              Excel (6 onglets)
                            </span>
                          </button>
                          <button
                            onClick={() => handleExport('zip')}
                            className="w-full flex items-center gap-2.5 px-3 py-2
                                     hover:bg-white rounded-md transition-colors text-left
                                     group"
                          >
                            <div className="w-1 h-1 rounded-full bg-neutral-300 group-hover:bg-blue-500 
                                          transition-colors flex-shrink-0" />
                            <span className="text-sm text-neutral-600 group-hover:text-neutral-900 
                                           font-medium transition-colors">
                              Archive ZIP
                            </span>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Séparateur */}
                    <div className="h-px bg-neutral-200 my-2 mx-4" />

                    {/* Modifier */}
                    <button
                      onClick={() => {
                        setIsEditModalOpen(true);
                        setIsActionsMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3
                               hover:bg-neutral-50 transition-all duration-200
                               group"
                    >
                      <Edit className="w-5 h-5 text-neutral-400 group-hover:text-orange-600
                                    transition-colors flex-shrink-0" strokeWidth={2} />
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-neutral-900 text-sm">Modifier</div>
                        <div className="text-xs text-neutral-500">Éditer les informations</div>
                      </div>
                    </button>

                    {/* Restaurer (RG-29) - Visible seulement si archivé ET admin */}
                    {project?.status === 'archived' && currentUser?.role === 'admin' && (
                      <>
                        <div className="h-px bg-neutral-200 my-2 mx-4" />
                        <button
                          onClick={() => {
                            setIsRestoreModalOpen(true);
                            setIsActionsMenuOpen(false);
                          }}
                          className="w-full flex items-center gap-3 px-4 py-3
                                   hover:bg-blue-50/50 transition-all duration-200
                                   group"
                        >
                          <RotateCcw className="w-5 h-5 text-neutral-400 group-hover:text-blue-600
                                              transition-colors flex-shrink-0" strokeWidth={2} />
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-neutral-900 group-hover:text-blue-700
                                         text-sm transition-colors">Restaurer</div>
                            <div className="text-xs text-neutral-500 group-hover:text-blue-500
                                         transition-colors">Déverrouiller les modifications</div>
                          </div>
                        </button>
                        <div className="h-px bg-neutral-200 my-2 mx-4" />
                      </>
                    )}

                    {/* Supprimer */}
                    <button
                      onClick={() => {
                        setIsDeleteModalOpen(true);
                        setIsActionsMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3
                               hover:bg-red-50/50 transition-all duration-200
                               group"
                    >
                      <Trash2 className="w-5 h-5 text-neutral-400 group-hover:text-red-600 
                                      transition-colors flex-shrink-0" strokeWidth={2} />
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-neutral-900 group-hover:text-red-700 
                                     text-sm transition-colors">Supprimer</div>
                        <div className="text-xs text-neutral-500 group-hover:text-red-500 
                                     transition-colors">Action irréversible</div>
                      </div>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 📄 CARTE INFO PROJET */}
        <div className="bg-gradient-to-br from-neutral-50 via-white to-neutral-50 rounded-2xl border border-neutral-200 p-8 shadow-sm">
          
          <div className="flex items-start gap-6 mb-6">
            <div className="flex items-start gap-4 flex-1 min-w-0">
              {/* Icône projet */}
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-neutral-800 to-neutral-900 
                            flex items-center justify-center shadow-md shadow-neutral-900/20 flex-shrink-0
                            group-hover:scale-110 transition-transform duration-300">
                <Folder className="w-6 h-6 text-white" strokeWidth={2.5} />
              </div>

              {/* Titre + Badge */}
              <div className="flex-1 min-w-0">
                <h1 className="text-4xl font-bold text-neutral-900 mb-3 break-words">
                  {project.name}
                </h1>

                {/* Badge statut */}
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 
                               text-sm font-semibold rounded-lg ${statusConfig.badgeColor}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${statusConfig.badgeAccent}`} />
                  {statusConfig.label}
                </span>
              </div>
            </div>
          </div>

          {/* Description */}
          <p className="text-neutral-800 text-base leading-relaxed mb-6">
            {project.description || 'Aucune description disponible'}
          </p>

          {/* Grid infos */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Carte Début */}
            <div className="flex items-center gap-3 px-4 py-3 bg-white rounded-xl border border-neutral-200
                          hover:border-blue-200 hover:shadow-sm transition-all duration-300 group">
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center
                            group-hover:scale-110 transition-transform duration-300">
                <Clock className="w-5 h-5 text-blue-600" strokeWidth={2.5} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs text-neutral-500 font-medium">Début</div>
                <div className="text-sm font-bold text-neutral-900">{formatDate(project.start_date)}</div>
                {project.start_date && (
                  <div className="text-xs text-neutral-400 mt-0.5">
                    {(() => {
                      const startDate = new Date(project.start_date);
                      const now = new Date();
                      const diffTime = startDate - now;
                      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                      
                      if (diffDays > 0) return `Dans ${diffDays} jour${diffDays > 1 ? 's' : ''}`;
                      if (diffDays === 0) return "Aujourd'hui";
                      return `Il y a ${Math.abs(diffDays)} jour${Math.abs(diffDays) > 1 ? 's' : ''}`;
                    })()}
                  </div>
                )}
              </div>
            </div>

            {/* Carte Échéance */}
            <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-300 group
                           ${(() => {
                             if (!project.end_date) return 'bg-white border-neutral-200 hover:border-red-200';
                             if (isCompleted) return 'bg-white border-neutral-200 hover:border-red-200';
                             const endDate = new Date(project.end_date);
                             const now = new Date();
                             const diffDays = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));
                             
                             if (diffDays < 0) return 'bg-red-50 border-red-200 hover:border-red-300';
                             if (diffDays <= 7) return 'bg-amber-50 border-amber-200 hover:border-amber-300';
                             return 'bg-white border-neutral-200 hover:border-red-200';
                           })()}`}>
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center
                             group-hover:scale-110 transition-transform duration-300
                             ${(() => {
                               if (!project.end_date) return 'bg-red-50';
                               if (isCompleted) return 'bg-green-50';
                               const endDate = new Date(project.end_date);
                               const now = new Date();
                               const diffDays = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));
                                
                               if (diffDays < 0) return 'bg-red-100';
                               if (diffDays <= 7) return 'bg-amber-100';
                               return 'bg-red-50';
                             })()}`}>
                <Target className={`w-5 h-5 ${(() => {
                  if (!project.end_date) return 'text-red-600';
                  if (isCompleted) return 'text-green-700';
                  const endDate = new Date(project.end_date);
                  const now = new Date();
                  const diffDays = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));
                  
                  if (diffDays < 0) return 'text-red-700';
                  if (diffDays <= 7) return 'text-amber-700';
                  return 'text-red-600';
                })()}`} strokeWidth={2.5} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs text-neutral-500 font-medium">Échéance</div>
                <div className="text-sm font-bold text-neutral-900">{formatDate(project.end_date)}</div>
                {project.end_date && (
                  <div className={`text-xs mt-0.5 font-medium ${(() => {
                    const endDate = new Date(project.end_date);
                    const now = new Date();
                    const diffDays = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));
                    
                    if (isCompleted) return 'text-green-600';
                    if (diffDays < 0) return 'text-red-600';
                    if (diffDays <= 7) return 'text-amber-600';
                    return 'text-neutral-400';
                  })()}`}>
                    {(() => {
                      const endDate = new Date(project.end_date);
                      const now = new Date();
                      const diffDays = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));
                      
                      if (isCompleted) return `✓ Terminé`;
                      if (diffDays < 0) return `⚠️ En retard de ${Math.abs(diffDays)} jour${Math.abs(diffDays) > 1 ? 's' : ''}`;
                      if (diffDays === 0) return "⏰ Aujourd'hui !";
                      if (diffDays <= 7) return `⚡ Dans ${diffDays} jour${diffDays > 1 ? 's' : ''}`;
                      return `Dans ${diffDays} jour${diffDays > 1 ? 's' : ''}`;
                    })()}
                  </div>
                )}
              </div>
            </div>

{/* Carte Équipe */}
<div className="flex items-center gap-3 px-4 py-3 bg-white rounded-xl border border-neutral-200
              hover:border-green-200 hover:shadow-sm transition-all duration-300 group">
  <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center
                group-hover:scale-110 transition-transform duration-300">
    <Users className="w-5 h-5 text-green-600" strokeWidth={2.5} />
  </div>
  <div className="flex-1 min-w-0">
    <div className="text-xs text-neutral-500 font-medium mb-1">Équipe</div>
    
    {members.length > 0 ? (
      <div className="flex items-center gap-2">
        <div className="flex -space-x-2">
          {members.slice(0, 4).map((member, idx) => (
            <Avatar
              key={member.user?.id || idx}
              avatarUrl={member.user?.avatar_url}
              name={member.user?.full_name || member.user?.username}
              size="sm"
              showBorder={true}
              className="hover:scale-110 hover:z-10 transition-transform duration-200 cursor-pointer"
            />
          ))}
          {members.length > 4 && (
            <div className="w-7 h-7 rounded-full bg-neutral-200
                         flex items-center justify-center text-neutral-600 text-xs font-bold 
                         border-2 border-white shadow-sm">
              +{members.length - 4}
            </div>
          )}
        </div>
        <span className="text-xs text-neutral-600 font-semibold">
          {members.length} membre{members.length > 1 ? 's' : ''}
        </span>
      </div>
    ) : (
      <div className="text-sm font-bold text-neutral-400">Aucun membre</div>
    )}
  </div>
</div>


          </div>
        </div>

        {/* 📊 STATISTIQUES */}
        <ProjectStats stats={stats} />

        {/* 👥 MEMBRES DU PROJET */}
        <div className="bg-white rounded-2xl border border-neutral-200 p-8 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-neutral-800 to-neutral-900 
                            flex items-center justify-center shadow-md shadow-neutral-900/20">
                <Users className="w-5 h-5 text-white" strokeWidth={2.5} />
              </div>
              <h2 className="text-2xl font-bold text-neutral-900">
                Membres du Projet ({members.length})
              </h2>
            </div>
            
            {canManageMembers && (
              <button
                onClick={() => setIsAddMemberModalOpen(true)}
                className="flex items-center gap-2 px-5 py-2.5 
                         bg-gradient-to-r from-orange-500 to-orange-600 
                         text-white font-semibold rounded-xl shadow-md
                         hover:shadow-xl hover:shadow-orange-500/30 
                         hover:scale-105 active:scale-95
                         transition-all duration-300"
              >
                <UserPlus className="w-4 h-4" strokeWidth={2.5} />
                Ajouter un membre
              </button>
            )}
          </div>

          <MemberList
            members={members}
            canManageMembers={canManageMembers}
            isOwner={isOwner || isAdmin || isChef}
            onRemoveMember={handleRemoveMember}
            onChangeRole={handleChangeRole}
            loading={loadingMembers}
          />
        </div>

        {/* 📋 TÂCHES DU PROJET */}
        <div className="bg-white rounded-2xl border border-neutral-200 p-8 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-neutral-800 to-neutral-900 
                            flex items-center justify-center shadow-md shadow-neutral-900/20">
                <CheckCircle2 className="w-5 h-5 text-white" strokeWidth={2.5} />
              </div>
              <h2 className="text-2xl font-bold text-neutral-900">
                Tâches du Projet ({tasks.length})
              </h2>
            </div>
            
            <button
              onClick={() => navigate(`/tasks?project=${id}`)}
              className="flex items-center gap-2 px-5 py-2.5 
                       border-2 border-neutral-200 text-neutral-700 font-semibold
                       rounded-xl hover:border-neutral-900 hover:text-neutral-900 hover:bg-neutral-50
                       transition-all duration-300"
            >
              <TrendingUp className="w-4 h-4" strokeWidth={2.5} />
              Voir toutes les tâches
            </button>
          </div>

          {tasks.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-neutral-400" />
              </div>
              <p className="text-neutral-600 font-medium mb-2">Aucune tâche pour le moment</p>
              <p className="text-neutral-400 text-sm">Les tâches apparaîtront ici une fois créées</p>
            </div>
          ) : (
            <>
              {(() => {
                const DISPLAY_LIMIT = 6;
                const hasMore = tasks.length > DISPLAY_LIMIT;
                const displayedTasks = showAllTasks ? tasks : tasks.slice(0, DISPLAY_LIMIT);
                const remainingCount = tasks.length - DISPLAY_LIMIT;

                return (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 auto-rows-fr">
                      {displayedTasks.map((task, index) => (
                        <TaskCard
                          key={task.id}
                          task={task}
                          onEdit={() => {}}
                          onDelete={() => {}}
                          style={{
                            animation: `fadeInUp 0.4s ease-out ${index * 0.05}s both`
                          }}
                        />
                      ))}
                    </div>

                    {hasMore && (
                      <button
                        onClick={() => setShowAllTasks(!showAllTasks)}
                        className="w-full mt-6 py-2.5 px-4 
                                 border-2 border-neutral-200 text-neutral-700 
                                 font-medium text-sm rounded-xl
                                 hover:border-neutral-300 hover:bg-neutral-50
                                 transition-all duration-200
                                 flex items-center justify-center gap-2"
                      >
                        {showAllTasks ? (
                          <>
                            <ChevronDown className="w-4 h-4 rotate-180 transition-transform" strokeWidth={2.5} />
                            <span>Voir moins</span>
                          </>
                        ) : (
                          <>
                            <ChevronDown className="w-4 h-4 transition-transform" strokeWidth={2.5} />
                            <span>Voir {remainingCount} autre{remainingCount > 1 ? 's' : ''} tâche{remainingCount > 1 ? 's' : ''}</span>
                          </>
                        )}
                      </button>
                    )}
                  </>
                );
              })()}
            </>
          )}
        </div>

        {/* MODALS */}
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          title="Modifier le projet"
        >
          <ProjectForm
            initialData={project}
            onSubmit={handleUpdate}
            onCancel={() => setIsEditModalOpen(false)}
            isLoading={updating}
          />
        </Modal>

        <ConfirmModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={handleDelete}
          title="Supprimer le projet"
          message={`Êtes-vous sûr de vouloir supprimer "${project.name}" ? Cette action est irréversible et supprimera aussi toutes les tâches associées.`}
          confirmText="Supprimer"
          variant="danger"
        />

        <ConfirmModal
          isOpen={isRestoreModalOpen}
          onClose={() => setIsRestoreModalOpen(false)}
          onConfirm={handleRestore}
          title="Restaurer le projet"
          message={`Êtes-vous sûr de vouloir restaurer "${project?.name}" ? Le projet pourra de nouveau être modifié.`}
          confirmText="Restaurer"
          isLoading={isRestoring}
        />

        <ConfirmModal
          isOpen={isIncompleteConfirmOpen}
          onClose={() => { setIsIncompleteConfirmOpen(false); setPendingStatusToSet(null); }}
          onConfirm={confirmSetStatusDespiteIncompleteTasks}
          title="Tâches non terminées"
          message={`Ce projet contient encore ${Array.isArray(tasks) ? tasks.filter(t => t.status !== 'done').length : 0} tâche(s) non terminée(s). Voulez-vous vraiment le marquer comme terminé ?`}
          confirmText="Accepter"
          cancelText="Annuler"
          isLoading={isConfirmingIncomplete}
          variant="warning"
        />

        <AddMemberModal
          isOpen={isAddMemberModalOpen}
          onClose={() => setIsAddMemberModalOpen(false)}
          onAddMember={handleAddMember}
          availableUsers={availableUsers}
          existingMembers={members}
          loading={addingMember}
        />

        <Modal
          isOpen={isTaskModalOpen}
          onClose={() => setIsTaskModalOpen(false)}
          title="Créer une nouvelle tâche"
        >
          <TaskForm
            onSubmit={handleTaskSubmit}
            onCancel={() => setIsTaskModalOpen(false)}
            initialData={initialTaskFormData}
            isLoading={isTaskSubmitting}
          />
        </Modal>

        {/* FAB - FLOATING ACTION BUTTON */}
        <button
          onClick={() => {
            setInitialTaskFormData({ project: id });
            setIsTaskModalOpen(true);
          }}
          className="fixed bottom-8 right-8 z-50
                   w-14 h-14 
                   bg-gradient-to-br from-orange-500 to-orange-600
                   text-white rounded-full
                   shadow-2xl shadow-orange-500/40
                   hover:shadow-3xl hover:shadow-orange-500/50
                   hover:scale-110 active:scale-95
                   transition-all duration-300
                   flex items-center justify-center
                   group"
          title="Créer une nouvelle tâche"
          aria-label="Créer une nouvelle tâche"
        >
          <Plus 
            className="w-7 h-7 group-hover:rotate-90 transition-transform duration-300" 
            strokeWidth={3} 
          />
        </button>
      </div>

      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(15px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </Layout>
  );
};

export default ProjectDetail;
