/**
 * Modal de confirmation pour supprimer un membre.
 * Design professionnel avec avertissement.
 */

import { useState } from 'react';
import { deleteMember } from '../../api/team';
import toast from 'react-hot-toast';

export const DeleteMemberModal = ({ member, isOpen, onClose, onMemberDeleted }) => {
  const [deleting, setDeleting] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  if (!isOpen || !member) return null;

  const handleDelete = async () => {
    // Vérification du texte de confirmation
    if (confirmText.toLowerCase() !== 'supprimer') {
      toast.error('Veuillez taper "supprimer" pour confirmer');
      return;
    }

    setDeleting(true);

    try {
      const response = await deleteMember(member.id);
      toast.success(response.message);
      onMemberDeleted(member.id);
      handleClose();
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Erreur lors de la suppression';
      toast.error(errorMsg);
    } finally {
      setDeleting(false);
    }
  };

  const handleClose = () => {
    setConfirmText('');
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && handleClose()}
    >
      <div className="bg-white rounded-lg max-w-md w-full">
        {/* Header avec icône warning */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Supprimer ce membre ?
              </h3>
              <p className="text-sm text-gray-500">
                {member.full_name}
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-6">
          <div className="space-y-4">
            {/* Avertissement */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800 mb-2">
                <strong>⚠️ Cette action est irréversible !</strong>
              </p>
              <ul className="text-sm text-red-700 space-y-1 list-disc list-inside">
                <li>Le membre sera supprimé définitivement</li>
                <li>Ses tâches assignées seront conservées</li>
                <li>Son historique sera perdu</li>
              </ul>
            </div>

            {/* Info membre */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <span className="text-white text-sm font-semibold">
                    {member.full_name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{member.full_name}</p>
                  <p className="text-xs text-gray-500">{member.email}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-gray-500">Rôle :</span>
                  <span className="ml-1 font-medium text-gray-900">
                    {member.role === 'admin' ? 'Administrateur' :
                     member.role === 'chef' ? 'Chef de projet' : 'Membre'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Tâches :</span>
                  <span className="ml-1 font-medium text-gray-900">
                    {member.tasks_total || 0}
                  </span>
                </div>
              </div>
            </div>

            {/* Confirmation par texte */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pour confirmer, tapez <span className="font-bold text-red-600">"supprimer"</span>
              </label>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="Tapez supprimer"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                disabled={deleting}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
          <button
            onClick={handleClose}
            disabled={deleting}
            className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Annuler
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting || confirmText.toLowerCase() !== 'supprimer'}
            className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {deleting ? 'Suppression...' : 'Supprimer définitivement'}
          </button>
        </div>
      </div>
    </div>
  );
};
