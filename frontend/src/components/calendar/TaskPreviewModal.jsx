import { useNavigate } from 'react-router-dom';
import { X, Calendar, User, Flag, FolderOpen, ExternalLink } from 'lucide-react';
import { Modal } from '../common/Modal';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export const TaskPreviewModal = ({ task, isOpen, onClose }) => {
  const navigate = useNavigate();

  if (!task) return null;

  // Labels français
  const getStatusLabel = (status) => {
    const labels = {
      todo: 'À faire',
      in_progress: 'En cours',
      in_review: 'En révision',
      done: 'Terminée',
    };
    return labels[status] || status;
  };

  const getPriorityLabel = (priority) => {
    const labels = {
      urgent: 'Urgent',
      high: 'Haute',
      medium: 'Moyenne',
      low: 'Basse',
    };
    return labels[priority] || priority;
  };

  const getStatusColor = (status) => {
    const colors = {
      todo: 'bg-neutral-100 text-neutral-700',
      in_progress: 'bg-blue-100 text-blue-700',
      in_review: 'bg-amber-100 text-amber-700',
      done: 'bg-green-100 text-green-700',
    };
    return colors[status] || 'bg-neutral-100 text-neutral-700';
  };

  const handleViewDetails = () => {
    navigate(`/tasks/${task.id}`);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Aperçu de la tâche">
      <div className="space-y-4">
        
        {/* Titre + Statut */}
        <div>
          <h3 className="text-xl font-semibold text-neutral-900 mb-2">
            {task.title}
          </h3>
          <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(task.status)}`}>
            {getStatusLabel(task.status)}
          </span>
        </div>

        {/* Infos */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
          
          {/* Projet */}
          {task.project && (
            <div className="flex items-center gap-2">
              <FolderOpen className="w-4 h-4 text-neutral-500" />
              <div>
                <p className="text-xs text-neutral-500">Projet</p>
                <p className="text-sm font-medium text-neutral-900">
                  {task.project.name}
                </p>
              </div>
            </div>
          )}

          {/* Priorité */}
          <div className="flex items-center gap-2">
            <Flag className="w-4 h-4 text-neutral-500" />
            <div>
              <p className="text-xs text-neutral-500">Priorité</p>
              <p className="text-sm font-medium text-neutral-900">
                {getPriorityLabel(task.priority)}
              </p>
            </div>
          </div>

          {/* Assigné */}
          {task.assigned_to && (
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-neutral-500" />
              <div>
                <p className="text-xs text-neutral-500">Assigné à</p>
                <p className="text-sm font-medium text-neutral-900">
                  {task.assigned_to.full_name || task.assigned_to.username}
                </p>
              </div>
            </div>
          )}

          {/* Date */}
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-neutral-500" />
            <div>
              <p className="text-xs text-neutral-500">Échéance</p>
              <p className={`text-sm font-medium ${task.is_overdue ? 'text-red-600' : 'text-neutral-900'}`}>
                {format(new Date(task.due_date), 'd MMMM yyyy', { locale: fr })}
              </p>
            </div>
          </div>

        </div>

        {/* Alerte en retard */}
        {task.is_overdue && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-700 font-medium">
              ⚠️ Cette tâche est en retard
            </p>
          </div>
        )}

        {/* Bouton voir détails */}
        <div className="pt-4 border-t">
          <button
            onClick={handleViewDetails}
            className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center justify-center gap-2 font-medium"
          >
            <ExternalLink className="w-4 h-4" />
            Voir les détails complets
          </button>
        </div>

      </div>
    </Modal>
  );
};
