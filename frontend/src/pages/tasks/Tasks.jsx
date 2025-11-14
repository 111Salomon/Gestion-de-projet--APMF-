/**
 * ═══════════════════════════════════════════════════════════
 * TASKS PAGE - Page de Gestion des Tâches (Smart Component)
 * ═══════════════════════════════════════════════════════════
 * 
 * RESPONSABILITÉ : Orchestrer tous les composants liés aux tâches
 * 
 * PRINCIPE : Container/Presentational Pattern
 * - Ce composant gère la LOGIQUE (API, état, actions)
 * - Les composants enfants gèrent l'AFFICHAGE (TaskCard, TaskForm)
 * 
 * ARCHITECTURE :
 * Tasks (Smart)
 *   ├─ TaskCard (Dumb) × N
 *   ├─ Modal > TaskForm (Dumb)
 *   └─ ConfirmModal (Dumb)
 */

import { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter,
  Grid3x3,
  List
} from 'lucide-react';
import { Layout } from '../../components/layout/Layout';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { ConfirmModal } from '../../components/common/ConfirmModal';
import { TaskCard } from '../../components/tasks/TaskCard';
import { TaskForm } from '../../components/forms/TaskForm';
import { tasksAPI } from '../../api/tasks';
import { useStats } from '../../context/StatsContext';
import toast from 'react-hot-toast';

/**
 * ───────────────────────────────────────────────────────────
 * COMPOSANT TASKS PAGE
 * ───────────────────────────────────────────────────────────
 * 
 * C'est LE composant principal qui gère tout.
 */
