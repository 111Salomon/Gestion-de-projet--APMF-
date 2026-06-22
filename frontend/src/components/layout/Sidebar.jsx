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
  ChevronDown,
  MessageSquare,
} from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useStats } from '../../context/StatsContext';
import { Avatar } from '../common/Avatar';
import { useChat } from '../../context/ChatContext';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday } from 'date-fns';
import { fr } from 'date-fns/locale';


export const Sidebar = ({ isCollapsed, setIsCollapsed }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { stats } = useStats();
  const { rooms } = useChat();  // ✨ AJOUTÉ
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

// ✨ AJOUTÉ : Calcul des messages non lus (avec protection)
const unreadCount = (rooms || []).reduce((sum, room) => sum + (room?.unread_count || 0), 0);

  // ═══════════════════════════════════════════════════════
  // 🔒 PERMISSIONS
  // ═══════════════════════════════════════════════════════


  const canViewAnalytics = () => {
    return user?.role === 'admin' || user?.role === 'chef';
  };


  const canManageTeam = () => {
    return user?.role === 'admin' || user?.role === 'chef';
  };


  // ═══════════════════════════════════════════════════════
  // 🧭 NAVIGATION
  // ═══════════════════════════════════════════════════════


  const navItems = [
    { 
      name: 'Dashboard', 
      icon: LayoutDashboard, 
      path: '/dashboard', 
      badge: null,
      section: 'menu'
    },
    ...(canViewAnalytics() ? [{
      name: 'Analytics',
      icon: BarChart3,
      path: '/analytics',
      badge: null,
      section: 'menu'
    }] : []),
    { 
      name: 'Projets', 
      icon: FolderKanban, 
      path: '/projects', 
      badge: stats.projectsCount || 0,
      section: 'workspace'
    },
    { 
      name: 'Tâches', 
      icon: CheckSquare, 
      path: '/tasks', 
      badge: stats.tasksCount || 0,
      section: 'workspace'
    },
    {
      name: 'Kanban',
      icon: Trello,
      path: '/kanban',
      badge: null,
      section: 'workspace'
    },

    {
    name: 'Chat',
    icon: MessageSquare,
    path: '/chat',
    badge: unreadCount > 0 ? unreadCount : null,
    section: 'workspace'
    },

    ...(canManageTeam() ? [{
      name: 'Équipe',
      icon: Users,
      path: '/team',
      badge: null,
      section: 'workspace'
    }] : []),

    {
      name: 'Calendrier',
      icon: CalendarIcon,
      path: '/calendar',
      badge: null,
      section: 'workspace'
    },
  ];


  const menuItems = navItems.filter(item => item.section === 'menu');
  const workspaceItems = navItems.filter(item => item.section === 'workspace');


  // ═══════════════════════════════════════════════════════
  // 🎯 HANDLERS
  // ═══════════════════════════════════════════════════════


  const handleLogout = () => {
    logout();
    navigate('/login');
  };


  const handlePreviousMonth = () => {
    const prevMonth = new Date(currentMonth);
    prevMonth.setMonth(prevMonth.getMonth() - 1);
    setCurrentMonth(prevMonth);
  };


  const handleNextMonth = () => {
    const nextMonth = new Date(currentMonth);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    setCurrentMonth(nextMonth);
  };


  const handleDateClick = (date) => {
    setSelectedDate(date);
    navigate(`/calendar?date=${format(date, 'yyyy-MM-dd')}`);
  };


  // ═══════════════════════════════════════════════════════
  // 📅 CALENDRIER
  // ═══════════════════════════════════════════════════════


  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const weekDays = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

  // ✅ CORRECTION : Calcul des jours vides avant le 1er du mois
  const firstDayOfMonth = monthStart.getDay(); // 0 = Dimanche, 1 = Lundi, ..., 6 = Samedi
  const startingDayIndex = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1; // Ajuste pour que Lundi = 0
  const emptyDays = Array(startingDayIndex).fill(null);


  // ═══════════════════════════════════════════════════════
  // 🎨 RENDER
  // ═══════════════════════════════════════════════════════


  return (
    <aside 
      className={`
        ${isCollapsed ? 'w-28' : 'w-80'} 
        h-screen
        flex flex-col
        transition-all duration-300 ease-in-out
        fixed left-0 top-0 z-40
        p-4
      `}
    >
      {/* 🎨 Container avec ombre et coins arrondis */}
      <div className="
        h-full
        bg-gradient-to-b from-neutral-900 via-neutral-900 to-neutral-800
        rounded-2xl
        shadow-xl
        border border-white/10
        flex flex-col
        overflow-hidden
      ">
        {/* ═══ HEADER ═══ */}
        <div className="h-16 px-4 flex items-center justify-between border-b border-white/5 flex-shrink-0">
          {!isCollapsed && (
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-base">T</span>
              </div>
              <div>
                <h1 className="text-base font-bold text-white">TaskFlow</h1>
                <p className="text-[10px] text-neutral-500 uppercase tracking-wider">Workspace</p>
              </div>
            </div>
          )}
          
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={`
              p-2 rounded-lg
              text-neutral-400 hover:text-white
              hover:bg-white/5
              transition-all duration-200
              ${isCollapsed ? 'mx-auto' : ''}
            `}
            aria-label={isCollapsed ? 'Agrandir' : 'Réduire'}
          >
            <ChevronLeft 
              className={`w-4 h-4 transition-transform duration-300 ${
                isCollapsed ? 'rotate-180' : ''
              }`} 
            />
          </button>
        </div>


        {/* ═══ USER PROFILE ═══ */}
        {!isCollapsed && (
          <div className="px-4 py-4 border-b border-white/5 flex-shrink-0">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer group">
              <div className="relative flex-shrink-0">
                <Avatar avatarUrl={user?.avatar_url} name={user?.full_name || user?.username} size="md" showBorder={true} />
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-neutral-900" />
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">
                  {user?.full_name || user?.username || 'Utilisateur'}
                </p>
                <p className="text-xs  text-orange-400 capitalize mt-1">
                  {user?.role === 'admin' ? 'Administrateur' : 
                   user?.role === 'chef' ? 'Chef de Projet' : 'Membre'}
                </p>
              </div>
            </div>
          </div>
        )}


        {/* ═══ NAVIGATION ═══ */}
        <nav className="flex-1 overflow-y-auto py-4 scrollbar-hide">
          {/* Menu Section */}
          {!isCollapsed && menuItems.length > 0 && (
            <div className="px-6 mb-2">
              <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
                Menu
              </span>
            </div>
          )}


          <div className="space-y-0.5 px-2">
            {menuItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => `
                  flex items-center gap-3 px-4 py-2.5 rounded-lg
                  transition-all duration-200 group relative
                  ${isActive 
                    ? 'bg-white/10 text-white' 
                    : 'text-neutral-400 hover:bg-white/5 hover:text-neutral-200'
                  }
                  ${isCollapsed ? 'justify-center px-2' : ''}
                `}
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-orange-500 rounded-r-full" />
                    )}
                    
                    <item.icon className={`
                      w-5 h-5 flex-shrink-0
                      ${isActive ? 'text-orange-500' : ''}
                    `} />
                    
                    {!isCollapsed && (
                      <>
                        <span className="flex-1 font-medium text-sm">{item.name}</span>
                        {item.badge !== null && item.badge !== undefined && item.badge > 0 && (
                          <span className={`
                            px-2 py-0.5 text-xs font-bold rounded-full
                            ${isActive 
                              ? 'bg-orange-500 text-white' 
                              : 'bg-white/10 text-neutral-300'
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


          {/* Separator */}
          {!isCollapsed && menuItems.length > 0 && workspaceItems.length > 0 && (
            <div className="my-4 mx-6 border-t border-white/5" />
          )}


          {/* Workspace Section */}
          {!isCollapsed && workspaceItems.length > 0 && (
            <div className="px-6 mb-2">
              <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
                Workspace
              </span>
            </div>
          )}


          <div className="space-y-0.5 px-2">
            {workspaceItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => `
                  flex items-center gap-3 px-4 py-2.5 rounded-lg
                  transition-all duration-200 group relative
                  ${isActive 
                    ? 'bg-white/10 text-white' 
                    : 'text-neutral-400 hover:bg-white/5 hover:text-neutral-200'
                  }
                  ${isCollapsed ? 'justify-center px-2' : ''}
                `}
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-orange-500 rounded-r-full" />
                    )}
                    
                    <item.icon className={`
                      w-5 h-5 flex-shrink-0
                      ${isActive ? 'text-orange-500' : ''}
                    `} />
                    
                    {!isCollapsed && (
                      <>
                        <span className="flex-1 font-medium text-sm">{item.name}</span>
                        {item.badge !== null && item.badge !== undefined && item.badge > 0 && (
                          <span className={`
                            px-2 py-0.5 text-xs font-bold rounded-full
                            ${isActive 
                              ? 'bg-orange-500 text-white' 
                              : 'bg-white/10 text-neutral-300'
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


        {/* ═══ CALENDRIER ═══ */}
        {!isCollapsed && (
          <div className="px-4 pb-3 flex-shrink-0">
            <button
              onClick={() => setIsCalendarOpen(!isCalendarOpen)}
              className="w-full flex items-center justify-between px-4 py-2.5 rounded-lg
                       text-neutral-400 hover:text-neutral-200
                       hover:bg-white/5 transition-all duration-200
                       border border-white/10"
            >
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4" />
                <span className="text-sm font-medium">Mini Calendrier</span>
              </div>
              <ChevronDown 
                className={`w-4 h-4 transition-transform duration-200 ${
                  isCalendarOpen ? 'rotate-180' : ''
                }`}
              />
            </button>
          </div>
        )}


        {!isCollapsed && isCalendarOpen && (
          <div className="px-4 pb-4 animate-fadeIn flex-shrink-0">
            <div className="bg-white/5 rounded-lg p-3 border border-white/10 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-3">
                <button
                  onClick={handlePreviousMonth}
                  className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                  aria-label="Mois précédent"
                >
                  <ChevronLeft className="w-4 h-4 text-neutral-400" />
                </button>
                
                <span className="text-xs font-semibold text-white capitalize">
                  {format(currentMonth, 'MMMM yyyy', { locale: fr })}
                </span>
                
                <button
                  onClick={handleNextMonth}
                  className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                  aria-label="Mois suivant"
                >
                  <ChevronRight className="w-4 h-4 text-neutral-400" />
                </button>
              </div>


              <div className="grid grid-cols-7 gap-1 mb-2">
                {weekDays.map((day, i) => (
                  <div
                    key={i}
                    className="text-center text-[10px] font-semibold text-neutral-500 uppercase"
                  >
                    {day}
                  </div>
                ))}
              </div>


              <div className="grid grid-cols-7 gap-1">
                {/* ✅ AJOUT : Cellules vides avant le 1er du mois */}
                {emptyDays.map((_, i) => (
                  <div key={`empty-${i}`} className="aspect-square" />
                ))}
                
                {/* Jours du mois */}
                {daysInMonth.map((date, i) => {
                  const isSelected = isSameDay(date, selectedDate);
                  const isTodayDate = isToday(date);
                  
                  return (
                    <button
                      key={i}
                      onClick={() => handleDateClick(date)}
                      className={`
                        aspect-square flex items-center justify-center
                        text-xs rounded-lg transition-all font-medium
                        ${isTodayDate 
                          ? 'bg-orange-500 text-white font-bold hover:bg-orange-600 shadow-lg shadow-orange-500/30' 
                          : isSelected
                            ? 'bg-white/20 text-white font-semibold'
                            : 'hover:bg-white/10 text-neutral-400 hover:text-neutral-200'
                        }
                      `}
                      aria-label={format(date, 'd MMMM yyyy', { locale: fr })}
                    >
                      {format(date, 'd')}
                    </button>
                  );
                })}
              </div>


              <div className="mt-3 pt-3 border-t border-white/10">
                <p className="text-xs text-neutral-400 text-center capitalize">
                  Aujourd'hui : {format(new Date(), "EEEE d MMMM yyyy", { locale: fr })}
                </p>
              </div>
            </div>
          </div>
        )}


        {/* ═══ FOOTER ═══ */}
        <div className="px-4 py-4 border-t border-white/5 space-y-1 flex-shrink-0">
          <button
            onClick={() => navigate('/settings')}
            className={`
              w-full flex items-center gap-3 px-4 py-2.5 rounded-lg
              text-neutral-400 hover:text-neutral-200
              hover:bg-white/5
              transition-all duration-200 group
              ${isCollapsed ? 'justify-center px-2' : ''}
            `}
            aria-label="Paramètres"
          >
            <Settings className="w-5 h-5 flex-shrink-0 group-hover:rotate-90 transition-transform duration-300" />
            {!isCollapsed && <span className="text-sm font-medium">Paramètres</span>}
          </button>


          <button
            onClick={handleLogout}
            className={`
              w-full flex items-center gap-3 px-4 py-2.5 rounded-lg
              text-red-400 hover:text-red-300
              hover:bg-red-500/10
              transition-all duration-200
              ${isCollapsed ? 'justify-center px-2' : ''}
            `}
            aria-label="Déconnexion"
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {!isCollapsed && <span className="text-sm font-medium">Déconnexion</span>}
          </button>
        </div>
      </div>
    </aside>
  );
};
