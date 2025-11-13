import { useState } from 'react';
import { 
  LayoutDashboard, 
  FolderKanban, 
  CheckSquare, 
  Users, 
  Settings,
  LogOut,
  ChevronLeft,
  Calendar as CalendarIcon
} from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { useStats } from '../../context/StatsContext';


export const Sidebar = ({ isCollapsed, setIsCollapsed }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { stats } = useStats();
//   const [isCollapsed, setIsCollapsed] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
 // Navigation avec badges dynamiques
  const navItems = [
    { 
      name: 'Dashboard', 
      icon: LayoutDashboard, 
      path: '/dashboard', 
      badge: null 
    },
    { 
      name: 'Projets', 
      icon: FolderKanban, 
      path: '/projects', 
      badge: stats.projectsCount || 0  // ← Dynamique !
    },
    { 
      name: 'Tâches', 
      icon: CheckSquare, 
      path: '/tasks', 
      badge: stats.tasksCount || 0  // ← Dynamique !
    },
    { 
      name: 'Équipe', 
      icon: Users, 
      path: '/team', 
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



      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 overflow-y-auto">
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
              {/* Indicateur actif */}
              {({ isActive }) => (
                <>
                  <item.icon className={`w-5 h-5 ${isCollapsed ? 'mx-auto' : ''}`} />
                  
                  {!isCollapsed && (
                    <>
                      <span className="flex-1 font-medium">{item.name}</span>
                      {item.badge && (
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

      {/* Calendrier (uniquement si sidebar non réduite) */}
      {!isCollapsed && (
        <div className="px-4 pb-4 border-t border-neutral-200">
          <div>
            <div className="flex items-center gap-2 mb-3 px-2">
              <CalendarIcon className="w-4 h-4 text-neutral-600" />
              <h3 className="text-sm font-semibold text-neutral-900">Calendrier</h3>
            </div>
            
            {/* Composant React Calendar avec styles personnalisés */}
            <div className="react-calendar-wrapper">
              <Calendar
                onChange={setSelectedDate}
                value={selectedDate}
                locale="fr-FR"
                className="border-0 w-full"
              />
            </div>
          </div>
        </div>
      )}

      {/* Footer avec boutons */}
      <div className="px-4 py-4 border-t border-neutral-200 space-y-2">
        <button
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
