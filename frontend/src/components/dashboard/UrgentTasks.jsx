import { Clock, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const UrgentTasks = ({ tasks }) => {
  const navigate = useNavigate();

  if (!tasks || tasks.length === 0) {
    return (
      <div className="text-neutral-500 text-center py-8">
        Aucune tâche urgente
      </div>
    );
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-700';
      case 'medium':
        return 'bg-amber-100 text-amber-700';
      case 'low':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-neutral-100 text-neutral-700';
    }
  };

  const getDaysLeftColor = (days) => {
    if (days <= 1) return 'text-red-600';
    if (days <= 3) return 'text-amber-600';
    return 'text-neutral-600';
  };

  return (
    <div className="space-y-3">
      {tasks.map((task) => (
        <div
          key={task.id}
          onClick={() => navigate(`/tasks/${task.id}`)}
          className="p-4 bg-neutral-50 rounded-lg hover:bg-neutral-100 transition-colors cursor-pointer border border-neutral-200"
        >
          <div className="flex items-start justify-between mb-2">
            <h4 className="text-sm font-medium text-neutral-900 flex-1">
              {task.title}
            </h4>
            <span className={`px-2 py-1 text-xs font-medium rounded ${getPriorityColor(task.priority)}`}>
              {task.priority === 'high' ? 'Haute' : task.priority === 'medium' ? 'Moyenne' : 'Basse'}
            </span>
          </div>
          
          <p className="text-xs text-neutral-600 mb-2">
            {task.project}
          </p>
          
          <div className="flex items-center gap-4 text-xs">
            <span className={`flex items-center gap-1 font-medium ${getDaysLeftColor(task.days_left)}`}>
              <Clock className="w-3 h-3" />
              {task.days_left === 0 ? "Aujourd'hui" : task.days_left === 1 ? "Demain" : `${task.days_left} jours`}
            </span>
            {task.assigned_to && (
              <span className="text-neutral-500">
                👤 {task.assigned_to}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
