/**
 * Modal pour afficher le profil détaillé d'un membre.
 * Design professionnel et minimaliste.
 */

import { useEffect, useState } from 'react';
import { getTeamMemberDetail, updateMemberRole, toggleMemberActive } from '../../api/team';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { DeleteMemberModal } from './DeleteMemberModal';
import { AvatarUploader } from './AvatarUploader';
import toast from 'react-hot-toast';


export const MemberProfileModal = ({ memberId, isOpen, onClose, onMemberUpdated, onMemberDeleted }) => {
  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [updatingRole, setUpdatingRole] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Charge les détails du membre quand le modal s'ouvre
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
    } catch (err) {
      setError('Impossible de charger les détails du membre');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

    // ✅ FONCTION 1 : Modifier le rôle
  const handleRoleChange = async (newRole) => {
    if (newRole === member.role) return;
    
    setUpdatingRole(true);
    try {
      const response = await updateMemberRole(memberId, newRole);
      toast.success(response.message);
      setMember(response.member);
      if (onMemberUpdated) onMemberUpdated(response.member);
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Erreur lors de la modification du rôle';
      toast.error(errorMsg);
    } finally {
      setUpdatingRole(false);
    }
  };
  
  // ✅ FONCTION 2 : Toggle actif/inactif
  const handleToggleActive = async () => {
    setUpdatingStatus(true);
    try {
      const response = await toggleMemberActive(memberId);
      toast.success(response.message);
      setMember(response.member);
      if (onMemberUpdated) onMemberUpdated(response.member);
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Erreur lors du changement de statut';
      toast.error(errorMsg);
    } finally {
      setUpdatingStatus(false);
    }
  };

    const handleAvatarUpdated = (newAvatarUrl) => {
    // Mettre à jour l'avatar dans le state local
    setMember((prev) => ({
      ...prev,
      avatar_url: newAvatarUrl
    }));
    
    // Notifier le parent pour mettre à jour la liste
    if (onMemberUpdated) {
      onMemberUpdated({
        ...member,
        avatar_url: newAvatarUrl
      });
    }
  };


  // Ferme le modal si on clique sur le fond
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Profil du membre</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-6">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <LoadingSpinner />
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
              {error}
            </div>
          ) : member ? (
            <>
              {/* Infos principales */}
    <div className="flex items-start gap-6 mb-8">
      {/* Avatar */}
      {/* <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
        {member.avatar_url ? (
          <img
            src={member.avatar_url}
            alt={member.full_name}
            className="w-full h-full rounded-full object-cover"
          />
        ) : (
          <span className="text-white text-2xl font-semibold">
            {member.full_name.charAt(0).toUpperCase()}
          </span>
        )}
      </div> */}
      {/* ✅ AVATAR AVEC UPLOAD */}
<div className="flex flex-col items-center gap-6 mb-8">
  <AvatarUploader
    userId={member.id}
    currentAvatar={member.avatar_url}
    onAvatarUpdated={handleAvatarUpdated}
  />
</div>


      {/* Informations */}
      <div className="flex-1">
        <h3 className="text-xl font-semibold text-gray-900 mb-1">
          {member.full_name}
        </h3>
        <p className="text-sm text-gray-500 mb-3">{member.email}</p>

        <div className="flex items-center gap-3">
          {/* ✅ DROPDOWN POUR CHANGER LE RÔLE */}
          <select
            value={member.role}
            onChange={(e) => handleRoleChange(e.target.value)}
            disabled={updatingRole}
            className={`px-2.5 py-0.5 rounded-md text-xs font-medium border cursor-pointer transition-colors ${
              member.role === 'admin'
                ? 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                : member.role === 'chef'
                ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
                : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200'
            } ${updatingRole ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <option value="membre">Membre</option>
            <option value="chef">Chef de projet</option>
            <option value="admin">Administrateur</option>
          </select>

          {/* ✅ TOGGLE POUR ACTIF/INACTIF */}
          <button
            onClick={handleToggleActive}
            disabled={updatingStatus}
            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-medium border transition-colors ${
              member.is_active
                ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                : 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200'
            } ${updatingStatus ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${
              member.is_active ? 'bg-green-500' : 'bg-gray-400'
            }`}></span>
            {member.is_active ? 'Actif' : 'Inactif'}
          </button>
        </div>
      </div>
    </div>


              {/* Statistiques */}
              <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <p className="text-sm text-gray-500 mb-1">Tâches Total</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {member.tasks_total}
                  </p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <p className="text-sm text-gray-500 mb-1">En Cours</p>
                  <p className="text-2xl font-semibold text-blue-600">
                    {member.tasks_in_progress}
                  </p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <p className="text-sm text-gray-500 mb-1">Terminées</p>
                  <p className="text-2xl font-semibold text-green-600">
                    {member.tasks_done}
                  </p>
                </div>
              </div>

              {/* Progression */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-gray-700">Taux de complétion</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {member.completion_rate}%
                  </p>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{ width: `${member.completion_rate}%` }}
                  />
                </div>
              </div>

              {/* Tâches récentes */}
              {member.recent_tasks && member.recent_tasks.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">
                    Tâches récentes
                  </h4>
                  <div className="space-y-2">
                    {member.recent_tasks.map((task) => (
                      <div
                        key={task.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
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

                        <div className="flex items-center gap-2 ml-3">
                          {/* Badge priorité */}
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-medium ${
                              task.priority === 'high'
                                ? 'bg-red-50 text-red-700'
                                : task.priority === 'medium'
                                ? 'bg-yellow-50 text-yellow-700'
                                : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {task.priority === 'high'
                              ? 'Haute'
                              : task.priority === 'medium'
                              ? 'Moyenne'
                              : 'Basse'}
                          </span>

                          {/* Badge statut */}
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-medium ${
                              task.status === 'done'
                                ? 'bg-green-50 text-green-700'
                                : task.status === 'in_progress'
                                ? 'bg-blue-50 text-blue-700'
                                : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {task.status === 'done'
                              ? 'Terminée'
                              : task.status === 'in_progress'
                              ? 'En cours'
                              : 'À faire'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Message si aucune tâche */}
              {(!member.recent_tasks || member.recent_tasks.length === 0) && (
                <div className="text-center py-8">
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
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                  <p className="mt-2 text-sm text-gray-500">Aucune tâche récente</p>
                </div>
              )}
            </>
          ) : null}
        </div>

{/* Footer */}
<div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-between">
  {/* ✅ BOUTON SUPPRIMER À GAUCHE */}
  <button
    onClick={() => setIsDeleteModalOpen(true)}
    className="px-4 py-2 bg-red-50 border border-red-200 text-red-700 text-sm font-medium rounded-lg hover:bg-red-100 transition-colors"
  >
    Supprimer
  </button>
  
  {/* BOUTON FERMER À DROITE */}
  <button
    onClick={onClose}
    className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
  >
    Fermer
  </button>
</div>

{/* ✅ MODAL DE CONFIRMATION DE SUPPRESSION */}
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
    </div>
  );
};
