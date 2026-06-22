// import { CheckCircle2, Clock, AlertCircle, User } from 'lucide-react';
// import { formatDistanceToNow } from 'date-fns';
// import { fr } from 'date-fns/locale';

// /**
//  * Liste des activités récentes avec timeline
//  */
// export const RecentActivity = ({ activities }) => {
//   // Icône selon le type d'activité
//   const getActivityIcon = (type) => {
//     const icons = {
//       completed: CheckCircle2,
//       created: Clock,
//       assigned: User,
//       updated: AlertCircle,
//     };
//     return icons[type] || Clock;
//   };

//   // Couleur selon le type
//   const getActivityColor = (type) => {
//     const colors = {
//       completed: 'bg-green-100 text-green-600',
//       created: 'bg-primary-100 text-primary-600',
//       assigned: 'bg-amber-100 text-amber-600',
//       updated: 'bg-neutral-100 text-neutral-600',
//     };
//     return colors[type] || 'bg-neutral-100 text-neutral-600';
//   };

//   return (
//     <div className="card">
//       <h3 className="text-lg font-semibold text-neutral-900 mb-6">
//         Activité Récente
//       </h3>

//       <div className="space-y-4">
//         {activities.map((activity, index) => {
//           const Icon = getActivityIcon(activity.type);
          
//           return (
//             <div key={index} className="flex gap-4">
//               {/* Timeline avec icône */}
//               <div className="flex flex-col items-center">
//                 <div className={`p-2 rounded-lg ${getActivityColor(activity.type)}`}>
//                   <Icon className="w-4 h-4" />
//                 </div>
//                 {/* Ligne de timeline (sauf pour le dernier élément) */}
//                 {index < activities.length - 1 && (
//                   <div className="w-0.5 h-full bg-neutral-200 mt-2" />
//                 )}
//               </div>

//               {/* Contenu de l'activité */}
//               <div className="flex-1 pb-4">
//                 <p className="text-sm font-medium text-neutral-900 mb-1">
//                   {activity.title}
//                 </p>
//                 <p className="text-sm text-neutral-600 mb-2">
//                   {activity.description}
//                 </p>
//                 <p className="text-xs text-neutral-500">
//                   {formatDistanceToNow(new Date(activity.timestamp), {
//                     addSuffix: true,
//                     locale: fr,
//                   })}
//                 </p>
//               </div>
//             </div>
//           );
//         })}
//       </div>
//     </div>
//   );
// };





//--------------------------------------------------------------------------------------------------------------
// import { CheckCircle, FolderPlus, UserPlus, TrendingUp, Clock } from 'lucide-react';

// /**
//  * 📋 Composant d'affichage des activités récentes
//  */
// export const RecentActivity = ({ activities }) => {
//   // Si pas d'activités
//   if (!activities || activities.length === 0) {
//     return (
//       <div className="text-neutral-500 text-center py-8">
//         Aucune activité récente
//       </div>
//     );
//   }

//   /**
//    * 🎨 Retourne l'icône selon le type d'activité
//    */
//   const getIcon = (type) => {
//     switch (type) {
//       case 'completed':
//         return <CheckCircle className="w-5 h-5 text-green-500" />;
//       case 'created':
//         return <FolderPlus className="w-5 h-5 text-blue-500" />;
//       case 'assigned':
//         return <UserPlus className="w-5 h-5 text-purple-500" />;
//       case 'updated':
//         return <TrendingUp className="w-5 h-5 text-amber-500" />;
//       default:
//         return <Clock className="w-5 h-5 text-neutral-500" />;
//     }
//   };

//   /**
//    * ⏰ Formate le timestamp en texte lisible
//    */
//   const formatTime = (timestamp) => {
//     const date = new Date(timestamp);
//     const now = new Date();
//     const diff = Math.floor((now - date) / 1000); // Différence en secondes

//     if (diff < 60) return 'À l\'instant';
//     if (diff < 3600) return `Il y a ${Math.floor(diff / 60)} min`;
//     if (diff < 86400) return `Il y a ${Math.floor(diff / 3600)}h`;
//     if (diff < 604800) return `Il y a ${Math.floor(diff / 86400)}j`;
    
//     // Si plus vieux, afficher la date
//     return date.toLocaleDateString('fr-FR', { 
//       day: 'numeric', 
//       month: 'short' 
//     });
//   };

//   return (
//     <div className="space-y-4">
//       {activities.map((activity, index) => (
//         <div
//           key={index}
//           className="flex items-start gap-4 p-4 bg-neutral-50 rounded-lg hover:bg-neutral-100 transition-colors"
//         >
//           {/* Icône */}
//           <div className="flex-shrink-0 mt-1">
//             {getIcon(activity.type)}
//           </div>

