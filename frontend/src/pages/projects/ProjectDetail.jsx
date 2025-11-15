import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, Trash2, Calendar, Users } from 'lucide-react';
import toast from 'react-hot-toast';

// ─── Imports avec chemins relatifs corrigés ───
import { Layout } from '../../components/layout/Layout';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { ConfirmModal } from '../../components/common/ConfirmModal';
import { ProjectStats } from '../../components/projects/ProjectStats';
import { TaskCard } from '../../components/tasks/TaskCard';
import { ProjectForm } from '../../components/forms/ProjectForm';

// Imports API
import { projectsAPI } from '../../api/projects';

export const ProjectDetail = () => {
  // ─── Récupère l'ID depuis l'URL ───
  const { id } = useParams();
  const navigate = useNavigate();
  
  // ─── État local ───
  const [project, setProject] = useState(null);
  const [stats, setStats] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // ─── Chargement au montage ───
  useEffect(() => {
    loadProjectData();
  }, [id]);

  const loadProjectData = async () => {
    try {
      setLoading(true);
      
      // Charge les 3 API en parallèle
      const [projectData, statsData, tasksData] = await Promise.all([
        projectsAPI.getById(id),
        projectsAPI.getStats(id),
        projectsAPI.getTasks(id),
      ]);

      setProject(projectData);
      setStats(statsData);
      
      // ✅ Gestion correcte des 2 formats possibles
      const tasksList = Array.isArray(tasksData) 
        ? tasksData 
        : (tasksData.results || []);
      
      setTasks(tasksList);
      
    } catch (error) {
      console.error('❌ Erreur chargement:', error);
      toast.error('Impossible de charger le projet');
      navigate('/projects');
    } finally {
      setLoading(false);
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

  const formatDate = (dateString) => {
    if (!dateString) return 'Non définie';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  // ─── Affichage pendant chargement ───
  if (loading) {
    return (
      <Layout>
        <LoadingSpinner />
      </Layout>
    );
  }

  // ─── Si projet introuvable ───
  if (!project) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-neutral-600">Projet introuvable</p>
        </div>
      </Layout>
    );
  }

  // ─── RENDU DE LA PAGE ───
  return (
    <Layout>
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        
        {/* ═══════════════════════════════════════════ */}
        {/* HEADER : Bouton retour + Actions */}
        {/* ═══════════════════════════════════════════ */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('/projects')}
            className="flex items-center gap-2 text-neutral-600 hover:text-neutral-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Retour aux projets</span>
          </button>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setIsEditModalOpen(true)}
              icon={<Edit className="w-4 h-4" />}
            >
              Modifier
            </Button>
            <Button
              variant="danger"
              onClick={() => setIsDeleteModalOpen(true)}
              icon={<Trash2 className="w-4 h-4" />}
            >
              Supprimer
            </Button>
          </div>
        </div>

        {/* ═══════════════════════════════════════════ */}
        {/* INFO PROJET : Titre + Description + Dates */}
        {/* ═══════════════════════════════════════════ */}
        <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6 space-y-4">
          <div>
            <h1 className="text-3xl font-bold text-neutral-900">
              {project.name}
            </h1>
            <p className="text-neutral-600 mt-2">
              {project.description || 'Aucune description'}
            </p>
          </div>

          {/* Infos secondaires (dates + membres) */}
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-neutral-500" />
              <span className="text-neutral-600">
                Début : <strong>{formatDate(project.start_date)}</strong>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-neutral-500" />
              <span className="text-neutral-600">
                Fin : <strong>{formatDate(project.end_date)}</strong>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-neutral-500" />
              <span className="text-neutral-600">
                Équipe : <strong>{project.members?.length || 0}</strong> membre
                {project.members?.length > 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════ */}
        {/* STATISTIQUES : Composant ProjectStats */}
        {/* ═══════════════════════════════════════════ */}
        <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
          <ProjectStats stats={stats} />
        </div>

        {/* ═══════════════════════════════════════════ */}
        {/* TÂCHES DU PROJET : Grille de cartes */}
        {/* ═══════════════════════════════════════════ */}
        <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">
              Tâches du Projet ({tasks.length})
            </h2>
            <Button
              variant="primary"
              onClick={() => navigate(`/tasks?project=${id}`)}
            >
              Voir toutes les tâches
            </Button>
          </div>

          {/* Liste des tâches ou message vide */}
          {tasks.length === 0 ? (
            <p className="text-center text-neutral-500 py-8">
              Aucune tâche pour le moment
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Affiche seulement les 6 premières tâches */}
              {tasks.slice(0, 6).map(task => (
                <TaskCard 
                  key={task.id} 
                  task={task}
                  onClick={() => {/* Optionnel: ouvrir modal détails */}}
                />
              ))}
            </div>
          )}
          
          {/* Message si + de 6 tâches */}
          {tasks.length > 6 && (
            <p className="text-center text-sm text-neutral-500 mt-4">
              Et {tasks.length - 6} autre{tasks.length - 6 > 1 ? 's' : ''} tâche
              {tasks.length - 6 > 1 ? 's' : ''}...
            </p>
          )}
        </div>

        {/* ═══════════════════════════════════════════ */}
        {/* MODALS : Édition + Suppression */}
        {/* ═══════════════════════════════════════════ */}
        
        {/* Modal d'édition */}
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          title="Modifier le projet"
        >
          <ProjectForm
            project={project}
            onClose={() => {
              setIsEditModalOpen(false);
              loadProjectData(); // Recharge les données après modification
            }}
          />
        </Modal>

        {/* Modal de confirmation suppression */}
        <ConfirmModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={handleDelete}
          title="Supprimer le projet"
          message={`Êtes-vous sûr de vouloir supprimer "${project.name}" ? Cette action est irréversible et supprimera aussi toutes les tâches associées.`}
          confirmText="Supprimer"
          variant="danger"
        />
      </div>
    </Layout>
  );
};

export default ProjectDetail;
