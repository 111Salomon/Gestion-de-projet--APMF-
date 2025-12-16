/**
 * ═══════════════════════════════════════════════════════════════
 * TASK PREVIEW MODAL - VERSION FINALE
 * ═══════════════════════════════════════════════════════════════
 * 
 * ✅ Améliorations :
 * - Design cohérent avec le thème
 * - Backdrop full screen
 * - Cards légères
 * - Couleurs subtiles
 * - Badge statut discret en haut
 * - Animation smooth
 */

import { useNavigate } from 'react-router-dom';
import { X, Calendar, User, Flag, FolderOpen, ArrowRight, AlertCircle } from 'lucide-react';
import { Modal } from '../common/Modal';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export const TaskPreviewModal = ({ task, isOpen, onClose }) => {
  const navigate = useNavigate();

  if (!task) return null;

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

  const handleViewDetails = () => {
    navigate(`/tasks/${task.id}`);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="max-w-xl">
      {/* ✨ HEADER avec badge statut */}
      <div className="relative px-6 pt-6 pb-4">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="flex-1">
            {/* Titre */}
            <h2 className="text-2xl font-bold text-neutral-900 leading-snug">
              {task.title}
            </h2>
          </div>
          
          {/* Bouton close */}
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-100 rounded-lg transition-colors flex-shrink-0"
          >
            <X className="w-5 h-5 text-neutral-400" strokeWidth={2} />
          </button>
        </div>
                    {/* Badge statut discret en haut */}
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg 
                          bg-neutral-100 text-neutral-600 text-xs font-medium mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-neutral-400"></span>
              {getStatusLabel(task.status)}
            </div>
      </div>

      {/* ✨ CONTENU */}
      <div className="px-6 pb-6 space-y-5">

        {/* Alerte retard */}
        {task.is_overdue && (
          <div className="flex items-start gap-3 p-4 bg-red-50 rounded-xl border border-red-100">
            <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-4 h-4 text-red-600" strokeWidth={2} />
            </div>
            <div className="flex-1 pt-0.5">
              <p className="text-sm font-semibold text-red-700 mb-1">
                Cette tâche est en retard
              </p>
              <p className="text-xs text-red-600">
                L'échéance est dépassée. Veuillez la traiter en priorité.
              </p>
            </div>
          </div>
        )}

        {/* ✨ GRILLE 2x2 - Cards légères */}
        <div className="grid grid-cols-2 gap-3">
          
          {/* Projet */}
          {task.project && (
            <div className="bg-neutral-50 rounded-xl p-4 border border-neutral-100 
                          hover:border-neutral-200 transition-colors">
              <div className="flex items-center gap-2 mb-2.5">
                <div className="w-7 h-7 bg-white rounded-lg shadow-sm flex items-center justify-center">
                  <FolderOpen className="w-3.5 h-3.5 text-neutral-600" strokeWidth={2} />
                </div>
                <p className="text-xs font-medium text-neutral-500">Projet</p>
              </div>
              <p className="text-sm font-semibold text-neutral-900 leading-snug">
                {task.project.name}
              </p>
            </div>
          )}

          {/* Assigné */}
          {task.assigned_to && (
            <div className="bg-neutral-50 rounded-xl p-4 border border-neutral-100 
                          hover:border-neutral-200 transition-colors">
              <div className="flex items-center gap-2 mb-2.5">
                <div className="w-7 h-7 bg-white rounded-lg shadow-sm flex items-center justify-center">
                  <User className="w-3.5 h-3.5 text-neutral-600" strokeWidth={2} />
                </div>
                <p className="text-xs font-medium text-neutral-500">Assigné à</p>
              </div>
              <p className="text-sm font-semibold text-neutral-900 leading-snug">
                {task.assigned_to.full_name || task.assigned_to.username}
              </p>
            </div>
          )}

          {/* Priorité */}
          <div className="bg-neutral-50 rounded-xl p-4 border border-neutral-100 
                        hover:border-neutral-200 transition-colors">
            <div className="flex items-center gap-2 mb-2.5">
              <div className={`w-7 h-7 rounded-lg shadow-sm flex items-center justify-center
                            ${task.priority === 'urgent' ? 'bg-red-100' :
                              task.priority === 'high' ? 'bg-orange-100' :
                              task.priority === 'medium' ? 'bg-green-100' : 'bg-neutral-200'}`}>
                <Flag className={`w-3.5 h-3.5
                              ${task.priority === 'urgent' ? 'text-red-600' :
                                task.priority === 'high' ? 'text-orange-600' :
                                task.priority === 'medium' ? 'text-green-600' : 'text-neutral-600'}`}
                      strokeWidth={2} />
              </div>
              <p className="text-xs font-medium text-neutral-500">Priorité</p>
            </div>
            <p className="text-sm font-semibold text-neutral-900">
              {getPriorityLabel(task.priority)}
            </p>
          </div>

          {/* Échéance */}
          <div className={`rounded-xl p-4 border transition-colors
                        ${task.is_overdue
                          ? 'bg-red-50 border-red-100 hover:border-red-200'
                          : 'bg-neutral-50 border-neutral-100 hover:border-neutral-200'}`}>
            <div className="flex items-center gap-2 mb-2.5">
              <div className={`w-7 h-7 rounded-lg shadow-sm flex items-center justify-center
                            ${task.is_overdue ? 'bg-red-100' : 'bg-white'}`}>
                <Calendar className={`w-3.5 h-3.5 ${task.is_overdue ? 'text-red-600' : 'text-neutral-600'}`}
                          strokeWidth={2} />
              </div>
              <p className={`text-xs font-medium ${task.is_overdue ? 'text-red-600' : 'text-neutral-500'}`}>
                Échéance
              </p>
            </div>
            <p className={`text-sm font-semibold ${task.is_overdue ? 'text-red-700' : 'text-neutral-900'}`}>
              {format(new Date(task.due_date), 'd MMMM yyyy', { locale: fr })}
            </p>
          </div>

        </div>

        {/* ✨ BOUTON - Style cohérent avec le thème */}
        <button
          onClick={handleViewDetails}
          className="w-full flex items-center justify-center gap-2 px-5 py-3.5
                   bg-gradient-to-r from-orange-500 to-orange-600 text-white
                   rounded-xl font-semibold text-sm
                   hover:shadow-lg hover:shadow-orange-500/30
                   transition-all duration-300
                   hover:scale-[1.02] active:scale-[0.98]
                   focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
        >
          <span>Voir les détails complets</span>
          <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
        </button>

      </div>
    </Modal>
  );
};
