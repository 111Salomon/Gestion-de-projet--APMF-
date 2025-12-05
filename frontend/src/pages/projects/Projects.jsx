import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical,
  Edit2,
  Trash2,
  Users
} from 'lucide-react';
import { Layout } from '../../components/layout/Layout';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { ProjectForm } from '../../components/forms/ProjectForm';
import { projectsAPI } from '../../api/projects';
import { toast } from 'react-hot-toast';
import { useStats } from '../../context/StatsContext';
import { ConfirmModal } from '../../components/common/ConfirmModal';
import { useAuth } from '../../context/AuthContext';  // 🆕 AJOUTER
import { canCreateProject } from '../../utils/permissions';  // 🆕 AJOUTER



/**
 * Page de gestion des projets
 * Affiche la liste des projets avec CRUD complet
 */
export const Projects = () => {
  const navigate = useNavigate();
  const { user } = useAuth(); 

    // 🆕 AJOUTER CES LIGNES
  // Vérifie si l'utilisateur peut créer un projet
  const canCreate = canCreateProject(user);
  // États pour les projets
  const { stats, refreshStats } = useStats(); 
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // États pour le modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // États pour le modal de confirmation
const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
const [projectToDelete, setProjectToDelete] = useState(null);
const [isDeleting, setIsDeleting] = useState(false);


  /**
   * Charge les projets au montage du composant
   */
  useEffect(() => {
    loadProjects();
  }, []);

  /**
   * Récupère tous les projets depuis l'API
   */
const loadProjects = async () => {
  try {
    setLoading(true);
    const data = await projectsAPI.getAll();

    // 🐛 DEBUG : Affiche ce que l'API retourne
    console.log('📊 Données reçues de l\'API:', data);
    console.log('📊 Type:', typeof data);
    console.log('📊 Est un tableau?', Array.isArray(data));
    
    // Gère les deux formats possibles de réponse
    // Format paginé : { results: [...] }
    // Format direct : [...]
    const projectsList = Array.isArray(data) ? data : (data.results || []);

    console.log('📊 Projets finaux:', projectsList);
    
    setProjects(projectsList);
  } catch (error) {
    toast.error('Erreur lors du chargement des projets');
    console.error('Erreur:', error);
  } finally {
    setLoading(false);
  }
};



  /**
   * Ouvre le modal pour créer un nouveau projet
   */
  const handleCreate = () => {
    setEditingProject(null);
    setIsModalOpen(true);
  };

  /**
   * Ouvre le modal pour modifier un projet
   */
const handleEdit = async (project) => {
  try {
    console.log('🔍 Chargement du projet complet...');
    
    // 🆕 Charge les détails complets (avec description)
    const fullProject = await projectsAPI.getById(project.id);
    
    console.log('✅ Projet complet chargé:', fullProject);
    console.log('✅ Description:', fullProject.description);
    
    setEditingProject(fullProject);
    setIsModalOpen(true);
  } catch (error) {
    console.error('❌ Erreur chargement projet:', error);
    toast.error('Impossible de charger les détails du projet');
  }
};

  /**
   * Soumet le formulaire de création/modification
   */
  const handleSubmit = async (formData) => {
    try {
      setIsSubmitting(true);
      
      if (editingProject) {
        // Mise à jour
        await projectsAPI.update(editingProject.id, formData);
        toast.success('Projet mis à jour avec succès !');
      } else {
        // Création
        await projectsAPI.create(formData);
        toast.success('Projet créé avec succès !');
      }
      
      // Recharge la liste et ferme le modal
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

/**
 * Ouvre le modal de confirmation de suppression
 */
const handleDelete = (project) => {
  setProjectToDelete(project);
  setIsDeleteModalOpen(true);
};

/**
 * Confirme et exécute la suppression
 */
const confirmDelete = async () => {
  if (!projectToDelete) return;

  try {
    setIsDeleting(true);
    await projectsAPI.delete(projectToDelete.id);
    
    toast.success(`Projet "${projectToDelete.name}" supprimé avec succès !`);
    
    await loadProjects();
    refreshStats();
    
    // Ferme le modal
    setIsDeleteModalOpen(false);
    setProjectToDelete(null);
    
  } catch (error) {
    toast.error('Erreur lors de la suppression du projet');
    console.error('Erreur:', error);
  } finally {
    setIsDeleting(false);
  }
};

/**
 * Annule la suppression
 */
const cancelDelete = () => {
  setIsDeleteModalOpen(false);
  setProjectToDelete(null);
};


/**
 * Filtre les projets selon la recherche et le statut
 * Sécurisé contre les valeurs undefined/null
 */
const filteredProjects = projects.filter((project) => {
  // Sécurité : Ignore les projets invalides
  if (!project || !project.name) {
    return false;
  }
  
  // Normalise les valeurs
  const name = project.name.toLowerCase();
  const description = (project.description || '').toLowerCase();
  const query = searchQuery.toLowerCase().trim();
  
  // Filtre par recherche (si query vide, tout passe)
  const matchesSearch = query === '' || 
                       name.includes(query) || 
                       description.includes(query);
  
  // Filtre par statut
  const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
  
  return matchesSearch && matchesStatus;
});

  /**
   * Retourne la couleur du badge selon le statut
   */
  const getStatusColor = (status) => {
    const colors = {
      active: 'bg-green-100 text-green-700',
      on_hold: 'bg-amber-100 text-amber-700',
      completed: 'bg-primary-100 text-primary-700',
      cancelled: 'bg-red-100 text-red-700',
    };
    return colors[status] || 'bg-neutral-100 text-neutral-700';
  };

  /**
   * Retourne le libellé du statut en français
   */
  const getStatusLabel = (status) => {
    const labels = {
      active: 'Actif',
      on_hold: 'En attente',
      completed: 'Terminé',
      cancelled: 'Annulé',
    };
    return labels[status] || status;
  };

  return (
    <Layout>
      {/* En-tête */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-neutral-900 mb-2">
              Gestion des Projets
            </h1>
            <p className="text-neutral-600">
              {filteredProjects.length} projet{filteredProjects.length > 1 ? 's' : ''} au total
            </p>
          </div>
          
        {canCreate && (
          <Button variant="primary" onClick={handleCreate}>
            <Plus size={18} />
            Nouveau Projet
          </Button>
        )}
        </div>

        {/* Barre de recherche et filtres */}
        <div className="flex flex-col md:flex-row gap-4">
          {/* Recherche */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher un projet..."
              className="w-full pl-11 pr-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Filtre par statut */}
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-neutral-500" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">Tous les statuts</option>
              <option value="active">Actif</option>
              <option value="on_hold">En attente</option>
              <option value="completed">Terminé</option>
              <option value="cancelled">Annulé</option>
            </select>
          </div>
        </div>
      </div>

      {/* Liste des projets */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-neutral-600 mt-4">Chargement des projets...</p>
        </div>
      ) : filteredProjects.length === 0 ? (
  <div className="text-center py-12">
    <p className="text-neutral-600">Aucun projet trouvé</p>
    
    {/* 🆕 Bouton ou message selon le rôle */}
    {canCreate ? (
      <Button variant="primary" onClick={handleCreate} className="mt-4">
        <Plus size={18} />
        Créer le premier projet
      </Button>
    ) : (
      <p className="text-neutral-400 text-sm mt-2">
        Vous verrez ici les projets auxquels vous êtes assigné
      </p>
    )}
  </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <div key={project.id} className="card hover:shadow-lg transition-all duration-200">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-neutral-900 mb-1">
                    {project.name}
                  </h3>
                  <span className={`inline-block px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(project.status)}`}>
                    {getStatusLabel(project.status)}
                  </span>
                </div>

                {/* Menu actions */}
                <div className="relative group">
                  <button className="p-2 hover:bg-neutral-100 rounded-lg transition-colors">
                    <MoreVertical className="w-5 h-5 text-neutral-400" />
                  </button>
                  
                  {/* Dropdown menu */}
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-neutral-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                    <button
                      onClick={() => handleEdit(project)}
                      className="w-full px-4 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-50 flex items-center gap-2 rounded-t-lg"
                    >
                      <Edit2 size={16} />
                      Modifier
                    </button>
                    <button
                      onClick={() => handleDelete(project)}
                      className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 rounded-b-lg"
                    >
                      <Trash2 size={16} />
                      Supprimer
                    </button>
                  </div>
                </div>
              </div>

              {/* Description */}
              <p className="text-sm text-neutral-600 mb-4 line-clamp-2">
                {project.description}
              </p>

              {/* Progression */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-neutral-600">Progression</span>
                  <span className="text-sm font-bold text-neutral-900">{project.progress}%</span>
                </div>
                <div className="w-full h-2 bg-neutral-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary-600 transition-all duration-500"
                    style={{ width: `${project.progress}%` }}
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-4 border-t border-neutral-200">
{/* Membres - Style TaskCard avec avatars */}
<div className="flex items-center gap-2">
  {project.members_count > 0 ? (
    <>
      {/* Avatars empilés */}
      <div className="flex -space-x-2">
        {project.members?.slice(0, 3).map((member, index) => (
          <div
            key={member.user.id || index}
            className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-xs font-bold border-2 border-white"
            title={member.user.full_name || member.user.username}
          >
            {(member.user.full_name || member.user.username).charAt(0).toUpperCase()}
          </div>
        ))}
      </div>
      
      {/* Compteur */}
      <span className="text-sm text-neutral-600">
        {project.members_count} membre{project.members_count > 1 ? 's' : ''}
      </span>
    </>
  ) : (
    <>
      <Users className="w-4 h-4 text-neutral-400" />
      <span className="text-sm text-neutral-400 italic">
        Aucun membre
      </span>
    </>
  )}
</div>

                {/* Dates */}
                <div className="text-sm text-neutral-600">
                  {new Date(project.end_date).toLocaleDateString('fr-FR')}
                </div>
              </div>
              {/* Bouton Voir Détails - Style Outline */}
<button
  onClick={() => navigate(`/projects/${project.id}`)}
  className="mt-4 w-full py-2 px-4 border-2 border-primary-600 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors flex items-center justify-center gap-2 font-medium"
>
  <svg 
    className="w-4 h-4" 
    fill="none" 
    stroke="currentColor" 
    viewBox="0 0 24 24"
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
  Voir détails
</button>

            </div>
          ))}
        </div>
      )}

      {/* Modal de création/modification */}
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
            {/* Modal de confirmation de suppression */}
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

    </Layout>
  );
};
