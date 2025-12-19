/**
 * ═══════════════════════════════════════════════════════════════
 * NOTIFICATION DROPDOWN - DESIGN ÉPURÉ ET MODERNE
 * ═══════════════════════════════════════════════════════════════
 */

import { useNavigate } from 'react-router-dom';
import { 
  Bell, 
  CheckCheck, 
  X,
  ClipboardList,
  MessageSquare,
  CheckCircle2,
  FolderPlus,
  AlertCircle,
  Calendar,
  UserPlus,
  Trash2
} from 'lucide-react';
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

  // Icône selon le type (Lucide icons)
  const getNotificationIcon = (type) => {
    const iconMap = {
      task_assigned: { icon: ClipboardList, color: 'text-blue-600', bg: 'bg-blue-100' },
      task_comment: { icon: MessageSquare, color: 'text-purple-600', bg: 'bg-purple-100' },
      task_status: { icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-100' },
      project_added: { icon: FolderPlus, color: 'text-orange-600', bg: 'bg-orange-100' },
      project_updated: { icon: Calendar, color: 'text-indigo-600', bg: 'bg-indigo-100' },
      member_added: { icon: UserPlus, color: 'text-teal-600', bg: 'bg-teal-100' },
      task_deleted: { icon: Trash2, color: 'text-red-600', bg: 'bg-red-100' },
    };
    
    return iconMap[type] || { icon: Bell, color: 'text-neutral-600', bg: 'bg-neutral-100' };
  };

  const unreadCount = notifications?.filter(n => !n.is_read).length || 0;

  return (
    <div
      ref={dropdownRef}
      className="absolute right-0 mt-2 w-[420px] bg-white rounded-xl shadow-2xl border border-neutral-200 z-50 max-h-[600px] flex flex-col animate-slideDown"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-md shadow-orange-500/20">
            <Bell className="w-5 h-5 text-white" strokeWidth={2.5} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-neutral-900">
              Notifications
            </h3>
            {unreadCount > 0 && (
              <p className="text-xs text-neutral-600">
                {unreadCount} non {unreadCount > 1 ? 'lues' : 'lue'}
              </p>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-orange-700 bg-orange-50 hover:bg-orange-100 rounded-lg transition-all hover:scale-105 active:scale-95"
              title="Tout marquer comme lu"
            >
              <CheckCheck className="w-3.5 h-3.5" strokeWidth={2} />
              Tout lire
            </button>
          )}
          
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-100 rounded-lg transition-colors group"
          >
            <X className="w-4 h-4 text-neutral-600 group-hover:text-neutral-900" strokeWidth={2} />
          </button>
        </div>
      </div>

      {/* Liste des notifications */}
      <div className="overflow-y-auto flex-1 custom-scrollbar">
        {!notifications || notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-6">
            <div className="w-16 h-16 bg-neutral-100 rounded-2xl flex items-center justify-center mb-4">
              <Bell className="w-8 h-8 text-neutral-400" strokeWidth={2} />
            </div>
            <p className="text-neutral-900 font-semibold text-base mb-1">
              Aucune notification
            </p>
            <p className="text-neutral-500 text-sm text-center">
              Vous êtes à jour ! Les nouvelles notifications apparaîtront ici.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-neutral-100">
            {notifications.map((notification) => {
              const { icon: IconComponent, color, bg } = getNotificationIcon(notification.notification_type);
              
              return (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`
                    group relative p-4 cursor-pointer transition-all
                    ${notification.is_read
                      ? 'bg-white hover:bg-neutral-50'
                      : 'bg-orange-50/30 hover:bg-orange-50/50'
                    }
                  `}
                >
                  <div className="flex gap-3">
                    <div className={`
                      w-10 h-10 ${bg} rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm
                      group-hover:scale-110 transition-transform duration-200
                    `}>
                      <IconComponent className={`w-5 h-5 ${color}`} strokeWidth={2} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className="text-sm font-bold leading-snug text-neutral-900">
                          {notification.title}
                        </p>
                        
                        {!notification.is_read && (
                          <div className="w-2 h-2 bg-orange-600 rounded-full flex-shrink-0 mt-1 animate-pulse" />
                        )}
                      </div>
                      
                      <p className="text-sm text-neutral-600 mb-2 line-clamp-2 leading-relaxed">
                        {notification.message}
                      </p>
                      
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-neutral-500 font-medium">
                          {notification.time_ago}
                        </p>
                        
                        {notification.action_url && (
                          <>
                            <span className="text-neutral-300">•</span>
                            <span className="text-xs text-orange-600 font-semibold group-hover:underline">
                              Voir
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="absolute inset-0 border-2 border-transparent group-hover:border-orange-200 rounded-lg pointer-events-none transition-colors" />
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      {notifications && notifications.length > 0 && (
        <div className="border-t border-neutral-200 p-3 bg-neutral-50">
          <button
            onClick={() => {
              navigate('/notifications');
              onClose();
            }}
            className="w-full text-center text-sm font-semibold text-neutral-700 hover:text-orange-600 py-2 rounded-lg hover:bg-white transition-all"
          >
            Voir toutes les notifications
          </button>
        </div>
      )}

      {/* Styles */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #d4d4d8;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #a1a1aa;
        }
        
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slideDown {
          animation: slideDown 0.2s ease-out;
        }
      `}</style>
    </div>
  );
};
