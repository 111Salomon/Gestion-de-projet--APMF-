/**
 * ═══════════════════════════════════════════════════════════
 * COMPOSANT PAGINATION - Style Premium Minimaliste
 * ═══════════════════════════════════════════════════════════
 * 
 * Design cohérent avec le thème Orange/Noir/Blanc
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
    <div className="mt-8">
      {/* Container avec background subtle */}
      <div>
        
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          
          {/* 📊 Indicateur : "Affichage 1-20 sur 37" */}
          <div className="flex items-center gap-2 text-sm">
            <span className="text-neutral-600">Affichage</span>
            <span className="px-2.5 py-1 bg-orange-100 text-orange-700 font-semibold rounded-lg">
              {startItem}-{endItem}
            </span>
            <span className="text-neutral-600">sur</span>
            <span className="px-2.5 py-1 bg-neutral-100 text-neutral-900 font-semibold rounded-lg">
              {totalItems}
            </span>
            <span className="text-neutral-600">tâches</span>
          </div>

          {/* 🎯 Boutons de pagination */}
          <div className="flex items-center gap-2">
            
            {/* Bouton Précédent */}
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className={`
                flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 text-sm font-semibold
                transition-all duration-300
                ${currentPage === 1
                  ? 'border-neutral-200 text-neutral-300 cursor-not-allowed bg-neutral-50'
                  : 'border-neutral-200 text-neutral-700 hover:border-neutral-900 hover:text-neutral-900 hover:bg-neutral-50'
                }
              `}
            >
              <ChevronLeft className="w-4 h-4" strokeWidth={2.5} />
              <span className="hidden sm:inline">Précédent</span>
            </button>

            {/* Numéros de pages */}
            <div className="flex items-center gap-1.5">
              {pageNumbers.map((page, index) => (
                page === '...' ? (
                  <span 
                    key={`ellipsis-${index}`}
                    className="px-3 py-2 text-neutral-400 font-medium"
                  >
                    ...
                  </span>
                ) : (
                  <button
                    key={page}
                    onClick={() => onPageChange(page)}
                    className={`
                      min-w-[44px] h-11 px-4 rounded-xl text-sm font-bold
                      transition-all duration-300
                      ${page === currentPage
                        ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md shadow-orange-500/30 scale-105'
                        : 'text-neutral-700 hover:bg-neutral-100 hover:scale-105 border-2 border-transparent hover:border-neutral-200'
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
                flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 text-sm font-semibold
                transition-all duration-300
                ${currentPage === totalPages
                  ? 'border-neutral-200 text-neutral-300 cursor-not-allowed bg-neutral-50'
                  : 'border-neutral-200 text-neutral-700 hover:border-neutral-900 hover:text-neutral-900 hover:bg-neutral-50'
                }
              `}
            >
              <span className="hidden sm:inline">Suivant</span>
              <ChevronRight className="w-4 h-4" strokeWidth={2.5} />
            </button>
          </div>
        </div>

        {/* 📍 Indicateur visuel de progression */}
        {/* <div className="mt-4 pt-4 border-t border-neutral-100">
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-neutral-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-orange-500 to-orange-600 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${(currentPage / totalPages) * 100}%` }}
              />
            </div>
            <span className="text-xs font-semibold text-neutral-500 min-w-[60px] text-right">
              {currentPage}/{totalPages}
            </span>
          </div>
        </div> */}
      </div>
    </div>
  );
};
