import { CheckCircle2, Clock, AlertCircle, ListTodo } from 'lucide-react';

/**
 * Composant qui affiche les stats d'un projet
 * - Barre de progression
 * - 4 cartes de stats
 * - Alerte si tâches en retard
 */
export const ProjectStats = ({ stats }) => {
  // Si pas de stats, on n'affiche rien
  if (!stats) return null;

  // Configuration des 4 cartes
  const statsCards = [
    {
      label: 'Total',
      value: stats.total_tasks,
      icon: ListTodo,
      color: 'text-neutral-600',
      bg: 'bg-neutral-100',
    },
    {
      label: 'À faire',
      value: stats.todo,
      icon: Clock,
      color: 'text-blue-600',
      bg: 'bg-blue-100',
    },
    {
      label: 'En cours',
      value: stats.in_progress,
      icon: AlertCircle,
      color: 'text-amber-600',
      bg: 'bg-amber-100',
    },
    {
      label: 'Terminées',
      value: stats.done,
      icon: CheckCircle2,
      color: 'text-green-600',
      bg: 'bg-green-100',
    },
  ];

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">📈 Statistiques</h2>
      
      {/* ─── Barre de progression ─── */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-neutral-600">Progression</span>
          <span className="font-semibold text-primary-600">
            {stats.completion_percentage}%
          </span>
        </div>
        {/* Barre grise de fond */}
        <div className="h-3 bg-neutral-200 rounded-full overflow-hidden">
          {/* Barre bleue qui se remplit */}
          <div
            className="h-full bg-gradient-to-r from-primary-500 to-primary-600 transition-all duration-300"
            style={{ width: `${stats.completion_percentage}%` }}
          />
        </div>
      </div>

      {/* ─── Cartes de stats ─── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statsCards.map((stat) => (
          <div
            key={stat.label}
            className="p-4 bg-white rounded-lg border border-neutral-200 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-3">
              {/* Icône */}
              <div className={`p-2 rounded-lg ${stat.bg}`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              {/* Chiffres */}
              <div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-sm text-neutral-600">{stat.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ─── Alerte tâches en retard (si > 0) ─── */}
      {stats.overdue_tasks > 0 && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <p className="text-sm text-red-800">
            ⚠️ <strong>{stats.overdue_tasks}</strong> tâche
            {stats.overdue_tasks > 1 ? 's' : ''} en retard
          </p>
        </div>
      )}
    </div>
  );
};
