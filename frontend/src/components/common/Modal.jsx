import { X } from 'lucide-react';

/**
 * Composant Modal réutilisable
 * 
 * @param {boolean} isOpen - État d'ouverture du modal
 * @param {Function} onClose - Fonction de fermeture
 * @param {string} title - Titre du modal
 * @param {React.ReactNode} children - Contenu du modal
 * @param {string} size - Taille du modal (sm, md, lg, xl)
 */
export const Modal = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  size = 'md' 
}) => {
  // Si le modal n'est pas ouvert, ne rien afficher
  if (!isOpen) return null;

  // Classes de taille selon la prop
  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  /**
   * Ferme le modal quand on clique sur l'arrière-plan
   */
  const handleBackdropClick = (e) => {
    // Ferme seulement si on clique sur l'arrière-plan, pas sur le contenu
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    // Arrière-plan sombre (backdrop)
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
      onClick={handleBackdropClick}
    >
      {/* Contenu du modal */}
      <div
        className={`
          bg-white rounded-xl shadow-2xl w-full ${sizeClasses[size]}
          max-h-[90vh] flex flex-col
          animate-in fade-in zoom-in duration-200
        `}
      >
        {/* Header avec titre et bouton fermer */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-200">
          <h2 className="text-2xl font-bold text-neutral-900">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
            aria-label="Fermer"
          >
            <X className="w-5 h-5 text-neutral-600" />
          </button>
        </div>

        {/* Contenu scrollable */}
        <div className="flex-1 overflow-y-auto p-6">
          {children}
        </div>
      </div>
    </div>
  );
};
