/**
 * API pour les notifications
 */

import axiosInstance from './axios';

export const notificationsAPI = {
  // Récupère toutes les notifications
  getAll: async () => {
    const response = await axiosInstance.get('/notifications/');
    return response.data;
  },

  // Récupère les notifications non lues
  getUnread: async () => {
    const response = await axiosInstance.get('/notifications/unread/');
    return response.data;
  },

  // Récupère le nombre de non lues
  getUnreadCount: async () => {
    const response = await axiosInstance.get('/notifications/unread_count/');
    return response.data.count;
  },

  // Marque une notification comme lue
  markAsRead: async (id) => {
    const response = await axiosInstance.post(`/notifications/${id}/mark_as_read/`);
    return response.data;
  },

  // Marque toutes comme lues
  markAllAsRead: async () => {
    const response = await axiosInstance.post('/notifications/mark_all_read/');
    return response.data;
  },
};
