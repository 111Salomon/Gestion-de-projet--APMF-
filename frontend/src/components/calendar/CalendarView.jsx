import { DndContext, DragOverlay, closestCenter } from '@dnd-kit/core';
import { useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, startOfWeek, endOfWeek } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { DraggableTask } from './DraggableTask';
import { DroppableDay } from './DroppableDay';
import { calendarAPI } from '../../api/calendar';
import toast from 'react-hot-toast';

export const CalendarView = ({ tasks, currentDate, onTaskClick, onMonthChange, onTasksUpdate }) => {
  const [activeTask, setActiveTask] = useState(null);

  // Génère les jours du mois avec padding
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 }); // Lundi
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const daysToShow = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  // Jours de la semaine
  const weekDays = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

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

    // Récupérer la tâche et la date cible
    const task = active.data.current?.task;
    const targetDate = over.data.current?.date;

    if (!task || !targetDate) return;

    const oldDate = task.due_date;
    const newDate = format(targetDate, 'yyyy-MM-dd');

    // Si même date, ne rien faire
    if (oldDate === newDate) return;

    try {
      // Appel API
      await calendarAPI.changeTaskDate(task.id, newDate);
      
      toast.success(`Échéance déplacée au ${format(targetDate, 'd MMMM', { locale: fr })}`);
      
      // Recharger les tâches
      if (onTasksUpdate) {
        onTasksUpdate();
      }
    } catch (error) {
      console.error('❌ Erreur changement date:', error);
      toast.error(error.response?.data?.message || 'Impossible de déplacer la tâche');
    }
  };

  return (
    <DndContext
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="space-y-4">
        {/* Header Navigation */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={handlePreviousMonth}
              className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            
            <h2 className="text-xl font-bold text-neutral-900 min-w-[200px] text-center">
              {format(currentDate, 'MMMM yyyy', { locale: fr })}
            </h2>
            
            <button
              onClick={handleNextMonth}
              className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <button
            onClick={handleToday}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
          >
            Aujourd'hui
          </button>
        </div>

        {/* Grille Calendrier */}
        <div className="border border-neutral-200 rounded-lg overflow-hidden bg-white">
          {/* Header jours semaine */}
          <div className="grid grid-cols-7 bg-neutral-50 border-b border-neutral-200">
            {weekDays.map((day) => (
              <div
                key={day}
                className="p-3 text-center text-sm font-semibold text-neutral-700 border-r border-neutral-200 last:border-r-0"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Grille des jours */}
          <div className="grid grid-cols-7">
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
                  onTaskClick={onTaskClick}
                >
                  <div className={`${!isCurrentMonth ? 'opacity-30' : ''}`}>
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

      {/* Overlay pendant le drag */}
      <DragOverlay>
        {activeTask && (
          <div className="bg-white shadow-2xl rounded-lg p-3 border-2 border-primary-400">
            <p className="text-sm font-medium text-neutral-900">{activeTask.title}</p>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
};
