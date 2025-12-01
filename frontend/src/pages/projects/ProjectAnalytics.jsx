import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Calendar,
  RefreshCw,
  ArrowLeft,
  CheckCircle,
  Target
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { projectsAPI } from '../../api/projects';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Layout } from '../../components/layout/Layout';
import { MEDIA_URL } from '../../api/axios';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

/**
 * 📊 Page ProjectAnalytics - Analytics d'un Projet Spécifique
 * 
 * Accessible par :
 * - Admin (rôle global)
 * - Chef de projet (rôle global)
 * - Propriétaire du projet
 * - Gestionnaire du projet
 */
export const ProjectAnalytics = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [period, setPeriod] = useState(30);
  const [analytics, setAnalytics] = useState(null);

  // ─────────────────────────────────────────────────────
  // 🔄 CHARGEMENT DES DONNÉES
  // ─────────────────────────────────────────────────────
  
  const fetchAnalytics = async () => {
    try {
      setRefreshing(true);
      const data = await projectsAPI.getProjectAnalytics(id, period);
      setAnalytics(data);
    } catch (error) {
      console.error('❌ Erreur chargement analytics projet:', error);
      
      if (error.response?.status === 403) {
        toast.error('Accès refusé. Vous devez être propriétaire ou gestionnaire de ce projet.');
        setTimeout(() => navigate('/projects'), 2000);
      } else {
        toast.error('Erreur lors du chargement des statistiques');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [id, period]);

  // ─────────────────────────────────────────────────────
  // 📈 PRÉPARATION DES DONNÉES POUR LE GRAPHIQUE
  // ─────────────────────────────────────────────────────
  
  const chartData = analytics?.productivity?.daily_data?.created?.map((item, index) => ({
    date: new Date(item.date).toLocaleDateString('fr-FR', { 
      day: '2-digit', 
      month: 'short' 
    }),
    créées: item.count,
    complétées: analytics.productivity.daily_data.completed[index]?.count || 0,
  })) || [];

  // ─────────────────────────────────────────────────────
  // 🎨 AFFICHAGE LOADING
  // ─────────────────────────────────────────────────────
  
  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-screen">
          <LoadingSpinner />
        </div>
      </Layout>
    );
  }

  if (!analytics) {
    return null;
  }

  return (
    <Layout>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        
        {/* EN-TÊTE */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              to={`/projects/${id}`}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </Link>
            
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <BarChart3 className="w-7 h-7 text-blue-600" />
                Analytics - {analytics.project.name}
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Performances de l'équipe du projet
              </p>
            </div>
          </div>

          <button
            onClick={fetchAnalytics}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span className="text-sm font-medium">Actualiser</span>
          </button>
        </div>

        {/* INFO DU PROJET */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-6">
          <div className="flex items-center gap-4">
            {analytics.project.owner.avatar ? (
              <img
                src={`${MEDIA_URL}${analytics.project.owner.avatar}`}
                alt={analytics.project.owner.full_name}
                className="w-16 h-16 rounded-full object-cover border-2 border-white shadow"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center border-2 border-white shadow">
                <span className="text-white font-bold text-xl">
                  {analytics.project.owner.full_name.charAt(0)}
                </span>
              </div>
            )}
            
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900">
                {analytics.project.name}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {analytics.project.description || 'Aucune description'}
              </p>
              <p className="text-xs text-gray-500 mt-2">
                Propriétaire : <strong>{analytics.project.owner.full_name}</strong>
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="flex items-center gap-2 text-gray-600 mb-1">
                  <Target className="w-4 h-4" />
                  <span className="text-xs">Total</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {analytics.project.total_tasks}
                </p>
              </div>

              <div className="text-center">
                <div className="flex items-center gap-2 text-green-600 mb-1">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-xs">Complétées</span>
                </div>
                <p className="text-2xl font-bold text-green-600">
                  {analytics.project.completed_tasks}
                </p>
              </div>

              <div className="text-center">
                <div className="text-xs text-gray-600 mb-1">Taux</div>
                <p className={`text-2xl font-bold ${
                  analytics.project.completion_rate >= 70 ? 'text-green-600' :
                  analytics.project.completion_rate >= 40 ? 'text-yellow-600' :
                  'text-red-600'
                }`}>
                  {analytics.project.completion_rate}%
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* FILTRES DE PÉRIODE */}
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-gray-500" />
          <span className="text-sm text-gray-600 mr-2">Période :</span>
          
          {[7, 30, 90].map((days) => (
            <button
              key={days}
              onClick={() => setPeriod(days)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                period === days
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {days} jours
            </button>
          ))}
        </div>

        {/* KPIs - CARTES STATISTIQUES */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <h3 className="text-sm font-medium text-gray-600">Vélocité Moyenne</h3>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {analytics.productivity?.summary?.avg_velocity_per_week?.toFixed(1) || 0}
              <span className="text-lg text-gray-500 ml-1">/sem</span>
            </p>
            <p className="text-xs text-gray-500 mt-2">
              Tâches complétées par semaine
            </p>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <BarChart3 className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <h3 className="text-sm font-medium text-gray-600">Taux de Complétion</h3>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {analytics.productivity?.summary?.completion_rate?.toFixed(1) || 0}%
            </p>
            <p className="text-xs text-gray-500 mt-2">
              {analytics.productivity?.summary?.total_completed || 0} / {analytics.productivity?.summary?.total_created || 0} tâches
            </p>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <h3 className="text-sm font-medium text-gray-600">Membres Actifs</h3>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {analytics.team_stats?.length || 0}
            </p>
            <p className="text-xs text-gray-500 mt-2">
              Membres du projet
            </p>
          </div>
        </div>

        {/* GRAPHIQUE DE PRODUCTIVITÉ */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            📈 Tendances de Productivité du Projet
          </h2>
          
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#6b7280" />
                <YAxis tick={{ fontSize: 12 }} stroke="#6b7280" />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px'
                  }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="créées" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6', r: 4 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="complétées" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  dot={{ fill: '#10b981', r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-gray-500 py-8">Aucune donnée disponible</p>
          )}
        </div>

        {/* CLASSEMENT DES MEMBRES DU PROJET */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            🏆 Classement de l'Équipe du Projet
          </h2>

          {analytics.team_stats && analytics.team_stats.length > 0 ? (
            <div className="space-y-3">
              {analytics.team_stats.map((member, index) => (
                <div
                  key={member.user.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                >
                  <div className="flex items-center gap-4">
                    <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${
                      index === 0 ? 'bg-yellow-100 text-yellow-700' :
                      index === 1 ? 'bg-gray-200 text-gray-700' :
                      index === 2 ? 'bg-orange-100 text-orange-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {member.rank}
                    </div>

                    <div className="flex items-center gap-3">
                      {member.user.avatar ? (
                        <img
                          src={`${MEDIA_URL}${member.user.avatar}`}
                          alt={member.user.full_name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <span className="text-blue-600 font-semibold text-sm">
                            {member.user.full_name.charAt(0)}
                          </span>
                        </div>
                      )}

                      <div>
                        <p className="font-medium text-gray-900">
                          {member.user.full_name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {member.user.role}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Tâches</p>
                      <p className="font-semibold text-gray-900">
                        {member.summary.completed} / {member.summary.total_assigned}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-sm text-gray-600">Taux</p>
                      <p className={`font-bold ${
                        member.summary.completion_rate >= 80 ? 'text-green-600' :
                        member.summary.completion_rate >= 60 ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>
                        {member.summary.completion_rate}%
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-sm text-gray-600">Vélocité</p>
                      <p className="font-semibold text-blue-600">
                        {member.summary.velocity} /sem
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-8">Aucune donnée disponible</p>
          )}
        </div>
      </div>
    </Layout>
  );
};
