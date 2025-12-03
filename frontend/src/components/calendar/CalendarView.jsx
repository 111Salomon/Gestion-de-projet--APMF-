import { Calendar as BigCalendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import './CalendarView.css'; // Styles custom

const locales = { fr };

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }), // Lundi
  getDay,
  locales,
});

export const CalendarView = ({ tasks, currentDate, onTaskClick, onMonthChange }) => {
  
  // Transformer les tâches en events pour react-big-calendar
  const events = tasks.map(task => ({
    id: task.id,
    title: task.title,
    start: new Date(task.due_date),
    end: new Date(task.due_date),
    resource: task, // Données complètes de la tâche
  }));

  // Style custom par priorité
  const eventStyleGetter = (event) => {
    const task = event.resource;
    return {
      style: {
        backgroundColor: task.color,
        borderRadius: '4px',
        border: 'none',
        color: 'white',
        fontSize: '12px',
        padding: '2px 6px',
      }
    };
  };

  // Clic sur un event
  const handleSelectEvent = (event) => {
    onTaskClick(event.resource);
  };

  // Navigation mois
  const handleNavigate = (date) => {
    onMonthChange(date);
  };

  return (
    <div className="calendar-container">
      <BigCalendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: 600 }}
        views={['month']}
        defaultView="month"
        date={currentDate}
        onNavigate={handleNavigate}
        onSelectEvent={handleSelectEvent}
        eventPropGetter={eventStyleGetter}
        messages={{
          today: "Aujourd'hui",
          previous: 'Précédent',
          next: 'Suivant',
          month: 'Mois',
          week: 'Semaine',
          day: 'Jour',
        }}
        culture="fr"
      />
    </div>
  );
};
