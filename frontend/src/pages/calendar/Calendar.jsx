/**
 * ═══════════════════════════════════════════════════════════════
 * CALENDAR PAGE - VERSION OPTIMISÉE ET DESIGN AMÉLIORÉ
 * ═══════════════════════════════════════════════════════════════
 * 
 * ✅ Améliorations :
 * - Layout épuré et aéré
 * - Gestion d'erreurs robuste
 * - Empty states élégants
 * - Transitions smooth
 * - Performance optimisée (useMemo, useCallback)
 * - Design cohérent avec le thème orange
 * - Loading states améliorés
 * - Responsive design
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Calendar as CalendarIcon, AlertCircle, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { Layout } from '../../components/layout/Layout';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { CalendarView } from '../../components/calendar/CalendarView';
import { CalendarHeader } from '../../components/calendar/CalendarHeader';
import { CalendarFilters } from '../../components/calendar/CalendarFilters';
import { FilterResults } from '../../components/calendar/FilterResults';
import { TaskPreviewModal } from '../../components/calendar/TaskPreviewModal';
import { calendarAPI } from '../../api/calendar';
import { useAuth } from '../../context/AuthContext';
import { format, startOfMonth, endOfMonth } from 'date-fns';

export const Calendar = () => {
  const { user } = useAuth();
  
  // ✨ ÉTATS
  const [tasks, setTasks] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedTask, setSelectedTask] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [availableProjects, setAvailableProjects] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filtres
  const [filters, setFilters] = useState({
    projects: [],
    status: [],
    priority: [],
  });

  // ✨ MEMO - Calcul des filtres actifs (performance)
  const hasActiveFilters = useMemo(() => {
    return (
      (filters.projects?.length > 0) ||
      (filters.status?.length > 0) ||
      (filters.priority?.length > 0)
    );
  }, [filters]);

  // ✨ CALLBACK - Charger les projets (évite re-création)
  const loadProjects = useCallback(async () => {
    try {
      const data = await calendarAPI.getProjects();
      setAvailableProjects(data);
    } catch (error) {
      console.error('❌ Erreur chargement projets:', error);
    }
  }, []);

  // ✨ CALLBACK - Charger les tâches avec gestion d'erreur améliorée
  const loadTasks = useCallback(async (date = currentDate, currentFilters = filters) => {
    try {
      setLoading(true);
      setError(null);
      
      const start = format(startOfMonth(date), 'yyyy-MM-dd');
      const end = format(endOfMonth(date), 'yyyy-MM-dd');
      
      // Construire les params avec filtres
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
      setError('Impossible de charger le calendrier');
      toast.error('Erreur de chargement des tâches');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [currentDate, filters]);

  // ✨ CALLBACK - Charger le résumé
  const loadSummary = useCallback(async () => {
    try {
      const data = await calendarAPI.getSummary();
      setSummary(data);
    } catch (error) {
      console.error('❌ Erreur résumé:', error);
    }
  }, []);

  // ✨ CALLBACK - Rafraîchir tout
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await Promise.all([
      loadTasks(currentDate, filters),
      loadSummary(),
    ]);
    toast.success('Calendrier actualisé');
  }, [currentDate, filters, loadTasks, loadSummary]);

  // ✨ Chargement initial
  useEffect(() => {
    loadProjects();
    loadTasks();
    loadSummary();
  }, [loadProjects, loadTasks, loadSummary]);

  // ✨ CALLBACK - Changement de mois
  const handleMonthChange = useCallback((newDate) => {
    setCurrentDate(newDate);
    loadTasks(newDate, filters);
  }, [filters, loadTasks]);

  // ✨ CALLBACK - Changement de filtres
  const handleFiltersChange = useCallback((newFilters) => {
    setFilters(newFilters);
    loadTasks(currentDate, newFilters);
  }, [currentDate, loadTasks]);

  // ✨ CALLBACK - Réinitialiser les filtres
  const handleClearFilters = useCallback(() => {
    const emptyFilters = { projects: [], status: [], priority: [] };
    setFilters(emptyFilters);
    loadTasks(currentDate, emptyFilters);
    toast.success('Filtres réinitialisés');
  }, [currentDate, loadTasks]);

  // ✨ CALLBACK - Clic sur une tâche
  const handleTaskClick = useCallback((task) => {
    setSelectedTask(task);
    setIsModalOpen(true);
  }, []);

  // ✨ CALLBACK - Fermer modal
  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedTask(null);
  }, []);

  // ✨ CALLBACK - Update après drag & drop
  const handleTasksUpdate = useCallback(() => {
    loadTasks(currentDate, filters);
  }, [currentDate, filters, loadTasks]);

  // ═════════════════════════════════════════════════════════════
  // RENDERING
  // ═════════════════════════════════════════════════════════════

  // ✨ LOADING STATE INITIAL
  if (loading && tasks.length === 0 && !error) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-4">
            <LoadingSpinner />
            <p className="text-sm text-neutral-500 font-medium">
              Chargement du calendrier...
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  // ✨ ERROR STATE
  if (error && !loading) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto p-6 ">
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-600" strokeWidth={2} />
            </div>
            <h3 className="text-lg font-bold text-red-900 mb-2">
              Erreur de chargement
            </h3>
            <p className="text-sm text-red-700 mb-6">
              {error}
            </p>
            <button
              onClick={handleRefresh}
              className="inline-flex items-center gap-2 px-5 py-2.5
                       bg-gradient-to-r from-orange-500 to-orange-600 text-white
                       rounded-xl font-semibold text-sm
                       hover:shadow-lg hover:shadow-orange-500/30
                       transition-all duration-300
                       hover:scale-105 active:scale-95"
            >
              <RefreshCw className="w-4 h-4" />
              Réessayer
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  // ✨ MAIN CONTENT
  return (
    <Layout>
      <div className="max-w-[1400px] mx-auto p-6 space-y-6 ">
        
        {/* ✨ HEADER avec résumé et bouton refresh */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <CalendarHeader 
              summary={summary}
              currentDate={currentDate}
              onMonthChange={handleMonthChange}
            />
          </div>
          
          {/* Bouton refresh */}
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="mt-2 p-2.5 hover:bg-orange-50 rounded-lg 
                     transition-colors group disabled:opacity-50"
            title="Actualiser"
          >
            <RefreshCw 
              className={`w-5 h-5 text-neutral-600 group-hover:text-orange-600 
                       transition-colors ${isRefreshing ? 'animate-spin' : ''}`}
              strokeWidth={2}
            />
          </button>
        </div>

        {/* ✨ FILTRES */}
        <CalendarFilters
          currentFilters={filters}
          onFiltersChange={handleFiltersChange}
          userRole={user?.role}
        />

        {/* ✨ RÉSULTATS FILTRES */}
        <FilterResults
          totalTasks={tasks.length}
          hasActiveFilters={hasActiveFilters}
          activeFilters={filters}
          availableProjects={availableProjects}
          onClearFilters={handleClearFilters}
        />

        {/* ✨ CALENDRIER - Card élégante */}
        <div className="bg-white rounded-xl  border  ">
          
          {/* Loading overlay si refresh */}
          {isRefreshing && (
            <div className="relative">
              <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 
                            flex items-center justify-center">
                <div className="flex items-center gap-3 bg-white px-4 py-3 rounded-xl 
                              shadow-lg border-2 border-orange-200">
                  <RefreshCw className="w-4 h-4 text-orange-600 animate-spin" />
                  <span className="text-sm font-semibold text-neutral-900">
                    Actualisation...
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Vue calendrier */}
          <div className="p-6">
            <CalendarView 
              tasks={tasks}
              currentDate={currentDate}
              onTaskClick={handleTaskClick}
              onMonthChange={handleMonthChange}
              onTasksUpdate={handleTasksUpdate} 
            />
          </div>
        </div>

        {/* ✨ EMPTY STATE - Si aucune tâche */}
        {!loading && tasks.length === 0 && (
          <div className="bg-neutral-50 border-2 border-neutral-200 rounded-xl p-12 text-center">
            <div className="w-16 h-16 bg-neutral-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <CalendarIcon className="w-8 h-8 text-neutral-400" strokeWidth={2} />
            </div>
            <h3 className="text-lg font-bold text-neutral-900 mb-2">
              {hasActiveFilters ? 'Aucune tâche trouvée' : 'Aucune tâche ce mois-ci'}
            </h3>
            <p className="text-sm text-neutral-600 mb-4">
              {hasActiveFilters 
                ? 'Essayez de modifier vos filtres pour voir plus de résultats.'
                : 'Aucune tâche n\'est planifiée pour cette période.'
              }
            </p>
            {hasActiveFilters && (
              <button
                onClick={handleClearFilters}
                className="inline-flex items-center gap-2 px-4 py-2
                         bg-white border-2 border-neutral-200 text-neutral-700
                         rounded-lg font-semibold text-sm
                         hover:bg-neutral-50 hover:border-neutral-300
                         transition-all duration-200"
              >
                Réinitialiser les filtres
              </button>
            )}
          </div>
        )}

      </div>

      {/* ✨ MODAL aperçu tâche */}
      <TaskPreviewModal
        task={selectedTask}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </Layout>
  );
};

export default Calendar;
