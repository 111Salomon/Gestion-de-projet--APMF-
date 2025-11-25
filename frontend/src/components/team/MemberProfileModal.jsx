/**
 * Modal pour afficher le profil détaillé d'un membre.
 * Design professionnel avec hiérarchie claire.
 */

import { useEffect, useState } from 'react';
import { getTeamMemberDetail, updateMemberRole, toggleMemberActive, updateMemberProfile } from '../../api/team';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { DeleteMemberModal } from './DeleteMemberModal';
import { AvatarUploader } from './AvatarUploader';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

export const MemberProfileModal = ({ memberId, isOpen, onClose, onMemberUpdated, onMemberDeleted }) => {
  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatingRole, setUpdatingRole] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  
  // États pour l'édition
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    bio: ''
  });
  const [saving, setSaving] = useState(false);
  const { user: currentUser, refreshUser } = useAuth();

  // Charge les détails du membre
  useEffect(() => {
    if (isOpen && memberId) {
      loadMemberDetails();
    }
  }, [isOpen, memberId]);

  const loadMemberDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getTeamMemberDetail(memberId);
      setMember(data);
      setEditForm({
        first_name: data.first_name || '',
        last_name: data.last_name || '',
        email: data.email || '',
        phone: data.phone || '',
        bio: data.bio || ''
      });
    } catch (err) {
      setError('Impossible de charger les détails du membre');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (newRole) => {
    if (newRole === member.role) return;
    setUpdatingRole(true);
    try {
      const response = await updateMemberRole(memberId, newRole);
      toast.success(response.message);
      setMember(response.member);
      if (onMemberUpdated) onMemberUpdated(response.member);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erreur lors de la modification du rôle');
    } finally {
      setUpdatingRole(false);
    }
  };

  const handleToggleActive = async () => {
    setUpdatingStatus(true);
    try {
      const response = await toggleMemberActive(memberId);
      toast.success(response.message);
      setMember(response.member);
      if (onMemberUpdated) onMemberUpdated(response.member);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erreur lors du changement de statut');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleAvatarUpdated = (newAvatarUrl) => {
    setMember((prev) => ({ ...prev, avatar_url: newAvatarUrl }));

    if (currentUser && memberId === currentUser.id) {
      refreshUser();
    }

    if (onMemberUpdated) {
      onMemberUpdated({ ...member, avatar_url: newAvatarUrl });
    }
  };

  const handleEditToggle = () => {
    if (isEditing) {
      setEditForm({
        first_name: member.first_name || '',
        last_name: member.last_name || '',
        email: member.email || '',
        phone: member.phone || '',
        bio: member.bio || ''
      });
    }
    setIsEditing(!isEditing);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = async () => {
    if (!editForm.first_name.trim() || !editForm.last_name.trim()) {
      toast.error('Le prénom et le nom sont requis');
      return;
    }
    if (!editForm.email.trim()) {
      toast.error('L\'email est requis');
      return;
    }

    setSaving(true);
    try {
      const response = await updateMemberProfile(memberId, editForm);
      toast.success(response.message);
      setMember(response.user);
      setIsEditing(false);
      if (onMemberUpdated) onMemberUpdated(response.user);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erreur lors de la mise à jour');
    } finally {
      setSaving(false);
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* ═══════════════════════════════════════════════ */}
        {/* HEADER - Titre et Bouton Fermer */}
        {/* ═══════════════════════════════════════════════ */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-8 py-5 flex items-center justify-between rounded-t-xl">
          <h2 className="text-xl font-semibold text-gray-900">Profil du membre</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* ═══════════════════════════════════════════════ */}
        {/* CONTENT */}
        {/* ═══════════════════════════════════════════════ */}
        <div className="px-8 py-6">
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <LoadingSpinner />
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
              {error}
            </div>
          ) : member ? (
            <div className="space-y-8">
              {/* ═══════════════════════════════════════════════ */}
              {/* SECTION 1 : AVATAR & IDENTITÉ */}
              {/* ═══════════════════════════════════════════════ */}
              <div className="flex items-start gap-8">
                {/* Avatar */}
                <div className="flex-shrink-0">
                  <AvatarUploader
                    userId={member.id}
                    currentAvatar={member.avatar_url}
                    onAvatarUpdated={handleAvatarUpdated}
                  />
                </div>

                {/* Identité et Actions */}
                <div className="flex-1 space-y-4">
                  {/* Nom et Email */}
                  <div>
                    <h3 className="text-2xl font-semibold text-gray-900 mb-1">
                      {member.full_name}
                    </h3>
                    <p className="text-gray-600">{member.email}</p>
                  </div>

                  {/* Rôle et Statut */}
                  <div className="flex items-center gap-3">
                    <select
                      value={member.role}
                      onChange={(e) => handleRoleChange(e.target.value)}
                      disabled={updatingRole}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium border-2 cursor-pointer transition-all ${
                        member.role === 'admin'
                          ? 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                          : member.role === 'chef'
                          ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
                          : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                      } ${updatingRole ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <option value="membre">Membre</option>
                      <option value="chef">Chef de projet</option>
                      <option value="admin">Administrateur</option>
                    </select>

                    <button
                      onClick={handleToggleActive}
                      disabled={updatingStatus}
                      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium border-2 transition-all ${
                        member.is_active
                          ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                          : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                      } ${updatingStatus ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      <span className={`w-2 h-2 rounded-full ${
                        member.is_active ? 'bg-green-500' : 'bg-gray-400'
                      }`}></span>
                      {member.is_active ? 'Actif' : 'Inactif'}
                    </button>
                  </div>
                </div>
              </div>

              {/* ═══════════════════════════════════════════════ */}
              {/* SECTION 2 : INFORMATIONS PERSONNELLES */}
              {/* ═══════════════════════════════════════════════ */}
              <div className="border-t border-gray-200 pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold text-gray-900">Informations personnelles</h4>
                  {!isEditing && (
                    <button
                      onClick={handleEditToggle}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Modifier
                    </button>
                  )}
                </div>

                {!isEditing ? (
                  /* MODE AFFICHAGE */
                  <div className="grid grid-cols-2 gap-6">
                    {/* Téléphone */}
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">
                        Téléphone
                      </label>
                      <p className="text-sm text-gray-900">
                        {member.phone || <span className="text-gray-400 italic">Non renseigné</span>}
                      </p>
                    </div>

                    {/* Bio */}
                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-gray-500 mb-1">
                        Biographie
                      </label>
                      <p className="text-sm text-gray-900">
                        {member.bio || <span className="text-gray-400 italic">Aucune biographie</span>}
                      </p>
                    </div>
                  </div>
                ) : (
                  /* MODE ÉDITION */
                  <div className="space-y-4 bg-gray-50 rounded-lg p-6 border border-gray-200">
                    <div className="grid grid-cols-2 gap-4">
                      {/* Prénom */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Prénom <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="first_name"
                          value={editForm.first_name}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          disabled={saving}
                        />
                      </div>

                      {/* Nom */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Nom <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="last_name"
                          value={editForm.last_name}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          disabled={saving}
                        />
                      </div>
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={editForm.email}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        disabled={saving}
                      />
                    </div>

                    {/* Téléphone */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Téléphone
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={editForm.phone}
                        onChange={handleInputChange}
                        placeholder="+33 6 12 34 56 78"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        disabled={saving}
                      />
                    </div>

                    {/* Bio */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Biographie
                        <span className="text-xs text-gray-500 ml-2">
                          ({editForm.bio.length}/500)
                        </span>
                      </label>
                      <textarea
                        name="bio"
                        value={editForm.bio}
                        onChange={handleInputChange}
                        maxLength={500}
                        rows={3}
                        placeholder="Courte description..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                        disabled={saving}
                      />
                    </div>

                    {/* Boutons d'action */}
                    <div className="flex gap-3 pt-2">
                      <button
                        onClick={handleEditToggle}
                        disabled={saving}
                        className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                      >
                        Annuler
                      </button>
                      <button
                        onClick={handleSaveProfile}
                        disabled={saving}
                        className="flex-1 px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 inline-flex items-center justify-center gap-2"
                      >
                        {saving ? (
                          <>
                            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Enregistrement...
                          </>
                        ) : (
                          'Enregistrer'
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* ═══════════════════════════════════════════════ */}
              {/* SECTION 3 : STATISTIQUES */}
              {/* ═══════════════════════════════════════════════ */}
              <div className="border-t border-gray-200 pt-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Statistiques</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Total</p>
                    <p className="text-2xl font-semibold text-gray-900">{member.tasks_total}</p>
                    <p className="text-xs text-gray-600 mt-1">tâches</p>
                  </div>

                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <p className="text-xs text-blue-600 uppercase tracking-wide mb-1">En cours</p>
                    <p className="text-2xl font-semibold text-blue-700">{member.tasks_in_progress}</p>
                    <p className="text-xs text-blue-600 mt-1">tâches</p>
                  </div>

                  <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                    <p className="text-xs text-green-600 uppercase tracking-wide mb-1">Terminées</p>
                    <p className="text-2xl font-semibold text-green-700">{member.tasks_done}</p>
                    <p className="text-xs text-green-600 mt-1">tâches</p>
                  </div>
                </div>

                {/* Barre de progression */}
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-gray-700">Taux de complétion</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {member.completion_rate}%
                    </p>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className="bg-blue-600 h-2.5 rounded-full transition-all duration-500"
                      style={{ width: `${member.completion_rate}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* ═══════════════════════════════════════════════ */}
              {/* SECTION 4 : TÂCHES RÉCENTES */}
              {/* ═══════════════════════════════════════════════ */}
              {member.recent_tasks && member.recent_tasks.length > 0 && (
                <div className="border-t border-gray-200 pt-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Tâches récentes</h4>
                  <div className="space-y-3">
                    {member.recent_tasks.map((task) => (
                      <div
                        key={task.id}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {task.title}
                          </p>
                          {task.due_date && (
                            <p className="text-xs text-gray-500 mt-1">
                              Échéance : {new Date(task.due_date).toLocaleDateString('fr-FR')}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-2 ml-4">
                          <span
                            className={`px-2.5 py-1 rounded-md text-xs font-medium ${
                              task.priority === 'high'
                                ? 'bg-red-100 text-red-700'
                                : task.priority === 'medium'
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {task.priority === 'high' ? 'Haute' : task.priority === 'medium' ? 'Moyenne' : 'Basse'}
                          </span>

                          <span
                            className={`px-2.5 py-1 rounded-md text-xs font-medium ${
                              task.status === 'done'
                                ? 'bg-green-100 text-green-700'
                                : task.status === 'in_progress'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {task.status === 'done' ? 'Terminée' : task.status === 'in_progress' ? 'En cours' : 'À faire'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>

        {/* ═══════════════════════════════════════════════ */}
        {/* FOOTER - Actions Principales */}
        {/* ═══════════════════════════════════════════════ */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-8 py-4 flex justify-between rounded-b-xl">
          <button
            onClick={() => setIsDeleteModalOpen(true)}
            className="px-4 py-2 bg-white border border-red-200 text-red-600 text-sm font-medium rounded-lg hover:bg-red-50 transition-colors inline-flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Supprimer
          </button>

          <button
            onClick={onClose}
            className="px-6 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>

      {/* Modals */}
      <DeleteMemberModal
        member={member}
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onMemberDeleted={(deletedId) => {
          setIsDeleteModalOpen(false);
          onClose();
          if (onMemberDeleted) onMemberDeleted(deletedId);
        }}
      />
    </div>
  );
};
