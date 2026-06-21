import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DndContext, DragOverlay, closestCorners, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { Layers } from 'lucide-react';
import toast from 'react-hot-toast';
import { getApiErrorMessage } from '../../utils/apiError';

import { Layout } from '../../components/layout/Layout';
import { KanbanColumn } from '../../components/kanban/KanbanColumn';

import { tasksAPI } from '../../api/tasks';
import { projectsAPI } from '../../api/projects';
import { useStats } from '../../context/StatsContext';

/**
 * 📋 Page Kanban - Vue Board avec Drag & Drop
 * Affiche les tâches en colonnes selon leur statut
 */
export const Kanban = () => {
  const navigate = useNavigate();
  const { refreshStats } = useStats();

  // ══════════════════════════════════════════════
  // 📦 ÉTAT
  // ══════════════════════════════════════════════

  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeCard, setActiveCard] = useState(null);

  // ══════════════════════════════════════════════
  // 📊 CONFIGURATION
  // ══════════════════════════════════════════════

  const COLUMNS = [
    { id: 'todo', title: 'À faire', color: 'neutral' },
    { id: 'in_progress', title: 'En cours', color: 'blue' },
    { id: 'in_review', title: 'En révision', color: 'amber' },
    { id: 'done', title: 'Terminé', color: 'green' },
  ];

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  // ══════════════════════════════════════════════
  // 🔄 CHARGEMENT DES DONNÉES
  // ══════════════════════════════════════════════

  useEffect(() => {
    loadData();
  }, [selectedProject]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Chargement parallèle
      const [projectsData, tasksData] = await Promise.all([
        projectsAPI.getAll(),
        tasksAPI.getAllUnpaginated(),
      ]);

      const projectsList = Array.isArray(projectsData)
        ? projectsData
        : projectsData.results || [];

      const tasksList = Array.isArray(tasksData)
        ? tasksData
        : tasksData.results || [];

      setProjects(projectsList);
      setTasks(tasksList);
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Impossible de charger les données'));
      setTasks([]);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  // ══════════════════════════════════════════════
  // 📋 GROUPEMENT DES TÂCHES PAR STATUT
  // ══════════════════════════════════════════════

  const getTasksByStatus = () => {
    if (!Array.isArray(tasks)) {
      return COLUMNS.reduce((acc, column) => {
        acc[column.id] = [];
        return acc;
      }, {});
    }

    // Filtrage par projet
    const filteredTasks = selectedProject
      ? tasks.filter((task) => {
          const projectId =
            typeof task.project === 'object' ? task.project?.id : task.project;
          return Number(projectId) === Number(selectedProject);
        })
      : tasks;

    // Groupement par statut
    return COLUMNS.reduce((acc, column) => {
      acc[column.id] = filteredTasks
        .filter((task) => task.status === column.id)
        .sort((a, b) => (a.order || 0) - (b.order || 0));
      return acc;
    }, {});
  };

  const tasksByStatus = getTasksByStatus();

  // ══════════════════════════════════════════════
  // 🎯 GESTION DU DRAG & DROP
  // ══════════════════════════════════════════════

  const handleDragStart = (event) => {
    const task = tasks.find((t) => t.id === event.active.id);
    setActiveCard(task);
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    setActiveCard(null);

    if (!over) return;

    const taskId = active.id;
    const newStatus = over.id;
    const task = tasks.find((t) => t.id === taskId);

    const validStatuses = ['todo', 'in_progress', 'in_review', 'done'];
    if (!validStatuses.includes(newStatus) || !task || task.status === newStatus) {
      return;
    }

    try {
      // Mise à jour optimiste
      const updatedTasks = tasks.map((t) =>
        t.id === taskId ? { ...t, status: newStatus } : t
      );
      setTasks(updatedTasks);

      await tasksAPI.changeStatus(taskId, newStatus);

      const columnTitle = COLUMNS.find((c) => c.id === newStatus)?.title;
      toast.success(`Tâche déplacée vers "${columnTitle}"`);
      refreshStats();
    } catch (error) {
      setTasks(tasks); // Rollback
      toast.error(getApiErrorMessage(error, 'Impossible de déplacer la tâche'));
    }
  };

  // ══════════════════════════════════════════════
  // 🖱️ HANDLERS
  // ══════════════════════════════════════════════

  const handleTaskClick = (task) => {
    navigate(`/tasks/${task.id}`);
  };

  const handleProjectChange = (e) => {
    const value = e.target.value;
    setSelectedProject(value ? parseInt(value) : null);
  };

  // ══════════════════════════════════════════════
  // 🎨 RENDU
  // ══════════════════════════════════════════════

  if (loading) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-neutral-600 text-sm font-medium">
            Chargement du Kanban...
          </p>
        </div>
      </Layout>
    );
  }

  const tasksCount = Object.values(tasksByStatus).flat().length;

  return (
    <Layout>
      <div className="min-h-screen bg-neutral-50">
        {/* HEADER */}
        <div className="sticky top-0 z-40 bg-white/70 backdrop-blur-xl border-b border-neutral-200/50 shadow-sm mb-6">
          <div className="max-w-[1800px] mx-auto px-6 py-4">
            <div className="flex items-center justify-between gap-4">
              {/* Titre + Compteur */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-neutral-800 to-neutral-900 
                              flex items-center justify-center shadow-md shadow-neutral-900/20">
                  <Layers className="w-5 h-5 text-white" strokeWidth={2.5} />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-neutral-900">Vue Kanban</h1>
                  <p className="text-sm text-neutral-600">
                    {tasksCount} tâche{tasksCount > 1 ? 's' : ''}
                    {selectedProject && ' dans ce projet'}
                  </p>
                </div>
              </div>

              {/* Sélecteur de projet */}
              <select
                value={selectedProject || ''}
                onChange={handleProjectChange}
                className="px-4 py-2.5 text-sm font-medium text-neutral-700
                         bg-white border border-neutral-200 rounded-lg
                         hover:border-neutral-300 hover:bg-neutral-50
                         focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500
                         transition-all duration-200"
              >
                <option value="">Tous les projets</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* BOARD KANBAN */}
        <div className="max-w-[1800px] mx-auto px-6 pb-8">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            {/* Colonnes */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {COLUMNS.map((column) => (
                <KanbanColumn
                  key={column.id}
                  id={column.id}
                  title={column.title}
                  color={column.color}
                  tasks={tasksByStatus[column.id] || []}
                  onTaskClick={handleTaskClick}
                />
              ))}
            </div>

            {/* Overlay drag */}
            <DragOverlay dropAnimation={null}>
              {activeCard && (
                <div
                  className="bg-white/95 backdrop-blur-sm rounded-xl border-2 border-orange-400 p-4 
                           shadow-2xl ring-4 ring-orange-500/20 rotate-3 scale-105"
                  style={{ cursor: 'grabbing', zIndex: 9999 }}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      <svg
                        className="w-4 h-4 text-orange-500"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2.5}
                          d="M4 8h16M4 16h16"
                        />
                      </svg>
                    </div>

                    <div className="flex-1">
                      <h4 className="text-sm font-semibold text-neutral-900 line-clamp-2">
                        {activeCard.title}
                      </h4>

                      {activeCard.priority && (
                        <div className="mt-2">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 
                                     text-xs font-medium rounded
                                     ${activeCard.priority === 'high' ? 'bg-red-100 text-red-700' : ''}
                                     ${activeCard.priority === 'medium' ? 'bg-amber-100 text-amber-700' : ''}
                                     ${activeCard.priority === 'low' ? 'bg-green-100 text-green-700' : ''}`}
                          >
                            {activeCard.priority === 'high' && 'Urgente'}
                            {activeCard.priority === 'medium' && 'Moyenne'}
                            {activeCard.priority === 'low' && 'Faible'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </DragOverlay>
          </DndContext>
        </div>
      </div>
    </Layout>
  );
};

export default Kanban;
