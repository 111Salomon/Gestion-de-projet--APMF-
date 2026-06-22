/**
 * ═══════════════════════════════════════════════════════════════
 * ANALYTICS & REPORTS - DESIGN ÉPURÉ ET COHÉRENT
 * ═══════════════════════════════════════════════════════════════
 * 
 * ✅ Bordures fines (border uniquement, pas border-2)
 * ✅ Design subtil et moderne
 * ✅ Thème orange cohérent
 * 
 * ⚠️ Logique 100% préservée
 */

import { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Calendar,
  RefreshCw,
  Award,
  Activity
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { reportsAPI } from '../../api/reports';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Layout } from '../../components/layout/Layout';
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
import { getApiErrorMessage } from '../../utils/apiError';
import { MEDIA_URL } from '../../api/axios';
import { Avatar } from '../../components/common/Avatar';

export const Analytics = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [period, setPeriod] = useState(30);
  const [teamStats, setTeamStats] = useState(null);
  const [productivity, setProductivity] = useState(null);

  const fetchAnalytics = async () => {
    try {
      setRefreshing(true);
      const [teamData, prodData] = await Promise.all([
        reportsAPI.getTeamComparison(null, period),
        reportsAPI.getProductivityTrends(period, null)
      ]);
      setTeamStats(teamData);
      setProductivity(prodData);
    } catch (error) {
      console.error('❌ Erreur chargement analytics:', error);
      toast.error(getApiErrorMessage(error, 'Erreur lors du chargement des statistiques'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const chartData = productivity?.daily_data?.created?.map((item, index) => ({
    date: new Date(item.date).toLocaleDateString('fr-FR', { 
      day: '2-digit', 
      month: 'short' 
    }),
    créées: item.count,
    complétées: productivity.daily_data.completed[index]?.count || 0,
  })) || [];

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-screen">
          <LoadingSpinner />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        
        {/* ✨ HEADER ÉPURÉ */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-md shadow-orange-500/20">
              <BarChart3 className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-neutral-900">
                Analytics & Rapports
              </h1>
              <p className="text-sm text-neutral-600">
                Performances de l'équipe et tendances de productivité
              </p>
            </div>
          </div>

          {/* Bouton Actualiser */}
          <button
            onClick={fetchAnalytics}
            disabled={refreshing}
            className="
              flex items-center gap-2 px-4 py-2.5
              bg-white text-neutral-700 border border-neutral-200
              rounded-lg font-medium text-sm
              hover:bg-neutral-50 hover:border-neutral-300
              transition-all duration-200
              disabled:opacity-50 disabled:cursor-not-allowed
              focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2
            "
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} strokeWidth={2} />
            <span>Actualiser</span>
          </button>
        </div>

        {/* ✨ FILTRES DE PÉRIODE - Design Moderne */}
        <div className="flex items-center gap-3 bg-white border border-neutral-200 rounded-lg p-3">
          <div className="flex items-center gap-2 px-3">
            <Calendar className="w-4 h-4 text-orange-500" strokeWidth={2} />
            <span className="text-sm font-medium text-neutral-700">Période</span>
          </div>
          
          <div className="h-6 w-px bg-neutral-200"></div>
          
          <div className="flex items-center gap-2">
            {[7, 30, 90].map((days) => (
              <button
                key={days}
                onClick={() => setPeriod(days)}
                className={`
                  px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
                  ${period === days
                    ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md shadow-orange-500/30'
                    : 'bg-neutral-50 text-neutral-700 hover:bg-neutral-100 border border-neutral-200'
                  }
                `}
              >
                {days} jours
              </button>
            ))}
          </div>
        </div>

        {/* ✨ KPIs - CARTES COHÉRENTES */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Vélocité Moyenne */}
          <div className="group relative bg-white border border-neutral-200 rounded-xl p-5 hover:border-orange-500 transition-all duration-300 hover:shadow-lg hover:shadow-orange-500/10">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 bg-neutral-900 rounded-xl flex items-center justify-center group-hover:bg-orange-500 transition-colors duration-300 shadow-sm">
                <TrendingUp className="w-5 h-5 text-white" strokeWidth={2.5} />
              </div>
            </div>
            <p className="text-xs text-neutral-500 font-medium mb-1 uppercase tracking-wide">
              Vélocité Moyenne
            </p>
            <p className="text-2xl font-bold text-neutral-900">
              {productivity?.summary?.avg_velocity_per_week?.toFixed(1) || 0}
              <span className="text-sm text-neutral-500 ml-1 font-normal">/semaine</span>
            </p>
            <p className="text-xs text-neutral-500 mt-2">
              Tâches complétées par semaine
            </p>
          </div>

          {/* Taux de Complétion */}
          <div className="group relative bg-white border border-neutral-200 rounded-xl p-5 hover:border-orange-500 transition-all duration-300 hover:shadow-lg hover:shadow-orange-500/10">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 bg-neutral-900 rounded-xl flex items-center justify-center group-hover:bg-orange-500 transition-colors duration-300 shadow-sm">
                <Activity className="w-5 h-5 text-white" strokeWidth={2.5} />
              </div>
            </div>
            <p className="text-xs text-neutral-500 font-medium mb-1 uppercase tracking-wide">
              Taux de Complétion
            </p>
            <p className="text-2xl font-bold text-neutral-900">
              {productivity?.summary?.completion_rate?.toFixed(1) || 0}%
            </p>
            <p className="text-xs text-neutral-500 mt-2">
              {productivity?.summary?.total_completed || 0} / {productivity?.summary?.total_created || 0} tâches
            </p>
          </div>

          {/* Membres Actifs */}
          <div className="group relative bg-white border border-neutral-200 rounded-xl p-5 hover:border-orange-500 transition-all duration-300 hover:shadow-lg hover:shadow-orange-500/10">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 bg-neutral-900 rounded-xl flex items-center justify-center group-hover:bg-orange-500 transition-colors duration-300 shadow-sm">
                <Users className="w-5 h-5 text-white" strokeWidth={2.5} />
              </div>
            </div>
            <p className="text-xs text-neutral-500 font-medium mb-1 uppercase tracking-wide">
              Membres Actifs
            </p>
            <p className="text-2xl font-bold text-neutral-900">
              {teamStats?.members_count || 0}
            </p>
            <p className="text-xs text-neutral-500 mt-2">
              Membres avec tâches assignées
            </p>
          </div>
        </div>

        {/* ✨ GRAPHIQUE DE PRODUCTIVITÉ */}
        <div className="bg-white rounded-xl border border-neutral-200 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-orange-600" strokeWidth={2} />
            </div>
            <h2 className="text-lg font-bold text-neutral-900">
              Tendances de Productivité
            </h2>
          </div>
          
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12, fill: '#6b7280' }} 
                  stroke="#e5e7eb"
                />
                <YAxis 
                  tick={{ fontSize: 12, fill: '#6b7280' }} 
                  stroke="#e5e7eb"
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                  }}
                  labelStyle={{ fontWeight: 600, color: '#111827' }}
                />
                <Legend 
                  wrapperStyle={{ paddingTop: '20px' }}
                  iconType="circle"
                />
                <Line 
                  type="monotone" 
                  dataKey="créées" 
                  stroke="#f97316" 
                  strokeWidth={2.5}
                  dot={{ fill: '#f97316', r: 4, strokeWidth: 0 }}
                  activeDot={{ r: 6 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="complétées" 
                  stroke="#10b981" 
                  strokeWidth={2.5}
                  dot={{ fill: '#10b981', r: 4, strokeWidth: 0 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center py-16 text-neutral-500">
              <div className="text-center">
                <BarChart3 className="w-12 h-12 mx-auto mb-3 text-neutral-300" />
                <p className="text-sm">Aucune donnée disponible</p>
              </div>
            </div>
          )}
        </div>

        {/* ✨ CLASSEMENT DES MEMBRES - Design Moderne */}
        <div className="bg-white rounded-xl border border-neutral-200 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center">
              <Award className="w-4 h-4 text-orange-600" strokeWidth={2} />
            </div>
            <h2 className="text-lg font-bold text-neutral-900">
              Classement de l'Équipe
            </h2>
          </div>

          {teamStats?.team_stats?.length > 0 ? (
            <div className="space-y-3">
              {teamStats.team_stats.map((member, index) => (
                <div
                  key={member.user.id}
                  className="group flex items-center justify-between p-4 bg-neutral-50 rounded-lg hover:bg-orange-50 hover:border-orange-200 border border-transparent transition-all duration-200"
                >
                  <div className="flex items-center gap-4">
                    {/* Rang avec Médailles */}
                    <div className={`
                      flex items-center justify-center w-9 h-9 rounded-lg font-bold text-sm shadow-sm
                      ${index === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-500 text-white' :
                        index === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-400 text-gray-700' :
                        index === 2 ? 'bg-gradient-to-br from-orange-400 to-orange-500 text-white' :
                        'bg-white text-neutral-600 border border-neutral-200'
                      }
                    `}>
                      {member.rank}
                    </div>

                    {/* Avatar + Infos */}
                    <div className="flex items-center gap-3">
                      <Avatar
                        avatarUrl={member.user.avatar_url}
                        name={member.user.full_name || member.user.username}
                        size="md"
                        showBorder={true}
                        className="w-11 h-11 rounded-lg"
                      />

                      <div>
                        <p className="font-semibold text-neutral-900 text-sm">
                          {member.user.full_name}
                        </p>
                        <p className="text-xs text-neutral-500">
                          {member.user.role}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Stats Membre */}
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-xs text-neutral-500 font-medium mb-0.5">Tâches</p>
                      <p className="font-bold text-neutral-900 text-sm">
                        {member.summary.completed} / {member.summary.total_assigned}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-xs text-neutral-500 font-medium mb-0.5">Taux</p>
                      <p className={`font-bold text-sm ${
                        member.summary.completion_rate >= 80 ? 'text-green-600' :
                        member.summary.completion_rate >= 60 ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>
                        {member.summary.completion_rate}%
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-xs text-neutral-500 font-medium mb-0.5">Vélocité</p>
                      <p className="font-bold text-orange-600 text-sm">
                        {member.summary.velocity} /sem
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center py-16 text-neutral-500">
              <div className="text-center">
                <Users className="w-12 h-12 mx-auto mb-3 text-neutral-300" />
                <p className="text-sm">Aucune donnée disponible</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Analytics;
