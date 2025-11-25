import { Bell, Search, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';  // ✅ AJOUTÉ
import { NotificationDropdown } from '../notifications/NotificationDropdown';  // ✅ AJOUTÉ

/**
 * Barre de navigation en haut de l'application
 * Affiche la recherche, les notifications et le profil utilisateur
 */
export const Navbar = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();  // ✅ AJOUTÉ
  const [searchQuery, setSearchQuery] = useState('');
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);  // ✅ AJOUTÉ

  /**
   * Gère la déconnexion
   */
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="h-16 bg-white border-b border-neutral-200 px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Barre de recherche */}
      <div className="flex-1 max-w-xl">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher des projets, tâches..."
            className="w-full pl-11 pr-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      {/* Actions à droite */}
      <div className="flex items-center gap-4">
       {/* Notifications - ✅ VERSION FONCTIONNELLE */}
        <div className="relative">
          <button
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className="relative p-2 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <Bell className="w-5 h-5 text-neutral-600" />
            
            {/* Badge dynamique */}
            {unreadCount > 0 && (
              <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Dropdown */}
          {isNotifOpen && (
            <NotificationDropdown onClose={() => setIsNotifOpen(false)} />
          )}
        </div>

        {/* Profil Utilisateur */}
        {user && (
          <div className="relative">
            {/* Bouton profil */}
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-3 p-2 hover:bg-neutral-100 rounded-lg transition-colors"
            >
          {/* Avatar */}
          <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center overflow-hidden">
            {user.avatar_url ? (
              <img 
                src={user.avatar_url} 
                alt={user.username}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-primary-600 font-semibold text-sm">
                {user.username?.charAt(0)?.toUpperCase() || 'U'}
              </span>
            )}
          </div>


              {/* Nom et rôle */}
              <div className="hidden md:block text-left">
                <p className="text-sm font-semibold text-neutral-900">
                  {user.username}
                </p>
                <p className="text-xs text-neutral-500">
                  {user.email}
                </p>
              </div>

              {/* Icône dropdown */}
              <ChevronDown className="w-4 h-4 text-neutral-600" />
            </button>

            {/* Menu dropdown */}
            {isProfileOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-neutral-200 py-2 z-50">
                {/* Info utilisateur */}
                <div className="px-4 py-3 border-b border-neutral-200">
                  <p className="text-sm font-semibold text-neutral-900">
                    {user.username}
                  </p>
                  <p className="text-xs text-neutral-500 mb-2">
                    {user.email}
                  </p>
                  <span className="inline-block px-2 py-1 bg-primary-100 text-primary-700 text-xs font-medium rounded">
                    {user.role || 'Utilisateur'}
                  </span>
                </div>

                {/* Menu items */}
                <div className="py-2">
                  <button
                    onClick={() => {
                      navigate('/profile');
                      setIsProfileOpen(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-50 transition-colors"
                  >
                    Mon Profil
                  </button>
                  <button
                    onClick={() => {
                      navigate('/settings');
                      setIsProfileOpen(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-50 transition-colors"
                  >
                    Paramètres
                  </button>
                </div>

                {/* Déconnexion */}
                <div className="border-t border-neutral-200 pt-2">
                  <button
                    onClick={handleLogout}
                    className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    Déconnexion
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
