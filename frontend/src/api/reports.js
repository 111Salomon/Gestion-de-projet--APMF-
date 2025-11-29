/**
 * 📊 API Analytics - Client pour les endpoints de rapports
 * 
 * Communique avec Django REST Framework pour récupérer :
 * - Performances individuelles
 * - Comparaison d'équipe
 * - Tendances de productivité
 * 
 * @module analytics
 */

import axiosInstance from './axios';

export const reportsAPI = {
  /**
   * 📈 Récupère les performances d'un membre spécifique.
   * 
   * @param {number} userId - ID de l'utilisateur à analyser
   * @param {number} days - Nombre de jours d'historique (défaut: 30)
   * @returns {Promise<Object>} Performances détaillées du membre
   * 
   * @example
   * const perf = await analyticsAPI.getMemberPerformance(1, 30);
   * console.log(perf.summary.completion_rate); // 87.5
   */
  getMemberPerformance: async (userId, days = 30) => {
    const response = await axiosInstance.get('/projects/analytics/performance/', {
      params: { user_id: userId, days }
    });
    return response.data;
  },

  /**
   * 👥 Compare les performances de toute l'équipe.
   * 
   * @param {number|null} projectId - ID du projet (optionnel)
   * @param {number} days - Nombre de jours d'historique (défaut: 30)
   * @returns {Promise<Object>} Classement de l'équipe
   * 
   * @example
   * const team = await analyticsAPI.getTeamComparison(null, 30);
   * console.log(team.team_stats[0].rank); // 1
   */
  getTeamComparison: async (projectId = null, days = 30) => {
    const params = { days };
    if (projectId) {
      params.project_id = projectId;
    }
    
    const response = await axiosInstance.get('/projects/analytics/team-comparison/', {
      params
    });
    return response.data;
  },

  /**
   * 📉 Récupère les tendances de productivité jour par jour.
   * 
   * @param {number} days - Nombre de jours d'historique (défaut: 30)
   * @param {number|null} projectId - Filtrer par projet (optionnel)
   * @returns {Promise<Object>} Données pour graphiques de tendance
   * 
   * @example
   * const trends = await analyticsAPI.getProductivityTrends(7);
   * console.log(trends.daily_data.created); // [{date: "2025-11-22", count: 5}, ...]
   */
  getProductivityTrends: async (days = 30, projectId = null) => {
    const params = { days };
    if (projectId) {
      params.project_id = projectId;
    }
    
    const response = await axiosInstance.get('/projects/analytics/productivity/', {
      params
    });
    return response.data;
  },
};
