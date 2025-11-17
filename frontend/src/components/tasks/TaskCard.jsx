import { useNavigate } from 'react-router-dom';
import { MoreVertical, Edit2, Trash2, User, Calendar, Flag, Eye } from 'lucide-react'; // 🆕 Ajout Eye
import { useState } from 'react';

export const TaskCard = ({ task, onEdit, onDelete }) => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const getPriorityColor = (priority) => {
    const colors = {
      high: 'bg-red-100 text-red-700',
      medium: 'bg-amber-100 text-amber-700',
      low: 'bg-green-100 text-green-700',
    };
    return colors[priority] || 'bg-neutral-100 text-neutral-700';
  };

  const getPriorityLabel = (priority) => {
    const labels = {
      high: 'Urgent',
      medium: 'Moyen',
      low: 'Faible',
    };
    return labels[priority] || priority;
  };

  const getStatusColor = (status) => {
    const colors = {
      todo: 'bg-neutral-100 text-neutral-700',
      in_progress: 'bg-primary-100 text-primary-700',
      done: 'bg-green-100 text-green-700',
      blocked: 'bg-red-100 text-red-700',
    };
    return colors[status] || 'bg-neutral-100 text-neutral-700';
  };

  const getStatusLabel = (status) => {
    const labels = {
      todo: 'À faire',
      in_progress: 'En cours',
      done: 'Terminé',
      blocked: 'Bloqué',
    };
    return labels[status] || status;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Pas de date';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const isOverdue = () => {
    if (!task.due_date || task.status === 'done') return false;
    const today = new Date();
    const dueDate = new Date(task.due_date);
    return dueDate < today;
  };

  const handleEdit = () => {
    setIsMenuOpen(false);
    onEdit(task);
  };

  const handleDelete = () => {
    setIsMenuOpen(false);
    onDelete(task);
  };

  // 🆕 Handler pour le bouton "Voir détails"
  const handleViewDetails = () => {
    navigate(`/tasks/${task.id}`);
  };

  return (
    <div className="card group hover:shadow-lg transition-all duration-200">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-neutral-900 mb-2 group-hover:text-primary-600 transition-colors">
            {task.title}
          </h3>

          <div className="flex items-center gap-2 mb-2">
            <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded ${getPriorityColor(task.priority)}`}>
              <Flag className="w-3 h-3" />
              {getPriorityLabel(task.priority)}
            </span>

            <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded ${getStatusColor(task.status)}`}>
              {getStatusLabel(task.status)}
            </span>
          </div>
        </div>

        <div className="relative">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <MoreVertical className="w-5 h-5 text-neutral-400" />
          </button>

          {isMenuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-neutral-200 z-10">
              <button
                onClick={handleEdit}
                className="w-full px-4 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-50 flex items-center gap-2 rounded-t-lg"
              >
                <Edit2 size={16} />
                Modifier
              </button>
              <button
                onClick={handleDelete}
                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 rounded-b-lg"
              >
                <Trash2 size={16} />
                Supprimer
              </button>
            </div>
          )}
        </div>
      </div>

      {task.description && (
        <p className="text-sm text-neutral-600 mb-4 line-clamp-2">
          {task.description}
        </p>
      )}

      {task.project_name && (
        <div className="mb-3">
          <span className="text-xs text-neutral-500">Projet : </span>
          <span className="text-xs font-medium text-neutral-700">
            {task.project_name}
          </span>
        </div>
      )}

      <div className="flex items-center justify-between pt-3 border-t border-neutral-200 mb-3"> {/* 🆕 Ajout mb-3 */}
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-neutral-500" />
          <span className="text-sm text-neutral-600">
            {task.assigned_to_name || 'Non assigné'}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <Calendar className="w-4 h-4 text-neutral-500" />
          <span className={`text-sm ${isOverdue() ? 'text-red-600 font-semibold' : 'text-neutral-600'}`}>
            {formatDate(task.due_date)}
          </span>
        </div>
      </div>

      {/* 🆕 BOUTON "VOIR DÉTAILS" */}
      <button
        onClick={handleViewDetails}
        className="w-full py-2 px-4 border border-neutral-300 rounded-lg text-neutral-700 hover:bg-neutral-50 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
      >
        <Eye className="w-4 h-4" />
        Voir détails
      </button>
    </div>
  );
};
