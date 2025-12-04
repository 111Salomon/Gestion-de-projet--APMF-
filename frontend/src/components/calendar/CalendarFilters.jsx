import { useState, useEffect, useMemo } from 'react';
import { 
  Filter, 
  ChevronDown, 
  X, 
  Search,
  FolderOpen,
  Circle,
  Flag,
  RotateCcw
} from 'lucide-react';
import { calendarAPI } from '../../api/calendar';
import { FilterTag } from './FilterTag';

export const CalendarFilters = ({ currentFilters, onFiltersChange, userRole }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [availableProjects, setAvailableProjects] = useState([]);
  const [localFilters, setLocalFilters] = useState(currentFilters);
  
  // États pour les accordéons
  const [expandedSections, setExpandedSections] = useState({
    projects: true,
    status: false,
    priority: false,
  });

  // États pour les recherches
  const [projectSearch, setProjectSearch] = useState('');
  const [globalSearch, setGlobalSearch] = useState('');

  // Charger les projets disponibles
  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const data = await calendarAPI.getProjects();
      setAvailableProjects(data);
    } catch (error) {
      console.error('❌ Erreur chargement projets:', error);
    }
  };

  // Options de statuts avec icônes et couleurs
  const statusOptions = [
    { value: 'todo', label: 'À faire', icon: Circle, color: 'text-blue-500' },
    { value: 'in_progress', label: 'En cours', icon: Circle, color: 'text-yellow-500' },
    { value: 'in_review', label: 'En révision', icon: Circle, color: 'text-purple-500' },
    { value: 'done', label: 'Terminé', icon: Circle, color: 'text-green-500' },
  ];

  // Options de priorités avec icônes et couleurs
  const priorityOptions = [
    { value: 'urgent', label: 'Urgent', icon: Flag, color: 'text-red-500' },
    { value: 'high', label: 'Haute', icon: Flag, color: 'text-orange-500' },
    { value: 'medium', label: 'Moyenne', icon: Flag, color: 'text-yellow-500' },
    { value: 'low', label: 'Basse', icon: Flag, color: 'text-green-500' },
  ];

  // 🆕 CORRIGÉ - Filtrer les projets selon recherche globale OU recherche locale
  const filteredProjects = useMemo(() => {
    const searchTerm = (globalSearch || projectSearch).toLowerCase();
    if (!searchTerm) return availableProjects;
    
    return availableProjects.filter(p => 
      p.name.toLowerCase().includes(searchTerm)
    );
  }, [availableProjects, projectSearch, globalSearch]);

  // 🆕 AJOUTÉ - Filtrer les statuts selon recherche globale
  const filteredStatuses = useMemo(() => {
    if (!globalSearch) return statusOptions;
    
    const searchTerm = globalSearch.toLowerCase();
    return statusOptions.filter(s => 
      s.label.toLowerCase().includes(searchTerm) ||
      s.value.toLowerCase().includes(searchTerm)
    );
  }, [globalSearch]);

  // 🆕 AJOUTÉ - Filtrer les priorités selon recherche globale
  const filteredPriorities = useMemo(() => {
    if (!globalSearch) return priorityOptions;
    
    const searchTerm = globalSearch.toLowerCase();
    return priorityOptions.filter(p => 
      p.label.toLowerCase().includes(searchTerm) ||
      p.value.toLowerCase().includes(searchTerm)
    );
  }, [globalSearch]);

  // 🆕 AJOUTÉ - Auto-expand sections avec résultats
  useEffect(() => {
    if (globalSearch) {
      setExpandedSections({
        projects: filteredProjects.length > 0,
        status: filteredStatuses.length > 0,
        priority: filteredPriorities.length > 0,
      });
    }
  }, [globalSearch, filteredProjects.length, filteredStatuses.length, filteredPriorities.length]);

  // Toggle section accordéon
  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Toggle projet
  const toggleProject = (projectId) => {
    const current = localFilters.projects || [];
    const updated = current.includes(projectId)
      ? current.filter(id => id !== projectId)
      : [...current, projectId];
    
    setLocalFilters({ ...localFilters, projects: updated });
  };

  // Toggle statut
  const toggleStatus = (status) => {
    const current = localFilters.status || [];
    const updated = current.includes(status)
      ? current.filter(s => s !== status)
      : [...current, status];
    
    setLocalFilters({ ...localFilters, status: updated });
  };

  // Toggle priorité
  const togglePriority = (priority) => {
    const current = localFilters.priority || [];
    const updated = current.includes(priority)
      ? current.filter(p => p !== priority)
      : [...current, priority];
    
    setLocalFilters({ ...localFilters, priority: updated });
  };

  // Appliquer les filtres
  const applyFilters = () => {
    onFiltersChange(localFilters);
    setIsOpen(false);
  };

  // Réinitialiser
  const resetFilters = () => {
    const emptyFilters = { projects: [], status: [], priority: [] };
    setLocalFilters(emptyFilters);
    onFiltersChange(emptyFilters);
    setGlobalSearch('');
    setProjectSearch('');
  };

  // Compter les filtres actifs par section
  const getActiveCount = (section) => {
    return localFilters[section]?.length || 0;
  };

  // Compter total des filtres actifs
  const activeFiltersCount = 
    (currentFilters.projects?.length || 0) +
    (currentFilters.status?.length || 0) +
    (currentFilters.priority?.length || 0);

  // Effacer une section
  const clearSection = (section) => {
    setLocalFilters({ ...localFilters, [section]: [] });
  };

  // Retirer un filtre spécifique
  const removeProjectFilter = (projectId) => {
    const updated = currentFilters.projects.filter(id => id !== projectId);
    onFiltersChange({ ...currentFilters, projects: updated });
  };

  const removeStatusFilter = (status) => {
    const updated = currentFilters.status.filter(s => s !== status);
    onFiltersChange({ ...currentFilters, status: updated });
  };

  const removePriorityFilter = (priority) => {
    const updated = currentFilters.priority.filter(p => p !== priority);
    onFiltersChange({ ...currentFilters, priority: updated });
  };

  return (
    <div className="space-y-3">
      
      {/* Bouton toggle */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`
            flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium
            transition-all duration-200 border
            ${isOpen 
              ? 'bg-primary-50 border-primary-300 text-primary-700' 
              : 'bg-white border-neutral-200 text-neutral-700 hover:border-neutral-300'
            }
          `}
        >
          <Filter className="w-4 h-4" />
          <span>Filtres</span>
          {activeFiltersCount > 0 && (
            <span className="ml-1 px-2 py-0.5 bg-primary-600 text-white text-xs font-bold rounded-full">
              {activeFiltersCount}
            </span>
          )}
          <ChevronDown 
            className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          />
        </button>

        {/* Bouton réinitialiser rapide */}
        {activeFiltersCount > 0 && (
          <button
            onClick={resetFilters}
            className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 
                     hover:bg-red-50 rounded-lg transition-colors font-medium"
          >
            <RotateCcw className="w-4 h-4" />
            Réinitialiser
          </button>
        )}
      </div>

      {/* Tags des filtres actifs */}
      {activeFiltersCount > 0 && !isOpen && (
        <div className="flex flex-wrap gap-2 items-center bg-neutral-50 p-3 rounded-lg border border-neutral-200">
          <span className="text-xs text-neutral-500 font-semibold uppercase tracking-wide">
            Actifs :
          </span>
          
          {/* Tags projets */}
          {currentFilters.projects?.map(projectId => {
            const project = availableProjects.find(p => p.id === projectId);
            return project ? (
              <FilterTag
                key={`project-${projectId}`}
                label={project.name}
                icon={FolderOpen}
                color="blue"
                onRemove={() => removeProjectFilter(projectId)}
              />
            ) : null;
          })}

          {/* Tags statuts */}
          {currentFilters.status?.map(status => {
            const statusOption = statusOptions.find(s => s.value === status);
            return statusOption ? (
              <FilterTag
                key={`status-${status}`}
                label={statusOption.label}
                icon={statusOption.icon}
                color="yellow"
                onRemove={() => removeStatusFilter(status)}
              />
            ) : null;
          })}

          {/* Tags priorités */}
          {currentFilters.priority?.map(priority => {
            const priorityOption = priorityOptions.find(p => p.value === priority);
            return priorityOption ? (
              <FilterTag
                key={`priority-${priority}`}
                label={priorityOption.label}
                icon={priorityOption.icon}
                color="red"
                onRemove={() => removePriorityFilter(priority)}
              />
            ) : null;
          })}
        </div>
      )}

      {/* Panel des filtres */}
      {isOpen && (
        <div className="bg-white border border-neutral-200 rounded-xl shadow-lg animate-fadeIn overflow-hidden">
          
          {/* Header sticky */}
          <div className="sticky top-0 bg-white border-b border-neutral-200 p-4 z-10">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-neutral-900 flex items-center gap-2">
                <Filter className="w-5 h-5 text-primary-600" />
                Filtrer les tâches
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-neutral-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-neutral-500" />
              </button>
            </div>

            {/* 🆕 CORRIGÉ - Recherche globale fonctionnelle */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                type="text"
                placeholder="Rechercher dans les filtres..."
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-neutral-200 rounded-lg
                         focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
                         text-sm"
              />
              {/* 🆕 AJOUTÉ - Bouton clear recherche */}
              {globalSearch && (
                <button
                  onClick={() => setGlobalSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-neutral-100 rounded"
                >
                  <X className="w-3.5 h-3.5 text-neutral-400" />
                </button>
              )}
            </div>

            {/* 🆕 AJOUTÉ - Compteur de résultats */}
            {globalSearch && (
              <p className="text-xs text-neutral-600 mt-2">
                {filteredProjects.length + filteredStatuses.length + filteredPriorities.length} résultat(s) trouvé(s)
              </p>
            )}
          </div>

          {/* Contenu scrollable */}
          <div className="max-h-[500px] overflow-y-auto p-4 space-y-3">
            
            {/* Section Projets */}
            {(filteredProjects.length > 0 || !globalSearch) && (
              <div className="border border-neutral-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleSection('projects')}
                  className="w-full flex items-center justify-between p-3 hover:bg-neutral-50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <FolderOpen className="w-4 h-4 text-neutral-600" />
                    <span className="font-semibold text-neutral-900">Projets</span>
                    {getActiveCount('projects') > 0 && (
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-bold rounded-full">
                        {getActiveCount('projects')}
                      </span>
                    )}
                    {/* 🆕 AJOUTÉ - Nombre de résultats filtrés */}
                    {globalSearch && filteredProjects.length > 0 && (
                      <span className="text-xs text-neutral-500">
                        ({filteredProjects.length})
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {getActiveCount('projects') > 0 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          clearSection('projects');
                        }}
                        className="text-xs text-red-600 hover:text-red-700 font-medium"
                      >
                        Effacer
                      </button>
                    )}
                    <ChevronDown 
                      className={`w-4 h-4 text-neutral-500 transition-transform ${
                        expandedSections.projects ? 'rotate-180' : ''
                      }`}
                    />
                  </div>
                </button>

                {expandedSections.projects && (
                  <div className="p-3 pt-0 space-y-2 border-t border-neutral-100">
                    {/* Recherche projets (masquée si recherche globale active) */}
                    {!globalSearch && (
                      <div className="relative">
                        <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400" />
                        <input
                          type="text"
                          placeholder="Rechercher projet..."
                          value={projectSearch}
                          onChange={(e) => setProjectSearch(e.target.value)}
                          className="w-full pl-8 pr-3 py-1.5 text-sm border border-neutral-200 rounded
                                   focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                        {projectSearch && (
                          <button
                            onClick={() => setProjectSearch('')}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5"
                          >
                            <X className="w-3 h-3 text-neutral-400" />
                          </button>
                        )}
                      </div>
                    )}

                    {/* Liste projets */}
                    <div className="space-y-1 max-h-48 overflow-y-auto">
                      {filteredProjects.length > 0 ? (
                        filteredProjects.map(project => (
                          <label
                            key={project.id}
                            className="flex items-center gap-2 p-2 hover:bg-neutral-50 rounded cursor-pointer group"
                          >
                            <input
                              type="checkbox"
                              checked={localFilters.projects?.includes(project.id) || false}
                              onChange={() => toggleProject(project.id)}
                              className="w-4 h-4 text-primary-600 rounded border-neutral-300 
                                       focus:ring-2 focus:ring-primary-500"
                            />
                            <span className="text-sm text-neutral-700 group-hover:text-neutral-900">
                              {project.name}
                            </span>
                          </label>
                        ))
                      ) : (
                        <p className="text-sm text-neutral-500 text-center py-4">
                          Aucun projet trouvé
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Section Statuts */}
            {(filteredStatuses.length > 0 || !globalSearch) && (
              <div className="border border-neutral-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleSection('status')}
                  className="w-full flex items-center justify-between p-3 hover:bg-neutral-50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Circle className="w-4 h-4 text-neutral-600" />
                    <span className="font-semibold text-neutral-900">Statuts</span>
                    {getActiveCount('status') > 0 && (
                      <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs font-bold rounded-full">
                        {getActiveCount('status')}
                      </span>
                    )}
                    {/* 🆕 AJOUTÉ */}
                    {globalSearch && filteredStatuses.length > 0 && (
                      <span className="text-xs text-neutral-500">
                        ({filteredStatuses.length})
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {getActiveCount('status') > 0 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          clearSection('status');
                        }}
                        className="text-xs text-red-600 hover:text-red-700 font-medium"
                      >
                        Effacer
                      </button>
                    )}
                    <ChevronDown 
                      className={`w-4 h-4 text-neutral-500 transition-transform ${
                        expandedSections.status ? 'rotate-180' : ''
                      }`}
                    />
                  </div>
                </button>

                {expandedSections.status && (
                  <div className="p-3 pt-0 space-y-1 border-t border-neutral-100">
                    {filteredStatuses.map(option => {
                      const Icon = option.icon;
                      return (
                        <label
                          key={option.value}
                          className="flex items-center gap-2 p-2 hover:bg-neutral-50 rounded cursor-pointer group"
                        >
                          <input
                            type="checkbox"
                            checked={localFilters.status?.includes(option.value) || false}
                            onChange={() => toggleStatus(option.value)}
                            className="w-4 h-4 text-primary-600 rounded border-neutral-300"
                          />
                          <Icon className={`w-4 h-4 ${option.color}`} />
                          <span className="text-sm text-neutral-700 group-hover:text-neutral-900">
                            {option.label}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Section Priorités */}
            {(filteredPriorities.length > 0 || !globalSearch) && (
              <div className="border border-neutral-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleSection('priority')}
                  className="w-full flex items-center justify-between p-3 hover:bg-neutral-50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Flag className="w-4 h-4 text-neutral-600" />
                    <span className="font-semibold text-neutral-900">Priorités</span>
                    {getActiveCount('priority') > 0 && (
                      <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-bold rounded-full">
                        {getActiveCount('priority')}
                      </span>
                    )}
                    {/* 🆕 AJOUTÉ */}
                    {globalSearch && filteredPriorities.length > 0 && (
                      <span className="text-xs text-neutral-500">
                        ({filteredPriorities.length})
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {getActiveCount('priority') > 0 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          clearSection('priority');
                        }}
                        className="text-xs text-red-600 hover:text-red-700 font-medium"
                      >
                        Effacer
                      </button>
                    )}
                    <ChevronDown 
                      className={`w-4 h-4 text-neutral-500 transition-transform ${
                        expandedSections.priority ? 'rotate-180' : ''
                      }`}
                    />
                  </div>
                </button>

                {expandedSections.priority && (
                  <div className="p-3 pt-0 space-y-1 border-t border-neutral-100">
                    {filteredPriorities.map(option => {
                      const Icon = option.icon;
                      return (
                        <label
                          key={option.value}
                          className="flex items-center gap-2 p-2 hover:bg-neutral-50 rounded cursor-pointer group"
                        >
                          <input
                            type="checkbox"
                            checked={localFilters.priority?.includes(option.value) || false}
                            onChange={() => togglePriority(option.value)}
                            className="w-4 h-4 text-primary-600 rounded border-neutral-300"
                          />
                          <Icon className={`w-4 h-4 ${option.color}`} />
                          <span className="text-sm text-neutral-700 group-hover:text-neutral-900">
                            {option.label}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* 🆕 AJOUTÉ - Message si aucun résultat */}
            {globalSearch && 
             filteredProjects.length === 0 && 
             filteredStatuses.length === 0 && 
             filteredPriorities.length === 0 && (
              <div className="text-center py-8">
                <Search className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
                <p className="text-neutral-600 font-medium">Aucun résultat trouvé</p>
                <p className="text-sm text-neutral-500 mt-1">
                  Essayez avec d'autres termes de recherche
                </p>
              </div>
            )}

          </div>

          {/* Footer sticky */}
          <div className="sticky bottom-0 bg-white border-t border-neutral-200 p-4 flex gap-2">
            <button
              onClick={applyFilters}
              className="flex-1 px-4 py-2.5 bg-primary-600 text-white rounded-lg 
                       hover:bg-primary-700 transition-colors font-semibold shadow-sm"
            >
              Appliquer les filtres
            </button>
            <button
              onClick={() => {
                setLocalFilters(currentFilters);
                setIsOpen(false);
              }}
              className="px-4 py-2.5 bg-neutral-100 text-neutral-700 rounded-lg 
                       hover:bg-neutral-200 transition-colors font-medium"
            >
              Annuler
            </button>
          </div>

        </div>
      )}
    </div>
  );
};
