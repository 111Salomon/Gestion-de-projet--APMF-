import { X, Filter, TrendingUp, CheckCircle2, Clock } from 'lucide-react';

export const FilterResults = ({ 
  totalTasks, 
  hasActiveFilters, 
  activeFilters,
  availableProjects,
  onClearFilters 
}) => {
  
  // Si pas de filtres actifs, ne rien afficher
  if (!hasActiveFilters) return null;

  // Labels des statuts
  const statusLabels = {
    todo: 'À faire',
    in_progress: 'En cours',
    in_review: 'En révision',
    done: 'Terminé',
  };

  // Labels des priorités
  const priorityLabels = {
    urgent: 'Urgent',
    high: 'Haute',
    medium: 'Moyenne',
    low: 'Basse',
  };

  // Construire le texte des filtres actifs
  const activeFilterTexts = [];
  
  // Projets
  if (activeFilters.projects?.length > 0) {
    const projectNames = activeFilters.projects
      .map(id => {
        const project = availableProjects.find(p => p.id === id);
        return project?.name;
      })
      .filter(Boolean);
    
    if (projectNames.length > 0) {
      activeFilterTexts.push(...projectNames);
    }
  }

  // Statuts
  if (activeFilters.status?.length > 0) {
    const statusNames = activeFilters.status
      .map(s => statusLabels[s])
      .filter(Boolean);
    activeFilterTexts.push(...statusNames);
  }

  // Priorités
  if (activeFilters.priority?.length > 0) {
    const priorityNames = activeFilters.priority
      .map(p => priorityLabels[p])
      .filter(Boolean);
    activeFilterTexts.push(...priorityNames);
  }

  return (
    <div className="bg-gradient-to-r from-primary-50 to-blue-50 border border-primary-200 rounded-xl p-4 shadow-sm">
      <div className="flex items-center justify-between">
        
        {/* Gauche : Résultats + Filtres */}
        <div className="flex items-center gap-4">
          
          {/* Icône + Nombre de résultats */}
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
              <Filter className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-lg font-bold text-neutral-900">
                {totalTasks} {totalTasks > 1 ? 'tâches trouvées' : 'tâche trouvée'}
              </p>
              <p className="text-xs text-neutral-600">
                Filtres actifs : {activeFilterTexts.length}
              </p>
            </div>
          </div>

          {/* Séparateur */}
          <div className="h-10 w-px bg-neutral-300"></div>

          {/* Liste des filtres actifs */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-neutral-600 uppercase tracking-wide">
              Affichage :
            </span>
            {activeFilterTexts.slice(0, 4).map((text, index) => (
              <span
                key={index}
                className="inline-flex items-center px-3 py-1 bg-white text-primary-700 
                         text-sm font-medium rounded-full border border-primary-200 shadow-sm"
              >
                {text}
              </span>
            ))}
            {activeFilterTexts.length > 4 && (
              <span className="text-sm text-neutral-600 font-medium">
                +{activeFilterTexts.length - 4} autres
              </span>
            )}
          </div>
        </div>

        {/* Droite : Bouton réinitialiser */}
        <button
          onClick={onClearFilters}
          className="flex items-center gap-2 px-4 py-2 bg-white text-red-600 
                   rounded-lg hover:bg-red-50 transition-colors font-medium shadow-sm
                   border border-red-200"
        >
          <X className="w-4 h-4" />
          Réinitialiser les filtres
        </button>
      </div>

      {/* 🆕 BONUS : Statistiques rapides (optionnel) */}
      {totalTasks > 0 && (
        <div className="mt-3 pt-3 border-t border-primary-200 flex items-center gap-6">
          <div className="flex items-center gap-2 text-sm">
            <TrendingUp className="w-4 h-4 text-green-600" />
            <span className="text-neutral-700">
              <span className="font-semibold text-neutral-900">
                {Math.round((totalTasks / 30) * 100)}%
              </span> du mois
            </span>
          </div>
          
          <div className="flex items-center gap-2 text-sm">
            <Clock className="w-4 h-4 text-orange-600" />
            <span className="text-neutral-700">
              Vue calendrier active
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
