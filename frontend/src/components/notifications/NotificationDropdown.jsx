/**
 * Dropdown des notifications
 */

import { useNavigate } from 'react-router-dom';
import { Bell, Check, CheckCheck, X } from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';
import { useEffect, useRef } from 'react';

export const NotificationDropdown = ({ onClose }) => {
  const navigate = useNavigate();
  const { notifications, markAsRead, markAllAsRead } = useNotifications();
  const dropdownRef = useRef(null);

  // Ferme au clic extérieur
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  // Gère le clic sur une notification
  const handleNotificationClick = async (notification) => {
    // Marque comme lue
    if (!notification.is_read) {
      await markAsRead(notification.id);
    }

    // Redirige vers l'URL
    if (notification.action_url) {
      navigate(notification.action_url);
      onClose();
    }
  };

  // Icône selon le type
  const getIcon = (type) => {
    const icons = {
      task_assigned: '📋',
      task_comment: '💬',
      task_status: '✅',
      project_added: '📁',
    };
    return icons[type] || '🔔';
  };

  return (
    <div
      ref={dropdownRef}
      className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-neutral-200 z-50 max-h-[500px] flex flex-col"
    >
{/* Header */}
<div className="flex items-center justify-between p-4 border-b border-neutral-200">
  <h3 className="text-lg font-semibold text-neutral-900">
    Notifications
  </h3>
  
  {notifications && notifications.filter(n => !n.is_read).length > 0 && (
    <button
      onClick={markAllAsRead}
      className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
    >
      <CheckCheck className="w-4 h-4" />
      Tout marquer lu
    </button>
  )}
</div>

{/* Liste des notifications */}
<div className="overflow-y-auto flex-1">
  {!notifications || notifications.length === 0 ? (
    // Vide
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <Bell className="w-12 h-12 text-neutral-300 mb-3" />
      <p className="text-neutral-500 text-sm">Aucune notification</p>
    </div>
  ) : (
    // Liste
    notifications.map((notification) => (
      <div
        key={notification.id}
        onClick={() => handleNotificationClick(notification)}
        className={`p-4 border-b border-neutral-100 cursor-pointer transition-colors ${
          notification.is_read
            ? 'bg-white hover:bg-neutral-50'
            : 'bg-primary-50 hover:bg-primary-100'
        }`}
      >
        <div className="flex gap-3">
          {/* Icône */}
          <div className="text-2xl flex-shrink-0">
            {getIcon(notification.notification_type)}
          </div>

          {/* Contenu */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-neutral-900 mb-1">
              {notification.title}
            </p>
            <p className="text-sm text-neutral-600 mb-2 line-clamp-2">
              {notification.message}
            </p>
            <p className="text-xs text-neutral-500">
              {notification.time_ago}
            </p>
          </div>

          {/* Badge non lu */}
          {!notification.is_read && (
            <div className="w-2 h-2 bg-primary-600 rounded-full flex-shrink-0 mt-2" />
          )}
        </div>
      </div>
    ))
  )}
</div>

    </div>
  );
};
