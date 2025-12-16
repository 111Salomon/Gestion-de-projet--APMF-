/**
 * ═══════════════════════════════════════════════════════════════
 * DROPPABLE DAY - VERSION OPTIMISÉE UI/UX (PROFESSIONNELLE)
 * ═══════════════════════════════════════════════════════════════
 * 
 * ✅ Changements appliqués :
 * - Aujourd'hui en orange (bg-orange-50) au lieu de bleu
 * - Hover state orange au survol
 * - Badge compteur orange si > 2 tâches
 * - Drop zone en orange avec icône Lucide
 * - Focus visible pour accessibilité
 * - SANS EMOJIS (design professionnel)
 * 
 * ⚠️ Logique droppable 100% préservée
 */

import { useDroppable } from '@dnd-kit/core';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { MoveDown, Inbox } from 'lucide-react';

export const DroppableDay = ({ date, tasks, isToday, isCurrentMonth, onTaskClick, children }) => {
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
        min-h-[120px] p-2 border-r border-b border-neutral-200
        transition-all duration-200
        ${isToday 
          ? 'bg-orange-50/50 ring-1 ring-orange-200 ring-inset' 
          : 'bg-white hover:bg-neutral-50'
        }
        ${isOver 
          ? 'bg-orange-100 ring-2 ring-orange-500 ring-inset shadow-inner' 
          : ''
        }
        ${!isCurrentMonth ? 'bg-neutral-50/50' : ''}
        focus-within:ring-2 focus-within:ring-orange-500 focus-within:ring-inset
      `}
      tabIndex={0}
      role="gridcell"
      aria-label={`${format(date, 'd MMMM yyyy', { locale: fr })} - ${tasks.length} tâche${tasks.length > 1 ? 's' : ''}`}
    >
      {/* ✨ HEADER JOUR - AMÉLIORÉ */}
      <div className="flex items-center justify-between mb-2">
        {/* Numéro du jour */}
        <span className={`
          text-sm font-bold transition-colors
          ${isToday 
            ? 'text-orange-600 bg-orange-200 w-7 h-7 rounded-full flex items-center justify-center' 
            : 'text-neutral-700'
          }
          ${!isCurrentMonth ? 'text-neutral-400' : ''}
        `}>
          {format(date, 'd')}
        </span>
        
        {/* ✨ BADGE NOMBRE DE TÂCHES - ORANGE SI > 2 */}
        {tasks.length > 0 && (
          <span className={`
            text-xs px-2 py-0.5 rounded-full font-semibold
            transition-all duration-200
            ${tasks.length > 2
              ? 'bg-orange-100 text-orange-700 ring-1 ring-orange-200' 
              : 'bg-neutral-100 text-neutral-600'
            }
          `}>
            {tasks.length}
          </span>
        )}
      </div>

      {/* ✨ LISTE DES TÂCHES */}
      <div className="space-y-1">
        {children}
      </div>

      {/* ✨ MESSAGE DROP ZONE - PROFESSIONNEL AVEC ICÔNE */}
      {isOver && (
        <div className="mt-2 flex items-center justify-center gap-2 text-center 
                      bg-gradient-to-br from-orange-100 to-orange-50 rounded-lg p-2.5 
                      border-2 border-orange-300 border-dashed animate-pulse">
          <MoveDown className="w-4 h-4 text-orange-600" strokeWidth={2.5} />
          <span className="text-xs text-orange-700 font-bold uppercase tracking-wide">
            Déposer ici
          </span>
        </div>
      )}

      {/* ✨ INDICATEUR VIDE (si jour actuel sans tâches) */}
      {isToday && tasks.length === 0 && !isOver && (
        <div className="mt-2 flex items-center justify-center gap-1.5 
                      bg-orange-50/50 rounded-lg p-2 border border-orange-100">
          <Inbox className="w-3.5 h-3.5 text-orange-400" strokeWidth={2} />
          <span className="text-xs text-orange-500 font-medium">
            Aucune tâche
          </span>
        </div>
      )}
    </div>
  );
};
