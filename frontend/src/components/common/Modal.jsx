/**
 * ═══════════════════════════════════════════════════════════════
 * MODAL COMPONENT - BACKDROP FULL SCREEN + CLICK OUTSIDE
 * ═══════════════════════════════════════════════════════════════
 * 
 * ✅ Corrections :
 * - Backdrop couvre 100% de l'écran (fixed inset-0)
 * - Click outside ferme le modal
 * - Scroll lock automatique
 * - Z-index correct
 * - Animations smooth
 */

import { useEffect } from 'react';
import { X } from 'lucide-react';

/**
 * Composant Modal réutilisable
 * 
 * @param {boolean} isOpen - État d'ouverture du modal
 * @param {Function} onClose - Fonction de fermeture
 * @param {string} title - Titre du modal (optionnel)
 * @param {React.ReactNode} children - Contenu du modal
 * @param {string} size - Taille du modal (sm, md, lg, xl)
 * @param {string} maxWidth - Alternative à size (ex: "max-w-xl")
 */
export const Modal = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  size = 'md',
  maxWidth 
}) => {
  // ✨ SCROLL LOCK
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  // Si le modal n'est pas ouvert, ne rien afficher
  if (!isOpen) return null;

  // Classes de taille
  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  const widthClass = maxWidth || sizeClasses[size];

  /**
   * ✅ CLICK OUTSIDE pour fermer
   */
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center
                 bg-neutral-900/60 backdrop-blur-[2px]
                 animate-in fade-in duration-200"
      onClick={handleBackdropClick}
    >
      {/* ✨ MODAL CONTENT */}
      <div
        className={`
          relative bg-white rounded-2xl shadow-2xl w-full ${widthClass}
          max-h-[90vh] flex flex-col
          animate-in zoom-in-95 fade-in duration-200
        `}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        
        {/* ✨ HEADER CONDITIONNEL */}
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200">
            <h2 className="text-xl font-bold text-neutral-900">
              {title}
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
              aria-label="Fermer"
            >
              <X className="w-5 h-5 text-neutral-600" strokeWidth={2} />
            </button>
          </div>
        )}

        {/* ✨ CONTENU */}
        <div className={`flex-1 overflow-y-auto ${title ? 'p-6' : ''}`}>
          {children}
        </div>
      </div>
    </div>
  );
};
