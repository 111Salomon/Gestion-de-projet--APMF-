import { MoreVertical, Users, Clock, Lock } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

/**
 * Carte d'affichage d'un projet avec progression et informations
 * 
 * @param {Object} project - Données du projet
 */
export const ProjectCard = ({ project }) => {
  const isArchived = project.status === 'archived';
  // Détermine la couleur de la barre de progression selon le status
  const getStatusColor = (status) => {
    const colors = {
      active: 'bg-green-500',
      on_hold: 'bg-amber-500',
      completed: 'bg-primary-600',
      archived: 'bg-neutral-400',
      cancelled: 'bg-red-500',
    };
    return colors[status] || 'bg-neutral-300';
  };

  // Formatage de la date de fin
  const formattedDate = project.end_date 
    ? format(new Date(project.end_date), 'dd MMM yyyy', { locale: fr })
    : 'Pas de date';

  return (
    <div className="card group hover:shadow-lg transition-all duration-200 relative">
      {/* Header avec titre et menu */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-lg font-semibold text-neutral-900 group-hover:text-primary-600 transition-colors">
              {project.name}
            </h3>
            {project.status === 'archived' && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-neutral-100 text-neutral-700 rounded-md text-xs font-medium">
                <Lock className="w-3 h-3" />
                Archivé
              </span>
            )}
          </div>
          <p className="text-sm text-neutral-600 line-clamp-2">
            {project.description}
          </p>
        </div>

        {/* Menu options */}
        <button
          className={`p-1 rounded-lg transition-colors ${isArchived ? 'opacity-50 cursor-not-allowed' : 'hover:bg-neutral-100'}`}
          title={isArchived ? 'Projet archivé — restauration requise pour modifier' : 'Options du projet'}
          disabled={isArchived}
          aria-disabled={isArchived}
        >
          <MoreVertical className="w-5 h-5 text-neutral-400" />
        </button>
      </div>

      {/* Barre de progression */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-neutral-600">Progression</span>
          <span className="text-sm font-bold text-neutral-900">{project.progress}%</span>
        </div>
        
        {/* Barre de progression visuelle */}
        <div className="w-full h-2 bg-neutral-200 rounded-full overflow-hidden">
          <div 
            className={`h-full ${getStatusColor(project.status)} transition-all duration-500`}
            style={{ width: `${project.progress}%` }}
          />
        </div>
      </div>

      {/* Footer avec infos et avatars */}
      <div className="flex items-center justify-between pt-4 border-t border-neutral-200">
        {/* Membres du projet (avatars empilés) */}
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-neutral-500" />
          <div className="flex -space-x-2">
            {project.members?.slice(0, 3).map((member, index) => (
              <div
                key={index}
                className="w-8 h-8 rounded-full bg-primary-100 border-2 border-white flex items-center justify-center"
                title={member.name}
              >
                <span className="text-xs font-semibold text-primary-600">
                  {member.name?.charAt(0)}
                </span>
              </div>
            ))}
            {project.members?.length > 3 && (
              <div className="w-8 h-8 rounded-full bg-neutral-200 border-2 border-white flex items-center justify-center">
                <span className="text-xs font-semibold text-neutral-600">
                  +{project.members.length - 3}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Date d'échéance */}
        <div className="flex items-center gap-1 text-neutral-600">
          <Clock className="w-4 h-4" />
          <span className="text-sm">{formattedDate}</span>
        </div>
      </div>

      {/* Overlay si archivé pour empêcher les interactions */}
      {isArchived && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/70 rounded-md pointer-events-auto">
          <div className="flex items-center gap-2 px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-md">
            <Lock className="w-4 h-4 text-neutral-700" />
            <span className="text-sm font-medium text-neutral-700">Projet archivé — restauration requise par un administrateur</span>
          </div>
        </div>
      )}
    </div>
  );
};
