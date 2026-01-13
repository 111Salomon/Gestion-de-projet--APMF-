import axiosInstance from './axios';

export const dashboardAPI = {
  /**
   * 📊 Récupère les statistiques complètes du dashboard (authentifié)
   * 
   * @returns {Promise<Object>} Statistiques du dashboard
   */
  getStats: async () => {
    const response = await axiosInstance.get('/projects/dashboard/stats/');
    return response.data;
  },

  /**
   * 🌐 Récupère les statistiques publiques pour la page de connexion
   * 
   * ✅ Endpoint PUBLIC - Pas d'authentification requise
   * 
   * @returns {Promise<Object>} Statistiques publiques
   */
  getPublicStats: async () => {
    try {
      // Appel direct sans authentification
      const response = await axiosInstance.get('/projects/public/stats/');
      return response.data;
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des stats publiques:', error);
      
      // Retourne des valeurs par défaut en cas d'erreur
      return {
        active_projects: 500,
        satisfaction_rate: 98.0,
        active_users: 200,
        error: true
      };
    }
  },
};
