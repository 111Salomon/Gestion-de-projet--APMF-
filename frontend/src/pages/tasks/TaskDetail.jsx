import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Edit, Trash2, Calendar, User, 
  FolderOpen, Flag, Clock,Paperclip
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


// Import API
import { tasksAPI } from '../../api/tasks';

// ✅ CHANGEMENT 1 : Import des permissions et du contexte Auth
import { canModifyTask, canDeleteTask, canChangeTaskStatus } from '../../utils/permissions';
import { useAuth } from '../../context/AuthContext';


export const TaskDetail = () => {
  // Récupère l'ID depuis l'URL (ex: /tasks/15)
  const { id } = useParams();
  const navigate = useNavigate();
  
  // ✅ CHANGEMENT 2 : Récupère l'utilisateur connecté
  const { user } = useAuth();

  // États locaux
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false); 
  const [updating, setUpdating] = useState(false); // 🆕 AJOUTÉ


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


  // 🆕 FONCTION AJOUTÉE : Mise à jour de la tâche
  const handleUpdate = async (values) => {
    try {
      setUpdating(true);
      await tasksAPI.update(id, values);
      toast.success('Tâche mise à jour');
      await loadTask(); // Recharge les données
      setIsEditModalOpen(false);
    } catch (error) {
      console.error('❌ Erreur mise à jour:', error);
      if (error.response?.status === 403) {
        toast.error('Vous n\'avez pas les droits pour modifier cette tâche');
      } else {
        toast.error('Impossible de mettre à jour la tâche');
      }
    } finally {
      setUpdating(false);
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
      if (error.response?.status === 403) {
        toast.error('Vous n\'avez pas les droits pour supprimer cette tâche');
      } else {
        toast.error('Impossible de supprimer la tâche');
      }
    }
  };

    // Ajoute après handleDelete() (ligne 115 environ)

  // ✅ NOUVELLE FONCTION : Changer le statut
  const handleChangeStatus = async (newStatus) => {
    try {
      setUpdating(true);
      await tasksAPI.changeStatus(id, newStatus);  // ✅ Bon endpoint
      toast.success('Statut mis à jour');
      await loadTask();
      setIsStatusModalOpen(false);
    } catch (error) {
      console.error('❌ Erreur changement statut:', error);
      if (error.response?.status === 403) {
        toast.error('Vous n\'avez pas les droits pour changer ce statut');
      } else {
        toast.error('Impossible de mettre à jour le statut');
      }
    } finally {
      setUpdating(false);
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


  {/* ✅ CORRIGÉ : Boutons d'action selon les permissions */}
  <div className="flex gap-2">
    {/* Bouton "Modifier" pour Manager+ */}
    {canModifyTask(user, task) && (
      <Button
        variant="outline"
        onClick={() => setIsEditModalOpen(true)}
        icon={<Edit className="w-4 h-4" />}
      >
        Modifier
      </Button>
    )}
    
    {/* ✅ NOUVEAU : Bouton "Changer le statut" pour assigné (si pas Manager+) */}
    {canChangeTaskStatus(user, task) && !canModifyTask(user, task) && (
      <Button
        variant="primary"
        onClick={() => setIsStatusModalOpen(true)}
        icon={<Flag className="w-4 h-4" />}
      >
        Changer le statut
      </Button>
    )}
    
    {/* Bouton "Supprimer" pour Manager+ */}
    {canDeleteTask(user, task) && (
      <Button
        variant="danger"
        onClick={() => setIsDeleteModalOpen(true)}
        icon={<Trash2 className="w-4 h-4" />}
      >
        Supprimer
      </Button>
    )}
  </div>

        </div>


        {/* ═══ CONTENU PRINCIPAL ═══ */}
        <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6 space-y-6">
          
          {/* Titre + Badges */}
          <div>
            <h1 className="text-3xl font-bold text-neutral-900 mb-3 break-words">
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


          {/* 🆕 SECTION PIÈCES JOINTES À AJOUTER ICI */}
          <div className="pt-4 border-t">
            <div className="flex items-center gap-2 mb-3">
              <Paperclip className="w-5 h-5 text-neutral-500" />
              <h2 className="text-sm font-semibold text-neutral-700">
                Pièces jointes
              </h2>
            </div>
            <AttachmentList taskId={id} />
          </div>

          {/* Métadonnées (Projet, Assigné, Dates) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
            
            {/* Projet */}
            <div className="flex items-center gap-3">
              <FolderOpen className="w-5 h-5 text-neutral-500" />
              <div>
                <p className="text-sm text-neutral-500">Projet</p>
                <p className="font-medium text-neutral-900">
                  {task.project?.name || 'Non assigné'}
                </p>
              </div>
            </div>


{/* Assigné à */}
{task.assigned_to ? (
  <div className="flex items-center gap-3">
    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold">
      {(task.assigned_to.full_name || task.assigned_to.username).charAt(0).toUpperCase()}
    </div>
    <div>
      <p className="text-sm text-neutral-500">Assigné à</p>
      <p className="font-medium text-neutral-900">
        {task.assigned_to.full_name || task.assigned_to.username}
      </p>
      <p className="text-xs text-neutral-500">
        {task.assigned_to.email}
      </p>
    </div>
  </div>
) : (
  <div className="flex items-center gap-3">
    <User className="w-5 h-5 text-neutral-400" />
    <div>
      <p className="text-sm text-neutral-500">Assigné à</p>
      <p className="font-medium text-neutral-400 italic">
        Non assigné
      </p>
    </div>
  </div>
)}



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
        
        {/* 🔧 Modal d'édition CORRIGÉ */}
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          title="Modifier la tâche"
        >
          <TaskForm
            initialData={task}           // ✅ CHANGÉ : task → initialData
            onSubmit={handleUpdate}      // ✅ AJOUTÉ
            onCancel={() => setIsEditModalOpen(false)} // ✅ AJOUTÉ
            isLoading={updating}         // ✅ CHANGÉ
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

        {/* ✅ NOUVELLE MODAL : Changer le statut */}
        <Modal
          isOpen={isStatusModalOpen}
          onClose={() => setIsStatusModalOpen(false)}
          title="Changer le statut"
        >
          <div className="space-y-4">
            <p className="text-sm text-neutral-600">
              Sélectionnez le nouveau statut de la tâche :
            </p>
            
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleChangeStatus('todo')}
                disabled={updating}
                className={`p-4 border-2 rounded-lg text-left transition-all ${
                  task.status === 'todo'
                    ? 'border-neutral-500 bg-neutral-50'
                    : 'border-neutral-200 hover:border-neutral-400'
                }`}
              >
                <div className="font-semibold text-neutral-900">À faire</div>
                <div className="text-xs text-neutral-500 mt-1">Pas encore commencé</div>
              </button>
              
              <button
                onClick={() => handleChangeStatus('in_progress')}
                disabled={updating}
                className={`p-4 border-2 rounded-lg text-left transition-all ${
                  task.status === 'in_progress'
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-neutral-200 hover:border-primary-300'
                }`}
              >
                <div className="font-semibold text-primary-900">En cours</div>
                <div className="text-xs text-primary-600 mt-1">En cours de réalisation</div>
              </button>
              
              <button
                onClick={() => handleChangeStatus('in_review')}
                disabled={updating}
                className={`p-4 border-2 rounded-lg text-left transition-all ${
                  task.status === 'in_review'
                    ? 'border-amber-500 bg-amber-50'
                    : 'border-neutral-200 hover:border-amber-300'
                }`}
              >
                <div className="font-semibold text-amber-900">En révision</div>
                <div className="text-xs text-amber-600 mt-1">En attente de validation</div>
              </button>
              
              <button
                onClick={() => handleChangeStatus('done')}
                disabled={updating}
                className={`p-4 border-2 rounded-lg text-left transition-all ${
                  task.status === 'done'
                    ? 'border-green-500 bg-green-50'
                    : 'border-neutral-200 hover:border-green-300'
                }`}
              >
                <div className="font-semibold text-green-900">Terminé</div>
                <div className="text-xs text-green-600 mt-1">Tâche complétée</div>
              </button>
            </div>
            
            {updating && (
              <div className="text-center text-sm text-neutral-500">
                Mise à jour en cours...
              </div>
            )}
          </div>
        </Modal>


        {/* Section commentaires - Style réseaux sociaux */}
        <CommentSection taskId={id} />


      </div>
    </Layout>
  );
};


export default TaskDetail;
