import { useDroppable } from '@dnd-kit/core';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export const DroppableDay = ({ date, tasks, isToday, onTaskClick, children }) => {
  const {
    setNodeRef,
    isOver,
  } = useDroppable({
    id: `day-${format(date, 'yyyy-MM-dd')}`,
    data: { date },
  });

  return (
    <div
      ref={setNodeRef}
      className={`
        min-h-[120px] p-2 border border-neutral-200
        ${isToday ? 'bg-blue-50' : 'bg-white'}
        ${isOver ? 'bg-primary-100 ring-2 ring-primary-400' : ''}
        transition-colors
      `}
    >
      {/* Numéro du jour */}
      <div className="flex items-center justify-between mb-2">
        <span className={`
          text-sm font-semibold
          ${isToday ? 'text-primary-600' : 'text-neutral-700'}
        `}>
          {format(date, 'd')}
        </span>
        
        {/* Badge nombre de tâches */}
        {tasks.length > 0 && (
          <span className="text-xs bg-neutral-200 text-neutral-700 px-2 py-0.5 rounded-full">
            {tasks.length}
          </span>
        )}
      </div>

      {/* Liste des tâches */}
      <div className="space-y-1">
        {children}
      </div>

      {/* Message si drop zone active */}
      {isOver && (
        <div className="mt-2 text-center text-xs text-primary-600 font-medium">
          Déposer ici
        </div>
      )}
    </div>
  );
};
