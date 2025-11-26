import axiosInstance from './axios';

export const dashboardAPI = {
  /**
   * Récupère les statistiques complètes du dashboard
   * 
   * @returns {Promise<Object>} Statistiques du dashboard
   */
  getStats: async () => {
    const response = await axiosInstance.get('/projects/dashboard/stats/');
    return response.data;
  },
};
