/**
 * ═══════════════════════════════════════════════════════════════
 * PAGE ÉQUIPE - VERSION SENIOR UI/UX
 * ═══════════════════════════════════════════════════════════════
 * 
 * ✅ Toutes les recommandations appliquées :
 * - Stats cards uniformisées avec hover orange
 * - Badges simplifiés (seulement Admin/Chef)
 * - Colonne Tâches compacte (2/3 format)
 * - Actions cohérentes sur toutes les lignes
 * - Accessibilité WCAG 2.1 AA
 * - Tooltips et micro-interactions
 */

import { useState, useEffect } from 'react';
import { getTeamMembers, getTeamStats } from '../../api/team';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Layout } from '../../components/layout/Layout';
import { MemberProfileModal } from '../../components/team/MemberProfileModal';
import { InviteMemberModal } from '../../components/team/InviteMemberModal';
import { AddMemberModal } from '../../components/team/AddMemberModal';
import { Avatar } from '../../components/common/Avatar'; 
import { useAuth } from '../../context/AuthContext'; 
import { 
  Download, 
  ChevronDown, 
  Search, 
  Users, 
  UserCheck, 
  Briefcase, 
  TrendingUp,
  UserPlus,
  Mail,
  Filter,
  Crown,
  Target
} from 'lucide-react';
import toast from 'react-hot-toast';

