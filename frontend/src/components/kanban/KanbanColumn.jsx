import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { KanbanCard } from './KanbanCard';

/**
 * 📋 KanbanColumn - Une colonne de statut avec drag & drop
 * 
 * Représente une colonne Kanban (ex: "À faire", "En cours").
 * Contient des KanbanCard draggables et peut recevoir des drops.
 * 
 * @param {string} id - ID du statut ('todo', 'in_progress', etc.)
 * @param {string} title - Titre affiché ("À faire")
 * @param {Array} tasks - Liste des tâches de cette colonne
 * @param {Function} onTaskClick - Callback au clic sur une carte
 */
export const KanbanColumn = ({ 
  id,           // Identifiant de la colonne
  title,        // Titre affiché
  tasks,        // Tâches de cette colonne
  onTaskClick   // Fonction appelée au clic sur une carte
}) => {

  // ── Hook @dnd-kit pour rendre la colonne droppable ──
  const { setNodeRef, isOver } = useDroppable({
    id: id,  // ID unique de la zone droppable
  });

  /**
   * 🎨 Fonction : Classe CSS selon le statut
   * Applique les couleurs définies dans index.css
   */
  const getColumnHeaderClass = () => {
    const classes = {
      'todo': 'kanban-header-todo',
      'in_progress': 'kanban-header-in-progress',
      'in_review': 'kanban-header-in-review',
      'done': 'kanban-header-done',
    };
    return classes[id] || 'kanban-header-todo';
  };

  return (
    <div className="kanban-column">
      
      {/* ── Header : Titre + Compteur ── */}
      <div className={`kanban-column-header ${getColumnHeaderClass()}`}>
        
        {/* Titre de la colonne */}
        <h3 className="font-semibold text-neutral-800">
          {title}
        </h3>

        {/* Badge compteur de tâches */}
        <span className="bg-white bg-opacity-60 px-2 py-1 rounded-full text-xs font-medium">
          {tasks.length}
        </span>

      </div>

      {/* ── Zone droppable contenant les cartes ── */}
      <div 
        ref={setNodeRef}  // Référence pour @dnd-kit
        className={`kanban-dropzone ${isOver ? 'drag-over' : ''}`}
        // Classe 'drag-over' ajoutée quand on survole avec une carte
      >
        
        {/* SortableContext : permet de trier les cartes dans la colonne */}
        <SortableContext 
          items={tasks.map(t => t.id)}  // Liste des IDs de tâches
          strategy={verticalListSortingStrategy}  // Tri vertical
        >
          
          {/* Liste des cartes */}
          {tasks.length === 0 ? (
            // Message si colonne vide
            <div className="text-center text-neutral-400 text-sm py-8">
              Aucune tâche
            </div>
          ) : (
            // Affichage des cartes
            tasks.map(task => (
              <KanbanCard
                key={task.id}
                task={task}
                onClick={() => onTaskClick(task)}  // Ouvre modal détails
              />
            ))
          )}

        </SortableContext>

      </div>
    </div>
  );
};
