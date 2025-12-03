import { useDraggable } from '@dnd-kit/core';
import { GripVertical } from 'lucide-react';

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
    opacity: isDragging ? 0.5 : 1,
  } : undefined;

  // Couleurs par priorité
  const getPriorityStyles = () => {
    const styles = {
      urgent: 'bg-red-500 border-red-600',
      high: 'bg-blue-500 border-blue-600',
      medium: 'bg-green-500 border-green-600',
      low: 'bg-yellow-500 border-yellow-600',
    };
    return styles[task.priority] || 'bg-gray-500 border-gray-600';
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        group relative cursor-pointer
        ${isDragging ? 'shadow-2xl' : 'shadow-sm'}
      `}
    >
      {/* Handle de drag (visible au hover) */}
      <div
        {...listeners}
        {...attributes}
        className="absolute left-0 top-0 bottom-0 w-6 bg-neutral-100 
                   opacity-0 group-hover:opacity-100 transition-opacity
                   flex items-center justify-center cursor-grab active:cursor-grabbing
                   border-r border-neutral-200"
      >
        <GripVertical className="w-4 h-4 text-neutral-400" />
      </div>

      {/* Contenu de la tâche */}
      <div
        onClick={() => !isDragging && onTaskClick(task)}
        className={`
          pl-2 pr-2 py-1 rounded text-white text-xs font-medium
          border-l-4 ${getPriorityStyles()}
          hover:brightness-110 transition-all
          truncate
        `}
      >
        {task.title}
      </div>
    </div>
  );
};
