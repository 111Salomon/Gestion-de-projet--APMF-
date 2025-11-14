/**
 * ═══════════════════════════════════════════════════════════
 * API TASKS - Couche de communication avec le backend Django
 * ═══════════════════════════════════════════════════════════
 * 
 * Ce fichier centralise TOUTES les requêtes liées aux tâches.
 * 
 * PRINCIPE : Séparation des responsabilités (Separation of Concerns)
 * - Les composants React ne font PAS de fetch() directement
 * - Ils appellent les méthodes de cette API
 * - Si l'URL du backend change, on modifie uniquement ici
 * 
 * PATTERN : Repository Pattern (couche d'accès aux données)
 */

import axiosInstance from './axios';

/**
 * ───────────────────────────────────────────────────────────
 * OBJET tasksAPI
 * ───────────────────────────────────────────────────────────
 * 
 * Contient toutes les méthodes pour gérer les tâches.
 * Chaque méthode = 1 action sur les tâches.
 * 
 * CONVENTION DE NOMMAGE :
 * - getAll()    → Récupérer plusieurs ressources
 * - getById()   → Récupérer une ressource par son ID
 * - create()    → Créer une nouvelle ressource
 * - update()    → Modifier une ressource existante
 * - delete()    → Supprimer une ressource
 */
