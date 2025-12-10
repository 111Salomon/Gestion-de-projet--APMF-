import { Bell, Search, ChevronDown, User, Settings, LogOut } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { NotificationDropdown } from '../notifications/NotificationDropdown';

/**
 * 🎨 Barre de navigation détachée avec coins arrondis
 */
export const Navbar = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  
  const profileRef = useRef(null);
  const notifRef = useRef(null);

  // ═══════════════════════════════════════════════════════
  // 🔒 FERMETURE AUTO DES DROPDOWNS
  // ═══════════════════════════════════════════════════════

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setIsNotifOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ═══════════════════════════════════════════════════════
  // 🎯 HANDLERS
  // ═══════════════════════════════════════════════════════

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      console.log('Recherche:', searchQuery);
    }
  };

  // ═══════════════════════════════════════════════════════
  // 🎨 RENDER
  // ═══════════════════════════════════════════════════════

  return (
    <div className="px-6 pt-4 pb-2 bg-neutral-50">
      <header className="h-16 bg-white rounded-2xl shadow-sm  px-6 flex items-center justify-between">
        {/* ═══ ZONE RECHERCHE ═══ */}
        <div className="flex-1 max-w-2xl">
          <form onSubmit={handleSearch} className="relative">
            <div className="relative group">
              {/* Icône de recherche */}
              <div className={`
                absolute left-4 top-1/2 -translate-y-1/2
                transition-colors duration-200
                ${isSearchFocused ? 'text-primary-500' : 'text-neutral-400'}
              `}>
                <Search className="w-4 h-4" />
              </div>

              {/* Input */}
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
                placeholder="Rechercher des projets, tâches..."
                className={`
                  w-full h-11 pl-12 pr-4
                  bg-neutral-50 border border-neutral-200
                  rounded-xl
                  text-sm text-neutral-900 placeholder-neutral-400
                  transition-all duration-200
                  focus:outline-none focus:bg-white
                  focus:border-primary-300 focus:ring-4 focus:ring-primary-50
                  hover:border-neutral-300
                `}
              />
            </div>
          </form>
        </div>

        {/* ═══ ACTIONS DROITE ═══ */}
        <div className="flex items-center gap-2 ml-6">
          {/* ─── Notifications ─── */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setIsNotifOpen(!isNotifOpen)}
              className={`
                relative p-2.5 rounded-xl
                transition-all duration-200
                ${isNotifOpen 
                  ? 'bg-primary-50 text-primary-600' 
                  : 'text-neutral-600 hover:bg-neutral-100'
                }
              `}
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5" />
              
              {/* Badge de notifications */}
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-lg animate-pulse">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Dropdown Notifications */}
            {isNotifOpen && (
              <div className="absolute right-0 mt-2 animate-fadeIn">
                <NotificationDropdown onClose={() => setIsNotifOpen(false)} />
              </div>
            )}
          </div>

          {/* ─── Séparateur vertical ─── */}
          <div className="w-px h-8 bg-neutral-200 mx-1" />

          {/* ─── Profil Utilisateur ─── */}
          {user && (
            <div className="relative" ref={profileRef}>
              {/* Bouton profil */}
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className={`
                  flex items-center gap-3 pl-2 pr-3 py-2 rounded-xl
                  transition-all duration-200
                  ${isProfileOpen 
                    ? 'bg-neutral-100' 
                    : 'hover:bg-neutral-50'
                  }
                `}
              >
                {/* Avatar */}
                <div className="relative">
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center overflow-hidden ring-2 ring-white shadow-sm">
                    {user.avatar_url ? (
                      <img 
                        src={user.avatar_url} 
                        alt={user.username}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-white font-bold text-sm">
                        {user.username?.charAt(0)?.toUpperCase() || 'U'}
                      </span>
                    )}
                  </div>
                  {/* Indicateur en ligne */}
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                </div>

                {/* Nom et email (masqué sur mobile) */}
                <div className="hidden lg:block text-left min-w-0">
                  <p className="text-sm font-semibold text-neutral-900 truncate max-w-[120px]">
                    {user.username}
                  </p>
                  <p className="text-xs text-neutral-500 truncate max-w-[120px]">
                    {user.email}
                  </p>
                </div>

                {/* Icône dropdown */}
                <ChevronDown className={`
                  w-4 h-4 text-neutral-400 transition-transform duration-200
                  ${isProfileOpen ? 'rotate-180' : 'rotate-0'}
                `} />
              </button>

              {/* ═══ MENU DROPDOWN ═══ */}
              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-neutral-200/50 overflow-hidden z-50 animate-fadeIn">
                  {/* Header avec infos utilisateur */}
                  <div className="p-4 bg-gradient-to-br from-primary-50 to-white border-b border-neutral-100">
                    <div className="flex items-center gap-3">
                      {/* Avatar */}
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center overflow-hidden ring-2 ring-primary-100 shadow-lg">
                        {user.avatar_url ? (
                          <img 
                            src={user.avatar_url} 
                            alt={user.username}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-white font-bold text-lg">
                            {user.username?.charAt(0)?.toUpperCase() || 'U'}
                          </span>
                        )}
                      </div>

                      {/* Infos */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-neutral-900 truncate">
                          {user.username}
                        </p>
                        <p className="text-xs text-neutral-500 truncate">
                          {user.email}
                        </p>
                        <span className="inline-block mt-1.5 px-2 py-0.5 bg-primary-100 text-primary-700 text-[10px] font-bold rounded-full uppercase tracking-wide">
                          {user.role === 'admin' ? 'Administrateur' : 
                           user.role === 'chef' ? 'Chef de Projet' : 'Membre'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Menu items */}
                  <div className="py-2">
                    <button
                      onClick={() => {
                        navigate('/profile');
                        setIsProfileOpen(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors group"
                    >
                      <User className="w-4 h-4 text-neutral-400 group-hover:text-primary-500 transition-colors" />
                      <span className="font-medium">Mon Profil</span>
                    </button>
                    
                    <button
                      onClick={() => {
                        navigate('/settings');
                        setIsProfileOpen(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors group"
                    >
                      <Settings className="w-4 h-4 text-neutral-400 group-hover:text-primary-500 transition-colors" />
                      <span className="font-medium">Paramètres</span>
                    </button>
                  </div>

                  {/* Déconnexion */}
                  <div className="border-t border-neutral-100 p-2">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors group"
                    >
                      <LogOut className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                      <span className="font-medium">Déconnexion</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </header>
    </div>
  );
};
