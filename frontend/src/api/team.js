/**
 * API Service pour la gestion de l'équipe.
 */

import api from './axios';


/**
 * Récupère la liste de tous les membres de l'équipe avec leurs statistiques.
 */
export const getTeamMembers = async (filters = {}) => {
  try {
    const params = new URLSearchParams();
    
    if (filters.role) {
      params.append('role', filters.role);
    }
    
    if (filters.search) {
      params.append('search', filters.search);
    }
    
    if (filters.is_active !== undefined) {
      params.append('is_active', filters.is_active);
    }
    
    const queryString = params.toString();
    const url = queryString ? `/users/team/?${queryString}` : '/users/team/';
    
    const response = await api.get(url);
    return response.data;
  } catch (error) {
    console.error('Erreur lors de la récupération des membres:', error);
    throw error;
  }
};


/**
 * Récupère les statistiques globales de l'équipe.
 */
export const getTeamStats = async () => {
  try {
    const response = await api.get('/users/team/stats/');
    return response.data;
  } catch (error) {
    console.error('Erreur lors de la récupération des stats:', error);
    throw error;
  }
};


/**
 * Récupère les détails d'un membre spécifique.
 */
export const getTeamMemberDetail = async (userId) => {
  try {
    const response = await api.get(`/users/team/${userId}/`);
    return response.data;
  } catch (error) {
    console.error('Erreur lors de la récupération des détails:', error);
    throw error;
  }
};
