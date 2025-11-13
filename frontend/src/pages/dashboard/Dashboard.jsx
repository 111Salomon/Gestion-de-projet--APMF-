import { useState, useEffect } from 'react';
import { 
  FolderKanban, 
  CheckSquare, 
  Users, 
  Clock,
  Plus 
} from 'lucide-react';
import { Layout } from '../../components/layout/Layout';
import { StatCard } from '../../components/dashboard/StatCard';
import { ProjectCard } from '../../components/dashboard/ProjectCard';
import { RecentActivity } from '../../components/dashboard/RecentActivity';
import { Button } from '../../components/common/Button';
import { useAuth } from '../../context/AuthContext';

/**
 * Page Dashboard principale
 * Affiche les statistiques, projets récents et activités
 */
export const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalProjects: 12,
    activeTasks: 34,
    teamMembers: 8,
    completedToday: 5,
  });

  // Données de démonstration (à remplacer par des appels API)
  const recentProjects = [
    {
      id: 1,
      name: 'Refonte Site Web',
      description: 'Redesign complet du site corporate avec nouveau branding',
      progress: 75,
      status: 'active',
      end_date: '2025-12-15',
      members: [
        { name: 'Alice Martin' },
        { name: 'Bob Dupont' },
        { name: 'Claire Dubois' },
      ],
    },
    {
      id: 2,
      name: 'Application Mobile',
      description: 'Développement de l\'app mobile iOS et Android',
      progress: 45,
      status: 'active',
      end_date: '2026-01-30',
      members: [
        { name: 'David Chen' },
        { name: 'Emma Wilson' },
      ],
    },
    {
      id: 3,
      name: 'Migration Cloud',
      description: 'Migration infrastructure vers AWS',
      progress: 90,
      status: 'active',
      end_date: '2025-11-30',
      members: [
        { name: 'Frank Moore' },
        { name: 'Grace Lee' },
        { name: 'Henry Taylor' },
        { name: 'Iris Brown' },
      ],
    },
  ];

  const recentActivities = [
    {
      type: 'completed',
      title: 'Tâche terminée',
      description: 'Design des maquettes UI validé par le client',
      timestamp: new Date(Date.now() - 1000 * 60 * 30), // Il y a 30 min
    },
    {
      type: 'created',
      title: 'Nouveau projet créé',
      description: 'Projet "Refonte CRM" ajouté à la liste',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // Il y a 2h
    },
    {
      type: 'assigned',
      title: 'Assignation de tâche',
      description: 'Sarah Martin assignée à "Développement API"',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5), // Il y a 5h
    },
    {
      type: 'updated',
      title: 'Mise à jour',
      description: 'Progression du projet "App Mobile" : 45%',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // Il y a 1j
    },
  ];

  return (
    <Layout>
      {/* En-tête avec message de bienvenue */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-neutral-900 mb-2">
          Bienvenue, {user?.full_name || user?.username} 👋
        </h1>
        <p className="text-neutral-600">
          Voici un aperçu de vos projets et tâches en cours
        </p>
      </div>

      {/* Cartes de statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Projets"
          value={stats.totalProjects}
          icon={FolderKanban}
          trend={12}
          color="primary"
        />
        <StatCard
          title="Tâches Actives"
          value={stats.activeTasks}
          icon={CheckSquare}
          trend={8}
          color="success"
        />
        <StatCard
          title="Membres Équipe"
          value={stats.teamMembers}
          icon={Users}
          trend={0}
          color="warning"
        />
        <StatCard
          title="Terminées Aujourd'hui"
          value={stats.completedToday}
          icon={Clock}
          trend={-5}
          color="error"
        />
      </div>

      {/* Section projets récents */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-neutral-900">
            Projets Récents
          </h2>
          <Button variant="primary" size="sm">
            <Plus size={18} />
            Nouveau Projet
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recentProjects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      </div>

      {/* Section activités récentes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activités (2/3 de la largeur) */}
        <div className="lg:col-span-2">
          <RecentActivity activities={recentActivities} />
        </div>

        {/* Widget tâches à venir (1/3 de la largeur) */}
        <div className="card">
          <h3 className="text-lg font-semibold text-neutral-900 mb-4">
            Tâches à Venir
          </h3>
          <div className="space-y-3">
            {[
              { title: 'Réunion client', date: 'Aujourd\'hui, 14h00', priority: 'high' },
              { title: 'Review code', date: 'Demain, 10h00', priority: 'medium' },
              { title: 'Tests unitaires', date: '15 Nov, 9h00', priority: 'low' },
            ].map((task, index) => (
              <div
                key={index}
                className="p-3 bg-neutral-50 rounded-lg hover:bg-neutral-100 transition-colors cursor-pointer"
              >
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    className="mt-1 w-4 h-4 rounded border-neutral-300 text-primary-600"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-neutral-900">
                      {task.title}
                    </p>
                    <p className="text-xs text-neutral-600 mt-1">
                      {task.date}
                    </p>
                  </div>
                  <span className={`
                    px-2 py-1 text-xs font-medium rounded
                    ${task.priority === 'high' ? 'bg-red-100 text-red-700' : ''}
                    ${task.priority === 'medium' ? 'bg-amber-100 text-amber-700' : ''}
                    ${task.priority === 'low' ? 'bg-green-100 text-green-700' : ''}
                  `}>
                    {task.priority}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
};
