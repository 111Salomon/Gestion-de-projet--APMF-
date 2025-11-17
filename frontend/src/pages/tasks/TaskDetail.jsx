import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Edit, Trash2, Calendar, User, 
  FolderOpen, Flag, Clock 
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

// Import API
import { tasksAPI } from '../../api/tasks';

export const TaskDetail = () => {
  // Récupère l'ID depuis l'URL (ex: /tasks/15)
  const { id } = useParams();
  const navigate = useNavigate();
  
  // États locaux
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Chargement de la tâche au montage du composant
  useEffect(() => {
    loadTask();
  }, [id]);

  // Fonction de chargement des données
  const loadTask = async () => {
    try {
      setLoading(true);
      const data = await tasksAPI.getById(id);
      setTask(data);
    } catch (error) {
      console.error('❌ Erreur chargement:', error);
      toast.error('Impossible de charger la tâche');
      navigate('/tasks');
    } finally {
      setLoading(false);
    }
  };

  // Suppression de la tâche
  const handleDelete = async () => {
    try {
      await tasksAPI.delete(id);
      toast.success('Tâche supprimée');
      navigate('/tasks');
    } catch (error) {
      console.error('❌ Erreur suppression:', error);
      toast.error('Impossible de supprimer la tâche');
    }
  };

  // Formatage de date
  const formatDate = (dateString) => {
    if (!dateString) return 'Non définie';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  // Badge de statut avec couleurs
  const getStatusBadge = (status) => {
    const styles = {
      todo: 'bg-neutral-100 text-neutral-700',
      in_progress: 'bg-primary-100 text-primary-700',
      done: 'bg-green-100 text-green-700',
      blocked: 'bg-red-100 text-red-700',
    };
    const labels = {
      todo: 'À faire',
      in_progress: 'En cours',
      done: 'Terminé',
      blocked: 'Bloqué',
    };
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  // Badge de priorité avec couleurs
  const getPriorityBadge = (priority) => {
    const styles = {
      low: 'bg-green-100 text-green-700',
      medium: 'bg-amber-100 text-amber-700',
      high: 'bg-red-100 text-red-700',
    };
    const labels = { low: 'Faible', medium: 'Moyen', high: 'Urgent' };
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${styles[priority]}`}>
        <Flag className="w-3 h-3 inline mr-1" />
        {labels[priority]}
      </span>
    );
  };

  // Affichage pendant chargement
  if (loading) {
    return (
      <Layout>
        <LoadingSpinner />
      </Layout>
    );
  }

  // Si tâche introuvable
  if (!task) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-neutral-600">Tâche introuvable</p>
        </div>
      </Layout>
    );
  }

  // Rendu principal de la page
  return (
    <Layout>
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        
        {/* ═══ HEADER : Bouton retour + Actions ═══ */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(-1)} // Retour à la page précédente
            className="flex items-center gap-2 text-neutral-600 hover:text-neutral-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Retour</span>
          </button>

          {/* Boutons Modifier et Supprimer */}
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

        {/* ═══ CONTENU PRINCIPAL ═══ */}
        <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6 space-y-6">
          
          {/* Titre + Badges */}
          <div>
            <h1 className="text-3xl font-bold text-neutral-900 mb-3">
              {task.title}
            </h1>
            <div className="flex gap-2">
              {getStatusBadge(task.status)}
              {getPriorityBadge(task.priority)}
            </div>
          </div>

          {/* Description */}
          <div>
            <h2 className="text-sm font-semibold text-neutral-700 mb-2">Description</h2>
            <p className="text-neutral-600 whitespace-pre-wrap">
              {task.description || 'Aucune description'}
            </p>
          </div>

          {/* Métadonnées (Projet, Assigné, Dates) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
            
            {/* Projet */}
            <div className="flex items-center gap-3">
              <FolderOpen className="w-5 h-5 text-neutral-500" />
              <div>
                <p className="text-sm text-neutral-500">Projet</p>
                <p className="font-medium text-neutral-900">
                  {task.project_name || 'Non assigné'}
                </p>
              </div>
            </div>

            {/* Assigné à */}
            <div className="flex items-center gap-3">
              <User className="w-5 h-5 text-neutral-500" />
              <div>
                <p className="text-sm text-neutral-500">Assigné à</p>
                <p className="font-medium text-neutral-900">
                  {task.assigned_to_name || 'Non assigné'}
                </p>
              </div>
            </div>

            {/* Date de début */}
            {task.start_date && (
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-neutral-500" />
                <div>
                  <p className="text-sm text-neutral-500">Date de début</p>
                  <p className="font-medium text-neutral-900">
                    {formatDate(task.start_date)}
                  </p>
                </div>
              </div>
            )}

            {/* Date limite */}
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-neutral-500" />
              <div>
                <p className="text-sm text-neutral-500">Date limite</p>
                <p className="font-medium text-neutral-900">
                  {formatDate(task.due_date)}
                </p>
              </div>
            </div>

          </div>

          {/* Dates de création/modification */}
          <div className="pt-4 border-t text-xs text-neutral-500">
            <p>Tâche créée le {formatDate(task.created_at)}</p>
            {task.updated_at && (
              <p>Dernière modification le {formatDate(task.updated_at)}</p>
            )}
          </div>

        </div>

        {/* ═══ MODALS ═══ */}
        
        {/* Modal d'édition */}
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          title="Modifier la tâche"
        >
          <TaskForm
            task={task}
            onClose={() => {
              setIsEditModalOpen(false);
              loadTask(); // Recharge les données après modification
            }}
          />
        </Modal>

        {/* Modal de confirmation suppression */}
        <ConfirmModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={handleDelete}
          title="Supprimer la tâche"
          message={`Êtes-vous sûr de vouloir supprimer "${task.title}" ? Cette action est irréversible.`}
          confirmText="Supprimer"
          variant="danger"
        />


        {/* Section commentaires - Style réseaux sociaux */}
<CommentSection taskId={id} />

      </div>
    </Layout>
  );
};

export default TaskDetail;
