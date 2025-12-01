/**
 * 🔒 Utilitaires de Gestion des Permissions Frontend
 * 
 * Principe :
 * - Ces fonctions RÉPLIQUENT la logique backend côté frontend
 * - Elles servent UNIQUEMENT à l'affichage (cacher/montrer des boutons)
 * - Le backend reste la VRAIE sécurité (ne jamais faire confiance au frontend)
 * 
 * Architecture :
 * - Une fonction par type de permission
 * - Logique identique à celle du backend
 * - Vérification rapide (pas de requête API)
 * 
 * Auteur: TaskFlow Security Layer
 * Date: 2025-12-01
 */

/**
 * Vérifie si l'utilisateur peut MODIFIER une tâche.
 * 
 * ✅ Autorisé :
 * - Admin global
 * - Chef de projet global
 * - Propriétaire du projet
 * - Manager du projet
 * 
 * ❌ Interdit :
 * - Membre simple
 * - Observateur
 * 
 * Note : Cette fonction ne peut PAS vérifier le rôle dans ProjectMember
 * car on n'a pas cette info dans l'objet task côté frontend.
 * On fait une vérification partielle (Admin/Chef/Owner).
 * Le backend fera la vérification complète.
 * 
 * @param {Object} user - Utilisateur connecté { id, role, ... }
 * @param {Object} task - Tâche concernée { id, project: { owner: { id } }, ... }
 * @returns {boolean} - true si autorisé, false sinon
 */
export const canModifyTask = (user, task) => {
  // 🛡️ Vérifications de sécurité de base
  if (!user || !task) {
    return false;
  }
  
  // 1️⃣ Admin ou Chef de projet global → Accès total
  if (user.role === 'admin' || user.role === 'chef') {
    return true;
  }
  
  // 2️⃣ Propriétaire du projet (champ owner)
  if (task.project?.owner?.id === user.id) {
    return true;
  }
  
  // 3️⃣ Manager du projet
  // ⚠️ Limitation : On ne peut pas vérifier le rôle dans ProjectMember ici
  // car cette info n'est pas dans l'objet task standard.
  // Solution : On autorise ici et le backend refusera si pas manager.
  // Alternative : Ajouter un champ `user_role_in_project` dans le serializer.
  
  // Pour l'instant, on refuse si pas Admin/Chef/Owner
  return false;
};

/**
 * Vérifie si l'utilisateur peut SUPPRIMER une tâche.
 * 
 * ✅ Autorisé :
 * - Admin global
 * - Chef de projet global
 * - Propriétaire du projet
 * - Manager du projet
 * 
 * ❌ Interdit :
 * - Membre simple
 * - Observateur
 * - Même l'assigné ne peut PAS supprimer
 * 
 * @param {Object} user - Utilisateur connecté
 * @param {Object} task - Tâche concernée
 * @returns {boolean}
 */
export const canDeleteTask = (user, task) => {
  // Même logique que canModifyTask
  // (La suppression a les mêmes règles que la modification)
  return canModifyTask(user, task);
};

/**
 * Vérifie si l'utilisateur peut CHANGER LE STATUT d'une tâche.
 * 
 * ✅ Autorisé :
 * - Utilisateur assigné à la tâche (seulement SA tâche)
 * - + Tous ceux autorisés par canModifyTask (Admin, Chef, Owner, Manager)
 * 
 * ❌ Interdit :
 * - Membre simple qui N'EST PAS assigné
 * - Observateur
 * 
 * Exemple :
 * Jean (membre) assigné à la tâche 15 :
 * ✅ Peut changer le statut de la tâche 15
 * ❌ Ne peut PAS changer le statut de la tâche 16
 * 
 * @param {Object} user - Utilisateur connecté
 * @param {Object} task - Tâche concernée
 * @returns {boolean}
 */
export const canChangeTaskStatus = (user, task) => {
  // 🛡️ Vérifications de sécurité
  if (!user || !task) {
    return false;
  }
  
  // 1️⃣ Manager+ (réutilise canModifyTask)
  if (canModifyTask(user, task)) {
    return true;
  }
  
  // 2️⃣ Utilisateur assigné à CETTE tâche
  if (task.assigned_to?.id === user.id) {
    return true;
  }
  
  // ❌ Sinon refusé
  return false;
};

/**
 * Vérifie si l'utilisateur peut CRÉER une tâche dans un projet.
 * 
 * ✅ Autorisé :
 * - Admin global
 * - Chef de projet global
 * - Propriétaire du projet
 * - Manager du projet
 * 
 * ❌ Interdit :
 * - Membre simple
 * - Observateur
 * 
 * @param {Object} user - Utilisateur connecté
 * @param {Object} project - Projet concerné { id, owner: { id }, ... }
 * @returns {boolean}
 */
export const canCreateTask = (user, project) => {
  // 🛡️ Vérifications de sécurité
  if (!user || !project) {
    return false;
  }
  
  // 1️⃣ Admin ou Chef global
  if (user.role === 'admin' || user.role === 'chef') {
    return true;
  }
  
  // 2️⃣ Propriétaire du projet
  if (project.owner?.id === user.id) {
    return true;
  }
  
  // 3️⃣ Manager du projet
  // ⚠️ Même limitation que canModifyTask
  // On ne peut pas vérifier le rôle ProjectMember ici
  
  return false;
};

/**
 * Vérifie si l'utilisateur peut RÉORGANISER les tâches (Kanban).
 * 
 * ✅ Autorisé :
 * - Admin global
 * - Chef de projet global
 * - Propriétaire du projet
 * - Manager du projet
 * 
 * ❌ Interdit :
 * - Membre simple
 * - Observateur
 * 
 * Principe :
 * Réorganiser affecte toute l'équipe.
 * C'est une responsabilité de gestion.
 * 
 * @param {Object} user - Utilisateur connecté
 * @param {Object} task - Tâche concernée
 * @returns {boolean}
 */
export const canUpdateTaskOrder = (user, task) => {
  // Même logique que canModifyTask
  return canModifyTask(user, task);
};

/**
 * 🎯 Fonction helper pour afficher des messages d'erreur cohérents.
 * 
 * Utilisation :
 * if (!canModifyTask(user, task)) {
 *   toast.error(getPermissionErrorMessage('modifier cette tâche'));
 * }
 * 
 * @param {string} action - Action tentée (ex: "modifier cette tâche")
 * @returns {string} - Message d'erreur formaté
 */
export const getPermissionErrorMessage = (action) => {
  return `Vous n'avez pas les droits pour ${action}.`;
};

/**
 * 🎯 Fonction helper pour vérifier si l'utilisateur est au moins Manager.
 * 
 * Utile pour afficher des sections complètes (analytics, rapports, etc.).
 * 
 * @param {Object} user - Utilisateur connecté
 * @returns {boolean}
 */
export const isManagerOrAbove = (user) => {
  if (!user) return false;
  return user.role === 'admin' || user.role === 'chef';
};

/**
 * 🎯 Fonction helper pour vérifier si l'utilisateur est Admin.
 * 
 * @param {Object} user - Utilisateur connecté
 * @returns {boolean}
 */
export const isAdmin = (user) => {
  if (!user) return false;
  return user.role === 'admin';
};
