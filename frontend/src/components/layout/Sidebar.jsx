import { useState } from 'react';
import { 
  LayoutDashboard, 
  FolderKanban, 
  CheckSquare, 
  Users, 
  Settings,
  LogOut,
  ChevronLeft,
  Calendar as CalendarIcon,
  Trello,
  BarChart3,
  ChevronRight,
  ChevronDown
} from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useStats } from '../../context/StatsContext';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday } from 'date-fns';
import { fr } from 'date-fns/locale';

export const Sidebar = ({ isCollapsed, setIsCollapsed }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { stats } = useStats();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isCalendarOpen, setIsCalendarOpen] = useState(false); // 🆕 État du calendrier

  /**
   * Vérifie si l'utilisateur peut voir les analytics globales
   */
  const canViewGlobalAnalytics = () => {
    return user?.role === 'admin' || user?.role === 'chef';
  };

  // Navigation avec badges dynamiques
  const navItems = [
    { 
      name: 'Dashboard', 
      icon: LayoutDashboard, 
      path: '/dashboard', 
      badge: null 
    },
    ...(canViewGlobalAnalytics() ? [{
      name: 'Analytics',
      icon: BarChart3,
      path: '/analytics',
      badge: null
    }] : []),
    { 
      name: 'Projets', 
      icon: FolderKanban, 
      path: '/projects', 
      badge: stats.projectsCount || 0
    },
    { 
      name: 'Tâches', 
      icon: CheckSquare, 
      path: '/tasks', 
      badge: stats.tasksCount || 0
    },
    {
      name: 'Kanban',
      icon: Trello,
      path: '/kanban',
      badge: null
    },
    { 
      name: 'Équipe', 
      icon: Users, 
      path: '/team', 
      badge: null 
    },
    {
      name: 'Calendrier',
      icon: CalendarIcon,
      path: '/calendar',
      badge: null
    },
  ];

  /**
   * Gère la déconnexion
   */
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  /**
   * Navigation mois précédent
   */
  const handlePreviousMonth = () => {
    const prevMonth = new Date(currentMonth);
    prevMonth.setMonth(prevMonth.getMonth() - 1);
    setCurrentMonth(prevMonth);
  };

  /**
   * Navigation mois suivant
   */
  const handleNextMonth = () => {
    const nextMonth = new Date(currentMonth);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    setCurrentMonth(nextMonth);
  };

  /**
   * Clic sur une date → Redirection vers calendrier
   */
  const handleDateClick = (date) => {
    setSelectedDate(date);
    navigate(`/calendar?date=${format(date, 'yyyy-MM-dd')}`);
  };

  // Génère les jours du mois
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Jours de la semaine (court)
  const weekDays = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

  return (
    <aside 
      className={`
        ${isCollapsed ? 'w-20' : 'w-80'} 
        h-screen bg-white border-r border-neutral-200 
        flex flex-col transition-all duration-300 ease-in-out
        fixed left-0 top-0 z-40
      `}
    >
      {/* Header avec Logo */}
      <div className="h-16 px-6 flex items-center justify-between border-b border-neutral-200">
        {!isCollapsed && (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">T</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-neutral-900">TaskFlow</h1>
              <p className="text-xs text-neutral-500">Gestion de Projets</p>
            </div>
          </div>
        )}
        
        {/* Bouton pour réduire/agrandir la sidebar */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
        >
          <ChevronLeft 
            className={`w-5 h-5 text-neutral-600 transition-transform ${
              isCollapsed ? 'rotate-180' : ''
            }`} 
          />
        </button>
      </div>

      {/* Navigation - PLUS DE SCROLLBAR ! */}
      <nav className="px-4 py-6">
        <div className="space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `
                flex items-center gap-3 px-4 py-3 rounded-lg
                transition-all duration-200 group relative
                ${isActive 
                  ? 'bg-primary-50 text-primary-600' 
                  : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
                }
              `}
            >
              {({ isActive }) => (
                <>
                  <item.icon className={`w-5 h-5 ${isCollapsed ? 'mx-auto' : ''}`} />
                  
                  {!isCollapsed && (
                    <>
                      <span className="flex-1 font-medium">{item.name}</span>
                      {item.badge !== null && item.badge !== undefined && (
                        <span className={`
                          px-2 py-0.5 text-xs font-semibold rounded-full
                          ${isActive 
                            ? 'bg-primary-600 text-white' 
                            : 'bg-neutral-200 text-neutral-600'
                          }
                        `}>
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>

      {/* 🆕 Bouton Toggle Calendrier (seulement si non collapsed) */}
      {!isCollapsed && (
        <div className="px-4 pb-3">
          <button
            onClick={() => setIsCalendarOpen(!isCalendarOpen)}
            className="w-full flex items-center justify-between px-4 py-2 rounded-lg
                     text-neutral-700 hover:bg-neutral-50 transition-colors
                     border border-neutral-200"
          >
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-4 h-4" />
              <span className="text-sm font-medium">Mini Calendrier</span>
            </div>
            <ChevronDown 
              className={`w-4 h-4 transition-transform ${
                isCalendarOpen ? 'rotate-180' : ''
              }`}
            />
          </button>
        </div>
      )}

      {/* 🆕 Mini Calendrier Collapsible */}
      {!isCollapsed && isCalendarOpen && (
        <div className="px-4 pb-4 animate-fadeIn">
          <div className="bg-neutral-50 rounded-lg p-3 border border-neutral-200">
            {/* Header calendrier */}
            <div className="flex items-center justify-between mb-3">
              <button
                onClick={handlePreviousMonth}
                className="p-1 hover:bg-white rounded transition-colors"
              >
                <ChevronLeft className="w-4 h-4 text-neutral-600" />
              </button>
              
              <span className="text-xs font-semibold text-neutral-900">
                {format(currentMonth, 'MMMM yyyy', { locale: fr })}
              </span>
              
              <button
                onClick={handleNextMonth}
                className="p-1 hover:bg-white rounded transition-colors"
              >
                <ChevronRight className="w-4 h-4 text-neutral-600" />
              </button>
            </div>

            {/* Jours de la semaine */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {weekDays.map((day, i) => (
                <div
                  key={i}
                  className="text-center text-xs font-medium text-neutral-500"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Grille des jours */}
            <div className="grid grid-cols-7 gap-1">
              {daysInMonth.map((date, i) => {
                const isSelected = isSameDay(date, selectedDate);
                const isTodayDate = isToday(date);
                
                return (
                  <button
                    key={i}
                    onClick={() => handleDateClick(date)}
                    className={`
                      aspect-square flex items-center justify-center
                      text-xs rounded transition-all
                      ${isTodayDate 
                        ? 'bg-primary-600 text-white font-bold hover:bg-primary-700' 
                        : isSelected
                          ? 'bg-primary-100 text-primary-900 font-semibold'
                          : 'hover:bg-white text-neutral-700'
                      }
                    `}
                  >
                    {format(date, 'd')}
                  </button>
                );
              })}
            </div>

            {/* Info today */}
            <div className="mt-3 pt-3 border-t border-neutral-200">
              <p className="text-xs text-neutral-600 text-center">
                {format(new Date(), "d MMMM yyyy", { locale: fr })}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Footer avec boutons - TOUJOURS VISIBLE EN BAS */}
      <div className="px-4 py-4 border-t border-neutral-200 space-y-2 mt-auto">
        <button
          onClick={() => navigate('/settings')}
          className={`
            w-full flex items-center gap-3 px-4 py-3 rounded-lg
            text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900
            transition-all duration-200
            ${isCollapsed ? 'justify-center' : ''}
          `}
        >
          <Settings className="w-5 h-5" />
          {!isCollapsed && <span className="font-medium">Paramètres</span>}
        </button>

        <button
          onClick={handleLogout}
          className={`
            w-full flex items-center gap-3 px-4 py-3 rounded-lg
            text-red-600 hover:bg-red-50
            transition-all duration-200
            ${isCollapsed ? 'justify-center' : ''}
          `}
        >
          <LogOut className="w-5 h-5" />
          {!isCollapsed && <span className="font-medium">Déconnexion</span>}
        </button>
      </div>
    </aside>
  );
};
