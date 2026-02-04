import axiosInstance from './axios';

export const googleCalendarAPI = {
  /**
   * Obtenir la liste des calendriers Google disponibles
   */
  getCalendars: async () => {
    const response = await axiosInstance.get('/calendar/google/calendars/');
    return response.data;
  },

  /**
   * Synchroniser les tâches avec Google Calendar
   */
  syncWithGoogle: async () => {
    const response = await axiosInstance.post('/calendar/google/sync/');
    return response.data;
  },

  /**
   * Déconnecter Google Calendar
   */
  disconnect: async () => {
    const response = await axiosInstance.post('/calendar/google/disconnect/');
    return response.data;
  },

  /**
   * Sélectionner un calendrier Google spécifique
   */
  selectCalendar: async (calendarId) => {
    const response = await axiosInstance.post('/calendar/google/select-calendar/', {
      calendar_id: calendarId
    });
    return response.data;
  }
};