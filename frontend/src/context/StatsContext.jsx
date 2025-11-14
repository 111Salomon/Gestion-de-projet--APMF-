import { createContext, useContext, useState, useEffect } from 'react';
import { projectsAPI } from '../api/projects';
import { tasksAPI } from '../api/tasks';

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
    // Charge les projets ET les tâches en parallèle
    const projectsData = await projectsAPI.getAll();
    const tasksData = await tasksAPI.getAll();  // ← Charge les tâches
    
    // Gère le format paginé
    const projectsList = Array.isArray(projectsData) 
      ? projectsData 
      : (projectsData.results || []);
    
    const tasksList = Array.isArray(tasksData) 
      ? tasksData 
      : (tasksData.results || []);

    // Met à jour les stats avec les vraies données
    setStats({
      projectsCount: projectsList.length,
      tasksCount: tasksList.length,  // ← Nombre réel de tâches
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
