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
  Folder
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
import { MemberList } from '../../components/projects/MemberList';
import { AddMemberModal } from '../../components/projects/AddMemberModal';
import { projectsAPI } from '../../api/projects';
import { useAuth } from '../../context/AuthContext';

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

  // Ref pour le dropdown
  const exportDropdownRef = useRef(null);

  // Chargement
  useEffect(() => {
    loadProjectData();
    loadMembers();
    loadAvailableUsers();
  }, [id]);

  // Fermer dropdown au clic extérieur
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (exportDropdownRef.current && !exportDropdownRef.current.contains(event.target)) {
        setIsExportDropdownOpen(false);
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
      toast.error('Impossible de charger le projet');
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
      toast.error('Impossible de charger les membres');
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
      toast.error(error.response?.data?.error || 'Impossible d\'ajouter le membre');
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
      toast.error('Impossible de retirer le membre');
    }
  };

  const handleChangeRole = async (userId, newRole) => {
    try {
      await projectsAPI.updateMemberRole(id, userId, newRole);
      toast.success('Rôle modifié avec succès');
      await loadMembers();
    } catch (error) {
      console.error('❌ Erreur changement rôle:', error);
      toast.error('Impossible de modifier le rôle');
    }
  };

  const handleExport = async (format) => {
    try {
      setIsExporting(true);
      setIsExportDropdownOpen(false);

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
        toast.error(`Erreur serveur: ${error.response.status}`);
      } else if (error.message === 'Fichier vide reçu') {
        toast.error('Le fichier exporté est vide');
      } else {
        toast.error('Impossible d\'exporter le projet');
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
      toast.error('Impossible de mettre à jour le projet');
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    try {
      await projectsAPI.delete(id);
      toast.success('Projet supprimé');
      navigate('/projects');
    } catch (error) {
      console.error('❌ Erreur suppression:', error);
      toast.error('Impossible de supprimer le projet');
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
        color: 'bg-neutral-50 text-neutral-700',
        label: 'En planification',
        accent: 'bg-neutral-500',
      },
      active: {
        color: 'bg-green-50 text-green-700',
        label: 'Actif',
        accent: 'bg-green-500',
      },
      on_hold: {
        color: 'bg-amber-50 text-amber-700',
        label: 'En pause',
        accent: 'bg-amber-500',
      },
      completed: {
        color: 'bg-blue-50 text-blue-700',
        label: 'Terminé',
        accent: 'bg-blue-500',
      },
      cancelled: {
        color: 'bg-red-50 text-red-700',
        label: 'Annulé',
        accent: 'bg-red-500',
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

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        
        {/* 🎯 HEADER PREMIUM */}
        <div className="bg-gradient-to-br from-neutral-50 via-white to-neutral-50 rounded-2xl border border-neutral-200 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/projects')}
              className="flex items-center gap-2 px-4 py-2.5 text-neutral-700 font-medium
                       hover:text-neutral-900 hover:bg-neutral-100 rounded-xl
                       transition-all duration-300"
            >
              <ArrowLeft className="w-5 h-5" strokeWidth={2.5} />
              <span>Retour aux projets</span>
            </button>

            <div className="flex items-center gap-3">
              {canViewProjectAnalytics() && (
                <Link
                  to={`/projects/${project.id}/analytics`}
                  className="flex items-center gap-2 px-5 py-2.5 
                           bg-gradient-to-r from-blue-500 to-blue-600 text-white 
                           font-semibold rounded-xl shadow-md
                           hover:shadow-xl hover:shadow-blue-500/30 
                           hover:scale-105 active:scale-95
                           transition-all duration-300"
                >
                  <BarChart3 className="w-4 h-4" strokeWidth={2.5} />
                  Analytics
                </Link>
              )}

              <div className="relative" ref={exportDropdownRef}>
                <button
                  onClick={() => setIsExportDropdownOpen(!isExportDropdownOpen)}
                  disabled={isExporting}
                  className={`
                    flex items-center gap-2 px-5 py-2.5 
                    border-2 border-neutral-200 text-neutral-700 font-semibold
                    rounded-xl transition-all duration-300
                    ${isExporting 
                      ? 'opacity-50 cursor-not-allowed' 
                      : 'hover:border-neutral-900 hover:text-neutral-900 hover:bg-neutral-50'
                    }
                  `}
                >
                  <Download className="w-4 h-4" strokeWidth={2.5} />
                  {isExporting ? 'Export...' : 'Exporter'}
                  <ChevronDown 
                    className={`w-4 h-4 transition-transform duration-200 
                              ${isExportDropdownOpen ? 'rotate-180' : ''}`} 
                    strokeWidth={2.5}
                  />
                </button>

                {isExportDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl 
                                border-2 border-neutral-200 shadow-lg z-50 overflow-hidden">
                    <button
                      onClick={() => handleExport('pdf')}
                      className="w-full px-4 py-3 text-left hover:bg-neutral-50 
                               transition-colors flex items-center gap-3"
                    >
                      <div className="w-2 h-2 rounded-full bg-red-500" />
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-neutral-900">PDF Complet</div>
                        <div className="text-xs text-neutral-500">Rapport détaillé multi-pages</div>
                      </div>
                    </button>

                    <button
                      onClick={() => handleExport('excel')}
                      className="w-full px-4 py-3 text-left hover:bg-neutral-50 
                               transition-colors flex items-center gap-3"
                    >
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-neutral-900">Excel (6 onglets)</div>
                        <div className="text-xs text-neutral-500">Données structurées et éditables</div>
                      </div>
                    </button>

                    <button
                      onClick={() => handleExport('zip')}
                      className="w-full px-4 py-3 text-left hover:bg-neutral-50 
                               transition-colors flex items-center gap-3 rounded-b-xl"
                    >
                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-neutral-900">Archive ZIP</div>
                        <div className="text-xs text-neutral-500">JSON + fichiers attachés</div>
                      </div>
                    </button>
                  </div>
                )}
              </div>

              <button
                onClick={() => setIsEditModalOpen(true)}
                className="flex items-center gap-2 px-5 py-2.5 
                         border-2 border-neutral-200 text-neutral-700 font-semibold
                         rounded-xl hover:border-neutral-900 hover:text-neutral-900 hover:bg-neutral-50
                         transition-all duration-300"
              >
                <Edit className="w-4 h-4" strokeWidth={2.5} />
                Modifier
              </button>

              <button
                onClick={() => setIsDeleteModalOpen(true)}
                className="flex items-center gap-2 px-5 py-2.5 
                         border-2 border-red-200 text-red-600 font-semibold
                         rounded-xl hover:border-red-600 hover:bg-red-50
                         transition-all duration-300"
              >
                <Trash2 className="w-4 h-4" strokeWidth={2.5} />
                Supprimer
              </button>
            </div>
          </div>
        </div>

        {/* 📄 CARTE INFO PROJET */}
        <div className="bg-gradient-to-br from-neutral-50 via-white to-neutral-50 rounded-2xl border border-neutral-200 p-8 shadow-sm">
          <div className="flex items-start gap-6 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-neutral-800 to-neutral-900 
                          flex items-center justify-center shadow-md shadow-neutral-900/20">
              <Folder className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>

            <div className="flex-1">
              <h1 className="text-4xl font-bold text-neutral-900 mb-3">
                {project.name}
              </h1>

              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 
                             text-sm font-semibold rounded-lg ${statusConfig.color}`}>
                <div className={`w-1.5 h-1.5 rounded-full ${statusConfig.accent}`} />
                {statusConfig.label}
              </span>
            </div>
          </div>

          <p className="text-neutral-600 text-lg leading-relaxed mb-6">
            {project.description || 'Aucune description disponible'}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 px-4 py-3 bg-white rounded-xl border border-neutral-200">
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                <Clock className="w-5 h-5 text-blue-600" strokeWidth={2.5} />
              </div>
              <div>
                <div className="text-xs text-neutral-500 font-medium">Début</div>
                <div className="text-sm font-bold text-neutral-900">{formatDate(project.start_date)}</div>
              </div>
            </div>

            <div className="flex items-center gap-3 px-4 py-3 bg-white rounded-xl border border-neutral-200">
              <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center">
                <Target className="w-5 h-5 text-red-600" strokeWidth={2.5} />
              </div>
              <div>
                <div className="text-xs text-neutral-500 font-medium">Échéance</div>
                <div className="text-sm font-bold text-neutral-900">{formatDate(project.end_date)}</div>
              </div>
            </div>

            <div className="flex items-center gap-3 px-4 py-3 bg-white rounded-xl border border-neutral-200">
              <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
                <Users className="w-5 h-5 text-green-600" strokeWidth={2.5} />
              </div>
              <div>
                <div className="text-xs text-neutral-500 font-medium">Équipe</div>
                <div className="text-sm font-bold text-neutral-900">
                  {members.length} membre{members.length > 1 ? 's' : ''}
                </div>
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

        {/* 📋 TÂCHES DU PROJET - CORRECTION ICI */}
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
              {/* 🔧 GRID AVEC AUTO-ROWS ET ITEMS-STRETCH */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 auto-rows-fr">
                {tasks.slice(0, 6).map((task, index) => (
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

              {tasks.length > 6 && (
                <div className="mt-6 pt-6 border-t border-neutral-200 text-center">
                  <p className="text-neutral-500 text-sm">
                    Et <span className="font-bold text-neutral-700">{tasks.length - 6}</span> autre
                    {tasks.length - 6 > 1 ? 's' : ''} tâche{tasks.length - 6 > 1 ? 's' : ''}...
                  </p>
                </div>
              )}
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

        <AddMemberModal
          isOpen={isAddMemberModalOpen}
          onClose={() => setIsAddMemberModalOpen(false)}
          onAddMember={handleAddMember}
          availableUsers={availableUsers}
          existingMembers={members}
          loading={addingMember}
        />
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
