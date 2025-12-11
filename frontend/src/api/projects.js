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
getAll: async (params = {}) => {
  const response = await axiosInstance.get('/projects/', { params });
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
   * Récupère les statistiques d'un projet
   * 
   * @param {number} id - ID du projet
   * @returns {Promise<Object>} Stats du projet
   * 
   * Exemple de réponse :
   * {
   *   total_tasks: 20,
   *   todo: 5,
   *   in_progress: 8,
   *   in_review: 3,
   *   done: 4,
   *   completion_percentage: 20.0,
   *   overdue_tasks: 2
   * }
   */
  getStats: async (id) => {
    const response = await axiosInstance.get(`/projects/${id}/stats/`);
    return response.data;
  },

  /**
   * Récupère les tâches d'un projet
   * 
   * @param {number} id - ID du projet
   * @returns {Promise<Array>} Liste des tâches du projet
   */
  getTasks: async (id) => {
    const response = await axiosInstance.get('/tasks/', {
      params: { project: id }
    });
    return response.data;
  },

  // ═══════════════════════════════════════════════════════════════════
  // 👥 GESTION DES MEMBRES
  // ═══════════════════════════════════════════════════════════════════

  /**
   * 🆕 Récupère la liste des membres d'un projet
   * 
   * @param {number} projectId - ID du projet
   * @returns {Promise<Array>} Liste des membres
   * 
   * Exemple de réponse :
   * [
   *   {
   *     id: 1,
   *     user: {
   *       id: 2,
   *       username: "john_doe",
   *       email: "john@example.com",
   *       full_name: "John Doe",
   *       avatar: "http://...",
   *       role: "developer"
   *     },
   *     role: "developer",
   *     role_display: "Développeur",
   *     joined_at: "2025-11-15T10:30:00Z"
   *   }
   * ]
   */
  getMembers: async (projectId) => {
    const response = await axiosInstance.get(`/projects/${projectId}/members/`);
    return response.data;
  },

  /**
   * 🔧 Ajoute un membre à un projet
   * (URL mise à jour vers /members/add/)
   * 
   * @param {number} projectId - ID du projet
   * @param {number} userId - ID de l'utilisateur à ajouter
   * @param {string} role - Rôle (member, developer, manager, viewer)
   * @returns {Promise<Object>} Données du membre ajouté
   * 
   * Exemple de réponse :
   * {
   *   id: 1,
   *   user: {...},
   *   role: "developer",
   *   role_display: "Développeur",
   *   joined_at: "2025-11-18T11:20:00Z"
   * }
   */
  addMember: async (projectId, userId, role = 'member') => {
    const response = await axiosInstance.post(
      `/projects/${projectId}/members/add/`,  // 🔧 URL mise à jour
      {
        user_id: userId,
        role: role,
      }
    );
    return response.data;
  },

  /**
   * 🔧 Retire un membre d'un projet
   * (URL mise à jour vers /members/{user_id}/remove/)
   * 
   * @param {number} projectId - ID du projet
   * @param {number} userId - ID de l'utilisateur à retirer
   * @returns {Promise<void>}
   */
  removeMember: async (projectId, userId) => {
    await axiosInstance.delete(
      `/projects/${projectId}/members/${userId}/remove/`  // 🔧 URL mise à jour
    );
  },

  /**
   * 🆕 Modifie le rôle d'un membre
   * 
   * @param {number} projectId - ID du projet
   * @param {number} userId - ID de l'utilisateur
   * @param {string} newRole - Nouveau rôle (member, developer, manager, viewer)
   * @returns {Promise<Object>} Données du membre mis à jour
   * 
   * Exemple de réponse :
   * {
   *   id: 1,
   *   user: {...},
   *   role: "manager",
   *   role_display: "Manager",
   *   joined_at: "2025-11-15T10:30:00Z"
   * }
   */
  updateMemberRole: async (projectId, userId, newRole) => {
    const response = await axiosInstance.patch(
      `/projects/${projectId}/members/${userId}/role/`,
      {
        role: newRole
      }
    );
    return response.data;
  },

  /**
   * 🆕 Récupère la liste des utilisateurs disponibles
   * (pour ajouter des membres à un projet)
   * 
   * @returns {Promise<Array>} Liste des utilisateurs actifs
   * 
   * Exemple de réponse :
   * [
   *   {
   *     id: 2,
   *     username: "alice",
   *     email: "alice@example.com",
   *     full_name: "Alice Martin",
   *     avatar: "http://...",
   *     role: "developer"
   *   }
   * ]
   */
  getAvailableUsers: async () => {
    const response = await axiosInstance.get('/projects/available_users/');
    return response.data;
  },


    // ═══════════════════════════════════════════════════════════════════
  // 📤 EXPORT COMPLET DE PROJET (AJOUTÉ)
  // ═══════════════════════════════════════════════════════════════════

  /**
   * 🆕 Exporte un projet complet en PDF
   * 
   * @param {number} projectId - ID du projet
   * @returns {Promise<Blob>} Fichier PDF
   */
  exportProjectPDF: async (projectId) => {
    const response = await axiosInstance.get(`/projects/${projectId}/export/pdf/`, {
      responseType: 'blob', // Important pour télécharger le fichier
    });
    return response.data;
  },

  /**
   * 🆕 Exporte un projet complet en Excel
   * 
   * @param {number} projectId - ID du projet
   * @returns {Promise<Blob>} Fichier Excel (.xlsx)
   */
  exportProjectExcel: async (projectId) => {
    const response = await axiosInstance.get(`/projects/${projectId}/export/excel/`, {
      responseType: 'blob',
    });
    return response.data;
  },

  /**
   * 🆕 Exporte un projet complet en archive ZIP
   * 
   * @param {number} projectId - ID du projet
   * @returns {Promise<Blob>} Archive ZIP
   */
  exportProjectArchive: async (projectId) => {
    const response = await axiosInstance.get(`/projects/${projectId}/export/archive/`, {
      responseType: 'blob',
    });
    return response.data;
  },



    /**
   * 📊 Récupère les analytics d'un projet spécifique.
   * 
   * @param {number} projectId - ID du projet
   * @param {number} days - Période d'analyse (défaut: 30)
   * @returns {Promise<Object>} Analytics du projet
   */
  getProjectAnalytics: async (projectId, days = 30) => {
    const response = await axiosInstance.get(`/projects/${projectId}/analytics/`, {
      params: { days }
    });
    return response.data;
  },
};


