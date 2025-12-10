import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FolderKanban, 
  CheckSquare, 
  TrendingUp,
  AlertCircle,
  Activity,
  Zap,
  ChevronRight,
  Calendar,
  Clock
} from 'lucide-react';
import toast from 'react-hot-toast';

import { Layout } from '../../components/layout/Layout';
import { StatCard } from '../../components/dashboard/StatCard';
import { RecentActivity } from '../../components/dashboard/RecentActivity';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { DonutChart } from '../../components/dashboard/DonutChart';
import { ProjectProgressBar } from '../../components/dashboard/ProjectProgressBar';

import { dashboardAPI } from '../../api/dashboard';
import { useAuth } from '../../context/AuthContext';

export const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);

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

  return (
    <Layout>
      {/* ═══════════════════════════════════════════════════════
          EN-TÊTE MINIMALISTE
          ═══════════════════════════════════════════════════════ */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-neutral-900 mb-2">
          Bonjour, {user?.full_name || user?.username}
        </h1>
        <p className="text-neutral-600">
          Vue d'ensemble de vos projets et tâches
        </p>
      </div>

      {/* ═══════════════════════════════════════════════════════
          GRID KPI - 4 COLONNES
          ═══════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Projets */}
        <div 
          onClick={() => navigate('/projects')}
          className="group bg-white rounded-2xl p-6 shadow-sm  hover:shadow-md hover:border-orange-200 transition-all cursor-pointer"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 bg-neutral-100 rounded-xl flex items-center justify-center group-hover:bg-orange-500 transition-all">
              <FolderKanban className="w-6 h-6 text-neutral-600 group-hover:text-white transition-colors" />
            </div>
            <ChevronRight className="w-5 h-5 text-neutral-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
          </div>
          <p className="text-sm font-medium text-neutral-600 mb-1">Total Projets</p>
          <p className="text-3xl font-bold text-neutral-900 mb-1">
            {stats.kpis.total_projects}
          </p>
          <p className="text-sm text-neutral-500">
            {stats.kpis.active_projects} actifs
          </p>
        </div>

        {/* Tâches Actives */}
        <div 
          onClick={() => navigate('/tasks?status=in_progress')}
          className="group bg-white rounded-2xl p-6 shadow-sm  hover:shadow-md hover:border-orange-200 transition-all cursor-pointer"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 bg-neutral-100 rounded-xl flex items-center justify-center group-hover:bg-orange-500 transition-all">
              <CheckSquare className="w-6 h-6 text-neutral-600 group-hover:text-white transition-colors" />
            </div>
            <ChevronRight className="w-5 h-5 text-neutral-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
          </div>
          <p className="text-sm font-medium text-neutral-600 mb-1">Tâches Actives</p>
          <p className="text-3xl font-bold text-neutral-900 mb-1">
            {stats.kpis.in_progress_tasks}
          </p>
          <p className="text-sm text-neutral-500">
            {stats.kpis.total_tasks} au total
          </p>
        </div>

        {/* Taux de Complétion */}
        <div 
          onClick={() => navigate('/tasks?status=completed')}
          className="group bg-white rounded-2xl p-6 shadow-sm  hover:shadow-md hover:border-orange-200 transition-all cursor-pointer"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 bg-neutral-100 rounded-xl flex items-center justify-center group-hover:bg-orange-500 transition-all">
              <TrendingUp className="w-6 h-6 text-neutral-600 group-hover:text-white transition-colors" />
            </div>
            <ChevronRight className="w-5 h-5 text-neutral-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
          </div>
          <p className="text-sm font-medium text-neutral-600 mb-1">Taux de Complétion</p>
          <p className="text-3xl font-bold text-neutral-900 mb-1">
            {completionRate}%
          </p>
          <p className="text-sm text-neutral-500">
            {stats.kpis.completed_tasks} terminées
          </p>
        </div>

        {/* Tâches en Retard */}
        <div 
          onClick={() => navigate('/tasks?status=overdue')}
          className="group bg-white rounded-2xl p-6 shadow-sm  hover:shadow-md hover:border-orange-200 transition-all cursor-pointer"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 bg-neutral-100 rounded-xl flex items-center justify-center group-hover:bg-orange-500 transition-all">
              <AlertCircle className="w-6 h-6 text-neutral-600 group-hover:text-white transition-colors" />
            </div>
            <ChevronRight className="w-5 h-5 text-neutral-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
          </div>
          <p className="text-sm font-medium text-neutral-600 mb-1">Tâches en Retard</p>
          <p className="text-3xl font-bold text-orange-600 mb-1">
            {stats.kpis.overdue_tasks}
          </p>
          <p className="text-sm text-neutral-500">
            {stats.kpis.completed_today} terminées aujourd'hui
          </p>
        </div>
      </div>

            {/* ═══════════════════════════════════════════════════════
          ALERTE TÂCHES URGENTES (SI PRÉSENTES)
          ═══════════════════════════════════════════════════════ */}
      {stats.urgent_tasks && stats.urgent_tasks.length > 0 && (
        <div className="mb-8 bg-white rounded-2xl border border-orange-200 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-orange-50 to-orange-50/50 border-b border-orange-100 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/30">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-neutral-900">
                  {stats.urgent_tasks.length} Tâche{stats.urgent_tasks.length > 1 ? 's' : ''} Urgente{stats.urgent_tasks.length > 1 ? 's' : ''}
                </h3>
                <p className="text-sm text-neutral-600">
                  Nécessite votre attention immédiate
                </p>
              </div>
            </div>
          </div>
          
          <div className="p-6 space-y-3">
            {stats.urgent_tasks.slice(0, 4).map((task) => (
              <div 
                key={task.id}
                onClick={() => handleTaskClick(task.id)}
                className="group flex items-center justify-between p-4 bg-neutral-50 hover:bg-orange-50 rounded-xl transition-all cursor-pointer border border-transparent hover:border-orange-200"
              >
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-neutral-900 mb-1 truncate group-hover:text-orange-600 transition-colors">
                    {task.title}
                  </h4>
                  <div className="flex items-center gap-3 text-sm text-neutral-600">
                    <span>{task.project_name}</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {new Date(task.due_date).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-neutral-400 group-hover:text-orange-500 group-hover:translate-x-1 transition-all" />
              </div>
            ))}
            
            {stats.urgent_tasks.length > 4 && (
              <button 
                onClick={() => navigate('/tasks?priority=urgent')}
                className="w-full py-3 text-sm font-medium text-orange-600 hover:text-orange-700 transition-colors"
              >
                Voir toutes les tâches urgentes ({stats.urgent_tasks.length})
              </button>
            )}
          </div>
        </div>
      )}



      {/* ═══════════════════════════════════════════════════════
          GRAPHIQUES - 2 COLONNES
          ═══════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Tâches par Statut */}
        <div className="bg-white rounded-2xl p-6 shadow-sm ">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                <Activity className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-neutral-900">Tâches par Statut</h3>
                <p className="text-sm text-neutral-600">Répartition actuelle</p>
              </div>
            </div>
          </div>
          <DonutChart data={stats.charts.tasks_by_status} />
        </div>

        {/* Top 5 Projets */}
        <div className="bg-white rounded-2xl p-6 shadow-sm ">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                <FolderKanban className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-neutral-900">Top 5 Projets Actifs</h3>
                <p className="text-sm text-neutral-600">Progression en cours</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/projects')}
              className="text-sm font-medium text-orange-600 hover:text-orange-700 flex items-center gap-1 group"
            >
              Voir tout
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
          <ProjectProgressBar projects={stats.charts.top_projects} />
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          ACTIVITÉS RÉCENTES
          ═══════════════════════════════════════════════════════ */}
      <div className="bg-white rounded-2xl p-6 shadow-sm ">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
              <Activity className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-neutral-900">Activités Récentes</h3>
              <p className="text-sm text-neutral-600">5 dernières actions</p>
            </div>
          </div>
        </div>
        <RecentActivity activities={stats.recent_activities.slice(0, 5)} />
      </div>
    </Layout>
  );
};
