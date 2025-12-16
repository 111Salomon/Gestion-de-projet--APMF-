/**
 * ═══════════════════════════════════════════════════════════════
 * CALENDAR FILTERS - VERSION LÉGÈRE (LOGIQUE PRÉSERVÉE)
 * ═══════════════════════════════════════════════════════════════
 * 
 * ✅ Changements UNIQUEMENT visuels :
 * - primary-600 → orange-500
 * - Couleurs douces et aérées
 * - Padding généreux
 * - Bordures arrondies
 * 
 * ⚠️ AUCUNE logique modifiée (accordéons, recherche, tags, etc.)
 */

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

  // Filtrer les projets selon recherche globale OU recherche locale
  const filteredProjects = useMemo(() => {
    const searchTerm = (globalSearch || projectSearch).toLowerCase();
    if (!searchTerm) return availableProjects;
    
    return availableProjects.filter(p => 
      p.name.toLowerCase().includes(searchTerm)
    );
  }, [availableProjects, projectSearch, globalSearch]);

  // Filtrer les statuts selon recherche globale
  const filteredStatuses = useMemo(() => {
    if (!globalSearch) return statusOptions;
    
    const searchTerm = globalSearch.toLowerCase();
    return statusOptions.filter(s => 
      s.label.toLowerCase().includes(searchTerm) ||
      s.value.toLowerCase().includes(searchTerm)
    );
  }, [globalSearch]);

  // Filtrer les priorités selon recherche globale
  const filteredPriorities = useMemo(() => {
    if (!globalSearch) return priorityOptions;
    
    const searchTerm = globalSearch.toLowerCase();
    return priorityOptions.filter(p => 
      p.label.toLowerCase().includes(searchTerm) ||
      p.value.toLowerCase().includes(searchTerm)
    );
  }, [globalSearch]);

  // Auto-expand sections avec résultats
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
      
      {/* ✨ BOUTON TOGGLE - COULEURS ORANGE */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`
            flex items-center gap-2.5 px-4 py-2.5 rounded-xl font-medium text-sm
            transition-all duration-200 border shadow-sm hover:shadow-md
            ${isOpen 
              ? 'bg-orange-50 border-orange-200 text-orange-700' 
              : 'bg-white border-neutral-200 text-neutral-700 hover:border-neutral-300 hover:bg-neutral-50'
            }
            focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2
          `}
        >
          <Filter className={`w-4 h-4 ${isOpen ? 'text-orange-500' : 'text-neutral-500'}`} 
                  strokeWidth={2.5} />
          <span>Filtres</span>
          {activeFiltersCount > 0 && (
            <span className="ml-1 px-2 py-0.5 bg-orange-500 text-white text-xs font-bold rounded-full
                           animate-pulse">
              {activeFiltersCount}
            </span>
          )}
          <ChevronDown 
            className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
            strokeWidth={2.5}
          />
        </button>

        {/* Bouton réinitialiser rapide */}
        {activeFiltersCount > 0 && (
          <button
            onClick={resetFilters}
            className="flex items-center gap-2 px-3 py-2.5 text-sm text-red-600 
                     hover:bg-red-50 rounded-xl transition-all duration-200 font-medium
                     border-2 border-transparent hover:border-red-200
                     focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          >
            <RotateCcw className="w-4 h-4" strokeWidth={2.5} />
            Réinitialiser
          </button>
        )}
      </div>

      {/* ✨ TAGS DES FILTRES ACTIFS - AÉRÉ */}
      {activeFiltersCount > 0 && !isOpen && (
        <div className="flex flex-wrap gap-2 items-center bg-orange-50/50 p-4 rounded-xl 
                      border-2 border-orange-100">
          <span className="text-xs text-neutral-600 font-bold uppercase tracking-wide">
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

      {/* ✨ PANEL DES FILTRES - AÉRÉ */}
      {isOpen && (
        <div className="bg-white border-2 border-neutral-200 rounded-xl shadow-2xl 
                      animate-fadeIn overflow-hidden">
          
          {/* Header sticky */}
          <div className="sticky top-0 bg-white border-b-2 border-neutral-200 p-5 z-10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-neutral-900 flex items-center gap-2.5">
                <Filter className="w-5 h-5 text-orange-500" strokeWidth={2.5} />
                Filtrer les tâches
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-neutral-100 rounded-lg transition-colors
                         focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <X className="w-5 h-5 text-neutral-500" strokeWidth={2.5} />
              </button>
            </div>

            {/* Recherche globale */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" 
                      strokeWidth={2.5} />
              <input
                type="text"
                placeholder="Rechercher dans les filtres..."
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 border-2 border-neutral-200 rounded-xl
                         focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-300
                         text-sm transition-all duration-200"
              />
              {globalSearch && (
                <button
                  onClick={() => setGlobalSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-neutral-100 
                           rounded-full transition-colors"
                >
                  <X className="w-3.5 h-3.5 text-neutral-400" strokeWidth={2.5} />
                </button>
              )}
            </div>

            {/* Compteur de résultats */}
            {globalSearch && (
              <p className="text-xs text-neutral-600 mt-2 font-medium">
                {filteredProjects.length + filteredStatuses.length + filteredPriorities.length} résultat(s) trouvé(s)
              </p>
            )}
          </div>

          {/* ✨ CONTENU SCROLLABLE - SPACING GÉNÉREUX */}
          <div className="max-h-[500px] overflow-y-auto p-5 space-y-3">
            
            {/* Section Projets */}
            {(filteredProjects.length > 0 || !globalSearch) && (
              <div className="border-2 border-neutral-200 rounded-xl overflow-hidden">
                <button
                  onClick={() => toggleSection('projects')}
                  className="w-full flex items-center justify-between p-3.5 hover:bg-orange-50 
                           transition-colors duration-200"
                >
                  <div className="flex items-center gap-2.5">
                    <FolderOpen className="w-4 h-4 text-neutral-600" strokeWidth={2.5} />
                    <span className="font-bold text-neutral-900">Projets</span>
                    {getActiveCount('projects') > 0 && (
                      <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs font-bold 
                                   rounded-full ring-1 ring-orange-200">
                        {getActiveCount('projects')}
                      </span>
                    )}
                    {globalSearch && filteredProjects.length > 0 && (
                      <span className="text-xs text-neutral-500 font-medium">
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
                        className="text-xs text-red-600 hover:text-red-700 font-bold hover:underline"
                      >
                        Effacer
                      </button>
                    )}
                    <ChevronDown 
                      className={`w-4 h-4 text-neutral-500 transition-transform duration-200 ${
                        expandedSections.projects ? 'rotate-180' : ''
                      }`}
                      strokeWidth={2.5}
                    />
                  </div>
                </button>

                {expandedSections.projects && (
                  <div className="p-3.5 pt-0 space-y-2.5 border-t-2 border-neutral-100">
                    {/* Recherche projets */}
                    {!globalSearch && (
                      <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400" 
                                strokeWidth={2.5} />
                        <input
                          type="text"
                          placeholder="Rechercher projet..."
                          value={projectSearch}
                          onChange={(e) => setProjectSearch(e.target.value)}
                          className="w-full pl-9 pr-9 py-2 text-sm border-2 border-neutral-200 rounded-lg
                                   focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-300
                                   transition-all duration-200"
                        />
                        {projectSearch && (
                          <button
                            onClick={() => setProjectSearch('')}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 hover:bg-neutral-100 
                                     rounded-full"
                          >
                            <X className="w-3 h-3 text-neutral-400" strokeWidth={2.5} />
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
                            className="flex items-center gap-2.5 p-2.5 hover:bg-orange-50 rounded-lg 
                                     cursor-pointer group transition-colors border-2 border-transparent 
                                     hover:border-orange-200"
                          >
                            <input
                              type="checkbox"
                              checked={localFilters.projects?.includes(project.id) || false}
                              onChange={() => toggleProject(project.id)}
                              className="w-4 h-4 text-orange-500 rounded border-2 border-neutral-300 
                                       focus:ring-2 focus:ring-orange-500 cursor-pointer"
                            />
                            <span className="text-sm text-neutral-700 group-hover:text-neutral-900 font-medium">
                              {project.name}
                            </span>
                          </label>
                        ))
                      ) : (
                        <p className="text-sm text-neutral-500 text-center py-6">
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
              <div className="border-2 border-neutral-200 rounded-xl overflow-hidden">
                <button
                  onClick={() => toggleSection('status')}
                  className="w-full flex items-center justify-between p-3.5 hover:bg-orange-50 
                           transition-colors duration-200"
                >
                  <div className="flex items-center gap-2.5">
                    <Circle className="w-4 h-4 text-neutral-600" strokeWidth={2.5} />
                    <span className="font-bold text-neutral-900">Statuts</span>
                    {getActiveCount('status') > 0 && (
                      <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs font-bold 
                                   rounded-full ring-1 ring-orange-200">
                        {getActiveCount('status')}
                      </span>
                    )}
                    {globalSearch && filteredStatuses.length > 0 && (
                      <span className="text-xs text-neutral-500 font-medium">
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
                        className="text-xs text-red-600 hover:text-red-700 font-bold hover:underline"
                      >
                        Effacer
                      </button>
                    )}
                    <ChevronDown 
                      className={`w-4 h-4 text-neutral-500 transition-transform duration-200 ${
                        expandedSections.status ? 'rotate-180' : ''
                      }`}
                      strokeWidth={2.5}
                    />
                  </div>
                </button>

                {expandedSections.status && (
                  <div className="p-3.5 pt-0 space-y-1 border-t-2 border-neutral-100">
                    {filteredStatuses.map(option => {
                      const Icon = option.icon;
                      return (
                        <label
                          key={option.value}
                          className="flex items-center gap-2.5 p-2.5 hover:bg-orange-50 rounded-lg 
                                   cursor-pointer group transition-colors border-2 border-transparent 
                                   hover:border-orange-200"
                        >
                          <input
                            type="checkbox"
                            checked={localFilters.status?.includes(option.value) || false}
                            onChange={() => toggleStatus(option.value)}
                            className="w-4 h-4 text-orange-500 rounded border-2 border-neutral-300 
                                     focus:ring-2 focus:ring-orange-500 cursor-pointer"
                          />
                          <Icon className={`w-4 h-4 ${option.color}`} strokeWidth={2.5} />
                          <span className="text-sm text-neutral-700 group-hover:text-neutral-900 font-medium">
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
              <div className="border-2 border-neutral-200 rounded-xl overflow-hidden">
                <button
                  onClick={() => toggleSection('priority')}
                  className="w-full flex items-center justify-between p-3.5 hover:bg-orange-50 
                           transition-colors duration-200"
                >
                  <div className="flex items-center gap-2.5">
                    <Flag className="w-4 h-4 text-neutral-600" strokeWidth={2.5} />
                    <span className="font-bold text-neutral-900">Priorités</span>
                    {getActiveCount('priority') > 0 && (
                      <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs font-bold 
                                   rounded-full ring-1 ring-orange-200">
                        {getActiveCount('priority')}
                      </span>
                    )}
                    {globalSearch && filteredPriorities.length > 0 && (
                      <span className="text-xs text-neutral-500 font-medium">
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
                        className="text-xs text-red-600 hover:text-red-700 font-bold hover:underline"
                      >
                        Effacer
                      </button>
                    )}
                    <ChevronDown 
                      className={`w-4 h-4 text-neutral-500 transition-transform duration-200 ${
                        expandedSections.priority ? 'rotate-180' : ''
                      }`}
                      strokeWidth={2.5}
                    />
                  </div>
                </button>

                {expandedSections.priority && (
                  <div className="p-3.5 pt-0 space-y-1 border-t-2 border-neutral-100">
                    {filteredPriorities.map(option => {
                      const Icon = option.icon;
                      return (
                        <label
                          key={option.value}
                          className="flex items-center gap-2.5 p-2.5 hover:bg-orange-50 rounded-lg 
                                   cursor-pointer group transition-colors border-2 border-transparent 
                                   hover:border-orange-200"
                        >
                          <input
                            type="checkbox"
                            checked={localFilters.priority?.includes(option.value) || false}
                            onChange={() => togglePriority(option.value)}
                            className="w-4 h-4 text-orange-500 rounded border-2 border-neutral-300 
                                     focus:ring-2 focus:ring-orange-500 cursor-pointer"
                          />
                          <Icon className={`w-4 h-4 ${option.color}`} strokeWidth={2.5} />
                          <span className="text-sm text-neutral-700 group-hover:text-neutral-900 font-medium">
                            {option.label}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Message si aucun résultat */}
            {globalSearch && 
             filteredProjects.length === 0 && 
             filteredStatuses.length === 0 && 
             filteredPriorities.length === 0 && (
              <div className="text-center py-10">
                <Search className="w-12 h-12 text-neutral-300 mx-auto mb-3" strokeWidth={1.5} />
                <p className="text-neutral-600 font-semibold">Aucun résultat trouvé</p>
                <p className="text-sm text-neutral-500 mt-1">
                  Essayez avec d'autres termes de recherche
                </p>
              </div>
            )}

          </div>

          {/* ✨ FOOTER STICKY - BOUTONS ORANGE */}
          <div className="sticky bottom-0 bg-white border-t-2 border-neutral-200 p-5 flex gap-3">
            <button
              onClick={applyFilters}
              className="flex-1 px-4 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white 
                       rounded-xl hover:shadow-lg hover:shadow-orange-500/30 
                       transition-all duration-300 font-bold shadow-sm
                       hover:scale-105 active:scale-95
                       focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
            >
              Appliquer les filtres
            </button>
            <button
              onClick={() => {
                setLocalFilters(currentFilters);
                setIsOpen(false);
              }}
              className="px-4 py-2.5 bg-neutral-100 text-neutral-700 rounded-xl 
                       hover:bg-neutral-200 transition-all duration-200 font-semibold
                       border-2 border-transparent hover:border-neutral-300
                       focus:outline-none focus:ring-2 focus:ring-neutral-500 focus:ring-offset-2"
            >
              Annuler
            </button>
          </div>

        </div>
      )}
    </div>
  );
};
