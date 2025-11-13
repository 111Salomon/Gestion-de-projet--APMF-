/**
 * API pour la gestion des projets
 * Communique avec Django REST Framework
 */

import axiosInstance from './axios';

export const projectsAPI = {
  /**
   * Récupère la liste de tous les projets
   * 
   * @returns {Promise<Array>} Liste des projets
   * 
   * Exemple de réponse :
   * [
   *   {
   *     id: 1,
   *     name: "Refonte Site Web",
   *     description: "Redesign complet",
   *     status: "active",
   *     start_date: "2025-11-01",
   *     end_date: "2025-12-31",
   *     progress: 75,
   *     created_by: {...},
   *     members: [...]
   *   }
   * ]
   */
  getAll: async () => {
    const response = await axiosInstance.get('/projects/');
    return response.data;
  },

  /**
   * Récupère les projets de l'utilisateur connecté
   * 
   * @returns {Promise<Array>} Liste des projets de l'utilisateur
   */
  getMyProjects: async () => {
    const response = await axiosInstance.get('/projects/my_projects/');
    return response.data;
  },

  /**
   * Récupère un projet par son ID
   * 
   * @param {number} id - ID du projet
   * @returns {Promise<Object>} Détails du projet
   */
  getById: async (id) => {
    const response = await axiosInstance.get(`/projects/${id}/`);
    return response.data;
  },

  /**
   * Crée un nouveau projet
   * 
   * @param {Object} projectData - Données du projet
   * @returns {Promise<Object>} Projet créé
   * 
   * Exemple de données :
   * {
   *   name: "Nouveau Projet",
   *   description: "Description du projet",
   *   status: "active",
   *   start_date: "2025-11-15",
   *   end_date: "2026-01-15"
   * }
   */
  create: async (projectData) => {
    const response = await axiosInstance.post('/projects/', projectData);
    return response.data;
  },

  /**
   * Met à jour un projet existant
   * 
   * @param {number} id - ID du projet
   * @param {Object} projectData - Nouvelles données
   * @returns {Promise<Object>} Projet mis à jour
   */
  update: async (id, projectData) => {
    const response = await axiosInstance.put(`/projects/${id}/`, projectData);
    return response.data;
  },

  /**
   * Supprime un projet
   * 
   * @param {number} id - ID du projet à supprimer
   * @returns {Promise<void>}
   */
  delete: async (id) => {
    await axiosInstance.delete(`/projects/${id}/`);
  },

  /**
   * Ajoute un membre à un projet
   * 
   * @param {number} projectId - ID du projet
   * @param {number} userId - ID de l'utilisateur à ajouter
   * @param {string} role - Rôle (chef ou membre)
   * @returns {Promise<Object>}
   */
  addMember: async (projectId, userId, role = 'membre') => {
    const response = await axiosInstance.post(`/projects/${projectId}/add_member/`, {
      user_id: userId,
      role: role,
    });
    return response.data;
  },

  /**
   * Retire un membre d'un projet
   * 
   * @param {number} projectId - ID du projet
   * @param {number} userId - ID de l'utilisateur à retirer
   * @returns {Promise<Object>}
   */
  removeMember: async (projectId, userId) => {
    const response = await axiosInstance.post(`/projects/${projectId}/remove_member/`, {
      user_id: userId,
    });
    return response.data;
  },
};
