import { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Filter } from 'lucide-react';
import toast from 'react-hot-toast';
import { Layout } from '../../components/layout/Layout';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { CalendarView } from '../../components/calendar/CalendarView';
import { CalendarHeader } from '../../components/calendar/CalendarHeader';
import { TaskPreviewModal } from '../../components/calendar/TaskPreviewModal';
import { calendarAPI } from '../../api/calendar';
import { format, startOfMonth, endOfMonth } from 'date-fns';

export const Calendar = () => {
  const [tasks, setTasks] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedTask, setSelectedTask] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Charger les tâches du mois
  const loadTasks = async (date = currentDate) => {
    try {
      setLoading(true);
      const start = format(startOfMonth(date), 'yyyy-MM-dd');
      const end = format(endOfMonth(date), 'yyyy-MM-dd');
      
      const data = await calendarAPI.getTasks({ start, end });
      setTasks(data.tasks || []);
    } catch (error) {
      console.error('❌ Erreur chargement calendrier:', error);
      toast.error('Impossible de charger le calendrier');
    } finally {
      setLoading(false);
    }
  };

  // Charger le résumé
  const loadSummary = async () => {
    try {
      const data = await calendarAPI.getSummary();
      setSummary(data);
    } catch (error) {
      console.error('❌ Erreur résumé:', error);
    }
  };

  // Chargement initial
  useEffect(() => {
    loadTasks();
    loadSummary();
  }, []);

  // Changement de mois
  const handleMonthChange = (newDate) => {
    setCurrentDate(newDate);
    loadTasks(newDate);
  };

  // Clic sur une tâche
  const handleTaskClick = (task) => {
    setSelectedTask(task);
    setIsModalOpen(true);
  };

  if (loading && tasks.length === 0) {
    return (
      <Layout>
        <LoadingSpinner />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        
        {/* Header avec résumé */}
        <CalendarHeader 
          summary={summary}
          currentDate={currentDate}
          onMonthChange={handleMonthChange}
        />

        {/* Vue calendrier */}
        <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
          <CalendarView 
            tasks={tasks}
            currentDate={currentDate}
            onTaskClick={handleTaskClick}
            onMonthChange={handleMonthChange}
          />
        </div>

        {/* Modal aperçu tâche */}
        <TaskPreviewModal
          task={selectedTask}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />

      </div>
    </Layout>
  );
};

export default Calendar;
