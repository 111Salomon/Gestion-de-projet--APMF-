import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { KanbanCard } from './KanbanCard';
import { CheckCircle2, Circle, Clock, Eye } from 'lucide-react';

const KanbanColumnComponent = ({ 
  id,
  title,
  color,
  tasks,
  onTaskClick
}) => {

  const { setNodeRef, isOver } = useDroppable({
    id: id,
  });

  // Configuration couleurs par statut
  const getColumnStyle = () => {
    const styles = {
      'neutral': {
        header: 'bg-neutral-50 border-neutral-200',
        icon: 'text-neutral-600',
        badge: 'bg-neutral-600',
        dropzone: 'border-neutral-200',
        IconComponent: Circle,
      },
      'blue': {
        header: 'bg-blue-50 border-blue-200',
        icon: 'text-blue-600',
        badge: 'bg-blue-600',
        dropzone: 'border-blue-200',
        IconComponent: Clock,
      },
      'amber': {
        header: 'bg-amber-50 border-amber-200',
        icon: 'text-amber-600',
        badge: 'bg-amber-600',
        dropzone: 'border-amber-200',
        IconComponent: Eye,
      },
      'green': {
        header: 'bg-green-50 border-green-200',
        icon: 'text-green-600',
        badge: 'bg-green-600',
        dropzone: 'border-green-200',
        IconComponent: CheckCircle2,
      },
    };
    return styles[color] || styles.neutral;
  };

  const columnStyle = getColumnStyle();
  const IconComponent = columnStyle.IconComponent;

  return (
    <div className="flex flex-col h-full">
      
      {/* Header */}
      <div className={`flex items-center justify-between px-4 py-3 rounded-xl  mb-4
                     ${columnStyle.header} transition-all duration-200`}>
        <div className="flex items-center gap-2">
          <IconComponent className={`w-5 h-5 ${columnStyle.icon}`} strokeWidth={2.5} />
          <h3 className="font-bold text-neutral-900">{title}</h3>
        </div>
        <span className={`${columnStyle.badge} text-white px-2.5 py-1 rounded-full text-xs font-bold
                        shadow-sm`}>
          {tasks.length}
        </span>
      </div>

      {/* ✅ Dropzone avec SCROLL Asana-style */}
      <div 
        ref={setNodeRef}
        className={`flex-1 rounded-xl border-2 border-dashed p-3
                   overflow-y-auto  
                   max-h-[calc(100vh-280px)]
                   transition-all duration-200
                   kanban-scrollbar
                   ${isOver 
                     ? 'border-orange-400 bg-orange-50/50 shadow-inner' 
                     : `${columnStyle.dropzone} bg-white/30`}`}
        style={{
          minHeight: '500px',
        }}
      >
        
        {tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center mb-3">
              <IconComponent className="w-8 h-8 text-neutral-400" strokeWidth={2} />
            </div>
            <p className="text-neutral-400 text-sm font-medium">Aucune tâche</p>
            <p className="text-neutral-400 text-xs mt-1">Glissez une tâche ici</p>
          </div>
        ) : (
          <div className="space-y-3">
            {tasks.map(task => (
              <KanbanCard
                key={task.id}
                task={task}
                onClick={() => onTaskClick(task)}
              />
            ))}
          </div>
        )}

      </div>
    </div>
  );
};

export const KanbanColumn = React.memo(KanbanColumnComponent);