export const Tasks = () => {
  
  /**
   * ─────────────────────────────────────────────────────────
   * ÉTAT : Gestion des Données
   * ─────────────────────────────────────────────────────────
   * 
   * PRINCIPE : Single Source of Truth
   * 
   * Toutes les données de la page sont dans l'état de ce composant.
   * Les composants enfants ne font QUE lire ces données via props.
   */
  
  /**
   * Liste des tâches
   * 
   * PRINCIPE : État initialisé comme tableau vide
   * On ne met jamais null ou undefined, toujours [] pour un tableau.
   * Pourquoi ? Pour éviter les erreurs .map() sur null.
   * 
   * Structure d'une tâche :
   * {
   *   id: 1,
   *   title: "Créer le design",
   *   description: "Maquettes Figma",
   *   status: "todo",
   *   priority: "high",
   *   project: 5,
   *   assigned_to: 2,
   *   due_date: "2025-11-20",
   *   created_at: "2025-11-14T10:00:00Z"
   * }
   */
  const [tasks, setTasks] = useState([]);
  
  /**
   * État de chargement
   * 
   * PRINCIPE : Loading States pour la UX
   * Permet d'afficher un spinner pendant le chargement.
   */
  const [loading, setLoading] = useState(true);
  
  /**
   * Requête de recherche
   * 
   * PRINCIPE : Controlled Input
   * La valeur de l'input est liée à cet état.
   */
  const [searchQuery, setSearchQuery] = useState('');
  
  /**
   * Filtre de statut
   * 
   * PRINCIPE : Filtrage côté client
   * On charge toutes les tâches, puis on filtre localement.
   * 
   * Alternative : Filtrage côté serveur
   * fetch('/api/tasks/?status=todo')
   */
  const [statusFilter, setStatusFilter] = useState('all');
  
  /**
   * Filtre de priorité
   */
  const [priorityFilter, setPriorityFilter] = useState('all');

  /**
   * ─────────────────────────────────────────────────────────
   * ÉTAT : Gestion des Modals
   * ─────────────────────────────────────────────────────────
   * 
   * PRINCIPE : Modal State Management
   * Chaque modal a son propre état ouvert/fermé.
   */
  
  /**
   * Modal de création/édition
   */
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  /**
   * Tâche en cours d'édition
   * 
   * PRINCIPE : Mode Création vs Édition
   * - Si editingTask = null → Mode création
   * - Si editingTask = {...} → Mode édition (pré-rempli)
   */
  const [editingTask, setEditingTask] = useState(null);
  
  /**
   * État de soumission du formulaire
   */
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  /**
   * Modal de confirmation de suppression
   */
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  /**
   * ─────────────────────────────────────────────────────────
   * CONTEXT : Statistiques Globales
   * ─────────────────────────────────────────────────────────
   * 
   * PRINCIPE : Context API pour l'état global
   * 
   * refreshStats() permet de mettre à jour le badge dans la sidebar
   * après création/suppression d'une tâche.
   */
  const { refreshStats } = useStats();

  /**
   * ─────────────────────────────────────────────────────────
   * EFFET : Chargement Initial
   * ─────────────────────────────────────────────────────────
   * 
   * PRINCIPE : useEffect au Montage du Composant
   * 
   * useEffect(() => { ... }, [])
   *                           ↑
   *                  [] = s'exécute UNE SEULE FOIS
   * 
   * CYCLE DE VIE :
   * 1. Composant monte (s'affiche)
   * 2. useEffect s'exécute
   * 3. loadTasks() fait un appel API
   * 4. setTasks(data) met à jour l'état
   * 5. React re-rend avec les tâches
   */
  useEffect(() => {
    loadTasks();
  }, []); // ← Dépendances vides = une seule fois au montage

  /**
   * ─────────────────────────────────────────────────────────
   * FONCTION : Charger les Tâches
   * ─────────────────────────────────────────────────────────
   * 
   * PRINCIPE : Async/Await avec Try/Catch
   * 
   * FLOW :
   * 1. setLoading(true) → Affiche le spinner
   * 2. await tasksAPI.getAll() → Attend la réponse de l'API
   * 3. Gère le format de réponse (array ou paginated)
   * 4. setTasks(data) → Met à jour l'état
   * 5. setLoading(false) → Cache le spinner
   * 6. En cas d'erreur → Affiche une notification
   */
  const loadTasks = async () => {
    try {
      setLoading(true);
      
      // Appel à l'API (créée dans Étape 1)
      const data = await tasksAPI.getAll();
      
      /**
       * PRINCIPE : Gestion des Formats de Réponse
       * 
       * Django REST Framework peut retourner :
       * 
       * Format 1 : Array direct
       * [{ id: 1, ... }, { id: 2, ... }]
       * 
       * Format 2 : Objet paginé
       * {
       *   count: 50,
       *   next: "http://...",
       *   previous: null,
       *   results: [{ id: 1, ... }, { id: 2, ... }]
       * }
       * 
       * On gère les deux cas.
       */
      const tasksList = Array.isArray(data) 
        ? data 
        : (data.results || []);
      
      /**
       * SÉCURITÉ : Filtrer les tâches invalides
       * Si une tâche n'a pas de titre, on l'ignore.
       */
      const validTasks = tasksList.filter(t => t && t.title);
      
      console.log('📋 Tâches chargées:', validTasks.length);
      
      setTasks(validTasks);
      
    } catch (error) {
      /**
       * PRINCIPE : Gestion Centralisée des Erreurs
       * 
       * L'intercepteur axios (dans axios.js) gère déjà les erreurs 401.
       * Ici, on gère les erreurs métier (réseau, serveur down, etc.)
       */
      console.error('❌ Erreur chargement tâches:', error);
      toast.error('Erreur lors du chargement des tâches');
      
      // Assure qu'on a toujours un tableau (jamais null)
      setTasks([]);
      
    } finally {
      /**
       * PRINCIPE : Finally Block
       * 
       * finally s'exécute TOUJOURS, que l'opération réussisse ou échoue.
       * Idéal pour désactiver le loading.
       */
      setLoading(false);
    }
  };

  /**
   * ─────────────────────────────────────────────────────────
   * FONCTION : Ouvrir le Modal de Création
   * ─────────────────────────────────────────────────────────
   * 
   * PRINCIPE : Réinitialisation de l'État
   * 
   * Important : Remettre editingTask à null pour indiquer
   * qu'on est en mode CRÉATION (pas édition).
   */
  const handleCreate = () => {
    setEditingTask(null);  // ← Mode création
    setIsModalOpen(true);
  };

  /**
   * ─────────────────────────────────────────────────────────
   * FONCTION : Ouvrir le Modal d'Édition
   * ─────────────────────────────────────────────────────────
   * 
   * PRINCIPE : Passage de Données au Formulaire
   * 
   * On stocke la tâche à éditer dans l'état.
   * TaskForm utilisera ces données pour pré-remplir le formulaire.
   * 
   * @param {Object} task - La tâche à éditer
   */
  const handleEdit = (task) => {
    setEditingTask(task);  // ← Mode édition
    setIsModalOpen(true);
  };

  /**
   * ─────────────────────────────────────────────────────────
   * FONCTION : Soumettre le Formulaire
   * ─────────────────────────────────────────────────────────
   * 
   * PRINCIPE : Création vs Édition (Polymorphisme)
   * 
   * Cette fonction gère les DEUX cas :
   * - Création : editingTask = null
   * - Édition : editingTask = { id: ..., ... }
   * 
   * @param {Object} formData - Données du formulaire
   * 
   * FLOW :
   * 1. setIsSubmitting(true) → Bouton désactivé + spinner
   * 2. Si édition → PUT /api/tasks/:id/
   *    Si création → POST /api/tasks/
   * 3. await loadTasks() → Recharge la liste
   * 4. refreshStats() → Met à jour le badge sidebar
   * 5. setIsModalOpen(false) → Ferme le modal
   * 6. toast.success() → Notification verte
   */
  const handleSubmit = async (formData) => {
    try {
      setIsSubmitting(true);
      
      if (editingTask) {
        /**
         * MODE ÉDITION
         * 
         * PRINCIPE : Update (PUT)
         * On envoie l'ID + les nouvelles données.
         */
        await tasksAPI.update(editingTask.id, formData);
        toast.success('Tâche mise à jour avec succès !');
        
      } else {
        /**
         * MODE CRÉATION
         * 
         * PRINCIPE : Create (POST)
         * Django génère automatiquement l'ID.
         */
        await tasksAPI.create(formData);
        toast.success('Tâche créée avec succès !');
      }
      
      /**
       * IMPORTANT : Recharger les données
       * 
       * On pourrait optimiser en ajoutant/modifiant localement :
       * setTasks([...tasks, newTask])
       * 
       * Mais recharger depuis l'API assure la cohérence avec le serveur.
       */
      await loadTasks();
      
      /**
       * Met à jour les statistiques globales
       * (badge "8" à côté de "Tâches" dans la sidebar)
       */
      refreshStats();
      
      /**
       * Ferme le modal et réinitialise l'état
       */
      setIsModalOpen(false);
      setEditingTask(null);
      
    } catch (error) {
      console.error('❌ Erreur soumission:', error);
      toast.error('Erreur lors de la sauvegarde de la tâche');
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * ─────────────────────────────────────────────────────────
   * FONCTION : Ouvrir le Modal de Suppression
   * ─────────────────────────────────────────────────────────
   * 
   * PRINCIPE : Confirmation avant Action Destructive
   * 
   * UX : Ne jamais supprimer directement sans confirmation.
   * On ouvre d'abord un modal pour demander confirmation.
   * 
   * @param {Object} task - La tâche à supprimer
   */
  const handleDelete = (task) => {
    setTaskToDelete(task);
    setIsDeleteModalOpen(true);
  };

  /**
   * ─────────────────────────────────────────────────────────
   * FONCTION : Confirmer la Suppression
   * ─────────────────────────────────────────────────────────
   * 
   * PRINCIPE : Suppression avec DELETE HTTP
   * 
   * FLOW :
   * 1. User confirme dans le modal
   * 2. DELETE /api/tasks/:id/
   * 3. Django supprime de la base
   * 4. Recharge la liste
   * 5. Ferme le modal
   * 6. Notification
   */
  const confirmDelete = async () => {
    if (!taskToDelete) return;

    try {
      setIsDeleting(true);
      
      /**
       * Appel DELETE à l'API
       * Django retourne généralement un 204 No Content
       */
      await tasksAPI.delete(taskToDelete.id);
      
      toast.success(`Tâche "${taskToDelete.title}" supprimée !`);
      
      // Recharge la liste
      await loadTasks();
      
      // Met à jour les stats
      refreshStats();
      
      // Ferme le modal et nettoie l'état
      setIsDeleteModalOpen(false);
      setTaskToDelete(null);
      
    } catch (error) {
      console.error('❌ Erreur suppression:', error);
      toast.error('Erreur lors de la suppression');
    } finally {
      setIsDeleting(false);
    }
  };

  /**
   * ─────────────────────────────────────────────────────────
   * FONCTION : Annuler la Suppression
   * ─────────────────────────────────────────────────────────
   */
  const cancelDelete = () => {
    setIsDeleteModalOpen(false);
    setTaskToDelete(null);
  };

  /**
   * ─────────────────────────────────────────────────────────
   * FONCTION : Changer le Statut d'une Tâche
   * ─────────────────────────────────────────────────────────
   * 
   * PRINCIPE : Mise à Jour Partielle (PATCH)
   * 
   * On ne renvoie QUE le champ modifié (status).
   * Plus performant qu'un PUT qui renvoie tout.
   * 
   * @param {Object} task - La tâche à modifier
   * @param {string} newStatus - Le nouveau statut
   * 
   * FLOW :
   * 1. User clique sur le badge de statut
   * 2. TaskCard appelle onStatusChange(task, 'done')
   * 3. Cette fonction fait un PATCH
   * 4. Django met à jour le statut
   * 5. On recharge la liste
   */


  /**
   * ─────────────────────────────────────────────────────────
   * FILTRAGE CLIENT-SIDE
   * ─────────────────────────────────────────────────────────
   * 
   * PRINCIPE : Array.filter() avec Conditions Multiples
   * 
   * On applique plusieurs filtres en cascade :
   * 1. Filtre par recherche (titre + description)
   * 2. Filtre par statut
   * 3. Filtre par priorité
   * 
   * PERFORMANCE : O(n) où n = nombre de tâches
   * Pour de grandes listes (>1000), préférer le filtrage serveur.
   * 
   * ALTERNATIVE : Filtrage serveur
   * fetch('/api/tasks/?status=todo&priority=high&search=design')
   */
  const filteredTasks = tasks.filter((task) => {
    /**
     * SÉCURITÉ : Vérifier que la tâche existe et a un titre
     */
    if (!task || !task.title) {
      return false;
    }

    /**
     * FILTRE 1 : Recherche textuelle
     * 
     * PRINCIPE : Recherche insensible à la casse (toLowerCase)
     * On cherche dans le titre ET la description.
     */
    const title = task.title.toLowerCase();
    const description = (task.description || '').toLowerCase();
    const query = searchQuery.toLowerCase().trim();
    
    const matchesSearch = query === '' || 
                         title.includes(query) || 
                         description.includes(query);

    /**
     * FILTRE 2 : Statut
     */
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;

    /**
     * FILTRE 3 : Priorité
     */
    const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;

    /**
     * PRINCIPE : AND Logic (ET)
     * Toutes les conditions doivent être vraies.
     */
    return matchesSearch && matchesStatus && matchesPriority;
  });

  /**
   * ─────────────────────────────────────────────────────────
   * RENDU JSX (Interface Utilisateur)
   * ─────────────────────────────────────────────────────────
   * 
   * STRUCTURE :
   * <Layout>
   *   <Header>
   *   <Filters>
   *   <TasksGrid>
   *   <Modals>
   * </Layout>
   */
  return (
    <Layout>
      {/* ═══════════════════════════════════════════════════ */}
      {/* EN-TÊTE                                              */}
      {/* ═══════════════════════════════════════════════════ */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-neutral-900 mb-2">
              Gestion des Tâches
            </h1>
            <p className="text-neutral-600">
              {filteredTasks.length} tâche{filteredTasks.length > 1 ? 's' : ''} au total
            </p>
          </div>
          
          {/* Bouton Nouvelle Tâche */}
          <Button variant="primary" onClick={handleCreate}>
            <Plus size={18} />
            Nouvelle Tâche
          </Button>
        </div>

        {/* ═════════════════════════════════════════════════ */}
        {/* BARRE DE RECHERCHE ET FILTRES                      */}
        {/* ═════════════════════════════════════════════════ */}
        <div className="flex flex-col md:flex-row gap-4">
          
          {/* Recherche */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher une tâche..."
              className="w-full pl-11 pr-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Filtre Statut */}
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-neutral-500" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">Tous les statuts</option>
              <option value="todo">À faire</option>
              <option value="in_progress">En cours</option>
              <option value="done">Terminé</option>
              <option value="blocked">Bloqué</option>
            </select>
          </div>

          {/* Filtre Priorité */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">Toutes priorités</option>
            <option value="high">Urgente</option>
            <option value="medium">Moyenne</option>
            <option value="low">Faible</option>
          </select>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════ */}
      {/* LISTE DES TÂCHES                                     */}
      {/* ═══════════════════════════════════════════════════ */}
      
      {/**
       * PRINCIPE : Conditional Rendering (Rendu Conditionnel)
       * 
       * 3 états possibles :
       * 1. Loading → Affiche un spinner
       * 2. Aucune tâche → Affiche un message vide
       * 3. Tâches → Affiche la grille
       */}
      
      {loading ? (
        // ────────── État Loading ──────────
        <div className="text-center py-12">
          <div className="inline-block w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-neutral-600 mt-4">Chargement des tâches...</p>
        </div>
        
      ) : filteredTasks.length === 0 ? (
        // ────────── État Vide ──────────
        <div className="text-center py-12">
          <p className="text-neutral-600 mb-4">
            {searchQuery || statusFilter !== 'all' || priorityFilter !== 'all'
              ? 'Aucune tâche ne correspond aux filtres'
              : 'Aucune tâche créée'}
          </p>
          <Button variant="primary" onClick={handleCreate}>
            <Plus size={18} />
            Créer la première tâche
          </Button>
        </div>
        
      ) : (
        // ────────── Grille de Tâches ──────────
        /**
         * PRINCIPE : Grid Layout Responsive
         * 
         * grid-cols-1 : 1 colonne sur mobile
         * md:grid-cols-2 : 2 colonnes sur tablette (≥768px)
         * lg:grid-cols-3 : 3 colonnes sur desktop (≥1024px)
         * 
         * gap-6 : Espace de 1.5rem entre les cartes
         */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/**
           * PRINCIPE : Array.map() pour Générer des Composants
           * 
           * Pour chaque tâche, on crée une TaskCard.
           * 
           * IMPORTANT : key={task.id}
           * React utilise la key pour identifier chaque élément
           * et optimiser le re-rendu.
           */}
          {filteredTasks.map((task) => (
            <TaskCard
              key={task.id}           // ← Clé unique obligatoire
              task={task}             // ← Données de la tâche
              onEdit={handleEdit}     // ← Callback pour éditer
              onDelete={handleDelete} // ← Callback pour supprimer
            />
          ))}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════ */}
      {/* MODAL DE CRÉATION/ÉDITION                           */}
      {/* ═══════════════════════════════════════════════════ */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingTask ? 'Modifier la Tâche' : 'Nouvelle Tâche'}
        size="lg"
      >
        <TaskForm
          onSubmit={handleSubmit}
          onCancel={() => setIsModalOpen(false)}
          initialData={editingTask}  // ← null = création, {...} = édition
          isLoading={isSubmitting}
        />
      </Modal>

      {/* ═══════════════════════════════════════════════════ */}
      {/* MODAL DE CONFIRMATION DE SUPPRESSION                */}
      {/* ═══════════════════════════════════════════════════ */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={cancelDelete}
        onConfirm={confirmDelete}
        title="Supprimer la tâche ?"
        message={`Êtes-vous sûr de vouloir supprimer la tâche "${taskToDelete?.title}" ? Cette action est irréversible.`}
        confirmText="Supprimer"
        cancelText="Annuler"
        isLoading={isDeleting}
        variant="danger"
      />
    </Layout>
  );
};

/**
 * ═══════════════════════════════════════════════════════════
 * CONCEPTS REACT UTILISÉS
 * ═══════════════════════════════════════════════════════════
 * 
 * 1. MULTIPLE useState
 *    - Gérer plusieurs états indépendants
 * 
 * 2. useEffect avec []
 *    - Charger les données au montage
 * 
 * 3. ASYNC/AWAIT
 *    - Opérations asynchrones (API calls)
 * 
 * 4. TRY/CATCH/FINALLY
 *    - Gestion des erreurs
 * 
 * 5. ARRAY.FILTER()
 *    - Filtrage côté client
 * 
 * 6. ARRAY.MAP()
 *    - Génération de composants
 * 
 * 7. CONDITIONAL RENDERING
 *    - {condition ? A : B}
 *    - {condition && <Component />}
 * 
 * 8. PROPS DRILLING
 *    - Passage de fonctions aux enfants via props
 * 
 * 9. LIFTING STATE UP
 *    - L'état est dans le parent, les enfants le modifient via callbacks
 * 
 * 10. CONTEXT API
 *     - useStats() pour l'état global
 */
