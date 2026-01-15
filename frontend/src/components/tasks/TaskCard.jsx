import { useNavigate } from 'react-router-dom';
import { MoreVertical, Edit2, Trash2, User, Calendar, Flag, Eye } from 'lucide-react';
import { useState } from 'react';
import { canModifyTask, canDeleteTask } from '../../utils/permissions';
import { Avatar } from '../common/Avatar';
import { useAuth } from '../../context/AuthContext';


export const TaskCard = ({ task, onEdit, onDelete }) => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user } = useAuth();

    // ✅ AJOUTEZ CES 3 LOGS ICI
  console.log('🔍 Tâche complète:', task);
  console.log('🔍 Assigné à:', task.assigned_to);
  console.log('🔍 Avatar URL:', task.assigned_to?.avatar_url);

  const userCanModify = canModifyTask(user, task);
  const userCanDelete = canDeleteTask(user, task);
  const hasAnyAction = userCanModify || userCanDelete;


  const getPriorityColor = (priority) => {
    const colors = {
      high: 'bg-red-50 text-red-700',
      medium: 'bg-amber-50 text-amber-700',
      low: 'bg-blue-50 text-blue-700',
    };
    return colors[priority] || 'bg-neutral-50 text-neutral-700';
  };

  const getPriorityAccent = (priority) => {
    const accents = {
      high: 'bg-red-500',
      medium: 'bg-amber-500',
      low: 'bg-blue-500',
    };
    return accents[priority] || 'bg-neutral-500';
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
      todo: 'bg-blue-50 text-blue-700',
      in_progress: 'bg-amber-50 text-amber-700',
      in_review: 'bg-neutral-100 text-neutral-700',
      done: 'bg-green-50 text-green-700',
      blocked: 'bg-red-50 text-red-700',
    };
    return colors[status] || 'bg-neutral-50 text-neutral-700';
  };

  const getStatusAccent = (status) => {
    const accents = {
      todo: 'bg-blue-500',
      in_progress: 'bg-amber-500',
      in_review: 'bg-neutral-400',
      done: 'bg-green-500',
      blocked: 'bg-red-500',
    };
    return accents[status] || 'bg-neutral-500';
  };

  const getStatusLabel = (status) => {
    const labels = {
      todo: 'À faire',
      in_progress: 'En cours',
      in_review: 'En révision',
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

  const handleViewDetails = () => {
    navigate(`/tasks/${task.id}`);
  };


// Dans TaskCard.jsx, remplace le return par :

return (
  <div 
    className={`
      group relative bg-white rounded-2xl border 
      hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden
      ${isOverdue() 
        ? 'border-red-200 bg-red-50/30' 
        : 'border-neutral-200 hover:border-neutral-300'
      }
    `}
    onClick={handleViewDetails}
  >
    {/* Border top coloré selon le statut */}
    <div className={`absolute top-0 left-0 right-0 h-1 ${getStatusAccent(task.status)}`} />
    
    {/* 🆕 Border bottom pour tâches en retard - SUBTIL */}
    {isOverdue() && (
      <div className="absolute left-0 right-0 bottom-0 h-1 bg-red-500" />
    )}

    <div className="p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 pr-2">
          <h3 className="text-lg font-bold text-neutral-900 mb-3 line-clamp-fix">
            {task.title}
          </h3>

          {/* Badges statut + priorité + EN RETARD */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 
                           text-xs font-medium rounded-lg ${getStatusColor(task.status)}`}>
              <div className={`w-1.5 h-1.5 rounded-full ${getStatusAccent(task.status)}`} />
              {getStatusLabel(task.status)}
            </span>

            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 
                           text-xs font-medium rounded-lg ${getPriorityColor(task.priority)}`}>
              <Flag className="w-3 h-3" />
              {getPriorityLabel(task.priority)}
            </span>

            {/* 🆕 Badge "En retard" - SUBTIL */}
            {isOverdue() && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 
                             bg-red-100 text-red-700 text-xs font-semibold rounded-lg
                             animate-pulse">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
                En retard
              </span>
            )}
          </div>
        </div>

        {/* Menu actions */}
        {hasAnyAction && (
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsMenuOpen(!isMenuOpen);
              }}
              className="p-2 hover:bg-neutral-100 rounded-lg transition-colors 
                       opacity-0 group-hover:opacity-100"
            >
              <MoreVertical className="w-4 h-4 text-neutral-400" />
            </button>

            {isMenuOpen && (
              <>
                <div 
                  className="fixed inset-0 z-10"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsMenuOpen(false);
                  }}
                />

                <div 
                  className="absolute right-0 mt-1 w-48 bg-white rounded-xl 
                           shadow-lg border border-neutral-200 z-20 py-1"
                  style={{ animation: 'fadeIn 0.15s ease-out' }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {userCanModify && (
                    <button
                      onClick={handleEdit}
                      className="w-full px-4 py-2.5 text-left text-sm text-neutral-700 
                               hover:bg-neutral-50 flex items-center gap-2 transition-colors"
                    >
                      <Edit2 size={16} />
                      Modifier
                    </button>
                  )}
                  
                  {userCanDelete && (
                    <button
                      onClick={handleDelete}
                      className="w-full px-4 py-2.5 text-left text-sm text-red-600 
                               hover:bg-red-50 flex items-center gap-2 transition-colors"
                    >
                      <Trash2 size={16} />
                      Supprimer
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Description */}
      {/* <p className="text-sm text-neutral-600 mb-4 line-clamp-2 leading-relaxed">
        {task.description || 'Aucune description disponible'}
      </p> */}

      {/* Projet */}
      {task.project?.name && (
        <div className="mb-4 px-3 py-2 bg-neutral-50 rounded-lg">
          <span className="text-xs text-neutral-500">Projet : </span>
          <span className="text-xs font-semibold text-neutral-700">
            {task.project.name}
          </span>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 mt-2 border-t border-neutral-100">
{task.assigned_to ? (
  <div className="flex items-center gap-2">
    <Avatar
      avatarUrl={task.assigned_to.avatar_url}
      name={task.assigned_to.full_name || task.assigned_to.username}
      size="sm"
      showBorder={true}
    />
    <span className="text-xs text-neutral-600 font-medium truncate max-w-[100px]">
      {task.assigned_to.full_name || task.assigned_to.username}
    </span>
  </div>
) : (
  <span className="flex items-center gap-1.5 text-xs text-neutral-400">
    <User className="w-3.5 h-3.5" />
    Non assigné
  </span>
)}


        {/* Date - Plus subtile */}
        <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg
                       ${isOverdue() ? 'bg-red-100' : ''}`}>
          <Calendar className={`w-3.5 h-3.5 ${isOverdue() ? 'text-red-600' : 'text-neutral-500'}`} />
          <span className={`text-xs font-medium ${isOverdue() ? 'text-red-700' : 'text-neutral-500'}`}>
            {formatDate(task.due_date)}
          </span>
        </div>
      </div>

      {/* Bouton Voir détails */}
      {/* <button
        onClick={(e) => {
          e.stopPropagation();
          handleViewDetails();
        }}
        className="mt-5 w-full py-2.5 px-4 text-sm font-semibold
                 text-neutral-700 bg-white border-2 border-neutral-200
                 hover:border-neutral-900 hover:text-neutral-900 hover:bg-neutral-50
                 rounded-xl transition-all duration-300 
                 flex items-center justify-center gap-2"
      >
        <Eye className="w-4 h-4" />
        Voir détails
      </button> */}
    </div>
  </div>
);

};
