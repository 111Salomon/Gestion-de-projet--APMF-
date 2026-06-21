import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../api/auth';
import toast from 'react-hot-toast';
import axiosInstance from '../api/axios'; // ✨ AJOUTÉ
import { getApiErrorMessage } from '../utils/apiError';

const AuthContext = createContext(null);

// ✨ EVENT EMITTER pour notifier les changements
const eventListeners = new Set();

const notifyListeners = (event, data) => {
  console.log(`📢 Event emitted: ${event}`, data);
  eventListeners.forEach(listener => {
    try {
      listener(event, data);
    } catch (error) {
      console.error('Error in listener:', error);
    }
  });
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('access_token');
    if (token) {
      try {
        const userData = await authAPI.getCurrentUser();
        setUser(userData);
      } catch (error) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
      }
    }
    setLoading(false);
  };

  const login = async (credentials) => {
    try {
      const { access, refresh } = await authAPI.login(credentials);
      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);
      
      const userData = await authAPI.getCurrentUser();
      setUser(userData);
      toast.success('Connexion réussie !');
      
      // ✨ Notifier les listeners
      notifyListeners('user_logged_in', userData);
      
      return true;
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Identifiants invalides'));
      return false;
    }
  };

  const logout = () => {
    authAPI.logout();
    setUser(null);
    toast.success('Déconnexion réussie');
    
    // ✨ Notifier les listeners
    notifyListeners('user_logged_out', null);
  };

  // ✅ FONCTION AMÉLIORÉE : Recharger + Notifier
  const refreshUser = async () => {
    try {
      const userData = await authAPI.getCurrentUser();
      setUser(userData);
      
      console.log('✅ User refreshed:', userData);
      
      // ✨ NOTIFIER TOUS LES COMPOSANTS
      notifyListeners('user_updated', userData);
      
      return userData;
    } catch (error) {
      console.error('❌ Erreur lors du rechargement du user:', error);
      return null;
    }
  };


  // ✨ NOUVELLE FONCTION : Notifier qu'un membre a été mis à jour
  const notifyMemberUpdated = (memberData) => {
    console.log('👤 Member updated, notifying listeners:', memberData);
    notifyListeners('member_updated', memberData);
  };

  // ✨ FONCTION D'ABONNEMENT
  const subscribe = (callback) => {
    eventListeners.add(callback);
    console.log('📌 Listener added. Total:', eventListeners.size);
    
    // Retourner fonction de désabonnement
    return () => {
      eventListeners.delete(callback);
      console.log('📌 Listener removed. Total:', eventListeners.size);
    };
  };

  // ═══════════════════════════════════════════════════════════
  // ✨ GOOGLE CALENDAR INTEGRATION FUNCTIONS
  // ═══════════════════════════════════════════════════════════

const connectGoogleCalendar = async () => {
  try {
    // Appel API pour obtenir l'URL Google (avec token JWT)
    const response = await axiosInstance.get('/calendar/google/auth/');
    
    // Rediriger vers l'URL Google
    window.location.href = response.data.auth_url;
    return true;
  } catch (error) {
    console.error('❌ Erreur connexion Google Calendar:', error);
    toast.error(getApiErrorMessage(error, 'Erreur lors de la connexion à Google Calendar'));
    return false;
  }
};

  const disconnectGoogleCalendar = async () => {
    try {
      await axiosInstance.post('/calendar/google/disconnect/');
      // Recharger l'utilisateur pour mettre à jour l'état
      await refreshUser();
      toast.success('Google Calendar déconnecté');
      return true;
    } catch (error) {
      console.error('❌ Erreur déconnexion Google Calendar:', error);
      toast.error(getApiErrorMessage(error, 'Erreur lors de la déconnexion'));
      return false;
    }
  };


  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      login, 
      logout, 
      refreshUser,
      notifyMemberUpdated,
      subscribe,  // ✨ EXPOSER subscribe
      connectGoogleCalendar,    // ✨ AJOUTÉ
      disconnectGoogleCalendar   // ✨ AJOUTÉ

    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
