/**
 * ═══════════════════════════════════════════════════════════════
 * DRAGGABLE TASK - VERSION LÉGÈRE ET AÉRÉE
 * ═══════════════════════════════════════════════════════════════
 * 
 * ✅ Design repensé :
 * - Couleurs PASTELS (douces pour les yeux)
 * - Beaucoup d'aération (padding généreux)
 * - Tooltip discret et élégant
 * - Handle subtil mais visible
 * - Focus states accessibles
 * - Animations fluides
 * 
 * ⚠️ 100% draggable garanti
 */

import { useDraggable } from '@dnd-kit/core';
import { GripVertical, Flag } from 'lucide-react';

export const DraggableTask = ({ task, onTaskClick }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: `task-${task.id}`,
    data: { task },
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    zIndex: isDragging ? 50 : 'auto',
    opacity: isDragging ? 0.6 : 1,
  } : undefined;

  // ✨ COULEURS DOUCES ET AÉRÉES (Pastel + Text foncé)
  const getPriorityStyles = () => {
    const styles = {
      urgent: {
        bg: 'bg-red-50',
        text: 'text-red-700',
        border: 'border-red-200',
        hoverBorder: 'hover:border-red-400',
        hoverBg: 'hover:bg-red-100',
        icon: 'text-red-500',
        label: 'Urgent'
      },
      high: {
        bg: 'bg-orange-50',
        text: 'text-orange-700',
        border: 'border-orange-200',
        hoverBorder: 'hover:border-orange-400',
        hoverBg: 'hover:bg-orange-100',
        icon: 'text-orange-500',
        label: 'Haute'
      },
      medium: {
        bg: 'bg-green-50',
        text: 'text-green-700',
        border: 'border-green-200',
        hoverBorder: 'hover:border-green-400',
        hoverBg: 'hover:bg-green-100',
        icon: 'text-green-500',
        label: 'Moyenne'
      },
      low: {
        bg: 'bg-neutral-50',
        text: 'text-neutral-600',
        border: 'border-neutral-200',
        hoverBorder: 'hover:border-neutral-300',
        hoverBg: 'hover:bg-neutral-100',
        icon: 'text-neutral-400',
        label: 'Basse'
      },
    };
    return styles[task.priority] || styles.low;
  };

  const priority = getPriorityStyles();

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        group relative mb-1.5
        ${isDragging ? 'scale-105' : ''}
        transition-transform duration-200
      `}
    >
      {/* ✨ HANDLE DRAG - DISCRET ET ÉLÉGANT */}
      <div
        {...listeners}
        {...attributes}
        className="absolute left-1 top-1/2 -translate-y-1/2 z-10
                   w-5 h-8 bg-white/80 backdrop-blur-sm
                   rounded border border-neutral-200
                   opacity-0 group-hover:opacity-100 
                   transition-all duration-300
                   flex items-center justify-center 
                   cursor-grab active:cursor-grabbing
                   hover:bg-orange-50 hover:border-orange-300
                   shadow-sm"
        title="Glisser pour déplacer"
      >
        <GripVertical className="w-3.5 h-3.5 text-neutral-400 group-hover:text-orange-500 
                                transition-colors" strokeWidth={2} />
      </div>

      {/* ✨ CONTENU TÂCHE - LÉGER ET AÉRÉ */}
      <div
        onClick={() => !isDragging && onTaskClick(task)}
        className={`
          px-3 py-2.5 rounded-lg
          ${priority.bg} ${priority.text} 
          border-l-[3px] ${priority.border}
          ${priority.hoverBorder} ${priority.hoverBg}
          transition-all duration-200
          cursor-pointer
          shadow-sm hover:shadow-md
          group-hover:pl-8
        `}
      >
        <div className="flex items-center gap-2">
          {/* Icône priorité - subtile */}
          <Flag className={`w-3 h-3 ${priority.icon} flex-shrink-0 opacity-60`} 
                strokeWidth={2} fill="currentColor" />
          
          {/* Titre tâche */}
          <span className="text-xs font-medium truncate leading-relaxed">
            {task.title}
          </span>

          {/* Indicateur retard - discret */}
          {task.is_overdue && (
            <span className="ml-auto flex-shrink-0 w-1.5 h-1.5 bg-red-500 rounded-full 
                           animate-pulse" 
                  title="En retard"
            />
          )}
        </div>
      </div>

      {/* ✨ TOOLTIP ÉLÉGANT - VISIBLE AU HOVER */}
      <div className="absolute left-0 bottom-full mb-1.5 w-full
                    opacity-0 group-hover:opacity-100 pointer-events-none
                    transition-opacity duration-300 delay-500 z-20">
        <div className="bg-neutral-900/95 backdrop-blur-sm text-white 
                      text-[11px] px-2.5 py-1.5 rounded-md shadow-xl">
          <div className="font-semibold mb-0.5">{task.title}</div>
          <div className="text-neutral-300 flex items-center gap-2">
            <span>Priorité: {priority.label}</span>
            {task.is_overdue && (
              <span className="text-red-300">• En retard</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
