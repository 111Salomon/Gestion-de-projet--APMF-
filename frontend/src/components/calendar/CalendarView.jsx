/**
 * ═══════════════════════════════════════════════════════════════
 * CALENDAR VIEW - VERSION ULTRA ÉPURÉE
 * ═══════════════════════════════════════════════════════════════
 * 
 * ✅ Améliorations design :
 * - Bordures 1px ultra-fines
 * - Couleurs douces (neutral-100/200)
 * - Espacements généreux
 * - Shadows subtiles
 * - Rounded-xl moderne
 * - Transitions smooth
 * 
 * ⚠️ Logique drag & drop 100% préservée
 */

import { DndContext, DragOverlay, closestCenter } from '@dnd-kit/core';
import { useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, startOfWeek, endOfWeek } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { DraggableTask } from './DraggableTask';
import { DroppableDay } from './DroppableDay';
import { calendarAPI } from '../../api/calendar';
import toast from 'react-hot-toast';
import { getApiErrorMessage } from '../../utils/apiError';

export const CalendarView = ({ tasks, currentDate, onTaskClick, onMonthChange, onTasksUpdate }) => {
  const [activeTask, setActiveTask] = useState(null);

  // Génère les jours du mois avec padding
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const daysToShow = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  // Jours de la semaine
  const weekDays = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

  // Grouper les tâches par date
  const tasksByDate = {};
  tasks.forEach(task => {
    const dateKey = format(new Date(task.due_date), 'yyyy-MM-dd');
    if (!tasksByDate[dateKey]) {
      tasksByDate[dateKey] = [];
    }
    tasksByDate[dateKey].push(task);
  });

  // Navigation mois
  const handlePreviousMonth = () => {
    const prevMonth = new Date(currentDate);
    prevMonth.setMonth(prevMonth.getMonth() - 1);
    onMonthChange(prevMonth);
  };

  const handleNextMonth = () => {
    const nextMonth = new Date(currentDate);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    onMonthChange(nextMonth);
  };

  const handleToday = () => {
    onMonthChange(new Date());
  };

  // Gestion du drag start
  const handleDragStart = (event) => {
    const task = event.active.data.current?.task;
    if (task) {
      setActiveTask(task);
    }
  };

  // Gestion du drag end
  const handleDragEnd = async (event) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const task = active.data.current?.task;
    const targetDate = over.data.current?.date;

    if (!task || !targetDate) return;

    const oldDate = task.due_date;
    const newDate = format(targetDate, 'yyyy-MM-dd');

    if (oldDate === newDate) return;

    try {
      await calendarAPI.changeTaskDate(task.id, newDate);
      toast.success(`Échéance déplacée au ${format(targetDate, 'd MMMM', { locale: fr })}`);
      
      if (onTasksUpdate) {
        onTasksUpdate();
      }
    } catch (error) {
      console.error('❌ Erreur changement date:', error);
      toast.error(getApiErrorMessage(error, 'Impossible de déplacer la tâche'));
    }
  };

  return (
    <DndContext
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="space-y-4">
        
        {/* ✨ HEADER NAVIGATION - ÉPURÉ */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            
            {/* Bouton Précédent */}
            <button
              onClick={handlePreviousMonth}
              className="p-2 hover:bg-orange-50 rounded-lg transition-all duration-200 
                       group focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
              aria-label="Mois précédent"
            >
              <ChevronLeft className="w-5 h-5 text-neutral-500 group-hover:text-orange-600" strokeWidth={2} />
            </button>
            
            {/* Titre Mois */}
            <h2 className="text-lg font-bold text-neutral-900 min-w-[180px] text-center capitalize">
              {format(currentDate, 'MMMM yyyy', { locale: fr })}
            </h2>
            
            {/* Bouton Suivant */}
            <button
              onClick={handleNextMonth}
              className="p-2 hover:bg-orange-50 rounded-lg transition-all duration-200 
                       group focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
              aria-label="Mois suivant"
            >
              <ChevronRight className="w-5 h-5 text-neutral-500 group-hover:text-orange-600" strokeWidth={2} />
            </button>
          </div>

          {/* ✨ BOUTON AUJOURD'HUI - Subtil */}
          <button
            onClick={handleToday}
            className="px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white 
                     rounded-lg hover:shadow-md hover:shadow-orange-500/25 
                     transition-all duration-200 font-medium text-sm
                     hover:scale-[1.02] active:scale-[0.98]
                     focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
          >
            Aujourd'hui
          </button>
        </div>

        {/* ✨ GRILLE CALENDRIER - ULTRA ÉPURÉE */}
        <div className="border border-neutral-200 rounded-xl overflow-hidden bg-white">
          
          {/* Header jours semaine */}
          <div className="grid grid-cols-7 bg-neutral-50/50 border-b border-neutral-200">
            {weekDays.map((day) => (
              <div
                key={day}
                className="py-3 text-center text-xs font-semibold text-neutral-600 uppercase tracking-wider"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Grille des jours */}
          <div className="grid grid-cols-7 divide-x divide-y divide-neutral-100">
            {daysToShow.map((date, index) => {
              const dateKey = format(date, 'yyyy-MM-dd');
              const dayTasks = tasksByDate[dateKey] || [];
              const isTodayDate = isToday(date);
              const isCurrentMonth = date.getMonth() === currentDate.getMonth();

              return (
                <DroppableDay
                  key={dateKey}
                  date={date}
                  tasks={dayTasks}
                  isToday={isTodayDate}
                  isCurrentMonth={isCurrentMonth}
                  onTaskClick={onTaskClick}
                >
                  <div className={`${!isCurrentMonth ? 'opacity-40' : ''}`}>
                    {dayTasks.map((task) => (
                      <DraggableTask
                        key={task.id}
                        task={task}
                        onTaskClick={onTaskClick}
                      />
                    ))}
                  </div>
                </DroppableDay>
              );
            })}
          </div>
        </div>
      </div>

      {/* ✨ OVERLAY DRAG - Subtil */}
      <DragOverlay>
        {activeTask && (
          <div className="bg-white shadow-xl rounded-lg p-3 border border-orange-300 
                        ring-2 ring-orange-500/20 transform rotate-2 scale-105">
            <p className="text-sm font-semibold text-neutral-900">{activeTask.title}</p>
            <p className="text-xs text-neutral-500 mt-1">Déplacement...</p>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
};