//           {/* Contenu */}
//           <div className="flex-1 min-w-0">
//             <p className="text-sm font-medium text-neutral-900">
//               {activity.title}
//             </p>
//             <p className="text-sm text-neutral-600 mt-1">
//               {activity.description}
//             </p>
//             {activity.user && (
//               <p className="text-xs text-neutral-500 mt-1">
//                 Par {activity.user}
//               </p>
//             )}
//           </div>

//           {/* Timestamp */}
//           <div className="flex-shrink-0 text-xs text-neutral-500">
//             {formatTime(activity.timestamp)}
//           </div>
//         </div>
//       ))}
//     </div>
//   );
// };

import { CheckCircle, FolderPlus, UserPlus, TrendingUp, Clock, ExternalLink } from 'lucide-react';
import { Avatar } from '../common/Avatar';
import { useNavigate } from 'react-router-dom';

/**
 * 📋 Activités Récentes - Version Améliorée
 * Inspiré de Monday.com et Asana
 */
export const RecentActivity = ({ activities }) => {
  const navigate = useNavigate();

  // Si pas d'activités
  if (!activities || activities.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Clock className="w-8 h-8 text-neutral-400" />
        </div>
        <p className="text-neutral-600 font-medium mb-2">Aucune activité récente</p>
        <p className="text-sm text-neutral-500">
          Les actions de votre équipe apparaîtront ici
        </p>
      </div>
    );
  }

  /**
   * 🎨 Retourne l'icône et la couleur selon le type
   */
  const getActivityStyle = (type) => {
    const styles = {
      completed: {
        icon: CheckCircle,
        bg: 'bg-green-50',
        iconColor: 'text-green-600',
        border: 'border-green-200'
      },
      created: {
        icon: FolderPlus,
        bg: 'bg-blue-50',
        iconColor: 'text-blue-600',
        border: 'border-blue-200'
      },
      assigned: {
        icon: UserPlus,
        bg: 'bg-purple-50',
        iconColor: 'text-purple-600',
        border: 'border-purple-200'
      },
      updated: {
        icon: TrendingUp,
        bg: 'bg-amber-50',
        iconColor: 'text-amber-600',
        border: 'border-amber-200'
      }
    };
    return styles[type] || styles.updated;
  };

  /**
   * ⏰ Formate le timestamp en texte lisible (style Monday.com)
   */
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);

    if (diff < 60) return 'À l\'instant';
    if (diff < 3600) return `Il y a ${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `Il y a ${Math.floor(diff / 3600)}h`;
    if (diff < 604800) return `Il y a ${Math.floor(diff / 86400)}j`;
    
    return date.toLocaleDateString('fr-FR', { 
      day: 'numeric', 
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  /**
   * 🔗 Navigation vers la ressource liée
   */
  const handleActivityClick = (activity) => {
    if (activity.task_id) {
      navigate(`/tasks/${activity.task_id}`);
    } else if (activity.project_id) {
      navigate(`/projects/${activity.project_id}`);
    }
  };

  return (
    <div className="space-y-3">
      {activities.map((activity, index) => {
        const style = getActivityStyle(activity.type);
        const Icon = style.icon;
        const isClickable = activity.task_id || activity.project_id;

        return (
          <div
            key={index}
            onClick={() => isClickable && handleActivityClick(activity)}
            className={`
              flex items-start gap-4 p-4 rounded-lg border-2 transition-all
              ${style.bg} ${style.border}
              ${isClickable 
                ? 'cursor-pointer hover:shadow-md hover:-translate-y-0.5' 
                : ''
              }
            `}
          >
            {/* Avatar ou Icône */}
            <div className="flex-shrink-0">
              {activity.user_avatar ? (
                <Avatar avatarUrl={activity.user_avatar} name={activity.user} size="sm" showBorder={true} />
              ) : activity.user ? (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold text-sm border-2 border-white shadow-sm">
                  {activity.user.charAt(0).toUpperCase()}
                </div>
              ) : (
                <div className={`w-10 h-10 rounded-full ${style.bg} flex items-center justify-center border-2 ${style.border}`}>
                  <Icon className={`w-5 h-5 ${style.iconColor}`} />
                </div>
              )}
            </div>

            {/* Contenu */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-neutral-900">
                {activity.title}
              </p>
              <p className="text-sm text-neutral-600 mt-1">
                {activity.description}
              </p>
              
              {/* Métadonnées */}
              <div className="flex items-center gap-3 mt-2">
                <span className="text-xs text-neutral-500 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatTime(activity.timestamp)}
                </span>
                
                {activity.project_name && (
                  <span className="text-xs text-neutral-500">
                    📁 {activity.project_name}
                  </span>
                )}
                
                {isClickable && (
                  <span className="text-xs text-primary-600 flex items-center gap-1 ml-auto group-hover:text-primary-700">
                    Voir détails
                    <ExternalLink className="w-3 h-3" />
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
