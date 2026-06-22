import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Edit, Trash2, Calendar, User, 
  FolderOpen, Flag, Clock, Paperclip,
  MoreVertical, ChevronDown, CheckCircle2,
  FileText, AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

// Imports composants
import { Layout } from '../../components/layout/Layout';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { ConfirmModal } from '../../components/common/ConfirmModal';
import { TaskForm } from '../../components/forms/TaskForm';
import { CommentSection } from '../../components/tasks/CommentSection';
import AttachmentList from '../../components/tasks/AttachmentList';
import AttachmentUploader from '../../components/tasks/AttachmentUploader';

// Import API
import { tasksAPI } from '../../api/tasks';

// Import des permissions et du contexte Auth
import { canModifyTask, canDeleteTask, canChangeTaskStatus } from '../../utils/permissions';
import { Avatar } from '../../components/common/Avatar';
import { useAuth } from '../../context/AuthContext';
import { getApiErrorMessage } from '../../utils/apiError';

export const TaskDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  // États
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [attachmentsRefresh, setAttachmentsRefresh] = useState(0);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [isActionsMenuOpen, setIsActionsMenuOpen] = useState(false);

  // Refs
  const actionsMenuRef = useRef(null);
  const statusDropdownRef = useRef(null);

  // Chargement
  useEffect(() => {
    loadTask();
  }, [id]);

  // Fermer menus au clic extérieur
  useEffect(() => {
    const handleClickOutside = (event) => {
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

  const loadTask = async () => {
    try {
      setLoading(true);
      const data = await tasksAPI.getById(id);
      setTask(data);
    } catch (error) {
      console.error('❌ Erreur chargement:', error);
      toast.error(getApiErrorMessage(error, 'Impossible de charger la tâche'));
      navigate('/tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (values) => {
    try {
      setUpdating(true);
      await tasksAPI.update(id, values);
      toast.success('Tâche mise à jour');
      await loadTask();
      setIsEditModalOpen(false);
    } catch (error) {
      console.error('❌ Erreur mise à jour:', error);
      toast.error(getApiErrorMessage(error, 'Impossible de mettre à jour la tâche'));
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    try {
      await tasksAPI.delete(id);
      toast.success('Tâche supprimée');
      navigate('/tasks');
    } catch (error) {
      console.error('❌ Erreur suppression:', error);
      toast.error(getApiErrorMessage(error, 'Impossible de supprimer la tâche'));
    }
  };

  const handleChangeStatus = async (newStatus) => {
    try {
      setUpdating(true);
      await tasksAPI.changeStatus(id, newStatus);
      toast.success('Statut mis à jour');
      await loadTask();
      setIsStatusDropdownOpen(false);
    } catch (error) {
      console.error('❌ Erreur changement statut:', error);
      toast.error(getApiErrorMessage(error, 'Impossible de mettre à jour le statut'));
    } finally {
      setUpdating(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Non définie';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  // Configuration pour le dropdown statut (minimaliste)
  const getStatusConfig = (status) => {
    const configs = {
      todo: {
        label: 'À faire',
        dotColor: 'bg-neutral-500',
        textColor: 'text-neutral-700',
        badgeColor: 'bg-neutral-50 text-neutral-700',
        badgeAccent: 'bg-neutral-500',
      },
      in_progress: {
        label: 'En cours',
        dotColor: 'bg-blue-500',
        textColor: 'text-blue-700',
        badgeColor: 'bg-blue-50 text-blue-700',
        badgeAccent: 'bg-blue-500',
      },
      in_review: {
        label: 'En révision',
        dotColor: 'bg-amber-500',
        textColor: 'text-amber-700',
        badgeColor: 'bg-amber-50 text-amber-700',
        badgeAccent: 'bg-amber-500',
      },
      done: {
        label: 'Terminé',
        dotColor: 'bg-green-500',
        textColor: 'text-green-700',
        badgeColor: 'bg-green-50 text-green-700',
        badgeAccent: 'bg-green-500',
      },
    };
    return configs[status] || configs.todo;
  };

  const getPriorityConfig = (priority) => {
    const configs = {
      low: {
        color: 'bg-green-50 text-green-700',
        label: 'Faible',
        accent: 'bg-green-500',
      },
      medium: {
        color: 'bg-amber-50 text-amber-700',
        label: 'Moyenne',
        accent: 'bg-amber-500',
      },
      high: {
        color: 'bg-red-50 text-red-700',
        label: 'Urgente',
        accent: 'bg-red-500',
      },
    };
    return configs[priority] || configs.medium;
  };

  // Loading
  if (loading) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-neutral-600 text-sm font-medium">Chargement de la tâche...</p>
        </div>
      </Layout>
    );
  }

  if (!task) {
    return (
      <Layout>
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-neutral-400" />
          </div>
          <p className="text-neutral-600 font-medium">Tâche introuvable</p>
        </div>
      </Layout>
    );
  }

  const statusConfig = getStatusConfig(task.status);
  const priorityConfig = getPriorityConfig(task.priority);

  const allStatuses = [
    { value: 'todo', ...getStatusConfig('todo') },
    { value: 'in_progress', ...getStatusConfig('in_progress') },
    { value: 'in_review', ...getStatusConfig('in_review') },
    { value: 'done', ...getStatusConfig('done') },
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
                onClick={() => navigate('/tasks')}
                className="text-neutral-600 hover:text-neutral-900 font-medium
                         transition-colors duration-200"
              >
                Tâches
              </button>
              <span className="text-neutral-400 select-none">/</span>
              <span className="text-neutral-900 font-semibold truncate">
                {task?.title}
              </span>
            </nav>

            {/* Quick Actions: Dropdown Statut + Menu 3 points */}
            <div className="flex items-center gap-2">
              
              {/* 🎯 DROPDOWN STATUT (Quick Action) */}
              {canChangeTaskStatus(user, task) && (
                <div className="relative" ref={statusDropdownRef}>
                  <button
                    onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                    disabled={updating}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg 
                               text-sm font-medium text-neutral-700
                               bg-white border border-neutral-200
                               hover:bg-neutral-50 hover:border-neutral-300
                               transition-all duration-200
                               ${updating ? 'opacity-50 cursor-not-allowed' : ''}
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
                          onClick={() => handleChangeStatus(status.value)}
                          disabled={task.status === status.value || updating}
                          className={`w-full flex items-center gap-3 px-4 py-2.5
                                   transition-colors duration-150
                                   ${task.status === status.value 
                                     ? 'bg-neutral-50' 
                                     : 'hover:bg-neutral-50'}
                                   ${updating ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          <span className={`w-2 h-2 rounded-full ${status.dotColor}`} />
                          <span className={`flex-1 text-left text-sm font-medium ${status.textColor}`}>
                            {status.label}
                          </span>
                          {task.status === status.value && (
                            <CheckCircle2 className="w-4 h-4 text-green-600" strokeWidth={2} />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Menu Actions (3 points) */}
              <div className="relative" ref={actionsMenuRef}>
                <button
                  onClick={() => setIsActionsMenuOpen(!isActionsMenuOpen)}
                  className="p-2.5 hover:bg-white/60 rounded-xl transition-all duration-200
                           group relative"
                  aria-label="Actions de la tâche"
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
                    
                    {/* Modifier */}
                    {canModifyTask(user, task) && (
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
                          <div className="text-xs text-neutral-500">Éditer la tâche</div>
                        </div>
                      </button>
                    )}

                    {/* Séparateur */}
                    {canModifyTask(user, task) && canDeleteTask(user, task) && (
                      <div className="h-px bg-neutral-200 my-2 mx-4" />
                    )}

                    {/* Supprimer */}
                    {canDeleteTask(user, task) && (
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
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 📄 CARTE INFO TÂCHE */}
        <div className="bg-gradient-to-br from-neutral-50 via-white to-neutral-50 rounded-2xl border border-neutral-200 p-8 shadow-sm">
          
          <div className="flex items-start gap-6 mb-6">
            <div className="flex items-start gap-4 flex-1 min-w-0">
              {/* Icône tâche */}
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-neutral-800 to-neutral-900 
                            flex items-center justify-center shadow-md shadow-neutral-900/20 flex-shrink-0
                            group-hover:scale-110 transition-transform duration-300">
                <CheckCircle2 className="w-6 h-6 text-white" strokeWidth={2.5} />
              </div>

              {/* Titre + Badges */}
              <div className="flex-1 min-w-0">
                <h1 className="text-4xl font-bold text-neutral-900 mb-3 break-words">
                  {task.title}
                </h1>

                {/* Badges Status + Priorité */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 
                                 text-sm font-semibold rounded-lg ${statusConfig.badgeColor}`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${statusConfig.badgeAccent}`} />
                    {statusConfig.label}
                  </span>

                  <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 
                                 text-sm font-semibold rounded-lg ${priorityConfig.color}`}>
                    <Flag className="w-3.5 h-3.5" strokeWidth={2.5} />
                    {priorityConfig.label}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="mb-6">
            <h2 className="text-sm font-semibold text-neutral-500 mb-2">Description</h2>
            <p className="text-neutral-800 text-base leading-relaxed whitespace-pre-wrap">
              {task.description || 'Aucune description disponible'}
            </p>
          </div>

          {/* Grid infos : Projet, Assigné, Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Projet */}
            <div className="flex items-center gap-3 px-4 py-3 bg-white rounded-xl border border-neutral-200
                          hover:border-orange-200 hover:shadow-sm transition-all duration-300 group">
              <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center
                            group-hover:scale-110 transition-transform duration-300">
                <FolderOpen className="w-5 h-5 text-orange-600" strokeWidth={2.5} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs text-neutral-500 font-medium">Projet</div>
                <div className="text-sm font-bold text-neutral-900">
                  {task.project?.name || 'Non assigné'}
                </div>
              </div>
            </div>

{/* Assigné à */}
<div className="flex items-center gap-3 px-4 py-3 bg-white rounded-xl border border-neutral-200
              hover:border-blue-200 hover:shadow-sm transition-all duration-300 group">
  {task.assigned_to ? (
    <>
      <Avatar
        avatarUrl={task.assigned_to.avatar_url}
        name={task.assigned_to.full_name || task.assigned_to.username}
        size="md"
        showBorder={true}
        className="group-hover:scale-110 transition-transform duration-300"
      />
      <div className="flex-1 min-w-0">
        <div className="text-xs text-neutral-500 font-medium">Assigné à</div>
        <div className="text-sm font-bold text-neutral-900 truncate">
          {task.assigned_to.full_name || task.assigned_to.username}
        </div>
        {task.assigned_to.email && (
          <div className="text-xs text-neutral-500 truncate">
            {task.assigned_to.email}
          </div>
        )}
      </div>
    </>
  ) : (
    <>
      <div className="w-10 h-10 rounded-lg bg-neutral-50 flex items-center justify-center
                   group-hover:scale-110 transition-transform duration-300">
        <User className="w-5 h-5 text-neutral-400" strokeWidth={2.5} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs text-neutral-500 font-medium">Assigné à</div>
        <div className="text-sm font-bold text-neutral-400 italic">Non assigné</div>
      </div>
    </>
  )}
</div>


            {/* Date de début */}
            {task.start_date && (
              <div className="flex items-center gap-3 px-4 py-3 bg-white rounded-xl border border-neutral-200
                            hover:border-green-200 hover:shadow-sm transition-all duration-300 group">
                <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center
                              group-hover:scale-110 transition-transform duration-300">
                  <Calendar className="w-5 h-5 text-green-600" strokeWidth={2.5} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-neutral-500 font-medium">Début</div>
                  <div className="text-sm font-bold text-neutral-900">
                    {formatDate(task.start_date)}
                  </div>
                </div>
              </div>
            )}

            {/* Date limite avec alerte */}
            <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-300 group
                           ${(() => {
                             if (!task.due_date) return 'bg-white border-neutral-200 hover:border-red-200';
                             const dueDate = new Date(task.due_date);
                             const now = new Date();
                             const diffDays = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));
                             
                             if (diffDays < 0 && task.status !== 'done') return 'bg-red-50 border-red-200 hover:border-red-300';
                             if (diffDays <= 3 && task.status !== 'done') return 'bg-amber-50 border-amber-200 hover:border-amber-300';
                             return 'bg-white border-neutral-200 hover:border-red-200';
                           })()}`}>
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center
                             group-hover:scale-110 transition-transform duration-300
                             ${(() => {
                               if (!task.due_date) return 'bg-red-50';
                               const dueDate = new Date(task.due_date);
                               const now = new Date();
                               const diffDays = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));
                               
                               if (diffDays < 0 && task.status !== 'done') return 'bg-red-100';
                               if (diffDays <= 3 && task.status !== 'done') return 'bg-amber-100';
                               return 'bg-red-50';
                             })()}`}>
                <Clock className={`w-5 h-5 ${(() => {
                  if (!task.due_date) return 'text-red-600';
                  const dueDate = new Date(task.due_date);
                  const now = new Date();
                  const diffDays = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));
                  
                  if (diffDays < 0 && task.status !== 'done') return 'text-red-700';
                  if (diffDays <= 3 && task.status !== 'done') return 'text-amber-700';
                  return 'text-red-600';
                })()}`} strokeWidth={2.5} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs text-neutral-500 font-medium">Échéance</div>
                <div className="text-sm font-bold text-neutral-900">
                  {formatDate(task.due_date)}
                </div>
                {task.due_date && task.status !== 'done' && (
                  <div className={`text-xs mt-0.5 font-medium ${(() => {
                    const dueDate = new Date(task.due_date);
                    const now = new Date();
                    const diffDays = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));
                    
                    if (diffDays < 0) return 'text-red-600';
                    if (diffDays <= 3) return 'text-amber-600';
                    return 'text-neutral-400';
                  })()}`}>
                    {(() => {
                      const dueDate = new Date(task.due_date);
                      const now = new Date();
                      const diffDays = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));
                      
                      if (diffDays < 0) return `⚠️ En retard de ${Math.abs(diffDays)} jour${Math.abs(diffDays) > 1 ? 's' : ''}`;
                      if (diffDays === 0) return "⏰ Aujourd'hui !";
                      if (diffDays <= 3) return `⚡ Dans ${diffDays} jour${diffDays > 1 ? 's' : ''}`;
                      return `Dans ${diffDays} jour${diffDays > 1 ? 's' : ''}`;
                    })()}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Métadonnées création/modification */}
          <div className="mt-6 pt-6 border-t border-neutral-200 text-xs text-neutral-500 space-y-1">
            <p>Tâche créée le {formatDate(task.created_at)}</p>
            {task.updated_at && task.updated_at !== task.created_at && (
              <p>Dernière modification le {formatDate(task.updated_at)}</p>
            )}
          </div>
        </div>

        {/* 📎 PIÈCES JOINTES */}
        <div className="bg-white rounded-2xl border border-neutral-200 p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-neutral-800 to-neutral-900 
                          flex items-center justify-center shadow-md shadow-neutral-900/20">
              <Paperclip className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>
            <h2 className="text-2xl font-bold text-neutral-900">Pièces jointes</h2>
          </div>
          {/* Affiche l'uploader si l'utilisateur peut modifier la tâche ou est assigné */}
          {(canModifyTask(user, task) || task.assigned_to?.id === user?.id) && (
            <div className="mb-4">
              <AttachmentUploader
                taskId={id}
                onUploadSuccess={async () => {
                  toast.success('Fichier(s) ajoutés');
                  await loadTask();
                  // Trigger AttachmentList reload by updating key via state
                  setAttachmentsRefresh(prev => prev + 1);
                }}
              />
            </div>
          )}

          <AttachmentList taskId={id} refresh={attachmentsRefresh} />
        </div>

        {/* 💬 COMMENTAIRES */}
        <CommentSection taskId={id} />

        {/* MODALS */}
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          title="Modifier la tâche"
        >
          <TaskForm
            initialData={task}
            onSubmit={handleUpdate}
            onCancel={() => setIsEditModalOpen(false)}
            isLoading={updating}
          />
        </Modal>

        <ConfirmModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={handleDelete}
          title="Supprimer la tâche"
          message={`Êtes-vous sûr de vouloir supprimer "${task.title}" ? Cette action est irréversible.`}
          confirmText="Supprimer"
          variant="danger"
        />
      </div>
    </Layout>
  );
};

export default TaskDetail;
