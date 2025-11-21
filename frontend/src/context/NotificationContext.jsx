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
      
      console.log('🔔 Données brutes:', data);
      
      const notifList = Array.isArray(data) ? data : (data.results || []);
      
      console.log('🔔 Notifications extraites:', notifList);
      
      setNotifications(notifList);
      
      // Compte les non lues
      const unread = notifList.filter(n => !n.is_read).length;
      console.log('🔔 Non lues:', unread);
      
      setUnreadCount(unread);
    } catch (error) {
      console.error('Erreur chargement notifications:', error);
      setNotifications([]);
      setUnreadCount(0);
    }
  }, []);

  // Marque comme lue
  const markAsRead = async (id) => {
    try {
      await notificationsAPI.markAsRead(id);
      
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
      
      setNotifications(prev =>
        prev.map(n => ({ ...n, is_read: true }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Erreur tout marquer lu:', error);
    }
  };

  // ✅ POLLING CORRIGÉ : Recharge tout toutes les 10s
  useEffect(() => {
    fetchNotifications(); // Charge au démarrage
    
    const interval = setInterval(() => {
      fetchNotifications();  // ✅ Recharge tout
    }, 30000);  // Toutes les 10 secondes

    return () => clearInterval(interval);
  }, [fetchNotifications]);

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

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications doit être utilisé dans NotificationProvider');
  }
  return context;
};
