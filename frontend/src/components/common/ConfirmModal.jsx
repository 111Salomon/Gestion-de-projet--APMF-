import { AlertTriangle, X } from 'lucide-react';
import { Button } from './Button';

/**
 * Modal de confirmation pour actions destructives
 * 
 * @param {boolean} isOpen - État d'ouverture
 * @param {Function} onClose - Fonction de fermeture
 * @param {Function} onConfirm - Fonction de confirmation
 * @param {string} title - Titre du modal
 * @param {string} message - Message de confirmation
 * @param {string} confirmText - Texte du bouton de confirmation
 * @param {string} cancelText - Texte du bouton d'annulation
 * @param {boolean} isLoading - État de chargement
 * @param {string} variant - Type (danger, warning, info)
 */
export const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirmer l\'action',
  message = 'Êtes-vous sûr de vouloir continuer ?',
  confirmText = 'Confirmer',
  cancelText = 'Annuler',
  isLoading = false,
  variant = 'danger',
}) => {
  if (!isOpen) return null;

  // Couleurs selon le type d'action
  const variants = {
    danger: {
      icon: 'bg-red-100 text-red-600',
      button: 'bg-red-600 hover:bg-red-700 text-white',
    },
    warning: {
      icon: 'bg-amber-100 text-amber-600',
      button: 'bg-amber-600 hover:bg-amber-700 text-white',
    },
    info: {
      icon: 'bg-primary-100 text-primary-600',
      button: 'bg-primary-600 hover:bg-primary-700 text-white',
    },
  };

  const style = variants[variant];

  /**
   * Empêche la fermeture en cliquant sur le contenu
   */
  const handleContentClick = (e) => {
    e.stopPropagation();
  };

  return (
    // Backdrop sombre
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      {/* Contenu du modal */}
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-md animate-in zoom-in duration-200"
        onClick={handleContentClick}
      >
        {/* Header */}
        <div className="p-6 border-b border-neutral-200">
          <div className="flex items-start gap-4">
            {/* Icône d'alerte */}
            <div className={`p-3 rounded-full ${style.icon}`}>
              <AlertTriangle className="w-6 h-6" />
            </div>

            {/* Titre et bouton fermer */}
            <div className="flex-1">
              <h3 className="text-xl font-bold text-neutral-900">
                {title}
              </h3>
            </div>

            <button
              onClick={onClose}
              disabled={isLoading}
              className="p-1 hover:bg-neutral-100 rounded-lg transition-colors disabled:opacity-50"
            >
              <X className="w-5 h-5 text-neutral-600" />
            </button>
          </div>
        </div>

        {/* Message */}
        <div className="p-6">
          <p className="text-neutral-600 leading-relaxed">
            {message}
          </p>
        </div>

        {/* Boutons */}
        <div className="p-6 bg-neutral-50 rounded-b-xl flex items-center gap-3">
          <Button
            variant="secondary"
            fullWidth
            onClick={onClose}
            disabled={isLoading}
          >
            {cancelText}
          </Button>

          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`
              w-full px-6 py-3 rounded-lg font-medium
              transition-all duration-200
              disabled:opacity-50 disabled:cursor-not-allowed
              flex items-center justify-center
              ${style.button}
            `}
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Suppression...
              </>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
