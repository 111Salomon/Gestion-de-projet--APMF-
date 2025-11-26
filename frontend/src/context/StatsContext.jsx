// StatsContext.jsx - Gestion des statistiques globales

import { createContext, useContext, useState, useEffect } from 'react';
import { projectsAPI } from '../api/projects';
import { tasksAPI } from '../api/tasks';

const StatsContext = createContext(null);

export const StatsProvider = ({ children }) => {
  const [stats, setStats] = useState({
    projectsCount: 0,
    tasksCount: 0,
    loading: true,
  });

  useEffect(() => {
    loadStats();
  }, []);

  // Charge les statistiques depuis les APIs
  const loadStats = async () => {
    try {
      // Charge projets ET tâches en parallèle
      const [projectsData, tasksData] = await Promise.all([
        projectsAPI.getAll(),
        tasksAPI.getAll()
      ]);
      
      // 🆕 Gère le format paginé ET array direct
      const projectsCount = projectsData.count 
        ? projectsData.count  // Format paginé : utilise "count"
        : (Array.isArray(projectsData) ? projectsData.length : 0);  // Array direct
      
      const tasksCount = tasksData.count 
        ? tasksData.count  // 🎯 Utilise "count" = 37 (total)
        : (Array.isArray(tasksData) ? tasksData.length : 0);

      console.log('📊 Stats chargées:', { projectsCount, tasksCount });

      setStats({
        projectsCount,
        tasksCount,
        loading: false,
      });

    } catch (error) {
      console.error('❌ Erreur chargement stats:', error);
      setStats({
        projectsCount: 0,
        tasksCount: 0,
        loading: false,
      });
    }
  };

  // Recharge les stats (appelé après création/suppression)
  const refreshStats = () => {
    loadStats();
  };

  return (
    <StatsContext.Provider value={{ stats, refreshStats }}>
      {children}
    </StatsContext.Provider>
  );
};

// Hook pour utiliser les stats
export const useStats = () => {
  const context = useContext(StatsContext);
  if (!context) {
    throw new Error('useStats must be used within StatsProvider');
  }
  return context;
};
