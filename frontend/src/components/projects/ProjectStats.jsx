import { AlertCircle, TrendingUp, CheckCircle2, Clock } from 'lucide-react';

export const ProjectStats = ({ stats }) => {
  if (!stats) return null;

  const totalTasks = stats.total_tasks || 0;
  const completedTasks = stats.done || 0;  // ✅ Utilise 'done' du backend
  const overdueTasks = stats.overdue_tasks || 0;

  return (
    <div className="bg-white rounded-xl border border-neutral-200 p-6 shadow-sm space-y-5">
      
      {/* 📊 BARRE DE PROGRESSION */}
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-neutral-600" strokeWidth={2.5} />
            <h3 className="text-base font-bold text-neutral-900">Progression</h3>
          </div>
          
          {/* Pourcentage */}
          <span className="text-2xl font-bold text-neutral-900">
            {stats.completion_percentage}%
          </span>
        </div>

        {/* Barre avec gradient orange */}
        <div className="relative h-2.5 bg-neutral-100 rounded-full overflow-hidden mb-3">
          <div
            className="h-full bg-gradient-to-r from-orange-500 to-orange-600 rounded-full 
                     transition-all duration-700 ease-out"
            style={{ width: `${stats.completion_percentage}%` }}
          />
        </div>

        {/* 🆕 INFORMATIONS CONTEXTUELLES */}
        <div className="flex items-center gap-3 text-sm text-neutral-600">
          {/* Tâches terminées */}
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-green-600" strokeWidth={2} />
            <span>
              <span className="font-semibold text-neutral-900">{completedTasks}/{totalTasks}</span> terminées
            </span>
          </div>

          {/* Séparateur */}
          <span className="text-neutral-300">•</span>

          {/* Tâches en retard */}
          {overdueTasks > 0 && (
            <>
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-red-600" strokeWidth={2} />
                <span>
                  <span className="font-semibold text-red-700">{overdueTasks}</span> en retard
                </span>
              </div>
            </>
          )}

          {/* Si aucune tâche en retard */}
          {overdueTasks === 0 && (
            <div className="flex items-center gap-1.5 text-green-600">
              <CheckCircle2 className="w-4 h-4" strokeWidth={2} />
              <span className="font-medium">À jour</span>
            </div>
          )}
        </div>
      </div>

      {/* ⚠️ ALERTE TÂCHES EN RETARD */}
      {stats.overdue_tasks > 0 && (
        <div className="pt-5 border-t border-neutral-200">
          <div className="flex items-start gap-3">
            {/* Icône rouge */}
            <div className="w-10 h-10 rounded-lg bg-red-500 flex items-center justify-center 
                          shadow-md shadow-red-500/20 animate-pulse flex-shrink-0">
              <AlertCircle className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>
            
            {/* Texte */}
            <div className="flex-1">
              <h4 className="font-bold text-red-900 text-base mb-0.5">
                {stats.overdue_tasks} tâche{stats.overdue_tasks > 1 ? 's' : ''} en retard
              </h4>
              <p className="text-xs text-red-700">
                Nécessite une attention immédiate
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
