import { Calendar, AlertCircle, Clock, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export const CalendarHeader = ({ summary, currentDate }) => {
  return (
    <div className="flex items-center justify-between">
      
      {/* Titre */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
          <Calendar className="w-6 h-6 text-primary-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Calendrier</h1>
          <p className="text-sm text-neutral-600">
            {format(currentDate, 'MMMM yyyy', { locale: fr })}
          </p>
        </div>
      </div>

      {/* Résumé rapide */}
      {summary && (
        <div className="flex gap-4">
          
          {/* Aujourd'hui */}
          <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-lg">
            <Clock className="w-4 h-4 text-blue-600" />
            <div>
              <p className="text-xs text-blue-600 font-medium">Aujourd'hui</p>
              <p className="text-lg font-bold text-blue-900">{summary.today}</p>
            </div>
          </div>

          {/* Cette semaine */}
          <div className="flex items-center gap-2 px-4 py-2 bg-green-50 rounded-lg">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            <div>
              <p className="text-xs text-green-600 font-medium">Cette semaine</p>
              <p className="text-lg font-bold text-green-900">{summary.this_week}</p>
            </div>
          </div>

          {/* En retard */}
          {summary.overdue > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 bg-red-50 rounded-lg">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <div>
                <p className="text-xs text-red-600 font-medium">En retard</p>
                <p className="text-lg font-bold text-red-900">{summary.overdue}</p>
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
};
