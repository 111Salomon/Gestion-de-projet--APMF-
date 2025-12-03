import axiosInstance from './axios';

export const calendarAPI = {
  
  // GET /api/calendar/tasks/ - Tâches pour le calendrier
  getTasks: async (params = {}) => {
    const response = await axiosInstance.get('/calendar/tasks/', { params });
    return response.data;
  },

  // GET /api/calendar/summary/ - Résumé rapide
  getSummary: async () => {
    const response = await axiosInstance.get('/calendar/summary/');
    return response.data;
  },

  // GET /api/calendar/projects/ - Projets pour filtres
  getProjects: async () => {
    const response = await axiosInstance.get('/calendar/projects/');
    return response.data;
  },

};
