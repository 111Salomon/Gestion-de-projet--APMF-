/**
 * ═══════════════════════════════════════════════════════════
 * COMPOSANT PAGINATION - Style Professionnel
 * ═══════════════════════════════════════════════════════════
 * 
 * UX Features :
 * - Affiche les numéros de pages
 * - Boutons Précédent/Suivant
 * - Indication de la page courante
 * - Ellipsis (...) pour les grandes listes
 * - Responsive mobile
 */

import { ChevronLeft, ChevronRight } from 'lucide-react';

export const Pagination = ({ 
  currentPage, 
  totalPages, 
  totalItems,
  itemsPerPage = 20,
  onPageChange 
}) => {
  
  /**
   * Génère les numéros de pages à afficher
   * Logique : [1] ... [4] [5] [6] ... [10]
   */
  const getPageNumbers = () => {
    const pages = [];
    const delta = 2; // Nombre de pages de chaque côté
    
    for (let i = 1; i <= totalPages; i++) {
      // Affiche toujours : première, dernière, courante et ±2 autour
      if (
        i === 1 || 
        i === totalPages || 
        (i >= currentPage - delta && i <= currentPage + delta)
      ) {
        pages.push(i);
      } else if (pages[pages.length - 1] !== '...') {
        pages.push('...');
      }
    }
    
    return pages;
  };

  // Si une seule page, ne pas afficher la pagination
  if (totalPages <= 1) return null;

  const pageNumbers = getPageNumbers();
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 pt-6 border-t border-neutral-200">
      
      {/* Indicateur : "Affichage 1-20 sur 35" */}
      <div className="text-sm text-neutral-600">
        Affichage <span className="font-medium text-neutral-900">{startItem}-{endItem}</span>
        {' '}sur{' '}
        <span className="font-medium text-neutral-900">{totalItems}</span>
        {' '}tâches
      </div>

      {/* Boutons de pagination */}
      <div className="flex items-center gap-2">
        
        {/* Bouton Précédent */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={`
            flex items-center gap-1 px-3 py-2 rounded-lg border text-sm font-medium
            transition-all duration-200
            ${currentPage === 1
              ? 'border-neutral-200 text-neutral-400 cursor-not-allowed'
              : 'border-neutral-300 text-neutral-700 hover:bg-neutral-50 hover:border-neutral-400'
            }
          `}
        >
          <ChevronLeft size={16} />
          <span className="hidden sm:inline">Précédent</span>
        </button>

        {/* Numéros de pages */}
        <div className="flex items-center gap-1">
          {pageNumbers.map((page, index) => (
            page === '...' ? (
              <span 
                key={`ellipsis-${index}`}
                className="px-3 py-2 text-neutral-400"
              >
                ...
              </span>
            ) : (
              <button
                key={page}
                onClick={() => onPageChange(page)}
                className={`
                  min-w-[40px] h-10 px-3 rounded-lg text-sm font-medium
                  transition-all duration-200
                  ${page === currentPage
                    ? 'bg-primary-600 text-white shadow-sm'
                    : 'text-neutral-700 hover:bg-neutral-100'
                  }
                `}
              >
                {page}
              </button>
            )
          ))}
        </div>

        {/* Bouton Suivant */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={`
            flex items-center gap-1 px-3 py-2 rounded-lg border text-sm font-medium
            transition-all duration-200
            ${currentPage === totalPages
              ? 'border-neutral-200 text-neutral-400 cursor-not-allowed'
              : 'border-neutral-300 text-neutral-700 hover:bg-neutral-50 hover:border-neutral-400'
            }
          `}
        >
          <span className="hidden sm:inline">Suivant</span>
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};
