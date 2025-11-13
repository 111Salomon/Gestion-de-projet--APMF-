import { CheckCircle2, Clock, AlertCircle, User } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

/**
 * Liste des activités récentes avec timeline
 */
export const RecentActivity = ({ activities }) => {
  // Icône selon le type d'activité
  const getActivityIcon = (type) => {
    const icons = {
      completed: CheckCircle2,
      created: Clock,
      assigned: User,
      updated: AlertCircle,
    };
    return icons[type] || Clock;
  };

  // Couleur selon le type
  const getActivityColor = (type) => {
    const colors = {
      completed: 'bg-green-100 text-green-600',
      created: 'bg-primary-100 text-primary-600',
      assigned: 'bg-amber-100 text-amber-600',
      updated: 'bg-neutral-100 text-neutral-600',
    };
    return colors[type] || 'bg-neutral-100 text-neutral-600';
  };

  return (
    <div className="card">
      <h3 className="text-lg font-semibold text-neutral-900 mb-6">
        Activité Récente
      </h3>

      <div className="space-y-4">
        {activities.map((activity, index) => {
          const Icon = getActivityIcon(activity.type);
          
          return (
            <div key={index} className="flex gap-4">
              {/* Timeline avec icône */}
              <div className="flex flex-col items-center">
                <div className={`p-2 rounded-lg ${getActivityColor(activity.type)}`}>
                  <Icon className="w-4 h-4" />
                </div>
                {/* Ligne de timeline (sauf pour le dernier élément) */}
                {index < activities.length - 1 && (
                  <div className="w-0.5 h-full bg-neutral-200 mt-2" />
                )}
              </div>

              {/* Contenu de l'activité */}
              <div className="flex-1 pb-4">
                <p className="text-sm font-medium text-neutral-900 mb-1">
                  {activity.title}
                </p>
                <p className="text-sm text-neutral-600 mb-2">
                  {activity.description}
                </p>
                <p className="text-xs text-neutral-500">
                  {formatDistanceToNow(new Date(activity.timestamp), {
                    addSuffix: true,
                    locale: fr,
                  })}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
