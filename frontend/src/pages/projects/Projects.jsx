import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical,
  Edit2,
  Trash2,
  Users,
  Eye,
  Calendar,
  X,
  ChevronDown,
  Check
} from 'lucide-react';
import { Layout } from '../../components/layout/Layout';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { ProjectForm } from '../../components/forms/ProjectForm';
import { projectsAPI } from '../../api/projects';
import { toast } from 'react-hot-toast';
import { useStats } from '../../context/StatsContext';
import { ConfirmModal } from '../../components/common/ConfirmModal';
import { useAuth } from '../../context/AuthContext';
import { canCreateProject } from '../../utils/permissions';


/**
 * 📊 Page de gestion des projets
 * Design minimaliste et stylé avec dropdown custom
 */
export const Projects = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { stats, refreshStats } = useStats();
  
  const canCreate = canCreateProject(user);
  
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
  const filterDropdownRef = useRef(null);


  useEffect(() => {
    loadProjects();
  }, []);

  // Fermeture du dropdown au clic extérieur
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(event.target)) {
        setIsFilterOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);


  const loadProjects = async () => {
    try {
      setLoading(true);
      const data = await projectsAPI.getAll();
      const projectsList = Array.isArray(data) ? data : (data.results || []);
      setProjects(projectsList);
    } catch (error) {
      toast.error('Erreur lors du chargement des projets');
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };


  const handleCreate = () => {
    setEditingProject(null);
    setIsModalOpen(true);
  };


  const handleEdit = async (project) => {
    try {
      const fullProject = await projectsAPI.getById(project.id);
      setEditingProject(fullProject);
      setIsModalOpen(true);
      setActiveDropdown(null);
    } catch (error) {
      console.error('❌ Erreur chargement projet:', error);
      toast.error('Impossible de charger les détails du projet');
    }
  };


  const handleSubmit = async (formData) => {
    try {
      setIsSubmitting(true);
      
      if (editingProject) {
        await projectsAPI.update(editingProject.id, formData);
        toast.success('Projet mis à jour avec succès !');
      } else {
        await projectsAPI.create(formData);
        toast.success('Projet créé avec succès !');
      }
      
      await loadProjects();
      refreshStats();
      setIsModalOpen(false);
      
    } catch (error) {
      toast.error('Erreur lors de la sauvegarde du projet');
      console.error('Erreur:', error);
    } finally {
      setIsSubmitting(false);
    }
  };


  const handleDelete = (project) => {
    setProjectToDelete(project);
    setIsDeleteModalOpen(true);
    setActiveDropdown(null);
  };


  const confirmDelete = async () => {
    if (!projectToDelete) return;

    try {
      setIsDeleting(true);
      await projectsAPI.delete(projectToDelete.id);
      
      toast.success(`Projet "${projectToDelete.name}" supprimé avec succès !`);
      
      await loadProjects();
      refreshStats();
      
      setIsDeleteModalOpen(false);
      setProjectToDelete(null);
      
    } catch (error) {
      toast.error('Erreur lors de la suppression du projet');
      console.error('Erreur:', error);
    } finally {
      setIsDeleting(false);
    }
  };


  const cancelDelete = () => {
    setIsDeleteModalOpen(false);
    setProjectToDelete(null);
  };


  const filteredProjects = projects.filter((project) => {
    if (!project || !project.name) return false;
    
    const name = project.name.toLowerCase();
    const description = (project.description || '').toLowerCase();
    const query = searchQuery.toLowerCase().trim();
    
    const matchesSearch = query === '' || name.includes(query) || description.includes(query);
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });


  /**
   * 🎨 Config statut
   */
  const getStatusConfig = (status) => {
    const configs = {
      all: {
        color: 'bg-neutral-50 text-neutral-700',
        label: 'Tous les statuts',
        accent: 'bg-neutral-500',
        icon: Filter
      },
      active: {
        color: 'bg-green-50 text-green-700',
        label: 'Actif',
        accent: 'bg-green-500',
        icon: null
      },
      on_hold: {
        color: 'bg-amber-50 text-amber-700',
        label: 'En attente',
        accent: 'bg-amber-500',
        icon: null
      },
      completed: {
        color: 'bg-blue-50 text-blue-700',
        label: 'Terminé',
        accent: 'bg-blue-500',
        icon: null
      },
      cancelled: {
        color: 'bg-red-50 text-red-700',
        label: 'Annulé',
        accent: 'bg-red-500',
        icon: null
      },
    };
    return configs[status] || configs.all;
  };

  const statusOptions = ['all', 'active', 'on_hold', 'completed', 'cancelled'];


  return (
    <Layout>
      {/* 🎯 HEADER STYLÉ */}
      <div className="mb-8">
        <div className="bg-gradient-to-br from-neutral-50 via-white to-neutral-50 rounded-2xl border border-neutral-200 p-8 shadow-sm">
          
          {/* Ligne 1 : Titre + Badge + CTA */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              {/* Icône accent */}
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 
                            flex items-center justify-center shadow-lg shadow-orange-500/20">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
              </div>
              
              {/* Titre + Badge */}
              <div>
                <h1 className="text-3xl font-bold text-neutral-900 mb-1">
                  Gestion des Projets
                </h1>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 
                                 bg-orange-100 text-orange-700 text-sm font-semibold rounded-lg">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
                    </svg>
                    {filteredProjects.length} projet{filteredProjects.length > 1 ? 's' : ''}
                  </span>
                  
                  {statusFilter !== 'all' && (
                    <span className="text-sm text-neutral-500 flex items-center gap-1">
                      · Filtre : 
                      <span className="font-medium text-orange-600">
                        {getStatusConfig(statusFilter).label}
                      </span>
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
                Nouveau Projet
              </button>
            )}
          </div>

          {/* Ligne 2 : Recherche + Dropdown Custom */}
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
                placeholder="Rechercher par nom ou description..."
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

            {/* 🎨 DROPDOWN CUSTOM ÉLÉGANT */}
            <div className="relative min-w-[220px]" ref={filterDropdownRef}>
              <button
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className={`
                  w-full h-12 pl-4 pr-10 
                  bg-white border-2 
                  rounded-xl text-sm font-semibold
                  transition-all duration-200
                  flex items-center gap-2
                  ${isFilterOpen 
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
                            ${isFilterOpen ? 'rotate-180' : ''}`} 
                />
              </button>

              {/* Dropdown Menu */}
              {isFilterOpen && (
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
                          setIsFilterOpen(false);
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
                        {/* Indicateur de statut */}
                        <div className={`w-2 h-2 rounded-full ${config.accent}`} />
                        
                        {/* Label */}
                        <span className="flex-1 text-left">{config.label}</span>
                        
                        {/* Check icon si sélectionné */}
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

      {/* 📋 Liste des projets */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-neutral-600 text-sm font-medium">Chargement des projets...</p>
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-neutral-400" />
          </div>
          <p className="text-neutral-600 font-medium mb-2">Aucun projet trouvé</p>
          
          {canCreate ? (
            <button
              onClick={handleCreate}
              className="mt-4 px-6 py-2.5 border-2 border-neutral-200 text-neutral-700 
                       font-medium rounded-xl hover:border-neutral-900 hover:text-neutral-900 
                       transition-all duration-300 inline-flex items-center gap-2"
            >
              <Plus size={18} />
              Créer le premier projet
            </button>
          ) : (
            <p className="text-neutral-400 text-sm mt-2">
              Vous verrez ici les projets auxquels vous êtes assigné
            </p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProjects.map((project, index) => {
            const statusConfig = getStatusConfig(project.status);
            const isDropdownOpen = activeDropdown === project.id;
            
            return (
              <div
                key={project.id}
                className="group relative bg-white rounded-2xl border border-neutral-200 
                         hover:border-neutral-300 hover:shadow-lg 
                         transition-all duration-300 cursor-pointer overflow-hidden"
                style={{
                  animation: `fadeInUp 0.4s ease-out ${index * 0.05}s both`
                }}
                onClick={() => navigate(`/projects/${project.id}`)}
              >
                <div 
                  className={`absolute top-0 left-0 right-0 h-1 ${statusConfig.accent}`}
                />

                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 pr-2">
                      <h3 className="text-lg font-bold text-neutral-900 mb-3 line-clamp-1">
                        {project.name}
                      </h3>
                      
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 
                                     text-xs font-medium rounded-lg ${statusConfig.color}`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${statusConfig.accent}`} />
                        {statusConfig.label}
                      </span>
                    </div>

                    <div className="relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveDropdown(isDropdownOpen ? null : project.id);
                        }}
                        className="p-2 hover:bg-neutral-100 rounded-lg transition-colors 
                                 opacity-0 group-hover:opacity-100"
                      >
                        <MoreVertical className="w-4 h-4 text-neutral-400" />
                      </button>
                      
                      {isDropdownOpen && (
                        <>
                          <div 
                            className="fixed inset-0 z-10"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveDropdown(null);
                            }}
                          />
                          
                          <div 
                            className="absolute right-0 mt-1 w-48 bg-white rounded-xl 
                                     shadow-lg border border-neutral-200 z-20 py-1"
                            style={{ animation: 'fadeIn 0.15s ease-out' }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEdit(project);
                              }}
                              className="w-full px-4 py-2.5 text-left text-sm text-neutral-700 
                                       hover:bg-neutral-50 flex items-center gap-2 transition-colors"
                            >
                              <Edit2 size={16} />
                              Modifier
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(project);
                              }}
                              className="w-full px-4 py-2.5 text-left text-sm text-red-600 
                                       hover:bg-red-50 flex items-center gap-2 transition-colors"
                            >
                              <Trash2 size={16} />
                              Supprimer
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <p className="text-sm text-neutral-600 mb-5 line-clamp-2 leading-relaxed">
                    {project.description || 'Aucune description disponible'}
                  </p>

                  <div className="mb-5">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-neutral-500">Progression</span>
                      <span className="text-sm font-bold text-orange-600">{project.progress}%</span>
                    </div>
                    <div className="w-full h-2 bg-neutral-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-orange-500 rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${project.progress}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 mt-2 border-t border-neutral-100">
                    <div className="flex items-center gap-2">
                      {project.members_count > 0 ? (
                        <>
                          <div className="flex -space-x-2">
                            {project.members?.slice(0, 3).map((member, idx) => (
                              <div
                                key={member.user.id || idx}
                                className="w-7 h-7 rounded-full bg-gradient-to-br from-neutral-300 to-neutral-400
                                         flex items-center justify-center text-white text-xs font-semibold 
                                         border-2 border-white shadow-sm"
                                title={member.user.full_name || member.user.username}
                              >
                                {(member.user.full_name || member.user.username).charAt(0).toUpperCase()}
                              </div>
                            ))}
                          </div>
                          <span className="text-xs text-neutral-600 font-medium">
                            {project.members_count}
                          </span>
                        </>
                      ) : (
                        <span className="flex items-center gap-1.5 text-xs text-neutral-400">
                          <Users className="w-3.5 h-3.5" />
                          Aucun membre
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-neutral-500">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(project.end_date).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'short'
                      })}
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/projects/${project.id}`);
                    }}
                    className="mt-5 w-full py-2.5 px-4 text-sm font-semibold
                             text-neutral-700 bg-white border-2 border-neutral-200
                             hover:border-neutral-900 hover:text-neutral-900 hover:bg-neutral-50
                             rounded-xl transition-all duration-300 
                             flex items-center justify-center gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    Voir détails
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingProject ? 'Modifier le Projet' : 'Nouveau Projet'}
        size="lg"
      >
        <ProjectForm
          onSubmit={handleSubmit}
          onCancel={() => setIsModalOpen(false)}
          initialData={editingProject}
          isLoading={isSubmitting}
        />
      </Modal>

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={cancelDelete}
        onConfirm={confirmDelete}
        title="Supprimer le projet ?"
        message={`Êtes-vous sûr de vouloir supprimer le projet "${projectToDelete?.name}" ? Cette action est irréversible.`}
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

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </Layout>
  );
};
