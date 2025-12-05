// Tasks.jsx - Page de Gestion des Tâches avec Filtrage Serveur

import { useState, useEffect } from 'react';
import { Plus, Search, Filter } from 'lucide-react';
import { Layout } from '../../components/layout/Layout';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { ConfirmModal } from '../../components/common/ConfirmModal';
import { Pagination } from '../../components/common/Pagination';
import { TaskCard } from '../../components/tasks/TaskCard';
import { TaskForm } from '../../components/forms/TaskForm';
import { tasksAPI } from '../../api/tasks';
import { useStats } from '../../context/StatsContext';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';  // 🆕 AJOUTER
import { canCreateTaskGlobal } from '../../utils/permissions';  // 🆕 AJOUTER


export const Tasks = () => {
  const { user } = useAuth();

  const canCreate = canCreateTaskGlobal(user);
  // États - Données
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  

  // États - Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // États - Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Context
  const { refreshStats } = useStats();

  // Chargement initial
  useEffect(() => {
    loadTasks(1);
  }, []);

  // 🆕 Recharge quand les filtres changent (retour à la page 1)
  useEffect(() => {
    if (loading) return; // Skip le premier render
    loadTasks(1);
  }, [statusFilter, priorityFilter, searchQuery]);

  // Charge les tâches avec filtres côté serveur
  const loadTasks = async (page = 1) => {
    try {
      setLoading(true);
      
      // Prépare les paramètres avec filtres
      const params = { page };
      if (statusFilter !== 'all') params.status = statusFilter;
      if (priorityFilter !== 'all') params.priority = priorityFilter;
      if (searchQuery.trim()) params.search = searchQuery.trim();
      
      console.log('📡 Requête API:', params);
      
      const data = await tasksAPI.getAll(params);
      
      // Gère la réponse paginée
      if (data.results) {
        const validTasks = data.results.filter(t => t && t.title);
        setTasks(validTasks);
        setTotalCount(data.count);
        setTotalPages(Math.ceil(data.count / 20));
        setCurrentPage(page);
        console.log(`✅ ${data.count} tâches trouvées`);
      } else {
        const validTasks = data.filter(t => t && t.title);
        setTasks(validTasks);
        setTotalCount(validTasks.length);
        setTotalPages(1);
        setCurrentPage(1);
      }
      
    } catch (error) {
      console.error('❌ Erreur chargement:', error);
      toast.error('Erreur lors du chargement des tâches');
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  // Change de page
  const handlePageChange = (newPage) => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    loadTasks(newPage);
  };

  // Ouvre le modal de création
  const handleCreate = () => {
    setEditingTask(null);
    setIsModalOpen(true);
  };

  // Ouvre le modal d'édition
  const handleEdit = async (task) => {
    try {
      console.log('🔍 Chargement de la tâche complète...');
      const fullTask = await tasksAPI.getById(task.id);
      setEditingTask(fullTask);
      setIsModalOpen(true);
    } catch (error) {
      console.error('❌ Erreur chargement tâche:', error);
      toast.error('Impossible de charger les détails de la tâche');
    }
  };

  // Soumet le formulaire
  const handleSubmit = async (formData) => {
    try {
      setIsSubmitting(true);
      
      if (editingTask) {
        await tasksAPI.update(editingTask.id, formData);
        toast.success('Tâche mise à jour avec succès !');
      } else {
        await tasksAPI.create(formData);
        toast.success('Tâche créée avec succès !');
      }
      
      await loadTasks(currentPage);
      refreshStats();
      setIsModalOpen(false);
      setEditingTask(null);
      
    } catch (error) {
      console.error('❌ Erreur soumission:', error);
      toast.error('Erreur lors de la sauvegarde de la tâche');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Ouvre le modal de suppression
  const handleDelete = (task) => {
    setTaskToDelete(task);
    setIsDeleteModalOpen(true);
  };

  // Confirme la suppression
  const confirmDelete = async () => {
    if (!taskToDelete) return;

    try {
      setIsDeleting(true);
      await tasksAPI.delete(taskToDelete.id);
      toast.success(`Tâche "${taskToDelete.title}" supprimée !`);
      
      await loadTasks(currentPage);
      refreshStats();
      
      setIsDeleteModalOpen(false);
      setTaskToDelete(null);
      
    } catch (error) {
      console.error('❌ Erreur suppression:', error);
      toast.error('Erreur lors de la suppression');
    } finally {
      setIsDeleting(false);
    }
  };

  // Annule la suppression
  const cancelDelete = () => {
    setIsDeleteModalOpen(false);
    setTaskToDelete(null);
  };

  return (
    <Layout>
      {/* EN-TÊTE */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-neutral-900 mb-2">
              Gestion des Tâches
            </h1>
            <p className="text-neutral-600">
              {totalCount} tâche{totalCount > 1 ? 's' : ''} au total
            </p>
          </div>
          
        {/* 🆕 Bouton conditionnel selon le rôle */}
        {canCreate && (
          <Button variant="primary" onClick={handleCreate}>
            <Plus size={18} />
            Nouvelle Tâche
          </Button>
        )}
        </div>

        {/* BARRE DE RECHERCHE ET FILTRES */}
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

      {/* LISTE DES TÂCHES */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-neutral-600 mt-4">Chargement des tâches...</p>
        </div>
        
      ) : tasks.length === 0 ? (
  <div className="text-center py-12">
    <p className="text-neutral-600 mb-4">
      {searchQuery || statusFilter !== 'all' || priorityFilter !== 'all'
        ? 'Aucune tâche ne correspond aux filtres'
        : 'Aucune tâche créée'}
    </p>
    
    {/* 🆕 Bouton ou message selon le rôle */}
    {canCreate ? (
      <Button variant="primary" onClick={handleCreate}>
        <Plus size={18} />
        Créer la première tâche
      </Button>
    ) : (
      <p className="text-neutral-400 text-sm mt-2">
        Vous verrez ici les tâches qui vous sont assignées
      </p>
    )}
  </div>
        
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* PAGINATION */}
      {!loading && tasks.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalCount}
          itemsPerPage={20}
          onPageChange={handlePageChange}
        />
      )}

      {/* MODAL CRÉATION/ÉDITION */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingTask ? 'Modifier la Tâche' : 'Nouvelle Tâche'}
        size="lg"
      >
        <TaskForm
          onSubmit={handleSubmit}
          onCancel={() => setIsModalOpen(false)}
          initialData={editingTask}
          isLoading={isSubmitting}
        />
      </Modal>

      {/* MODAL CONFIRMATION SUPPRESSION */}
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
