import { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Filter } from 'lucide-react';
import toast from 'react-hot-toast';
import { Layout } from '../../components/layout/Layout';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { CalendarView } from '../../components/calendar/CalendarView';
import { CalendarHeader } from '../../components/calendar/CalendarHeader';
import { CalendarFilters } from '../../components/calendar/CalendarFilters'; // ✅ CORRIGÉ (pas ../components)
import { FilterResults } from '../../components/calendar/FilterResults';
import { TaskPreviewModal } from '../../components/calendar/TaskPreviewModal';
import { calendarAPI } from '../../api/calendar';
import { useAuth } from '../../context/AuthContext'; // 🆕 AJOUTÉ
import { format, startOfMonth, endOfMonth } from 'date-fns';

export const Calendar = () => {
  const { user } = useAuth(); // 🆕 AJOUTÉ (pour le rôle utilisateur)
  
  const [tasks, setTasks] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedTask, setSelectedTask] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [availableProjects, setAvailableProjects] = useState([]);

  // 🆕 AJOUTÉ - État des filtres
  const [filters, setFilters] = useState({
    projects: [],
    status: [],
    priority: [],
  });

    // 🆕 AJOUTÉ - Charger les projets pour le composant FilterResults
  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const data = await calendarAPI.getProjects();
      setAvailableProjects(data);
    } catch (error) {
      console.error('❌ Erreur chargement projets:', error);
    }
  };

  // ✅ MODIFIÉ - Charger les tâches du mois avec filtres
  const loadTasks = async (date = currentDate, currentFilters = filters) => {
    try {
      setLoading(true);
      const start = format(startOfMonth(date), 'yyyy-MM-dd');
      const end = format(endOfMonth(date), 'yyyy-MM-dd');
      
      // 🆕 Construire les params avec filtres
      const params = { start, end };
      
      if (currentFilters.projects?.length > 0) {
        params.projects = currentFilters.projects.join(',');
      }
      if (currentFilters.status?.length > 0) {
        params.status = currentFilters.status.join(',');
      }
      if (currentFilters.priority?.length > 0) {
        params.priority = currentFilters.priority.join(',');
      }
      
      const data = await calendarAPI.getTasks(params);
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
    loadTasks(newDate, filters); // ✅ MODIFIÉ - Passe les filtres
  };

  // 🆕 AJOUTÉ - Changement de filtres
  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters);
    loadTasks(currentDate, newFilters);
  };

    // 🆕 AJOUTÉ - Réinitialiser les filtres depuis FilterResults
  const handleClearFilters = () => {
    const emptyFilters = { projects: [], status: [], priority: [] };
    setFilters(emptyFilters);
    loadTasks(currentDate, emptyFilters);
    toast.success('Filtres réinitialisés');
  };

  // Clic sur une tâche
  const handleTaskClick = (task) => {
    setSelectedTask(task);
    setIsModalOpen(true);
  };

  // ✅ MODIFIÉ - Recharger avec filtres après drag & drop
  const handleTasksUpdate = () => {
    loadTasks(currentDate, filters);
  };

 // 🆕 AJOUTÉ - Vérifier si des filtres sont actifs
  const hasActiveFilters = 
    (filters.projects?.length > 0) ||
    (filters.status?.length > 0) ||
    (filters.priority?.length > 0);

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

        {/* 🆕 AJOUTÉ - Composant Filtres */}
        <CalendarFilters
          currentFilters={filters}
          onFiltersChange={handleFiltersChange}
          userRole={user?.role}
        />

       {/* 🆕 AJOUTÉ - Banner des résultats */}
        <FilterResults
          totalTasks={tasks.length}
          hasActiveFilters={hasActiveFilters}
          activeFilters={filters}
          availableProjects={availableProjects}
          onClearFilters={handleClearFilters}
        />

        {/* Vue calendrier */}
        <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
          <CalendarView 
            tasks={tasks}
            currentDate={currentDate}
            onTaskClick={handleTaskClick}
            onMonthChange={handleMonthChange}
            onTasksUpdate={handleTasksUpdate} 
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
