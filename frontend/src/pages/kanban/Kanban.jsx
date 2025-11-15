import { useState, useEffect } from 'react';
import { DndContext, DragOverlay, closestCorners, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { Plus } from 'lucide-react';
import toast from 'react-hot-toast';

// Imports de vos composants existants
import { Layout } from '../../components/layout/Layout';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';

// Imports des nouveaux composants Kanban
import { KanbanColumn } from '../../components/kanban/KanbanColumn';
import { KanbanCard } from '../../components/kanban/KanbanCard';

// Imports API et contextes
import { tasksAPI } from '../../api/tasks';
import { projectsAPI } from '../../api/projects';
import { useStats } from '../../context/StatsContext';
import { TaskForm } from '../../components/forms/TaskForm';

/**
 * 📋 Page Kanban - Vue Board Style Trello
 * 
 * Affiche les tâches en colonnes selon leur statut avec drag & drop.
 * Permet de changer de statut en glissant-déposant les cartes.
 */
export const Kanban = () => {

  // ══════════════════════════════════════════════
  // 📦 ÉTAT LOCAL
  // ══════════════════════════════════════════════

  const [tasks, setTasks] = useState([]);              // Toutes les tâches
  const [projects, setProjects] = useState([]);        // Liste des projets
  const [selectedProject, setSelectedProject] = useState(null);  // Projet filtré
  const [loading, setLoading] = useState(true);        // État chargement
  const [activeCard, setActiveCard] = useState(null);  // Carte en cours de drag
  
  // Modal détails tâche
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);

  // Context pour rafraîchir les stats de la sidebar
  const { refreshStats } = useStats();

  // ══════════════════════════════════════════════
  // 🎮 CONFIGURATION DRAG & DROP
  // ══════════════════════════════════════════════

  /**
   * Sensors : configure le comportement du drag & drop
   * - PointerSensor : gère souris et tactile
   * - activationConstraint : distance minimale avant de commencer le drag (évite clics accidentels)
   */
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,  // 8px de mouvement avant d'activer le drag
      },
    })
  );

  // ══════════════════════════════════════════════
  // 📊 CONFIGURATION DES COLONNES
  // ══════════════════════════════════════════════

  /**
   * Définition des 4 colonnes Kanban
   * Correspond aux statuts du modèle Task backend
   */
  const COLUMNS = [
    { id: 'todo', title: 'À faire' },
    { id: 'in_progress', title: 'En cours' },
    { id: 'in_review', title: 'En révision' },
    { id: 'done', title: 'Terminé' },
  ];

  // ══════════════════════════════════════════════
  // 🔄 CHARGEMENT DES DONNÉES
  // ══════════════════════════════════════════════

  useEffect(() => {
    loadData();
  }, [selectedProject]);  // Recharge quand on change de projet

  /**
   * Charge les projets et tâches depuis l'API
   */
  const loadData = async () => {
    try {
      setLoading(true);

      // ── Chargement des projets (pour le sélecteur) ──
      const projectsData = await projectsAPI.getAll();
      setProjects(projectsData);


      // ✅ FIX : Vérifier si c'est un tableau ou un objet avec results
    const projectsList = Array.isArray(projectsData) 
      ? projectsData 
      : projectsData.results || [];
    
    setProjects(projectsList);

      // Si aucun projet sélectionné, prendre le premier
      if (!selectedProject && projectsData.length > 0) {
        setSelectedProject(projectsData[0].id);
      }

      // ── Chargement des tâches ──
      const tasksData = await tasksAPI.getAll();
      
    // ✅ FIX : Vérifier si c'est un tableau ou un objet avec results
    const tasksList = Array.isArray(tasksData) 
      ? tasksData 
      : tasksData.results || [];
    
    console.log('📊 Tasks loaded:', tasksList); // Debug



      // Filtrer par projet si un projet est sélectionné
      const filteredTasks = selectedProject 
        ? tasksData.filter(task => task.project?.id === selectedProject)
        : tasksList;

      setTasks(filteredTasks);

    } catch (error) {
      console.error('❌ Erreur chargement Kanban:', error);
      toast.error('Impossible de charger les données');

    // ✅ FIX : Initialiser avec tableaux vides en cas d'erreur
    setTasks([]);
    setProjects([]);

    } finally {
      setLoading(false);
    }
  };

  // ══════════════════════════════════════════════
  // 📋 GROUPEMENT DES TÂCHES PAR STATUT
  // ══════════════════════════════════════════════

/**
 * 📋 Fonction qui groupe les tâches par colonne
 * Retourne un objet : { todo: [...], in_progress: [...], ... }
 * 
 * ✅ SÉCURITÉ : Vérifie que tasks est un tableau valide
 */
const getTasksByStatus = () => {
  // ✅ Protection : si tasks n'est pas un tableau, retourne des colonnes vides
  if (!Array.isArray(tasks)) {
    return COLUMNS.reduce((acc, column) => {
      acc[column.id] = [];
      return acc;
    }, {});
  }

  // ✅ Groupement normal si tasks est valide
  return COLUMNS.reduce((acc, column) => {
    acc[column.id] = tasks
      .filter(task => task.status === column.id)
      .sort((a, b) => a.order - b.order);  // Tri par ordre
    return acc;
  }, {});

  // ⬇️ AJOUT : Log pour debug
  console.log('🔍 COLUMNS:', COLUMNS.map(c => c.id));
  console.log('🔍 Task statuses:', tasks.map(t => ({ id: t.id, status: t.status })));
  console.log('📊 Tasks by status:', result);
  
  return result;
};

