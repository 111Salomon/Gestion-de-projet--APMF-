// Dashboard.jsx - Avec Navigation vers Détails des Tâches

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // 🆕 Import pour navigation
import { 
  FolderKanban, 
  CheckSquare, 
  Users, 
  TrendingUp,
  AlertCircle,
  Activity,
  Zap,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import toast from 'react-hot-toast';

import { Layout } from '../../components/layout/Layout';
import { StatCard } from '../../components/dashboard/StatCard';
import { RecentActivity } from '../../components/dashboard/RecentActivity';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { DonutChart } from '../../components/dashboard/DonutChart';
import { ProjectProgressBar } from '../../components/dashboard/ProjectProgressBar';
import { UrgentTasks } from '../../components/dashboard/UrgentTasks';

import { dashboardAPI } from '../../api/dashboard';
import { useAuth } from '../../context/AuthContext';

export const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate(); // 🆕 Hook de navigation
  
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [showAllUrgentTasks, setShowAllUrgentTasks] = useState(false); // 🆕 État pour afficher toutes les tâches

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const data = await dashboardAPI.getStats();
      setStats(data);
    } catch (error) {
      console.error('❌ Erreur chargement dashboard:', error);
      toast.error('Impossible de charger les statistiques');
    } finally {
      setLoading(false);
    }
  };

  // 🆕 Navigation vers le détail de la tâche
  const handleTaskClick = (taskId) => {
    navigate(`/tasks/${taskId}`);
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <LoadingSpinner />
        </div>
      </Layout>
    );
  }

  if (!stats) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-neutral-600">Aucune donnée disponible</p>
        </div>
      </Layout>
    );
  }

  const completionRate = stats.kpis.total_tasks > 0
    ? Math.round((stats.kpis.completed_tasks / stats.kpis.total_tasks) * 100)
    : 0;

  // 🆕 Détermine combien de tâches urgentes afficher
  const urgentTasksToDisplay = showAllUrgentTasks 
    ? stats.urgent_tasks 
    : stats.urgent_tasks.slice(0, 3);

  return (
    <Layout>
      {/* EN-TÊTE ÉPURÉ */}
      <div className="mb-10">
        <h1 className="text-4xl font-bold text-neutral-900 mb-3">
          Bonjour, {user?.full_name || user?.username}
        </h1>
        <p className="text-lg text-neutral-500">
          Vue d'ensemble de vos projets et tâches
        </p>
      </div>

      {/* 🔥 ALERTE TÂCHES URGENTES (SI > 0) - EN HAUT */}
      {stats.urgent_tasks && stats.urgent_tasks.length > 0 && (
        <div className="mb-8 bg-gradient-to-r from-red-50 to-orange-50 border-l-4 border-red-500 rounded-lg p-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center">
                <Zap className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-red-900 mb-2">
                {stats.urgent_tasks.length} Tâche{stats.urgent_tasks.length > 1 ? 's' : ''} Urgente{stats.urgent_tasks.length > 1 ? 's' : ''} à Traiter !
              </h3>
              <p className="text-red-700 mb-4">
                Ces tâches nécessitent votre attention immédiate
              </p>
              
              {/* 🆕 Liste des tâches urgentes CLIQUABLES */}
              <div className="space-y-3">
                {urgentTasksToDisplay.map((task) => (
                  <div 
                    key={task.id}
                    onClick={() => handleTaskClick(task.id)}
                    className="bg-white rounded-lg p-4 border-l-4 border-red-500 hover:shadow-lg hover:scale-[1.02] transition-all cursor-pointer group"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-neutral-900 mb-1 group-hover:text-red-600 transition-colors">
                          {task.title}
                        </h4>
                        <div className="flex items-center gap-3 text-sm">
                          <span className="text-neutral-600">{task.project_name}</span>
                          <span className="inline-flex items-center gap-1 text-red-600 font-medium">
                            <AlertCircle className="w-4 h-4" />
                            Échéance : {new Date(task.due_date).toLocaleDateString('fr-FR')}
                          </span>
                        </div>
                      </div>
                      <span className="px-3 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded-full">
                        URGENT
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* 🆕 Bouton "Voir toutes" / "Voir moins" */}
              {stats.urgent_tasks.length > 3 && (
                <button 
                  onClick={() => setShowAllUrgentTasks(!showAllUrgentTasks)}
                  className="mt-4 flex items-center gap-2 text-red-600 hover:text-red-700 font-medium text-sm transition-colors"
                >
                  {showAllUrgentTasks ? (
                    <>
                      <ChevronUp className="w-4 h-4" />
                      Voir moins
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-4 h-4" />
                      Voir toutes les tâches urgentes ({stats.urgent_tasks.length})
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CARTES KPI - DESIGN ÉPURÉ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {/* Total Projets */}
        <div className="group bg-white border-2 border-neutral-200 hover:border-blue-400 rounded-xl p-6 transition-all duration-300 hover:-translate-y-1">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center group-hover:bg-blue-500 transition-colors">
              <FolderKanban className="w-6 h-6 text-blue-600 group-hover:text-white transition-colors" />
            </div>
          </div>
          <p className="text-sm font-medium text-neutral-600 mb-1">Total Projets</p>
          <p className="text-3xl font-bold text-neutral-900 mb-1">{stats.kpis.total_projects}</p>
          <p className="text-sm text-neutral-500">{stats.kpis.active_projects} actifs</p>
        </div>

        {/* Tâches Actives */}
        <div className="group bg-white border-2 border-neutral-200 hover:border-green-400 rounded-xl p-6 transition-all duration-300 hover:-translate-y-1">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center group-hover:bg-green-500 transition-colors">
              <CheckSquare className="w-6 h-6 text-green-600 group-hover:text-white transition-colors" />
            </div>
          </div>
          <p className="text-sm font-medium text-neutral-600 mb-1">Tâches Actives</p>
          <p className="text-3xl font-bold text-neutral-900 mb-1">{stats.kpis.in_progress_tasks}</p>
          <p className="text-sm text-neutral-500">{stats.kpis.total_tasks} au total</p>
        </div>

        {/* Taux de Complétion */}
        <div className="group bg-white border-2 border-neutral-200 hover:border-amber-400 rounded-xl p-6 transition-all duration-300 hover:-translate-y-1">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center group-hover:bg-amber-500 transition-colors">
              <TrendingUp className="w-6 h-6 text-amber-600 group-hover:text-white transition-colors" />
            </div>
          </div>
          <p className="text-sm font-medium text-neutral-600 mb-1">Taux de Complétion</p>
          <p className="text-3xl font-bold text-neutral-900 mb-1">{completionRate}%</p>
          <p className="text-sm text-neutral-500">{stats.kpis.completed_tasks} terminées</p>
        </div>

        {/* Tâches en Retard */}
        <div className="group bg-white border-2 border-red-200 hover:border-red-400 rounded-xl p-6 transition-all duration-300 hover:-translate-y-1">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center group-hover:bg-red-500 transition-colors">
              <AlertCircle className="w-6 h-6 text-red-600 group-hover:text-white transition-colors" />
            </div>
          </div>
          <p className="text-sm font-medium text-neutral-600 mb-1">Tâches en Retard</p>
          <p className="text-3xl font-bold text-red-600 mb-1">{stats.kpis.overdue_tasks}</p>
          <p className="text-sm text-neutral-500">{stats.kpis.completed_today} terminées aujourd'hui</p>
        </div>
      </div>

      {/* GRAPHIQUES - LAYOUT 2 COLONNES */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
        {/* Tâches par Statut */}
        <div className="bg-white border-2 border-neutral-200 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Activity className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="text-lg font-bold text-neutral-900">Tâches par Statut</h3>
          </div>
          <DonutChart data={stats.charts.tasks_by_status} />
        </div>

        {/* Top 5 Projets */}
        <div className="bg-white border-2 border-neutral-200 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <FolderKanban className="w-5 h-5 text-green-600" />
            </div>
            <h3 className="text-lg font-bold text-neutral-900">Top 5 Projets Actifs</h3>
          </div>
          <ProjectProgressBar projects={stats.charts.top_projects} />
        </div>
      </div>

      {/* ACTIVITÉS RÉCENTES - COMPACTE (MAX 5 ITEMS) */}
      <div className="bg-white border-2 border-neutral-200 rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Activity className="w-5 h-5 text-purple-600" />
            </div>
            <h3 className="text-lg font-bold text-neutral-900">Activités Récentes</h3>
          </div>
          <span className="text-sm text-neutral-500">5 dernières actions</span>
        </div>
        <RecentActivity activities={stats.recent_activities.slice(0, 5)} />
      </div>
    </Layout>
  );
};
