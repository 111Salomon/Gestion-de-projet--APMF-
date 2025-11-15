import { Calendar, User } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

/**
 * 🎴 KanbanCard - Version compacte de TaskCard pour le Kanban
 */
export const KanbanCard = ({ task, onClick }) => {
  
  // ── Hook @dnd-kit pour rendre la carte draggable ──
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ 
    id: task.id,
  });

  // Style CSS pendant le drag
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  /**
   * 🎨 Fonction : Couleur du badge de priorité
   */
  const getPriorityColor = (priority) => {
    const colors = {
      urgent: 'bg-red-600 text-white',
      high: 'bg-red-100 text-red-700',
      medium: 'bg-amber-100 text-amber-700',
      low: 'bg-green-100 text-green-700',
    };
    return colors[priority] || 'bg-neutral-100 text-neutral-700';
  };

  /**
   * 📅 Fonction : Formater la date d'échéance
   */
  const formatDate = (dateString) => {
    if (!dateString) return null;
    
    const date = new Date(dateString);
    const today = new Date();
    const diffTime = date - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return <span className="text-red-600">En retard</span>;
    if (diffDays === 0) return <span className="text-amber-600">Aujourd'hui</span>;
    if (diffDays === 1) return <span className="text-amber-500">Demain</span>;
    
    return date.toLocaleDateString('fr-FR', { 
      day: 'numeric', 
      month: 'short' 
    });
  };

  /**
   * 🏷️ Fonction : Label de priorité en français
   */
  const getPriorityLabel = (priority) => {
    const labels = {
      urgent: 'Urgent',
      high: 'Haute',
      medium: 'Moyenne',
      low: 'Basse',
    };
    return labels[priority] || priority;
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`kanban-card ${isDragging ? 'dragging' : ''}`}
      // ✅ CORRECTION : listeners ET attributes sur la carte entière
      {...attributes}
      {...listeners}
    >
      
      {/* ── Contenu de la carte ── */}
      <div 
        onClick={onClick}  // Clic ouvre modal
        className="w-full"
      >
        
        {/* Titre de la tâche (tronqué à 2 lignes) */}
        <h4 className="text-sm font-medium text-neutral-900 mb-2 line-clamp-2">
          {task.title}
        </h4>

        {/* Badge de priorité */}
        <div className="mb-2">
          <span className={`text-xs px-2 py-1 rounded-full font-medium ${getPriorityColor(task.priority)}`}>
            {getPriorityLabel(task.priority)}
          </span>
        </div>

        {/* Footer : Assigné + Date */}
        <div className="flex justify-between items-center text-xs text-neutral-600">
          
          {/* Personne assignée */}
          <div className="flex items-center gap-1">
            <User size={14} />
            <span className="truncate max-w-[120px]">
              {task.assigned_to?.first_name || 'Non assigné'}
            </span>
          </div>

          {/* Date d'échéance */}
          {task.due_date && (
            <div className="flex items-center gap-1">
              <Calendar size={14} />
              <span>{formatDate(task.due_date)}</span>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
