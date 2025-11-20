/**
 * Contexte pour gérer les notifications en temps réel
 */

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { notificationsAPI } from '../api/notifications';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

// Charge les notifications
const fetchNotifications = useCallback(async () => {
  try {
    const data = await notificationsAPI.getAll();

    console.log('🔔 Données brutes:', data);  // ✅ DEBUG
    console.log('🔔 Type:', typeof data);     // ✅ DEBUG
    
    // 🔧 Gère le format paginé : { results: [...] } ou [...]
    const notifList = Array.isArray(data) ? data : (data.results || []);

    console.log('🔔 Notifications extraites:', notifList);  // ✅ DEBUG
    
    setNotifications(notifList);
    
    // Compte les non lues
    const unread = notifList.filter(n => !n.is_read).length;
    console.log('🔔 Non lues:', unread);  // ✅ DEBUG
    setUnreadCount(unread);
  } catch (error) {
    console.error('Erreur chargement notifications:', error);
    setNotifications([]);  // 🔧 Initialise à tableau vide en cas d'erreur
    setUnreadCount(0);
  }
}, []);

  // Charge le compteur uniquement (plus léger)
  const fetchUnreadCount = useCallback(async () => {
    try {
      const count = await notificationsAPI.getUnreadCount();
      setUnreadCount(count);
    } catch (error) {
      console.error('Erreur compteur notifications:', error);
    }
  }, []);

  // Marque comme lue
  const markAsRead = async (id) => {
    try {
      await notificationsAPI.markAsRead(id);
      
      // Met à jour localement
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, is_read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Erreur marquer comme lu:', error);
    }
  };

  // Marque tout comme lu
  const markAllAsRead = async () => {
    try {
      await notificationsAPI.markAllAsRead();
      
      // Met à jour localement
      setNotifications(prev =>
        prev.map(n => ({ ...n, is_read: true }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Erreur tout marquer lu:', error);
    }
  };

  // Polling toutes les 30 secondes
  useEffect(() => {
    fetchNotifications(); // Charge au démarrage
    
    const interval = setInterval(() => {
      fetchUnreadCount(); // Vérifie le compteur toutes les 30s
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchNotifications, fetchUnreadCount]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

// Hook personnalisé
export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications doit être utilisé dans NotificationProvider');
  }
  return context;
};
