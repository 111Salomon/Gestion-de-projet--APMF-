import React from 'react';
import { Calendar, User, Flag, Clock } from 'lucide-react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';

const KanbanCardComponent = ({ task, onClick }) => {
  
  // ✅ CORRECTION : useDraggable au lieu de useSortable
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging
  } = useDraggable({ 
    id: task.id,
    data: {
      task: task,  // Passe les données de la tâche
    }
  });

  const style = {
    transform: CSS.Translate.toString(transform),  // ✅ Translate au lieu de Transform
    opacity: isDragging ? 0.5 : 1,
    cursor: isDragging ? 'grabbing' : 'grab',
  };

  // Configuration priorité
  const getPriorityConfig = (priority) => {
    const configs = {
      high: {
        color: 'bg-red-50 text-red-700',
        label: 'Urgente',
        icon: 'text-red-600',
      },
      medium: {
        color: 'bg-amber-50 text-amber-700',
        label: 'Moyenne',
        icon: 'text-amber-600',
      },
      low: {
        color: 'bg-green-50 text-green-700',
        label: 'Faible',
        icon: 'text-green-600',
      },
    };
    return configs[priority] || configs.medium;
  };

  // Formatage date
  const formatDate = (dateString) => {
    if (!dateString) return null;
    
    const date = new Date(dateString);
    const today = new Date();
    const diffTime = date - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { text: 'En retard', color: 'text-red-600' };
    if (diffDays === 0) return { text: "Aujourd'hui", color: 'text-amber-600' };
    if (diffDays === 1) return { text: 'Demain', color: 'text-amber-500' };
    
    return { 
      text: date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }),
      color: 'text-neutral-600'
    };
  };

  const priorityConfig = getPriorityConfig(task.priority);
  const dateInfo = task.due_date ? formatDate(task.due_date) : null;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`bg-white rounded-xl border border-neutral-200 p-4
                 hover:shadow-lg hover:border-neutral-300
                 transition-all duration-200
                 group ${isDragging ? 'shadow-2xl ring-2 ring-orange-500/50 scale-105' : ''}`}
    >
      {/* ✅ IMPORTANT : onClick doit être sur un élément SANS listeners de drag */}
      <div 
        onClick={(e) => {
          e.stopPropagation();  // Empêche le drag
          onClick();
        }} 
        className="w-full"
      >
        
        {/* Titre */}
        <h4 className="text-sm font-semibold text-neutral-900 mb-3 line-clamp-2 
                     group-hover:text-orange-600 transition-colors">
          {task.title}
        </h4>

        {/* Badge priorité */}
        {task.priority && (
          <div className="mb-3">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 
                           text-xs font-semibold rounded-lg ${priorityConfig.color}`}>
              <Flag className={`w-3 h-3 ${priorityConfig.icon}`} strokeWidth={2.5} />
              {priorityConfig.label}
            </span>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between text-xs">
          
          {/* Assigné */}
          <div className="flex items-center gap-1.5 text-neutral-600">
            {task.assigned_to ? (
              <>
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-orange-400 to-orange-600
                             flex items-center justify-center text-white text-xs font-bold">
                  {(task.assigned_to.full_name || task.assigned_to.username).charAt(0).toUpperCase()}
                </div>
                <span className="font-medium truncate max-w-[80px]">
                  {task.assigned_to.full_name || task.assigned_to.username}
                </span>
              </>
            ) : (
              <>
                <User className="w-4 h-4 text-neutral-400" strokeWidth={2} />
                <span className="text-neutral-400 italic">Non assigné</span>
              </>
            )}
          </div>

          {/* Date */}
          {dateInfo && (
            <div className={`flex items-center gap-1 font-medium ${dateInfo.color}`}>
              <Clock className="w-3.5 h-3.5" strokeWidth={2.5} />
              <span>{dateInfo.text}</span>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export const KanbanCard = React.memo(KanbanCardComponent);
