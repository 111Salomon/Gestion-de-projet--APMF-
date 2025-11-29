/**
 * Page Équipe - Liste des membres de l'équipe avec statistiques.
 * Design professionnel et minimaliste.
 */

import { useState, useEffect } from 'react';
import { getTeamMembers, getTeamStats } from '../../api/team';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Layout } from '../../components/layout/Layout';
import { MemberProfileModal } from '../../components/team/MemberProfileModal';
import { InviteMemberModal } from '../../components/team/InviteMemberModal';

// 🆕 Imports pour les icônes d'export
import { Download, ChevronDown } from 'lucide-react';

// 🆕 Import pour les toasts (feedback utilisateur)
import toast from 'react-hot-toast';

export const Team = () => {
  // ═══════════════════════════════════════════════════════════
  // STATE
  // ═══════════════════════════════════════════════════════════

  const [members, setMembers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ✅ NOUVEAUX ÉTATS pour le modal
  const [selectedMemberId, setSelectedMemberId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  // Filtres
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  // 🆕 ÉTATS POUR L'EXPORT
  const [isExportDropdownOpen, setIsExportDropdownOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // ═══════════════════════════════════════════════════════════
  // EFFETS
  // ═══════════════════════════════════════════════════════════

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    loadMembers();
  }, [searchTerm, roleFilter]);

  // 🆕 Fermer le dropdown d'export au clic en dehors
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

  const handleMemberUpdated = (updatedMember) => {
    console.log('Membre mis à jour:', updatedMember);
    setMembers((prevMembers) =>
      prevMembers.map((m) =>
        m.id === updatedMember.id ? updatedMember : m
      )
    );
    loadStats();
  };

  const handleMemberDeleted = (deletedId) => {
    console.log('Membre supprimé:', deletedId);
    setMembers((prevMembers) =>
      prevMembers.filter((m) => m.id !== deletedId)
    );
    loadStats();
  };

  /**
 * ✅ FONCTION D'EXPORT CORRIGÉE - Version Axios
 * Utilise axios pour télécharger le fichier en tant que blob.
 * Le token JWT est envoyé dans les headers (pas dans l'URL).
 * 
 * @param {'csv' | 'excel' | 'pdf'} format
 */
const handleExport = async (format) => {
  try {
    setIsExporting(true);
    setIsExportDropdownOpen(false);

    // ─── Construction des query params ───
    const params = new URLSearchParams();

    if (searchTerm) {
      params.append('search', searchTerm);
    }

    if (roleFilter !== 'all') {
      params.append('role', roleFilter);
    }

    const queryString = params.toString();

    // ─── Construction de l'URL ───
    const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    const url = `${backendUrl}/api/users/team-members/export/${format}/${queryString ? '?' + queryString : ''}`;

    // ─── Récupération du token JWT ───
    const token = localStorage.getItem('access_token');

    console.log('🔍 URL Export:', url);

    // ─── Appel API avec axios (blob response) ───
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      // Important : ne pas parser la réponse en JSON
    });

    console.log('📡 Réponse status:', response.status);

    if (!response.ok) {
      throw new Error(`Erreur HTTP ${response.status}`);
    }

    // ─── Récupération du blob ───
    const blob = await response.blob();

    // ─── Extraction du nom de fichier ───
    const contentDisposition = response.headers.get('Content-Disposition');
    let filename = `equipe_${Date.now()}.${format === 'excel' ? 'xlsx' : format}`;

    if (contentDisposition) {
      const match = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
      if (match && match[1]) {
        filename = match[1].replace(/['"]/g, '');
      }
    }

    // ─── Création du lien de téléchargement ───
    const downloadUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename;
    
    // Ajouter au DOM, cliquer, puis retirer
    document.body.appendChild(link);
    link.click();
    
    // Nettoyage
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
        <div className="flex justify-center items-center h-screen">
          <LoadingSpinner />
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
            {error}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* En-tête */}
        <div className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Équipe</h1>
            <p className="text-sm text-gray-500 mt-1">
              Gérez les membres de votre équipe
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* 🆕 Bouton Export avec dropdown */}
            <div
              className="relative"
              data-export-dropdown="true"
            >
              <button
                type="button"
                onClick={() => setIsExportDropdownOpen((prev) => !prev)}
                disabled={isExporting || members.length === 0}
                className="px-4 py-2 border border-gray-300 bg-white text-sm font-medium rounded-lg flex items-center gap-2 hover:bg-gray-50 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <Download className="w-4 h-4" />
                {isExporting ? 'Export en cours...' : 'Exporter'}
                <ChevronDown className="w-4 h-4" />
              </button>

              {isExportDropdownOpen && (
                <div className="absolute right-0 mt-2 w-44 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
                  <button
                    type="button"
                    onClick={() => handleExport('csv')}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors rounded-t-lg flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    CSV
                  </button>
                  <button
                    type="button"
                    onClick={() => handleExport('excel')}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Excel
                  </button>
                  <button
                    type="button"
                    onClick={() => handleExport('pdf')}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors rounded-b-lg flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    PDF
                  </button>
                </div>
              )}
            </div>

            {/* Bouton Inviter (existant) */}
            <button
              onClick={() => setIsInviteModalOpen(true)}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              Inviter un membre
            </button>
          </div>
        </div>

        {/* Stats Cards - Design minimaliste */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
            {/* Total Membres */}
            <div className="bg-white border border-gray-200 rounded-lg p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-gray-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                </div>
              </div>
              <p className="text-sm text-gray-500 mb-1">Total Membres</p>
              <p className="text-2xl font-semibold text-gray-900">
                {stats.total_members}
              </p>
            </div>

            {/* Actifs */}
            <div className="bg-white border border-gray-200 rounded-lg p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
              </div>
              <p className="text-sm text-gray-500 mb-1">Membres Actifs</p>
              <p className="text-2xl font-semibold text-gray-900">
                {stats.active_members}
              </p>
            </div>

            {/* Charge Moyenne */}
            <div className="bg-white border border-gray-200 rounded-lg p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                </div>
              </div>
              <p className="text-sm text-gray-500 mb-1">Charge Moyenne</p>
              <p className="text-2xl font-semibold text-gray-900">
                {stats.avg_workload}
                <span className="text-sm text-gray-400 ml-1">tâches</span>
              </p>
            </div>

            {/* Taux Complétion */}
            <div className="bg-white border border-gray-200 rounded-lg p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-purple-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                </div>
              </div>
              <p className="text-sm text-gray-500 mb-1">Taux Complétion</p>
              <p className="text-2xl font-semibold text-gray-900">
                {stats.completion_rate}%
              </p>
            </div>
          </div>
        )}

        {/* Filtres - Design épuré */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="search"
                placeholder="Rechercher un membre..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <select
              value={roleFilter}
              onChange={handleRoleChange}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            >
              <option value="all">Tous les rôles</option>
              <option value="admin">Administrateur</option>
              <option value="chef">Chef de projet</option>
              <option value="membre">Membre</option>
            </select>
          </div>
        </div>

        {/* Tableau - Design professionnel et aéré */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Membre
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rôle
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tâches
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Progression
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {members.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center">
                    <svg
                      className="mx-auto h-12 w-12 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>
                    <p className="mt-2 text-sm text-gray-500">Aucun membre trouvé</p>
                  </td>
                </tr>
              ) : (
                members.map((member) => (
                  <tr key={member.id} className="hover:bg-gray-50 transition-colors">
                    {/* Membre */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                          {member.avatar_url ? (
                            <img
                              src={member.avatar_url}
                              alt={member.full_name}
                              className="w-full h-full rounded-full object-cover"
                            />
                          ) : (
                            <span className="text-white text-sm font-semibold">
                              {member.full_name.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {member.full_name}
                          </p>
                          <p className="text-sm text-gray-500 truncate">
                            {member.email}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Rôle */}
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium ${
                          member.role === 'admin'
                            ? 'bg-red-50 text-red-700 border border-red-200'
                            : member.role === 'chef'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-gray-100 text-gray-700 border border-gray-200'
                        }`}
                      >
                        {member.role === 'admin'
                          ? 'Administrateur'
                          : member.role === 'chef'
                          ? 'Chef de projet'
                          : 'Membre'}
                      </span>
                    </td>

                    {/* Tâches */}
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <p className="text-gray-900 font-medium">
                          {member.tasks_in_progress} en cours
                        </p>
                        <p className="text-gray-500">
                          {member.tasks_total} au total
                        </p>
                      </div>
                    </td>

                    {/* Progression */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-[100px]">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all"
                            style={{ width: `${member.completion_rate}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-gray-700 w-10 text-right">
                          {member.completion_rate}%
                        </span>
                      </div>
                    </td>

                    {/* Statut */}
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-medium ${
                          member.is_active
                            ? 'bg-green-50 text-green-700 border border-green-200'
                            : 'bg-gray-100 text-gray-600 border border-gray-200'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            member.is_active ? 'bg-green-500' : 'bg-gray-400'
                          }`}
                        ></span>
                        {member.is_active ? 'Actif' : 'Inactif'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleViewProfile(member.id)}
                        className="text-sm text-gray-600 hover:text-gray-900 font-medium transition-colors"
                      >
                        Voir le profil
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

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
    </Layout>
  );
};
