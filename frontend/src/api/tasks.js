// tasks.js - API pour la gestion des tâches

import axiosInstance from './axios';

export const tasksAPI = {

  // GET /api/tasks/ - Liste des tâches (avec pagination normale)
  getAll: async (params = {}) => {
    const response = await axiosInstance.get('/tasks/', { params });
    return response.data;
  },

  
  // ✅ NOUVEAU : Charge TOUTES les pages (spécifique pour Kanban)
  getAllUnpaginated: async (params = {}) => {
    let allTasks = [];
    let nextUrl = '/tasks/';
    
    // 🔄 Boucle pour charger toutes les pages
    while (nextUrl) {
      const response = await axiosInstance.get(nextUrl, { params });
      const data = response.data;
      
      console.log(`📄 Page chargée: ${allTasks.length + data.results.length} tâches au total`);
      
      // Ajouter les résultats de cette page
      allTasks = [...allTasks, ...data.results];
      
      // Y a-t-il une page suivante ?
      if (data.next) {
        // Extraire juste le path (sans le domaine)
        nextUrl = data.next.replace('http://127.0.0.1:8000/api', '');
      } else {
        nextUrl = null;
      }
    }
    
    console.log(`✅ TOTAL CHARGÉ: ${allTasks.length} tâches`);
    
    // Retourner au même format que l'API
    return {
      count: allTasks.length,
      results: allTasks
    };
  },

  // GET /api/tasks/:id/ - Détails d'une tâche
  getById: async (id) => {
    const response = await axiosInstance.get(`/tasks/${id}/`);
    return response.data;
  },

  // POST /api/tasks/ - Créer une tâche
  create: async (taskData) => {
    const response = await axiosInstance.post('/tasks/', taskData);
    return response.data;
  },

  // PUT /api/tasks/:id/ - Mettre à jour une tâche (complète)
  update: async (id, taskData) => {
    const response = await axiosInstance.put(`/tasks/${id}/`, taskData);
    return response.data;
  },

  // PATCH /api/tasks/:id/ - Modification partielle
  partialUpdate: async (id, taskData) => {
    const response = await axiosInstance.patch(`/tasks/${id}/`, taskData);
    return response.data;
  },

  // DELETE /api/tasks/:id/ - Supprimer une tâche
  delete: async (id) => {
    await axiosInstance.delete(`/tasks/${id}/`);
  },

  // GET /api/tasks/my_tasks/ - Tâches assignées à l'utilisateur
  getMyTasks: async () => {
    const response = await axiosInstance.get('/tasks/my_tasks/');
    return response.data;
  },

  // GET /api/tasks/by_project/:projectId/ - Tâches d'un projet
  getByProject: async (projectId) => {
    const response = await axiosInstance.get(`/tasks/by_project/${projectId}/`);
    return response.data;
  },

  // PATCH /api/tasks/:id/change-status/ - Changer le statut
  changeStatus: async (id, newStatus) => {
    const response = await axiosInstance.patch(`/tasks/${id}/change-status/`, {
      status: newStatus,
    });
    return response.data;
  },

  // PATCH /api/tasks/:id/update-order/ - Mise à jour Kanban (statut + ordre)
  updateStatusKanban: async (taskId, status, order) => {
    try {
      const response = await axiosInstance.patch(
        `/tasks/${taskId}/update-order/`,
        { status, order }
      );
      return response.data;
    } catch (error) {
      console.error('❌ Erreur update_order Kanban:', error);
      console.error('❌ Response:', error.response?.data);
      throw error;
    }
  },

  // GET /api/tasks/:taskId/comments/ - Liste des commentaires
  getComments: async (taskId) => {
    const response = await axiosInstance.get(`/tasks/${taskId}/comments/`);
    return response.data;
  },

  // POST /api/tasks/:taskId/comments/ - Ajouter un commentaire
  addComment: async (taskId, data) => {
    const response = await axiosInstance.post(`/tasks/${taskId}/comments/`, data);
    return response.data;
  },

  // PUT /api/comments/:commentId/ - Modifier un commentaire
  updateComment: async (commentId, data) => {
    const response = await axiosInstance.put(`/comments/${commentId}/`, data);
    return response.data;
  },

  // DELETE /api/comments/:commentId/ - Supprimer un commentaire
  deleteComment: async (commentId) => {
    await axiosInstance.delete(`/comments/${commentId}/`);
  },

};
