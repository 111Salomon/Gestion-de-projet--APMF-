import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, Trash2, Calendar, Users, UserPlus } from 'lucide-react';
// 🆕 AJOUTÉ : Imports pour l'export
import { Download, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';

// ─── Imports avec chemins relatifs corrigés ───
import { Layout } from '../../components/layout/Layout';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { ConfirmModal } from '../../components/common/ConfirmModal';
import { ProjectStats } from '../../components/projects/ProjectStats';
import { TaskCard } from '../../components/tasks/TaskCard';
import { ProjectForm } from '../../components/forms/ProjectForm';

// 🆕 Imports pour la gestion des membres
import { MemberList } from '../../components/projects/MemberList';
import { AddMemberModal } from '../../components/projects/AddMemberModal';

// Imports API
import { projectsAPI } from '../../api/projects';

import { useAuth } from '../../context/AuthContext';

export const ProjectDetail = () => {
  // ─── Récupère l'ID depuis l'URL ───
  const { id } = useParams();
  const navigate = useNavigate();
  // 🆕 Récupère l'utilisateur depuis le contexte
  const { user: currentUser } = useAuth();

  // ─── État local (existant) ───
  const [project, setProject] = useState(null);
  const [stats, setStats] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [updating, setUpdating] = useState(false);

  // 🆕 État local pour la gestion des membres
  const [members, setMembers] = useState([]);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [addingMember, setAddingMember] = useState(false);

  // 🆕 AJOUTÉ : États pour l'export
  const [isExportDropdownOpen, setIsExportDropdownOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // ─── Chargement au montage ───
  useEffect(() => {
    loadProjectData();
    loadMembers();
    loadAvailableUsers();
  }, [id]);

  // 🆕 AJOUTÉ : Fermer le dropdown d'export au clic en dehors
  useEffect(() => {
    const handleClickOutside = (event) => {
      const target = event.target;
      const isExportElement = target.closest('[data-export-dropdown="true"]');
      if (!isExportElement && isExportDropdownOpen) {
        setIsExportDropdownOpen(false);
      }
    };

    if (isExportDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isExportDropdownOpen]);

  const loadProjectData = async () => {
    try {
      setLoading(true);

      // Charge les 3 API en parallèle
      const [projectData, statsData, tasksData] = await Promise.all([
        projectsAPI.getById(id),
        projectsAPI.getStats(id),
        projectsAPI.getTasks(id),
      ]);

      setProject(projectData);
      setStats(statsData);

      // ✅ Gestion correcte des 2 formats possibles
      const tasksList = Array.isArray(tasksData)
        ? tasksData
        : (tasksData.results || []);
      
      setTasks(tasksList);
    } catch (error) {
      console.error('❌ Erreur chargement:', error);
      toast.error('Impossible de charger le projet');
      navigate('/projects');
    } finally {
      setLoading(false);
    }
  };

  // 🆕 Charge la liste des membres du projet
  const loadMembers = async () => {
    try {
      setLoadingMembers(true);
      const data = await projectsAPI.getMembers(id);
      setMembers(data);
    } catch (error) {
      console.error('❌ Erreur chargement membres:', error);
      toast.error('Impossible de charger les membres');
    } finally {
      setLoadingMembers(false);
    }
  };

  // 🆕 Charge la liste des utilisateurs disponibles
  const loadAvailableUsers = async () => {
    try {
      const data = await projectsAPI.getAvailableUsers();
      setAvailableUsers(data);
    } catch (error) {
      console.error('❌ Erreur chargement utilisateurs:', error);
    }
  };

  // 🆕 Ajoute un membre au projet
  const handleAddMember = async (userId, role) => {
    try {
      setAddingMember(true);
      await projectsAPI.addMember(id, userId, role);
      toast.success('Membre ajouté avec succès');
      
      // Recharge les membres
      await loadMembers();
      
      // Ferme le modal
      setIsAddMemberModalOpen(false);
    } catch (error) {
      console.error('❌ Erreur ajout membre:', error);
      toast.error(error.response?.data?.error || 'Impossible d\'ajouter le membre');
    } finally {
      setAddingMember(false);
    }
  };

  // 🆕 Retire un membre du projet
  const handleRemoveMember = async (userId) => {
    try {
      await projectsAPI.removeMember(id, userId);
      toast.success('Membre retiré avec succès');
      
      // Recharge les membres
      await loadMembers();
    } catch (error) {
      console.error('❌ Erreur suppression membre:', error);
      toast.error('Impossible de retirer le membre');
    }
  };

  // 🆕 Change le rôle d'un membre
  const handleChangeRole = async (userId, newRole) => {
    try {
      await projectsAPI.updateMemberRole(id, userId, newRole);
      toast.success('Rôle modifié avec succès');
      
      // Recharge les membres
      await loadMembers();
    } catch (error) {
      console.error('❌ Erreur changement rôle:', error);
      toast.error('Impossible de modifier le rôle');
    }
  };

// 🆕 CORRIGÉ : Fonction d'export simplifiée avec projectsAPI
const handleExport = async (format) => {
  try {
    setIsExporting(true);
    setIsExportDropdownOpen(false);

    let blob;
    let extension;

    // ✅ Utilise les fonctions de projects.js (déjà configurées)
    if (format === 'pdf') {
      blob = await projectsAPI.exportProjectPDF(id);
      extension = 'pdf';
    } else if (format === 'excel') {
      blob = await projectsAPI.exportProjectExcel(id);
      extension = 'xlsx';
    } else if (format === 'zip') {
      blob = await projectsAPI.exportProjectArchive(id);
      extension = 'zip';
    }

    // Vérification que le blob est valide
    if (!blob || blob.size === 0) {
      throw new Error('Fichier vide reçu');
    }

    // Création du lien de téléchargement
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    
    // Nom du fichier avec sanitization
    const safeName = project.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    link.download = `projet_${safeName}_${Date.now()}.${extension}`;
    
    // Ajout au DOM, clic, puis suppression
    document.body.appendChild(link);
    link.click();
    
    // Nettoyage
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 100);

    const formatLabels = {
      pdf: 'PDF',
      excel: 'Excel',
      zip: 'Archive ZIP',
    };

    toast.success(`Export ${formatLabels[format]} réussi ! 📥`);
    
  } catch (error) {
    console.error('❌ Erreur export:', error);
    
    // Message d'erreur plus spécifique
    if (error.response) {
      toast.error(`Erreur serveur: ${error.response.status}`);
    } else if (error.message === 'Fichier vide reçu') {
      toast.error('Le fichier exporté est vide');
    } else {
      toast.error('Impossible d\'exporter le projet');
    }
  } finally {
    setIsExporting(false);
  }
};


  // Mise à jour du projet
  const handleUpdate = async (values) => {
    try {
      setUpdating(true);
      await projectsAPI.update(id, values);
      toast.success('Projet mis à jour');
      await loadProjectData();
      setIsEditModalOpen(false);
    } catch (error) {
      console.error('❌ Erreur mise à jour:', error);
      toast.error('Impossible de mettre à jour le projet');
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    try {
      await projectsAPI.delete(id);
      toast.success('Projet supprimé');
      navigate('/projects');
    } catch (error) {
      console.error('❌ Erreur suppression:', error);
      toast.error('Impossible de supprimer le projet');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Non définie';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  // Badge de statut avec couleurs
  const getStatusBadge = (status) => {
    const styles = {
      planning: 'bg-gray-100 text-gray-700',
      active: 'bg-blue-100 text-blue-700',
      on_hold: 'bg-yellow-100 text-yellow-700',
      completed: 'bg-green-100 text-green-700',
      cancelled: 'bg-red-100 text-red-700',
    };

    const labels = {
      planning: 'En planification',
      active: 'Actif',
      on_hold: 'En pause',
      completed: 'Terminé',
      cancelled: 'Annulé',
    };

    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${styles[status] || styles.active}`}>
        {labels[status] || status}
      </span>
    );
  };

  // ═══════════════════════════════════════════════════════════════════
  // 🔐 GESTION DES PERMISSIONS
  // ═══════════════════════════════════════════════════════════════════

  // 🔍 DEBUG : Affiche les membres avec leurs rôles
  console.log('🔍 Membres du projet:', members.map(m => ({
    username: m.user?.username,
    role: m.role
  })));

  // ✅ CORRECTION COMPLÈTE : Vérifie tous les types de propriétaires
  const isProjectOwner = currentUser && Number(project?.owner?.id) === Number(currentUser?.id);
  const isAdmin = currentUser && currentUser.role === 'admin';
  const isChef = currentUser && currentUser.role === 'chef';

  // 🆕 Vérifie si l'utilisateur a le rôle "owner" ou "proprietaire" dans ProjectMember
  const hasOwnerRole = currentUser && members.some(
    member => {
      const isSameUser = Number(member.user?.id) === Number(currentUser.id);
      const isOwnerRole = member.role === 'owner' || 
                          member.role === 'proprietaire' ||
                          member.role === 'Propriétaire';
      
      if (isSameUser) {
        console.log(`🔍 Rôle de ${member.user?.username} dans le projet:`, member.role);
      }
      
      return isSameUser && isOwnerRole;
    }
  );

  // Vérifie si gestionnaire
  const isManager = currentUser && members.some(
    member => Number(member.user?.id) === Number(currentUser.id) && 
              (member.role === 'manager' || member.role === 'gestionnaire')
  );

  // ✅ isOwner = vrai si SOIT champ owner SOIT rôle owner dans members
  const isOwner = isProjectOwner || hasOwnerRole;

  // ✅ Permission finale
  const canManageMembers = isOwner || isAdmin || isChef || isManager;

  // 🔍 DEBUG : Affiche toutes les vérifications
  console.log('═══════════════════════════════════════');
  console.log('🔍 VÉRIFICATION PERMISSIONS:');
  console.log('   project.owner.id:', project?.owner?.id);
  console.log('   currentUser.id:', currentUser?.id);
  console.log('   currentUser.role:', currentUser?.role);
  console.log('   ─────────────────────────────────');
  console.log('   isProjectOwner (champ DB):', isProjectOwner);
  console.log('   hasOwnerRole (rôle membre):', hasOwnerRole);
  console.log('   isAdmin:', isAdmin);
  console.log('   isChef:', isChef);
  console.log('   isManager:', isManager);
  console.log('   ─────────────────────────────────');
  console.log('   → isOwner final:', isOwner);
  console.log('   → canManageMembers:', canManageMembers);
  console.log('═══════════════════════════════════════');

  // ─── Affichage pendant chargement ───
  if (loading) {
    return (
      <Layout>
        <LoadingSpinner />
      </Layout>
    );
  }

  // ─── Si projet introuvable ───
  if (!project) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-neutral-600">Projet introuvable</p>
        </div>
      </Layout>
    );
  }

  // ─── RENDU DE LA PAGE ───
  return (
    <Layout>
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        
        {/* ═══════════════════════════════════════════ */}
        {/* HEADER : Bouton retour + Actions */}
        {/* ═══════════════════════════════════════════ */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('/projects')}
            className="flex items-center gap-2 text-neutral-600 hover:text-neutral-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Retour aux projets</span>
          </button>

          {/* 🆕 MODIFIÉ : Section des boutons avec Export */}
          <div className="flex gap-2">
            {/* 🆕 AJOUTÉ : BOUTON EXPORT AVEC DROPDOWN */}
            <div className="relative" data-export-dropdown="true">
              <Button
                variant="outline"
                onClick={() => setIsExportDropdownOpen(!isExportDropdownOpen)}
                disabled={isExporting}
                icon={<Download className="w-4 h-4" />}
              >
                {isExporting ? 'Export en cours...' : 'Exporter'}
                <ChevronDown className="w-4 h-4 ml-1" />
              </Button>

              {/* 🆕 AJOUTÉ : Dropdown des formats d'export */}
              {isExportDropdownOpen && (
                <div className="absolute left-0 mt-2 w-56 bg-white border border-neutral-200 rounded-lg shadow-lg z-20">
                  <div className="py-1">
                    {/* PDF */}
                    <button
                      type="button"
                      onClick={() => handleExport('pdf')}
                      className="w-full px-4 py-3 text-left text-sm text-neutral-700 hover:bg-neutral-50 transition-colors flex items-center gap-3 group"
                    >
                      <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center group-hover:bg-red-100 transition-colors">
                        <span className="text-xl">📄</span>
                      </div>
                      <div>
                        <div className="font-medium text-neutral-900">PDF Complet</div>
                        <div className="text-xs text-neutral-500">Rapport détaillé multi-pages</div>
                      </div>
                    </button>

                    {/* Excel */}
                    <button
                      type="button"
                      onClick={() => handleExport('excel')}
                      className="w-full px-4 py-3 text-left text-sm text-neutral-700 hover:bg-neutral-50 transition-colors flex items-center gap-3 group"
                    >
                      <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center group-hover:bg-green-100 transition-colors">
                        <span className="text-xl">📊</span>
                      </div>
                      <div>
                        <div className="font-medium text-neutral-900">Excel (6 onglets)</div>
                        <div className="text-xs text-neutral-500">Données structurées et éditables</div>
                      </div>
                    </button>

                    {/* Archive ZIP */}
                    <button
                      type="button"
                      onClick={() => handleExport('zip')}
                      className="w-full px-4 py-3 text-left text-sm text-neutral-700 hover:bg-neutral-50 transition-colors flex items-center gap-3 group rounded-b-lg"
                    >
                      <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                        <span className="text-xl">📦</span>
                      </div>
                      <div>
                        <div className="font-medium text-neutral-900">Archive ZIP</div>
                        <div className="text-xs text-neutral-500">JSON + fichiers attachés</div>
                      </div>
                    </button>
                  </div>
                </div>
              )}
            </div>
            {/* FIN 🆕 AJOUTÉ */}

            {/* Boutons existants */}
            <Button
              variant="outline"
              onClick={() => setIsEditModalOpen(true)}
              icon={<Edit className="w-4 h-4" />}
            >
              Modifier
            </Button>
            <Button
              variant="danger"
              onClick={() => setIsDeleteModalOpen(true)}
              icon={<Trash2 className="w-4 h-4" />}
            >
              Supprimer
            </Button>
          </div>
        </div>

        {/* ═══════════════════════════════════════════ */}
        {/* INFO PROJET : Titre + Description + Dates */}
        {/* ═══════════════════════════════════════════ */}
        <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
          <h1 className="text-3xl font-bold text-neutral-900 mb-3">
            {project.name}
          </h1>

          {/* Badge de statut */}
          <div className="mb-4">
            {getStatusBadge(project.status)}
          </div>

          <p className="text-neutral-600 mb-6">
            {project.description || 'Aucune description'}
          </p>

          {/* Infos secondaires (dates + membres) */}
          <div className="flex gap-4 text-sm text-neutral-500">
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              Début : {formatDate(project.start_date)}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              Fin : {formatDate(project.end_date)}
            </span>
            <span className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              Équipe : {members.length} membre{members.length > 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* ═══════════════════════════════════════════ */}
        {/* STATISTIQUES : Composant ProjectStats */}
        {/* ═══════════════════════════════════════════ */}
        <ProjectStats stats={stats} />

        {/* ═══════════════════════════════════════════ */}
        {/* 🆕 MEMBRES DU PROJET : Nouvelle Section */}
        {/* ═══════════════════════════════════════════ */}
        <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Users className="w-6 h-6" />
              Membres du Projet ({members.length})
            </h2>
            
            {/* Bouton ajouter (visible pour owner, admin, chef, manager) */}
            {canManageMembers && (
              <Button
                variant="primary"
                onClick={() => setIsAddMemberModalOpen(true)}
                icon={<UserPlus className="w-4 h-4" />}
              >
                Ajouter un membre
              </Button>
            )}    
          </div>

          {/* Composant MemberList */}
          <MemberList
            members={members}
            canManageMembers={canManageMembers}
            isOwner={isOwner || isAdmin || isChef}
            onRemoveMember={handleRemoveMember}
            onChangeRole={handleChangeRole}
            loading={loadingMembers}
          />
        </div>

        {/* ═══════════════════════════════════════════ */}
        {/* TÂCHES DU PROJET : Grille de cartes */}
        {/* ═══════════════════════════════════════════ */}
        <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">
              Tâches du Projet ({tasks.length})
            </h2>
            <Button
              variant="outline"
              onClick={() => navigate(`/tasks?project=${id}`)}
            >
              Voir toutes les tâches
            </Button>
          </div>

          {/* Liste des tâches ou message vide */}
          {tasks.length === 0 ? (
            <p className="text-neutral-500 text-center py-8">
              Aucune tâche pour le moment
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Affiche seulement les 6 premières tâches */}
              {tasks.slice(0, 6).map(task => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onClick={() => navigate(`/tasks/${task.id}`)}
                />
              ))}
            </div>
          )}

          {/* Message si + de 6 tâches */}
          {tasks.length > 6 && (
            <p className="text-neutral-500 text-center mt-4">
              Et {tasks.length - 6} autre{tasks.length - 6 > 1 ? 's' : ''} tâche
              {tasks.length - 6 > 1 ? 's' : ''}...
            </p>
          )}
        </div>

        {/* ═══════════════════════════════════════════ */}
        {/* MODALS : Édition + Suppression + Membres */}
        {/* ═══════════════════════════════════════════ */}

        {/* Modal d'édition du projet */}
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          title="Modifier le projet"
        >
          <ProjectForm
            initialData={project}
            onSubmit={handleUpdate}
            onCancel={() => setIsEditModalOpen(false)}
            isLoading={updating}
          />
        </Modal>

        {/* Modal de confirmation suppression */}
        <ConfirmModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={handleDelete}
          title="Supprimer le projet"
          message={`Êtes-vous sûr de vouloir supprimer "${project.name}" ? Cette action est irréversible et supprimera aussi toutes les tâches associées.`}
          confirmText="Supprimer"
          variant="danger"
        />

        {/* 🆕 Modal d'ajout de membre */}
        <AddMemberModal
          isOpen={isAddMemberModalOpen}
          onClose={() => setIsAddMemberModalOpen(false)}
          onAddMember={handleAddMember}
          availableUsers={availableUsers}
          existingMembers={members}
          loading={addingMember}
        />
      </div>
    </Layout>
  );
};

export default ProjectDetail;
