import { createContext, useContext, useState, useEffect } from 'react';
import { projectsAPI } from '../api/projects';

/**
 * Context pour les statistiques de l'application
 * Partage le nombre de projets, tâches, etc. entre tous les composants
 */
const StatsContext = createContext(null);

export const StatsProvider = ({ children }) => {
  const [stats, setStats] = useState({
    projectsCount: 0,
    tasksCount: 0,
    loading: true,
  });

  /**
   * Charge les statistiques au montage
   */
  useEffect(() => {
    loadStats();
  }, []);

  /**
   * Charge toutes les statistiques depuis les APIs
   */
  const loadStats = async () => {
    try {
      // Charge les projets
      const projectsData = await projectsAPI.getAll();
      const projectsList = Array.isArray(projectsData) 
        ? projectsData 
        : (projectsData.results || []);

      // TODO: Charge les tâches quand l'API sera créée
      // const tasksData = await tasksAPI.getAll();

      setStats({
        projectsCount: projectsList.length,
        tasksCount: 8, // Temporaire, à remplacer par l'API
        loading: false,
      });
    } catch (error) {
      console.error('Erreur chargement stats:', error);
      setStats({
        projectsCount: 0,
        tasksCount: 0,
        loading: false,
      });
    }
  };

  /**
   * Recharge les statistiques (appelé après création/suppression)
   */
  const refreshStats = () => {
    loadStats();
  };

  return (
    <StatsContext.Provider value={{ stats, refreshStats }}>
      {children}
    </StatsContext.Provider>
  );
};

/**
 * Hook pour utiliser les stats dans n'importe quel composant
 */
export const useStats = () => {
  const context = useContext(StatsContext);
  if (!context) {
    throw new Error('useStats must be used within StatsProvider');
  }
  return context;
};