const tasksByStatus = getTasksByStatus();


  // ══════════════════════════════════════════════
  // 🎯 GESTION DU DRAG & DROP
  // ══════════════════════════════════════════════

  /**
   * Appelé quand on commence à drag une carte
   */
  const handleDragStart = (event) => {
    const { active } = event;
    const task = tasks.find(t => t.id === active.id);
    setActiveCard(task);  // Sauvegarde la carte en drag
  };

  /**
   * Appelé quand on lâche la carte
   * C'est ici qu'on met à jour le statut dans l'API
   */
  const handleDragEnd = async (event) => {
    const { active, over } = event;

    setActiveCard(null);  // Reset la carte active

    // Si on ne drop pas sur une zone valide, annuler
    if (!over) return;

    const taskId = active.id;
    const newStatus = over.id;  // ID de la colonne = statut

    // Trouver la tâche qu'on a bougée
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    // Si le statut n'a pas changé, pas besoin d'update
    if (task.status === newStatus) return;

    try {
      // ── Mise à jour optimiste (UI d'abord) ──
      const updatedTasks = tasks.map(t =>
        t.id === taskId ? { ...t, status: newStatus } : t
      );
      setTasks(updatedTasks);

      // ── Appel API pour persister le changement ──
      await tasksAPI.updateStatusKanban(taskId, newStatus, task.order);

      // ── Notification de succès ──
      toast.success(`Tâche déplacée vers "${COLUMNS.find(c => c.id === newStatus)?.title}"`);

      // ── Rafraîchir les stats de la sidebar ──
      refreshStats();

    } catch (error) {
      console.error('❌ Erreur update statut:', error);
      
      // ── Rollback en cas d'erreur ──
      setTasks(tasks);  // Restaure l'état précédent
      toast.error('Impossible de déplacer la tâche');
    }
  };

  /**
   * Appelé pendant le drag (optionnel, pour animations)
   */
  const handleDragOver = (event) => {
    // On pourrait ajouter des effets visuels ici
  };

  // ══════════════════════════════════════════════
  // 🖱️ HANDLERS D'ACTIONS
  // ══════════════════════════════════════════════

  /**
   * Ouvre le modal détails au clic sur une carte
   */
  const handleTaskClick = (task) => {
    setSelectedTask(task);
    setIsTaskModalOpen(true);
  };

  /**
   * Ferme le modal et recharge les données
   */
  const handleCloseModal = () => {
    setIsTaskModalOpen(false);
    setSelectedTask(null);
    loadData();  // Recharge pour voir les modifications
  };

  /**
   * Change le projet filtré
   */
  const handleProjectChange = (e) => {
    const projectId = parseInt(e.target.value);
    setSelectedProject(projectId || null);
  };

  // ══════════════════════════════════════════════
  // 🎨 RENDU DU COMPOSANT
  // ══════════════════════════════════════════════

  // Affiche le spinner pendant le chargement
  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
          <LoadingSpinner size="lg" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6">

        {/* ── HEADER : Titre + Filtres + Actions ── */}
        <div className="mb-6 flex justify-between items-center">
          
          {/* Titre */}
          <div>
            <h1 className="text-2xl font-semibold text-neutral-900">
              Vue Kanban
            </h1>
            <p className="text-neutral-600 text-sm mt-1">
              {tasks.length} tâche{tasks.length > 1 ? 's' : ''} au total
            </p>
          </div>

          {/* Actions : Sélecteur projet + Bouton nouvelle tâche */}
          <div className="flex gap-3 items-center">
            
            {/* Sélecteur de projet */}
            <select
              value={selectedProject || ''}
              onChange={handleProjectChange}
              className="border border-neutral-300 rounded-lg px-4 py-2 
                         text-neutral-700 focus:ring-2 focus:ring-primary-500
                         bg-white"
            >
              <option value="">Tous les projets</option>
              {projects.map(project => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>

            {/* Bouton nouvelle tâche */}
            <Button
              variant="primary"
              onClick={() => setIsTaskModalOpen(true)}
            >
              <Plus size={20} />
              Nouvelle Tâche
            </Button>

          </div>
        </div>

        {/* ── BOARD KANBAN ── */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          
          {/* Conteneur horizontal des colonnes */}
          <div className="kanban-board">
            
            {/* Rendu des 4 colonnes */}
            {COLUMNS.map(column => (
              <KanbanColumn
                key={column.id}
                id={column.id}
                title={column.title}
                tasks={tasksByStatus[column.id] || []}
                onTaskClick={handleTaskClick}
              />
            ))}

          </div>

          {/* Overlay : carte suivant le curseur pendant le drag */}
          <DragOverlay>
            {activeCard && (
              <div className="kanban-card opacity-90 shadow-2xl">
                <h4 className="text-sm font-medium">{activeCard.title}</h4>
              </div>
            )}
          </DragOverlay>

        </DndContext>

        {/* ── MODAL DÉTAILS/CRÉATION TÂCHE ── */}
        <Modal
          isOpen={isTaskModalOpen}
          onClose={handleCloseModal}
          title={selectedTask ? 'Détails de la tâche' : 'Nouvelle tâche'}
          size="lg"
        >
          <TaskForm
            task={selectedTask}
            onSuccess={handleCloseModal}
            onCancel={handleCloseModal}
          />
        </Modal>

      </div>
    </Layout>
  );
};

export default Kanban;
