import { useState, useEffect } from 'react';
import { 
  FolderKanban, 
  CheckSquare, 
  Users, 
  TrendingUp,
  AlertCircle,
  Activity
} from 'lucide-react';
import toast from 'react-hot-toast';

// Imports composants
import { Layout } from '../../components/layout/Layout';
import { StatCard } from '../../components/dashboard/StatCard';
import { RecentActivity } from '../../components/dashboard/RecentActivity';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { DonutChart } from '../../components/dashboard/DonutChart';
import { ProjectProgressBar } from '../../components/dashboard/ProjectProgressBar';
import { UrgentTasks } from '../../components/dashboard/UrgentTasks';

// Imports API et contexte
import { dashboardAPI } from '../../api/dashboard';
import { useAuth } from '../../context/AuthContext';


/**
 * 📊 Page Dashboard Dynamique
 * Affiche les statistiques en temps réel depuis l'API
 */
export const Dashboard = () => {
  const { user } = useAuth();

  // ─── États ───
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null); // Toutes les données du dashboard

  // ─── Chargement des données au montage ───
  useEffect(() => {
    loadDashboardData();
  }, []);

  /**
   * 🔄 Charge toutes les statistiques depuis l'API
   */
  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const data = await dashboardAPI.getStats();
      setStats(data); // Stocke toutes les données reçues
    } catch (error) {
      console.error('❌ Erreur chargement dashboard:', error);
      toast.error('Impossible de charger les statistiques');
    } finally {
      setLoading(false);
    }
  };

  // ─── Affichage pendant chargement ───
  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <LoadingSpinner />
        </div>
      </Layout>
    );
  }

  // ─── Si pas de données ───
  if (!stats) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-neutral-600">Aucune donnée disponible</p>
        </div>
      </Layout>
    );
  }

  // ─── Calcul du taux de complétion ───
  const completionRate = stats.kpis.total_tasks > 0
    ? Math.round((stats.kpis.completed_tasks / stats.kpis.total_tasks) * 100)
    : 0;

  return (
    <Layout>
      {/* ═══════════════════════════════════════════════════ */}
      {/* EN-TÊTE avec message de bienvenue */}
      {/* ═══════════════════════════════════════════════════ */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-neutral-900 mb-2">
          Bienvenue, {user?.full_name || user?.username} 👋
        </h1>
        <p className="text-neutral-600">
          Voici un aperçu de vos projets et tâches en cours
        </p>
      </div>

      {/* ═══════════════════════════════════════════════════ */}
      {/* 📊 CARTES KPI (Indicateurs Clés) */}
      {/* ═══════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Projets */}
        <StatCard
          title="Total Projets"
          value={stats.kpis.total_projects}
          subtitle={`${stats.kpis.active_projects} actifs`}
          icon={FolderKanban}
          color="primary"
        />

        {/* Tâches Actives */}
        <StatCard
          title="Tâches Actives"
          value={stats.kpis.in_progress_tasks}
          subtitle={`${stats.kpis.total_tasks} au total`}
          icon={CheckSquare}
          color="success"
        />

        {/* Taux de Complétion */}
        <StatCard
          title="Taux de Complétion"
          value={`${completionRate}%`}
          subtitle={`${stats.kpis.completed_tasks} terminées`}
          icon={TrendingUp}
          color="warning"
        />

        {/* Tâches en Retard */}
        <StatCard
          title="Tâches en Retard"
          value={stats.kpis.overdue_tasks}
          subtitle={`${stats.kpis.completed_today} terminées aujourd'hui`}
          icon={AlertCircle}
          color="error"
        />
      </div>

      {/* ═══════════════════════════════════════════════════ */}
      {/* 📈 GRAPHIQUES */}
      {/* ═══════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Graphique : Tâches par Statut (Donut) */}
        <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
          <h3 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Tâches par Statut
          </h3>
          <DonutChart data={stats.charts.tasks_by_status} />
        </div>

        {/* Graphique : Top 5 Projets Actifs (Barres de progression) */}
        <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
          <h3 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center gap-2">
            <FolderKanban className="w-5 h-5" />
            Top 5 Projets Actifs
          </h3>
          <ProjectProgressBar projects={stats.charts.top_projects} />
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════ */}
      {/* 📋 ACTIVITÉS RÉCENTES & TÂCHES URGENTES */}
      {/* ═══════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activités Récentes (2/3 de la largeur) */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
            <h3 className="text-lg font-semibold text-neutral-900 mb-4">
              Activités Récentes
            </h3>
            <RecentActivity activities={stats.recent_activities} />
          </div>
        </div>

        {/* Tâches Urgentes (1/3 de la largeur) */}
        <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
          <h3 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-500" />
            Tâches Urgentes
          </h3>
          <UrgentTasks tasks={stats.urgent_tasks} />
        </div>
      </div>
    </Layout>
  );
};
