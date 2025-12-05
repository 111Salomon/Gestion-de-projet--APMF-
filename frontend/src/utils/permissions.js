/**
 * 🔒 Gestion des Permissions Frontend
 * Utilise les permissions calculées par le backend quand disponibles, sinon logique locale
 */

/**
 * Vérifie si l'utilisateur peut MODIFIER une tâche
 */
export const canModifyTask = (user, task) => {
  if (!user || !task) return false;
  
  // ✅ Utilise les permissions backend si disponibles
  if (task.user_permissions?.can_edit !== undefined) {
    return task.user_permissions.can_edit;
  }
  
  // 🔄 Fallback : logique locale (ancien code)
  if (user.role === 'admin' || user.role === 'chef') return true;
  
  const projectOwnerId = task.project?.owner?.id || task.project?.owner;
  if (projectOwnerId && projectOwnerId == user.id) return true;
  
  return false;
};

/**
 * Vérifie si l'utilisateur peut SUPPRIMER une tâche
 */
export const canDeleteTask = (user, task) => {
  if (!user || !task) return false;
  
  // ✅ Utilise les permissions backend si disponibles
  if (task.user_permissions?.can_delete !== undefined) {
    return task.user_permissions.can_delete;
  }
  
  // 🔄 Fallback : même logique que modifier
  return canModifyTask(user, task);
};

/**
 * Vérifie si l'utilisateur peut CHANGER LE STATUT d'une tâche
 */
export const canChangeTaskStatus = (user, task) => {
  if (!user || !task) return false;
  
  // ✅ Utilise les permissions backend si disponibles
  if (task.user_permissions?.can_change_status !== undefined) {
    return task.user_permissions.can_change_status;
  }
  
  // 🔄 Fallback : Manager+ OU assigné
  if (canModifyTask(user, task)) return true;
  if (task.assigned_to?.id === user.id) return true;
  
  return false;
};

/**
 * Vérifie si l'utilisateur peut CRÉER une tâche dans un projet
 */
export const canCreateTask = (user, project) => {
  if (!user || !project) return false;
  
  // Admin ou Chef global
  if (user.role === 'admin' || user.role === 'chef') return true;
  
  // Propriétaire du projet
  const projectOwnerId = project.owner?.id || project.owner;
  if (projectOwnerId && projectOwnerId == user.id) return true;
  
  return false;
};

/**
 * Vérifie si l'utilisateur peut RÉORGANISER les tâches (Kanban)
 */
export const canUpdateTaskOrder = (user, task) => {
  // Même logique que modifier
  return canModifyTask(user, task);
};

/**
 * Vérifie si l'utilisateur peut MODIFIER un projet
 */
export const canModifyProject = (user, project) => {
  if (!user || !project) return false;
  
  // ✅ Utilise les permissions backend si disponibles
  if (project.user_permissions?.can_edit !== undefined) {
    return project.user_permissions.can_edit;
  }
  
  // 🔄 Fallback : Admin/Chef ou propriétaire
  if (user.role === 'admin' || user.role === 'chef') return true;
  
  const projectOwnerId = project.owner?.id || project.owner;
  if (projectOwnerId && projectOwnerId == user.id) return true;
  
  return false;
};

/**
 * Vérifie si l'utilisateur peut SUPPRIMER un projet
 */
export const canDeleteProject = (user, project) => {
  if (!user || !project) return false;
  
  // ✅ Utilise les permissions backend si disponibles
  if (project.user_permissions?.can_delete !== undefined) {
    return project.user_permissions.can_delete;
  }
  
  // 🔄 Fallback : Admin/Chef ou propriétaire
  if (user.role === 'admin' || user.role === 'chef') return true;
  
  const projectOwnerId = project.owner?.id || project.owner;
  if (projectOwnerId && projectOwnerId == user.id) return true;
  
  return false;
};

/**
 * Vérifie si l'utilisateur peut GÉRER LES MEMBRES d'un projet
 */
export const canManageMembers = (user, project) => {
  if (!user || !project) return false;
  
  // ✅ Utilise les permissions backend si disponibles
  if (project.user_permissions?.can_manage_members !== undefined) {
    return project.user_permissions.can_manage_members;
  }
  
  // 🔄 Fallback : Admin/Chef ou propriétaire
  if (user.role === 'admin' || user.role === 'chef') return true;
  
  const projectOwnerId = project.owner?.id || project.owner;
  if (projectOwnerId && projectOwnerId == user.id) return true;
  
  return false;
};

/**
 * Retourne un message d'erreur formaté
 */
export const getPermissionErrorMessage = (action) => {
  return `Vous n'avez pas les droits pour ${action}.`;
};

/**
 * Vérifie si l'utilisateur est au moins Manager (Admin ou Chef)
 */
export const isManagerOrAbove = (user) => {
  if (!user) return false;
  return user.role === 'admin' || user.role === 'chef';
};

/**
 * Vérifie si l'utilisateur est Admin
 */
export const isAdmin = (user) => {
  if (!user) return false;
  return user.role === 'admin';
};

/**
 * Vérifie si l'utilisateur peut CRÉER un nouveau projet
 * Seuls ADMIN et CHEF peuvent créer des projets
 */
export const canCreateProject = (user) => {
  if (!user) return false;
  return user.role === 'admin' || user.role === 'chef';
};


/**
 * Vérifie si l'utilisateur peut CRÉER une tâche (vue globale Tasks.jsx)
 * Seuls ADMIN et CHEF peuvent créer des tâches depuis la page globale
 */
export const canCreateTaskGlobal = (user) => {
  if (!user) return false;
  return user.role === 'admin' || user.role === 'chef';
};