export const tasksAPI = {
  
  /**
   * ─────────────────────────────────────────────────────────
   * GET /api/tasks/ - Récupérer toutes les tâches
   * ─────────────────────────────────────────────────────────
   * 
   * @returns {Promise<Array>} Liste des tâches
   * 
   * PRINCIPE : Requête asynchrone (async/await)
   * - async/await permet d'attendre la réponse du serveur
   * - Plus lisible que .then().catch()
   * 
   * EXEMPLE DE RÉPONSE (Django) :
   * [
   *   {
   *     id: 1,
   *     title: "Créer le design",
   *     description: "Maquettes Figma",
   *     status: "todo",
   *     priority: "high",
   *     project: 5,
   *     assigned_to: 2,
   *     due_date: "2025-11-20",
   *     created_at: "2025-11-14T08:00:00Z"
   *   },
   *   ...
   * ]
   * 
   * UTILISATION DANS UN COMPOSANT :
   * const tasks = await tasksAPI.getAll();
   * setTasks(tasks);
   */
  getAll: async () => {
    // axiosInstance est déjà configuré avec :
    // - L'URL de base (http://127.0.0.1:8000/api)
    // - Le token JWT dans les headers
    // - La gestion des erreurs 401 (non authentifié)
    const response = await axiosInstance.get('/tasks/');
    
    // response.data contient les données renvoyées par Django
    return response.data;
  },

  /**
   * ─────────────────────────────────────────────────────────
   * GET /api/tasks/:id/ - Récupérer UNE tâche par son ID
   * ─────────────────────────────────────────────────────────
   * 
   * @param {number} id - L'ID de la tâche à récupérer
   * @returns {Promise<Object>} Détails de la tâche
   * 
   * PRINCIPE : Route paramétrique
   * - On passe l'ID dans l'URL
   * - Django retourne la tâche correspondante
   * 
   * EXEMPLE :
   * const task = await tasksAPI.getById(5);
   * console.log(task.title); // "Créer le design"
   */
  getById: async (id) => {
    // Template literals (backticks) pour injecter l'ID dans l'URL
    const response = await axiosInstance.get(`/tasks/${id}/`);
    return response.data;
  },

  /**
   * ─────────────────────────────────────────────────────────
   * POST /api/tasks/ - Créer une nouvelle tâche
   * ─────────────────────────────────────────────────────────
   * 
   * @param {Object} taskData - Données de la tâche à créer
   * @returns {Promise<Object>} Tâche créée (avec son ID)
   * 
   * PRINCIPE : Envoi de données (POST)
   * - Le 2ème paramètre de .post() est le corps de la requête
   * - Axios convertit automatiquement l'objet en JSON
   * - Django crée la tâche et retourne les données complètes
   * 
   * EXEMPLE DE DONNÉES ENVOYÉES :
   * {
   *   title: "Nouvelle tâche",
   *   description: "Description",
   *   status: "todo",
   *   priority: "medium",
   *   project: 3,
   *   assigned_to: 5,
   *   due_date: "2025-12-01"
   * }
   * 
   * EXEMPLE DE RÉPONSE (Django ajoute l'ID) :
   * {
   *   id: 42,  ← Créé par Django
   *   title: "Nouvelle tâche",
   *   ...
   *   created_at: "2025-11-14T08:45:00Z"  ← Créé par Django
   * }
   */
  create: async (taskData) => {
    const response = await axiosInstance.post('/tasks/', taskData);
    return response.data;
  },

  /**
   * ─────────────────────────────────────────────────────────
   * PUT /api/tasks/:id/ - Mettre à jour une tâche
   * ─────────────────────────────────────────────────────────
   * 
   * @param {number} id - ID de la tâche à modifier
   * @param {Object} taskData - Nouvelles données
   * @returns {Promise<Object>} Tâche mise à jour
   * 
   * PRINCIPE : Différence PUT vs PATCH
   * - PUT : Remplacement COMPLET (tous les champs requis)
   * - PATCH : Modification PARTIELLE (seulement les champs modifiés)
   * 
   * On utilise PUT ici pour garder la cohérence avec Django REST Framework.
   * 
   * EXEMPLE :
   * await tasksAPI.update(5, { status: "in_progress" });
   */
  update: async (id, taskData) => {
    const response = await axiosInstance.put(`/tasks/${id}/`, taskData);
    return response.data;
  },

  /**
   * ─────────────────────────────────────────────────────────
   * PATCH /api/tasks/:id/ - Modifier partiellement une tâche
   * ─────────────────────────────────────────────────────────
   * 
   * Utile pour changer uniquement le statut sans tout renvoyer.
   * 
   * EXEMPLE :
   * await tasksAPI.partialUpdate(5, { status: "done" });
   */
  partialUpdate: async (id, taskData) => {
    const response = await axiosInstance.patch(`/tasks/${id}/`, taskData);
    return response.data;
  },

  /**
   * ─────────────────────────────────────────────────────────
   * DELETE /api/tasks/:id/ - Supprimer une tâche
   * ─────────────────────────────────────────────────────────
   * 
   * @param {number} id - ID de la tâche à supprimer
   * @returns {Promise<void>} Pas de données retournées
   * 
   * PRINCIPE : Suppression définitive
   * - Django supprime la tâche de la base de données
   * - Retourne généralement un code 204 (No Content)
   * 
   * ATTENTION : Action irréversible !
   * On utilise toujours un modal de confirmation avant.
   * 
   * EXEMPLE :
   * await tasksAPI.delete(5);
   * toast.success('Tâche supprimée !');
   */
  delete: async (id) => {
    await axiosInstance.delete(`/tasks/${id}/`);
    // Pas de return car DELETE ne retourne généralement rien
  },

  /**
   * ─────────────────────────────────────────────────────────
   * ROUTES PERSONNALISÉES (Custom Actions Django)
   * ─────────────────────────────────────────────────────────
   * 
   * Django REST Framework permet de créer des actions custom
   * avec le décorateur @action.
   * 
   * Ces méthodes correspondent à des endpoints spéciaux.
   */

  /**
   * GET /api/tasks/my_tasks/ - Récupérer MES tâches
   * 
   * PRINCIPE : Filtrage côté serveur
   * - Django filtre automatiquement par utilisateur connecté
   * - Plus performant que de filtrer côté client
   * 
   * EXEMPLE :
   * const myTasks = await tasksAPI.getMyTasks();
   */
  getMyTasks: async () => {
    const response = await axiosInstance.get('/tasks/my_tasks/');
    return response.data;
  },

  /**
   * GET /api/tasks/by_project/:projectId/ - Tâches d'un projet
   * 
   * PRINCIPE : Relation Many-to-One
   * - Une tâche appartient à UN projet
   * - Un projet peut avoir PLUSIEURS tâches
   * 
   * EXEMPLE :
   * const projectTasks = await tasksAPI.getByProject(3);
   */
  getByProject: async (projectId) => {
    const response = await axiosInstance.get(`/tasks/by_project/${projectId}/`);
    return response.data;
  },

  /**
   * POST /api/tasks/:id/change_status/ - Changer le statut
   * 
   * PRINCIPE : Action métier spécifique
   * - Permet de gérer la logique métier côté serveur
   * - Django peut ajouter des validations, logs, notifications
   * 
   * EXEMPLE :
   * await tasksAPI.changeStatus(5, 'done');
   */
  changeStatus: async (id, newStatus) => {
    const response = await axiosInstance.post(`/tasks/${id}/change_status/`, {
      status: newStatus,
    });
    return response.data;
  },
};

/**
 * ═══════════════════════════════════════════════════════════
 * BONNES PRATIQUES
 * ═══════════════════════════════════════════════════════════
 * 
 * 1. GESTION DES ERREURS
 *    Les erreurs sont gérées dans axios.js (interceptor)
 *    Pas besoin de try/catch ici
 * 
 * 2. TYPAGE (si tu utilises TypeScript)
 *    interface Task {
 *      id: number;
 *      title: string;
 *      status: 'todo' | 'in_progress' | 'done';
 *      ...
 *    }
 * 
 * 3. CACHE (optionnel, pour optimiser)
 *    Utiliser React Query ou SWR pour mettre en cache
 *    les données et éviter les requêtes inutiles
 * 
 * 4. CHARGEMENT
 *    Toujours afficher un indicateur de chargement
 *    pendant les requêtes asynchrones
 */