export const Team = () => {
  // ═══════════════════════════════════════════════════════════
  // STATE
  // ═══════════════════════════════════════════════════════════

  const [members, setMembers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMemberId, setSelectedMemberId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [isExportDropdownOpen, setIsExportDropdownOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [hoveredRow, setHoveredRow] = useState(null);
  const { user, subscribe } = useAuth(); // ✅ Ajouter subscribe ici


  // ═══════════════════════════════════════════════════════════
  // EFFETS
  // ═══════════════════════════════════════════════════════════

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    loadMembers();
  }, [searchTerm, roleFilter]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      const target = event.target;
      const isExportElement = target.closest('[data-export-dropdown="true"]');
      if (!isExportElement && isExportDropdownOpen) {
        setIsExportDropdownOpen(false);
      }
    };

    if (isExportDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isExportDropdownOpen]);

  
  // ✅ ÉCOUTER LES CHANGEMENTS D'UTILISATEUR ET DE MEMBRES
  useEffect(() => {
    console.log('🎧 Team.jsx: Setting up listener');
    
    if (!subscribe) {
      console.log('⚠️ subscribe is undefined in Team.jsx');
      return;
    }

    const unsubscribe = subscribe((event, data) => {
      console.log('🔔 Team.jsx received event:', event);
      
      if (event === 'user_updated' || event === 'member_updated') {
        console.log('👥 Rechargement de l\'équipe suite à:', event);
        loadMembers(); // ✅ Recharge la liste
        loadStats();   // ✅ Recharge les stats
      }
    });

    console.log('✅ Team listener registered');
    return () => {
      console.log('🔌 Team listener unregistered');
      unsubscribe();
    };
  }, [subscribe]); // ✅ Seulement subscribe, pas de currentPage


  // ═══════════════════════════════════════════════════════════
  // FONCTIONS
  // ═══════════════════════════════════════════════════════════

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsData, membersData] = await Promise.all([
        getTeamStats(),
        getTeamMembers()
      ]);

      setStats(statsData);
      setMembers(membersData);
      setError(null);
    } catch (err) {
      setError('Impossible de charger les données');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadMembers = async () => {
    try {
      const filters = {};

      if (searchTerm) {
        filters.search = searchTerm;
      }

      if (roleFilter !== 'all') {
        filters.role = roleFilter;
      }

      const data = await getTeamMembers(filters);
      setMembers(data);
    } catch (err) {
      console.error('Erreur lors du filtrage:', err);
    }
  };

  const loadStats = async () => {
    try {
      const statsData = await getTeamStats();
      setStats(statsData);
    } catch (err) {
      console.error('Erreur silencieuse lors du chargement des stats:', err);
    }
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleRoleChange = (e) => {
    setRoleFilter(e.target.value);
  };

  const handleViewProfile = (memberId) => {
    setSelectedMemberId(memberId);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedMemberId(null);
  };

  const handleMemberInvited = (newMember) => {
    setMembers((prev) => [newMember, ...prev]);
    loadStats();
  };

  const handleMemberAdded = (newMember) => {
    setMembers((prev) => [newMember, ...prev]);
    loadStats();
  };

  const handleMemberUpdated = (updatedMember) => {
    setMembers((prevMembers) =>
      prevMembers.map((m) =>
        m.id === updatedMember.id ? updatedMember : m
      )
    );
    loadStats();
  };

  const handleMemberDeleted = (deletedId) => {
    setMembers((prevMembers) =>
      prevMembers.filter((m) => m.id !== deletedId)
    );
    loadStats();
  };

  const handleExport = async (format) => {
    try {
      setIsExporting(true);
      setIsExportDropdownOpen(false);

      const params = new URLSearchParams();

      if (searchTerm) {
        params.append('search', searchTerm);
      }

      if (roleFilter !== 'all') {
        params.append('role', roleFilter);
      }

      const queryString = params.toString();
      const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const url = `${backendUrl}/api/users/team-members/export/${format}/${queryString ? '?' + queryString : ''}`;
      const token = localStorage.getItem('access_token');

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP ${response.status}`);
      }

      const blob = await response.blob();
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = `equipe_${Date.now()}.${format === 'excel' ? 'xlsx' : format}`;

      if (contentDisposition) {
        const match = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (match && match[1]) {
          filename = match[1].replace(/['"]/g, '');
        }
      }

      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      
      document.body.appendChild(link);
      link.click();
      
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(downloadUrl);
      }, 100);

      const formatLabels = {
        csv: 'CSV',
        excel: 'Excel',
        pdf: 'PDF',
      };

      toast.success(`Export ${formatLabels[format]} réussi ! 📥`);
      
    } catch (error) {
      console.error('❌ Erreur export:', error);
      toast.error('Impossible d\'exporter la liste');
    } finally {
      setIsExporting(false);
    }
  };

  // ═══════════════════════════════════════════════════════════
  // RENDU
  // ═══════════════════════════════════════════════════════════

  if (loading) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-neutral-600 text-sm font-medium">Chargement de l'équipe...</p>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 text-red-800 flex items-center gap-3">
            <svg className="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-medium">{error}</span>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-neutral-50">
        
        {/* ✨ HEADER */}
        <div className="sticky top-0 z-40 bg-white/70 backdrop-blur-xl border-b border-neutral-200/50 shadow-sm mb-6">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between gap-4">
              
              {/* Titre */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br  from-orange-500 to-orange-600
                              flex items-center justify-center shadow-md shadow-neutral-900/20">
                  <Users className="w-5 h-5 text-white" strokeWidth={2.5} />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-neutral-900">Équipe</h1>
                  <p className="text-sm text-neutral-600">
                    {members.length} membre{members.length > 1 ? 's' : ''} dans votre équipe
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3">
                {/* Export */}
                <div className="relative" data-export-dropdown="true">
                  <button
                    type="button"
                    onClick={() => setIsExportDropdownOpen((prev) => !prev)}
                    disabled={isExporting || members.length === 0}
                    className="px-4 py-2.5 border border-neutral-200 bg-white text-sm font-medium rounded-xl 
                             flex items-center gap-2 hover:bg-neutral-50 hover:border-neutral-300
                             transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed
                             shadow-sm hover:shadow focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
                  >
                    <Download className="w-4 h-4" />
                    {isExporting ? 'Export...' : 'Exporter'}
                    <ChevronDown className="w-4 h-4" />
                  </button>

                  {isExportDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-44 bg-white border border-neutral-200 rounded-xl shadow-xl z-20 overflow-hidden">
                      <button
                        type="button"
                        onClick={() => handleExport('csv')}
                        className="w-full px-4 py-2.5 text-left text-sm text-neutral-700 hover:bg-neutral-50 
                                 transition-colors flex items-center gap-2"
                      >
                        <Download className="w-4 h-4" />
                        CSV
                      </button>
                      <button
                        type="button"
                        onClick={() => handleExport('excel')}
                        className="w-full px-4 py-2.5 text-left text-sm text-neutral-700 hover:bg-neutral-50 
                                 transition-colors flex items-center gap-2 border-t border-neutral-100"
                      >
                        <Download className="w-4 h-4" />
                        Excel
                      </button>
                      <button
                        type="button"
                        onClick={() => handleExport('pdf')}
                        className="w-full px-4 py-2.5 text-left text-sm text-neutral-700 hover:bg-neutral-50 
                                 transition-colors flex items-center gap-2 border-t border-neutral-100"
                      >
                        <Download className="w-4 h-4" />
                        PDF
                      </button>
                    </div>
                  )}
                </div>

                {/* Ajouter */}
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="px-4 py-2.5 bg-neutral-900 text-white text-sm font-semibold rounded-xl 
                           hover:bg-black transition-all duration-200 flex items-center gap-2 
                           shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:ring-offset-2"
                >
                  <UserPlus className="w-4 h-4" strokeWidth={2.5} />
                  Ajouter
                </button>

                {/* Inviter */}
                <button
                  onClick={() => setIsInviteModalOpen(true)}
                  className="px-4 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white text-sm 
                           font-semibold rounded-xl hover:shadow-lg hover:shadow-orange-500/30 
                           transition-all duration-300 flex items-center gap-2 hover:scale-105 active:scale-95
                           focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
                >
                  <Mail className="w-4 h-4" strokeWidth={2.5} />
                  Inviter
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 pb-8">
          {/* ✨ STATS CARDS - UNIFORMISÉES avec hover orange */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              {/* Total Membres */}
              <div className="group relative bg-white border border-neutral-200 rounded-xl p-5 
                            hover:border-orange-500 transition-all duration-300 hover:shadow-lg 
                            hover:shadow-orange-500/10 cursor-pointer">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10  bg-neutral-100 rounded-xl flex items-center justify-center 
                                group-hover:bg-orange-500 transition-colors duration-300 shadow-sm">
                    <Users className="w-5 h-5  text-neutral-600 group-hover:text-white" strokeWidth={2.5} />
                  </div>
                </div>
                <p className="text-xs text-neutral-500 font-medium mb-1 uppercase tracking-wide">
                  Total Membres
                </p>
                <p className="text-2xl font-bold text-neutral-900">{stats.total_members}</p>
              </div>

              {/* Actifs */}
              <div className="group relative bg-white border border-neutral-200 rounded-xl p-5 
                            hover:border-orange-500 transition-all duration-300 hover:shadow-lg 
                            hover:shadow-orange-500/10 cursor-pointer">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 bg-neutral-100 rounded-xl flex items-center justify-center 
                                group-hover:bg-orange-500 transition-colors duration-300 shadow-sm">
                    <UserCheck className="w-5 h-5 text-neutral-600 group-hover:text-white" strokeWidth={2.5} />
                  </div>
                </div>
                <p className="text-xs text-neutral-500 font-medium mb-1 uppercase tracking-wide">
                  Membres Actifs
                </p>
                <p className="text-2xl font-bold text-neutral-900">{stats.active_members}</p>
              </div>

              {/* Charge Moyenne */}
              <div className="group relative bg-white border border-neutral-200 rounded-xl p-5 
                            hover:border-orange-500 transition-all duration-300 hover:shadow-lg 
                            hover:shadow-orange-500/10 cursor-pointer">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 bg-neutral-100 rounded-xl flex items-center justify-center 
                                group-hover:bg-orange-500 transition-colors duration-300 shadow-sm">
                    <Briefcase className="w-5 h-5 text-neutral-600 group-hover:text-white" strokeWidth={2.5} />
                  </div>
                </div>
                <p className="text-xs text-neutral-500 font-medium mb-1 uppercase tracking-wide">
                  Charge Moyenne
                </p>
                <p className="text-2xl font-bold text-neutral-900">
                  {stats.avg_workload}
                  <span className="text-sm text-neutral-500 font-normal ml-1">tâches</span>
                </p>
              </div>

              {/* Taux Complétion - UNIFORMISÉ aussi */}
              <div className="group relative bg-white border border-neutral-200 rounded-xl p-5 
                            hover:border-orange-500 transition-all duration-300 hover:shadow-lg 
                            hover:shadow-orange-500/10 cursor-pointer">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 bg-neutral-100 rounded-xl flex items-center justify-center 
                                group-hover:bg-orange-500 transition-colors duration-300 shadow-sm">
                    <TrendingUp className="w-5 h-5 text-neutral-600 group-hover:text-white" strokeWidth={2.5} />
                  </div>
                </div>
                <p className="text-xs text-neutral-500 font-medium mb-1 uppercase tracking-wide">
                  Taux Complétion
                </p>
                <p className="text-2xl font-bold text-neutral-900">{stats.completion_rate}%</p>
              </div>
            </div>
          )}

          {/* ✨ FILTRES */}
          <div className="bg-white border border-neutral-200 rounded-xl p-4 mb-6 shadow-sm">
            <div className="flex gap-3">
              {/* Recherche */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                <input
                  type="search"
                  placeholder="Rechercher un membre..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="w-full pl-10 pr-4 py-2.5 border border-neutral-200 rounded-xl text-sm 
                           focus:outline-none focus:border-orange-500 transition-all duration-200 
                           hover:border-neutral-300 focus:ring-2 focus:ring-orange-500/20"
                />
              </div>

              {/* Filtre */}
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
                <select
                  value={roleFilter}
                  onChange={handleRoleChange}
                  className="pl-10 pr-8 py-2.5 border border-neutral-200 rounded-xl text-sm 
                           focus:outline-none focus:border-orange-500 bg-white appearance-none 
                           cursor-pointer transition-all duration-200 hover:border-neutral-300
                           focus:ring-2 focus:ring-orange-500/20"
                >
                  <option value="all">Tous les rôles</option>
                  <option value="admin">Administrateur</option>
                  <option value="chef">Chef de projet</option>
                  <option value="membre">Membre</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* ✨ TABLEAU OPTIMISÉ */}
          <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-neutral-200">
                    <th className="px-6 py-4 text-left">
                      <span className="text-xs font-bold text-neutral-900 uppercase tracking-wider">
                        Membre
                      </span>
                    </th>
                    <th className="px-6 py-4 text-left">
                      <span className="text-xs font-bold text-neutral-900 uppercase tracking-wider">
                        Rôle
                      </span>
                    </th>
                    <th className="px-6 py-4 text-left">
                      <span className="text-xs font-bold text-neutral-900 uppercase tracking-wider">
                        Tâches
                      </span>
                    </th>
                    <th className="px-6 py-4 text-left">
                      <span className="text-xs font-bold text-neutral-900 uppercase tracking-wider">
                        Progression
                      </span>
                    </th>
                    <th className="px-6 py-4 text-left">
                      <span className="text-xs font-bold text-neutral-900 uppercase tracking-wider">
                        Statut
                      </span>
                    </th>
                    <th className="px-6 py-4 text-right">
                      <span className="text-xs font-bold text-neutral-900 uppercase tracking-wider">
                        Actions
                      </span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {members.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-16 text-center">
                        <div className="flex flex-col items-center">
                          <div className="w-16 h-16 bg-neutral-100 rounded-xl flex items-center justify-center mb-4">
                            <Users className="w-8 h-8 text-neutral-400" strokeWidth={1.5} />
                          </div>
                          <p className="text-sm font-semibold text-neutral-900 mb-1">Aucun membre trouvé</p>
                          <p className="text-sm text-neutral-500">Essayez de modifier vos filtres</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    members.map((member) => (
                      <tr 
                        key={member.id} 
                        onMouseEnter={() => setHoveredRow(member.id)}
                        onMouseLeave={() => setHoveredRow(null)}
                        onClick={() => handleViewProfile(member.id)}
                        className="group hover:bg-orange-50/30 transition-all duration-200 cursor-pointer
                                 focus-within:ring-2 focus-within:ring-orange-500 focus-within:ring-inset"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            handleViewProfile(member.id);
                          }
                        }}
                      >
{/* Membre */}
<td className="px-6 py-4">
  <div className="flex items-center gap-3">
    <div className="relative">
      {/* ✅ UTILISER LE COMPOSANT AVATAR */}
      <Avatar
        avatarUrl={member.avatar_url}
        name={member.full_name}
        size="md"
        showBorder={false}
        className="shadow-sm group-hover:shadow-md transition-shadow"
      />
      
      {member.is_active && (
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 
                      rounded-full border border-white shadow-sm" 
             title="En ligne"
        />
      )}
    </div>
    <div className="min-w-0">
      <p className="text-sm font-bold text-neutral-900 truncate 
                  group-hover:text-orange-600 transition-colors">
        {member.full_name}
      </p>
      <p className="text-xs text-neutral-600 truncate">
        {member.email}
      </p>
    </div>
  </div>
</td>


                        {/* ✅ Rôle - SEULEMENT Admin/Chef avec icônes */}
                        <td className="px-6 py-4">
                          {member.role === 'admin' ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold
                                           bg-orange-100 text-orange-700 transition-colors">
                              <Crown className="w-3.5 h-3.5" />
                              Admin
                            </span>
                          ) : member.role === 'chef' ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold
                                           bg-neutral-900 text-white transition-colors">
                              <Target className="w-3.5 h-3.5" />
                              Chef
                            </span>
                          ) : (
                            <span className="text-xs text-neutral-500 font-medium">—</span>
                          )}
                        </td>

                        {/* ✅ Tâches - FORMAT COMPACT (2/3) */}
                        <td className="px-6 py-4">
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-sm font-bold text-neutral-900">
                              {member.tasks_in_progress}
                            </span>
                            <span className="text-xs text-neutral-400 font-medium">/</span>
                            <span className="text-xs text-neutral-500 font-medium">
                              {member.tasks_total}
                            </span>
                            <span className="text-xs text-neutral-400 ml-1">tâches</span>
                          </div>
                        </td>

                        {/* ✅ Progression - AVEC TOOLTIP */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3 group/progress">
                            <div className="flex-1 bg-neutral-100 rounded-full h-2.5 max-w-[120px] overflow-hidden
                                          relative">
                              <div
                                className="h-2.5 rounded-full transition-all duration-500 bg-gradient-to-r from-orange-500 to-orange-600"
                                style={{ width: `${member.completion_rate}%` }}
                              />
                              {/* Tooltip */}
                              <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-neutral-900 text-white 
                                            text-xs px-2 py-1 rounded opacity-0 group-hover/progress:opacity-100
                                            transition-opacity pointer-events-none whitespace-nowrap z-10">
                                {Math.round(member.tasks_total * member.completion_rate / 100)}/{member.tasks_total} tâches terminées
                              </div>
                            </div>
                            <span className="text-sm font-bold text-neutral-900 w-12 text-right">
                              {member.completion_rate}%
                            </span>
                          </div>
                        </td>

                        {/* Statut */}
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg text-xs font-semibold
                              transition-colors
                              ${member.is_active
                                ? 'bg-orange-100 text-orange-700'
                                : 'bg-neutral-100 text-neutral-500'
                              }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full
                                ${member.is_active ? 'bg-orange-500 animate-pulse' : 'bg-neutral-400'
                              }`}
                            />
                            {member.is_active ? 'Actif' : 'Inactif'}
                          </span>
                        </td>

                        {/* ✅ Actions - VISIBLE SUR TOUTES LES LIGNES AU HOVER */}
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewProfile(member.id);
                            }}
                            className={`inline-flex items-center gap-1 text-sm text-orange-600 hover:text-orange-700 
                                     font-bold transition-all
                                     ${hoveredRow === member.id ? 'opacity-100' : 'opacity-0'}
                                     focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-orange-500 
                                     focus:ring-offset-2 rounded px-2 py-1`}
                          >
                            Voir profil
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <MemberProfileModal
        memberId={selectedMemberId}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onMemberUpdated={handleMemberUpdated}
        onMemberDeleted={handleMemberDeleted}
      />

      <InviteMemberModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        onMemberInvited={handleMemberInvited}
      />

      <AddMemberModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onMemberAdded={handleMemberAdded}
      />
    </Layout>
  );
};
