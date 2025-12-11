import { useState, useEffect, useRef } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  CheckSquare,
  X,
  ChevronDown,
  Check,
  AlertCircle
} from 'lucide-react';
import { Layout } from '../../components/layout/Layout';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { ConfirmModal } from '../../components/common/ConfirmModal';
import { Pagination } from '../../components/common/Pagination';
import { TaskCard } from '../../components/tasks/TaskCard';
import { TaskForm } from '../../components/forms/TaskForm';
import { tasksAPI } from '../../api/tasks';
import { useStats } from '../../context/StatsContext';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { canCreateTaskGlobal } from '../../utils/permissions';
import { useLocation, useNavigate } from 'react-router-dom';


/**
 * 📋 Page de gestion des tâches
 * Design minimaliste et stylé - Version Premium
 */
export const Tasks = () => {
  const { user } = useAuth();
  const canCreate = canCreateTaskGlobal(user);
  const navigate = useNavigate(); // ← Déjà existant
  const location = useLocation(); // 🆕 AJOUT
  
  // États - Données
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  
  // États - Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [initialFormData, setInitialFormData] = useState(null); // 🆕 AJOUT
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // États - Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  
  // États - Dropdowns
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const [isPriorityDropdownOpen, setIsPriorityDropdownOpen] = useState(false);
  
  // Refs pour les dropdowns
  const statusDropdownRef = useRef(null);
  const priorityDropdownRef = useRef(null);
  
  // Context
  const { refreshStats } = useStats();



   // 🆕 AJOUT : Détection des query params pour auto-ouverture
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const shouldCreate = searchParams.get('create');
    const projectId = searchParams.get('project');
    
    if (shouldCreate === 'true') {
      // Si un projet est spécifié, pré-rempli le formulaire
    if (projectId) {
      setInitialFormData({ project: projectId }); // ✅ Utilise le nouvel état
    } else {
      setInitialFormData(null);
    }

      // Important : on ne touche PAS à editingTask (reste null = mode création)
      setEditingTask(null);
        
      // Ouvre le modal
      setIsModalOpen(true);
      
      // Nettoie l'URL (retire ?create=true&project=X)
      navigate('/tasks', { replace: true });
    }
  }, [location.search, navigate]);

  // Chargement initial
  useEffect(() => {
    loadTasks(1);
  }, []);


  // Recharge quand les filtres changent
  useEffect(() => {
    if (loading) return;
    loadTasks(1);
  }, [statusFilter, priorityFilter, searchQuery]);


  // Fermeture des dropdowns au clic extérieur
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target)) {
        setIsStatusDropdownOpen(false);
      }
      if (priorityDropdownRef.current && !priorityDropdownRef.current.contains(event.target)) {
        setIsPriorityDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);


  // Charge les tâches avec filtres côté serveur
  const loadTasks = async (page = 1) => {
    try {
      setLoading(true);
      
      const params = { page };
      if (statusFilter !== 'all') params.status = statusFilter;
      if (priorityFilter !== 'all') params.priority = priorityFilter;
      if (searchQuery.trim()) params.search = searchQuery.trim();
      
      console.log('📡 Requête API:', params);
      
      const data = await tasksAPI.getAll(params);
      
      if (data.results) {
        const validTasks = data.results.filter(t => t && t.title);
        setTasks(validTasks);
        setTotalCount(data.count);
        setTotalPages(Math.ceil(data.count / 20));
        setCurrentPage(page);
      } else {
        const validTasks = data.filter(t => t && t.title);
        setTasks(validTasks);
        setTotalCount(validTasks.length);
        setTotalPages(1);
        setCurrentPage(1);
      }
      
    } catch (error) {
      console.error('❌ Erreur chargement:', error);
      toast.error('Erreur lors du chargement des tâches');
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };


  const handlePageChange = (newPage) => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    loadTasks(newPage);
  };


  const handleCreate = () => {
    setEditingTask(null);
    setIsModalOpen(true);
  };


  const handleEdit = async (task) => {
    try {
      console.log('🔍 Chargement de la tâche complète...');
      const fullTask = await tasksAPI.getById(task.id);
      setEditingTask(fullTask);
      setIsModalOpen(true);
    } catch (error) {
      console.error('❌ Erreur chargement tâche:', error);
      toast.error('Impossible de charger les détails de la tâche');
    }
  };


  const handleSubmit = async (formData) => {
    try {
      setIsSubmitting(true);
      
      if (editingTask) {
        await tasksAPI.update(editingTask.id, formData);
        toast.success('Tâche mise à jour avec succès !');
      } else {
        await tasksAPI.create(formData);
        toast.success('Tâche créée avec succès !');
      }
      
      await loadTasks(currentPage);
      refreshStats();
      setIsModalOpen(false);
      setEditingTask(null);
      setInitialFormData(null); // 🆕 AJOUT : Réinitialise après création
      
    } catch (error) {
      console.error('❌ Erreur soumission:', error);
      toast.error('Erreur lors de la sauvegarde de la tâche');
    } finally {
      setIsSubmitting(false);
    }
  };


  const handleDelete = (task) => {
    setTaskToDelete(task);
    setIsDeleteModalOpen(true);
  };


  const confirmDelete = async () => {
    if (!taskToDelete) return;

    try {
      setIsDeleting(true);
      await tasksAPI.delete(taskToDelete.id);
      toast.success(`Tâche "${taskToDelete.title}" supprimée !`);
      
      await loadTasks(currentPage);
      refreshStats();
      
      setIsDeleteModalOpen(false);
      setTaskToDelete(null);
      
    } catch (error) {
      console.error('❌ Erreur suppression:', error);
      toast.error('Erreur lors de la suppression');
    } finally {
      setIsDeleting(false);
    }
  };


  const cancelDelete = () => {
    setIsDeleteModalOpen(false);
    setTaskToDelete(null);
  };


  /**
   * 🎨 Config statut
   */
  const getStatusConfig = (status) => {
    const configs = {
      all: {
        color: 'bg-neutral-50 text-neutral-700',
        label: 'Tous les statuts',
        accent: 'bg-neutral-500'
      },
      todo: {
        color: 'bg-blue-50 text-blue-700',
        label: 'À faire',
        accent: 'bg-blue-500'
      },
      in_progress: {
        color: 'bg-amber-50 text-amber-700',
        label: 'En cours',
        accent: 'bg-amber-500'
      },
      done: {
        color: 'bg-green-50 text-green-700',
        label: 'Terminé',
        accent: 'bg-green-500'
      },
      blocked: {
        color: 'bg-red-50 text-red-700',
        label: 'Bloqué',
        accent: 'bg-red-500'
      },
    };
    return configs[status] || configs.all;
  };


  /**
   * 🎨 Config priorité
   */
  const getPriorityConfig = (priority) => {
    const configs = {
      all: {
        color: 'bg-neutral-50 text-neutral-700',
        label: 'Toutes priorités',
        accent: 'bg-neutral-500'
      },
      high: {
        color: 'bg-red-50 text-red-700',
        label: 'Urgente',
        accent: 'bg-red-500'
      },
      medium: {
        color: 'bg-amber-50 text-amber-700',
        label: 'Moyenne',
        accent: 'bg-amber-500'
      },
      low: {
        color: 'bg-blue-50 text-blue-700',
        label: 'Faible',
        accent: 'bg-blue-500'
      },
    };
    return configs[priority] || configs.all;
  };

  const statusOptions = ['all', 'todo', 'in_progress', 'done', 'blocked'];
  const priorityOptions = ['all', 'high', 'medium', 'low'];


  return (
    <Layout>
      {/* 🎯 HEADER PREMIUM - IDENTIQUE AUX PROJETS */}
      <div className="mb-8">
        <div className="bg-gradient-to-br from-neutral-50 via-white to-neutral-50 rounded-2xl border border-neutral-200 p-8 shadow-sm">
          
          {/* Ligne 1 : Titre + Badge + CTA */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              {/* Icône accent */}
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 
                            flex items-center justify-center shadow-lg shadow-orange-500/20">
                <CheckSquare className="w-6 h-6 text-white" strokeWidth={2.5} />
              </div>
              
              {/* Titre + Badge */}
              <div>
                <h1 className="text-3xl font-bold text-neutral-900 mb-1">
                  Gestion des Tâches
                </h1>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 
                                 bg-orange-100 text-orange-700 text-sm font-semibold rounded-lg">
                    <CheckSquare className="w-4 h-4" />
                    {totalCount} tâche{totalCount > 1 ? 's' : ''}
                  </span>
                  
                  {/* Filtres actifs */}
                  {(statusFilter !== 'all' || priorityFilter !== 'all') && (
                    <span className="text-sm text-neutral-500 flex items-center gap-1">
                      · Filtres : 
                      {statusFilter !== 'all' && (
                        <span className="font-medium text-orange-600">
                          {getStatusConfig(statusFilter).label}
                        </span>
                      )}
                      {statusFilter !== 'all' && priorityFilter !== 'all' && ', '}
                      {priorityFilter !== 'all' && (
                        <span className="font-medium text-orange-600">
                          {getPriorityConfig(priorityFilter).label}
                        </span>
                      )}
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            {/* Bouton CTA */}
            {canCreate && (
              <button
                onClick={handleCreate}
                className="px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 
                         text-white font-semibold rounded-xl shadow-md
                         hover:shadow-xl hover:shadow-orange-500/30 
                         hover:scale-105 active:scale-95
                         transition-all duration-300
                         flex items-center gap-2 whitespace-nowrap"
              >
                <Plus size={20} strokeWidth={2.5} />
                Nouvelle Tâche
              </button>
            )}
          </div>

          {/* Ligne 2 : Recherche + 2 Dropdowns Custom */}
          <div className="flex items-center gap-3">
            {/* Recherche */}
            <div className="flex-1 relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 
                               text-neutral-400 group-focus-within:text-orange-500 
                               transition-colors pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher une tâche..."
                className="w-full h-12 pl-12 pr-12 
                         bg-white border-2 border-neutral-200
                         rounded-xl text-sm font-medium text-neutral-900
                         placeholder:text-neutral-400
                         focus:outline-none 
                         focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10
                         hover:border-neutral-300
                         transition-all duration-200"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2
                           text-neutral-400 hover:text-neutral-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* 🎨 DROPDOWN STATUT */}
            <div className="relative min-w-[180px]" ref={statusDropdownRef}>
              <button
                onClick={() => {
                  setIsStatusDropdownOpen(!isStatusDropdownOpen);
                  setIsPriorityDropdownOpen(false);
                }}
                className={`
                  w-full h-12 pl-4 pr-10 
                  bg-white border-2 
                  rounded-xl text-sm font-semibold
                  transition-all duration-200
                  flex items-center gap-2
                  ${isStatusDropdownOpen 
                    ? 'border-orange-500 ring-4 ring-orange-500/10' 
                    : 'border-neutral-200 hover:border-neutral-300'
                  }
                `}
              >
                <Filter className="w-4 h-4 text-neutral-500" />
                <span className="flex-1 text-left text-neutral-700">
                  {getStatusConfig(statusFilter).label}
                </span>
                <ChevronDown 
                  className={`w-4 h-4 text-neutral-500 transition-transform duration-200 
                            ${isStatusDropdownOpen ? 'rotate-180' : ''}`} 
                />
              </button>

              {isStatusDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 
                              bg-white rounded-xl border-2 border-neutral-200 
                              shadow-lg z-50 overflow-hidden
                              animate-in fade-in slide-in-from-top-2 duration-200">
                  {statusOptions.map((status) => {
                    const config = getStatusConfig(status);
                    const isSelected = statusFilter === status;
                    
                    return (
                      <button
                        key={status}
                        onClick={() => {
                          setStatusFilter(status);
                          setIsStatusDropdownOpen(false);
                        }}
                        className={`
                          w-full px-4 py-3 
                          flex items-center gap-3
                          text-sm font-medium
                          transition-all duration-150
                          ${isSelected 
                            ? 'bg-orange-50 text-orange-700' 
                            : 'text-neutral-700 hover:bg-neutral-50'
                          }
                        `}
                      >
                        <div className={`w-2 h-2 rounded-full ${config.accent}`} />
                        <span className="flex-1 text-left">{config.label}</span>
                        {isSelected && (
                          <Check className="w-4 h-4 text-orange-600" strokeWidth={2.5} />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 🎨 DROPDOWN PRIORITÉ */}
            <div className="relative min-w-[180px]" ref={priorityDropdownRef}>
              <button
                onClick={() => {
                  setIsPriorityDropdownOpen(!isPriorityDropdownOpen);
                  setIsStatusDropdownOpen(false);
                }}
                className={`
                  w-full h-12 pl-4 pr-10 
                  bg-white border-2 
                  rounded-xl text-sm font-semibold
                  transition-all duration-200
                  flex items-center gap-2
                  ${isPriorityDropdownOpen 
                    ? 'border-orange-500 ring-4 ring-orange-500/10' 
                    : 'border-neutral-200 hover:border-neutral-300'
                  }
                `}
              >
                <AlertCircle className="w-4 h-4 text-neutral-500" />
                <span className="flex-1 text-left text-neutral-700">
                  {getPriorityConfig(priorityFilter).label}
                </span>
                <ChevronDown 
                  className={`w-4 h-4 text-neutral-500 transition-transform duration-200 
                            ${isPriorityDropdownOpen ? 'rotate-180' : ''}`} 
                />
              </button>

              {isPriorityDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 
                              bg-white rounded-xl border-2 border-neutral-200 
                              shadow-lg z-50 overflow-hidden
                              animate-in fade-in slide-in-from-top-2 duration-200">
                  {priorityOptions.map((priority) => {
                    const config = getPriorityConfig(priority);
                    const isSelected = priorityFilter === priority;
                    
                    return (
                      <button
                        key={priority}
                        onClick={() => {
                          setPriorityFilter(priority);
                          setIsPriorityDropdownOpen(false);
                        }}
                        className={`
                          w-full px-4 py-3 
                          flex items-center gap-3
                          text-sm font-medium
                          transition-all duration-150
                          ${isSelected 
                            ? 'bg-orange-50 text-orange-700' 
                            : 'text-neutral-700 hover:bg-neutral-50'
                          }
                        `}
                      >
                        <div className={`w-2 h-2 rounded-full ${config.accent}`} />
                        <span className="flex-1 text-left">{config.label}</span>
                        {isSelected && (
                          <Check className="w-4 h-4 text-orange-600" strokeWidth={2.5} />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 📋 LISTE DES TÂCHES */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-neutral-600 text-sm font-medium">Chargement des tâches...</p>
        </div>
        
      ) : tasks.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-neutral-400" />
          </div>
          <p className="text-neutral-600 font-medium mb-2">
            {searchQuery || statusFilter !== 'all' || priorityFilter !== 'all'
              ? 'Aucune tâche ne correspond aux filtres'
              : 'Aucune tâche créée'}
          </p>
          
          {canCreate ? (
            <button
              onClick={handleCreate}
              className="mt-4 px-6 py-2.5 border-2 border-neutral-200 text-neutral-700 
                       font-medium rounded-xl hover:border-neutral-900 hover:text-neutral-900 
                       transition-all duration-300 inline-flex items-center gap-2"
            >
              <Plus size={18} />
              Créer la première tâche
            </button>
          ) : (
            <p className="text-neutral-400 text-sm mt-2">
              Vous verrez ici les tâches qui vous sont assignées
            </p>
          )}
        </div>
        
      ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {tasks.map((task, index) => (
                <div
                  key={task.id}
                  className="min-w-0"
                  style={{
                    animation: `fadeInUp 0.4s ease-out ${index * 0.05}s both`
                  }}
                >
                  <TaskCard
                    task={task}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                </div>
              ))}
            </div>
      )}

      {/* PAGINATION */}
      {!loading && tasks.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalCount}
          itemsPerPage={20}
          onPageChange={handlePageChange}
        />
      )}

      {/* MODALS */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
  setIsModalOpen(false);
  setEditingTask(null);
  setInitialFormData(null); // 🆕 AJOUT : Nettoie à la fermeture
}}
        title={editingTask ? 'Modifier la Tâche' : 'Nouvelle Tâche'}
        size="lg"
      >
        <TaskForm
          onSubmit={handleSubmit}
    onCancel={() => {
      setIsModalOpen(false);
      setEditingTask(null);
      setInitialFormData(null); // 🆕 AJOUT : Nettoie à l'annulation
    }}
          initialData={editingTask || initialFormData}
          isLoading={isSubmitting}
        />
      </Modal>

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={cancelDelete}
        onConfirm={confirmDelete}
        title="Supprimer la tâche ?"
        message={`Êtes-vous sûr de vouloir supprimer la tâche "${taskToDelete?.title}" ? Cette action est irréversible.`}
        confirmText="Supprimer"
        cancelText="Annuler"
        isLoading={isDeleting}
        variant="danger"
      />

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
