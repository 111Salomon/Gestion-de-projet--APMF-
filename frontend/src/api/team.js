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

/**
 * Invite un nouveau membre à rejoindre l'équipe.
 */
export const inviteMember = async (memberData) => {
  try {
    const response = await api.post('/users/team/invite/', memberData);
    return response.data;
  } catch (error) {
    console.error('Erreur lors de l\'invitation:', error);
    throw error;
  }
};

/**
 * Met à jour le rôle d'un membre.
 * 
 * @param {number} userId - ID du membre
 * @param {string} role - Nouveau rôle (admin, chef, membre)
 * @returns {Promise<Object>}
 */
export const updateMemberRole = async (userId, role) => {
  try {
    const response = await api.patch(`/users/team/${userId}/role/`, { role });
    return response.data;
  } catch (error) {
    console.error('Erreur lors de la modification du rôle:', error);
    throw error;
  }
};

/**
 * Active ou désactive un membre (toggle).
 * 
 * @param {number} userId - ID du membre
 * @returns {Promise<Object>}
 */
export const toggleMemberActive = async (userId) => {
  try {
    const response = await api.patch(`/users/team/${userId}/active/`);
    return response.data;
  } catch (error) {
    console.error('Erreur lors du changement de statut:', error);
    throw error;
  }
};


/**
 * Supprime un membre de l'équipe.
 * 
 * @param {number} userId - ID du membre à supprimer
 * @returns {Promise<Object>}
 */
export const deleteMember = async (userId) => {
  try {
    const response = await api.delete(`/users/team/${userId}/delete/`);
    return response.data;
  } catch (error) {
    console.error('Erreur lors de la suppression du membre:', error);
    throw error;
  }
};
