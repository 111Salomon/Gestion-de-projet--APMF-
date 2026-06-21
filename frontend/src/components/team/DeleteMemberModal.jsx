/**
 * ═══════════════════════════════════════════════════════════════
 * DELETE MEMBER MODAL - DESIGN ÉPURÉ ET SÉCURISÉ
 * ═══════════════════════════════════════════════════════════════
 * 
 * ✅ Confirmation par texte
 * ✅ Design minimaliste et professionnel
 * ✅ Avertissements clairs
 * ✅ Icons Lucide
 * ✅ Animations smooth
 */

import { useState } from 'react';
import { 
  X, 
  AlertTriangle, 
  Trash2,
  User,
  Mail,
  Shield,
  CheckCircle
} from 'lucide-react';
import { deleteMember } from '../../api/team';
import toast from 'react-hot-toast';
import { getApiErrorMessage } from '../../utils/apiError';

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
      toast.error(getApiErrorMessage(error, 'Erreur lors de la suppression'));
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
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-fadeIn"
      onClick={(e) => e.target === e.currentTarget && handleClose()}
    >
      <div className="bg-white rounded-xl max-w-md w-full shadow-2xl animate-slideUp">
        
        {/* ✨ HEADER WARNING */}
        <div className="px-6 py-5 border-b border-neutral-200">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center shadow-sm">
                <AlertTriangle className="w-6 h-6 text-red-600" strokeWidth={2.5} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-neutral-900">
                  Supprimer ce membre
                </h3>
                <p className="text-sm text-neutral-600">
                  Action irréversible
                </p>
              </div>
            </div>
            
            <button
              onClick={handleClose}
              disabled={deleting}
              className="p-2 hover:bg-neutral-100 rounded-lg transition-colors group"
            >
              <X className="w-5 h-5 text-neutral-600 group-hover:text-neutral-900" strokeWidth={2} />
            </button>
          </div>
        </div>

        {/* ✨ CONTENT */}
        <div className="px-6 py-6">
          <div className="space-y-5">
            
            {/* Avertissement */}
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" strokeWidth={2} />
                <div className="flex-1">
                  <p className="text-sm font-bold text-red-900 mb-2">
                    Cette action est irréversible !
                  </p>
                  <ul className="text-sm text-red-800 space-y-1.5">
                    <li className="flex items-start gap-2">
                      <span className="text-red-600 mt-0.5">•</span>
                      <span>Le membre sera supprimé définitivement</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-600 mt-0.5">•</span>
                      <span>Ses tâches assignées seront conservées</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-600 mt-0.5">•</span>
                      <span>Son historique sera perdu</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* ✨ CARD MEMBRE */}
            <div className="bg-gradient-to-br from-neutral-50 to-neutral-100 border border-neutral-200 rounded-xl p-5">
              {/* Avatar + Info principale */}
              <div className="flex items-center gap-4 mb-4">
                {/* Avatar */}
                <div className="relative group">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center overflow-hidden shadow-md shadow-orange-500/20">
                    {member.avatar_url ? (
                      <img 
                        src={member.avatar_url} 
                        alt={member.full_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-white text-lg font-bold">
                        {member.full_name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                </div>

                {/* Infos */}
                <div className="flex-1 min-w-0">
                  <p className="text-base font-bold text-neutral-900 truncate mb-1">
                    {member.full_name}
                  </p>
                  <div className="flex items-center gap-1.5 text-neutral-600">
                    <Mail className="w-3.5 h-3.5" strokeWidth={2} />
                    <p className="text-xs truncate">{member.email}</p>
                  </div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-3">
                {/* Rôle */}
                <div className="bg-white rounded-lg p-3 border border-neutral-200">
                  <div className="flex items-center gap-2 mb-1">
                    <Shield className="w-3.5 h-3.5 text-neutral-500" strokeWidth={2} />
                    <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">Rôle</span>
                  </div>
                  <p className={`text-sm font-bold ${
                    member.role === 'admin' ? 'text-red-700' :
                    member.role === 'chef' ? 'text-blue-700' :
                    'text-neutral-700'
                  }`}>
                    {member.role === 'admin' ? 'Administrateur' :
                     member.role === 'chef' ? 'Chef de projet' : 'Membre'}
                  </p>
                </div>

                {/* Tâches */}
                <div className="bg-white rounded-lg p-3 border border-neutral-200">
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle className="w-3.5 h-3.5 text-neutral-500" strokeWidth={2} />
                    <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">Tâches</span>
                  </div>
                  <p className="text-sm font-bold text-neutral-700">
                    {member.tasks_total || 0}
                  </p>
                </div>
              </div>
            </div>

            {/* ✨ CONFIRMATION INPUT */}
            <div>
              <label className="block text-sm font-semibold text-neutral-700 mb-2">
                Pour confirmer, tapez{' '}
                <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded font-mono text-xs">
                  supprimer
                </span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder="Tapez supprimer"
                  className={`
                    w-full px-4 py-2.5 border rounded-lg text-sm font-medium
                    focus:outline-none focus:ring-2 focus:ring-offset-0
                    transition-all
                    ${confirmText.toLowerCase() === 'supprimer'
                      ? 'border-red-300 bg-red-50 focus:ring-red-500 text-red-700'
                      : 'border-neutral-300 hover:border-neutral-400 focus:ring-orange-500'
                    }
                  `}
                  disabled={deleting}
                  autoComplete="off"
                />
                
                {/* Icône validation */}
                {confirmText.toLowerCase() === 'supprimer' && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <CheckCircle className="w-5 h-5 text-red-600" strokeWidth={2} />
                  </div>
                )}
              </div>
              
              {/* Helper text */}
              <p className="mt-2 text-xs text-neutral-600">
                {confirmText.toLowerCase() === 'supprimer' ? (
                  <span className="text-red-600 font-semibold">✓ Confirmation validée</span>
                ) : (
                  <span>Tapez exactement "supprimer" pour activer le bouton</span>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* ✨ FOOTER - ACTIONS */}
        <div className="px-6 py-4 bg-neutral-50 border-t border-neutral-200 flex justify-end gap-3 rounded-b-xl">
          <button
            onClick={handleClose}
            disabled={deleting}
            className="px-5 py-2.5 border border-neutral-300 text-neutral-700 text-sm font-semibold rounded-lg hover:bg-neutral-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Annuler
          </button>
          
          <button
            onClick={handleDelete}
            disabled={deleting || confirmText.toLowerCase() !== 'supprimer'}
            className="
              inline-flex items-center justify-center gap-2 
              px-5 py-2.5
              bg-gradient-to-r from-red-600 to-red-700
              text-white text-sm font-semibold rounded-lg
              hover:shadow-lg hover:shadow-red-500/30
              hover:scale-105 active:scale-95
              transition-all duration-200
              disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
              focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2
            "
          >
            {deleting ? (
              <>
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Suppression en cours...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" strokeWidth={2} />
                <span>Supprimer définitivement</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ✨ ANIMATIONS */}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};
