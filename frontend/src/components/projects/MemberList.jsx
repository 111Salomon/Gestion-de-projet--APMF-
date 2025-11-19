import { useState } from 'react';
import { Users, Crown, Trash2, Edit2 } from 'lucide-react';
import { Button } from '../common/Button';
import { ConfirmModal } from '../common/ConfirmModal';
import toast from 'react-hot-toast';

// 🆕 Liste des rôles (synchronisée avec le backend)
const ROLES = [
  { value: 'owner', label: 'Propriétaire' },
  { value: 'manager', label: 'Gestionnaire' },
  { value: 'member', label: 'Membre' },
  { value: 'viewer', label: 'Observateur' },
];

/**
 * Composant pour afficher la liste des membres d'un projet
 * 
 * Props:
 *   - members: Array des membres (avec user, role, joined_at)
 *   - isOwner: Boolean - L'utilisateur connecté est-il le propriétaire ?
 *   - onRemoveMember: Function(userId) - Callback pour retirer un membre
 *   - onChangeRole: Function(userId, newRole) - Callback pour changer le rôle
 *   - loading: Boolean - Affichage du loading
 */
export const MemberList = ({ 
  members = [], 
  isOwner = false,
  onRemoveMember,
  onChangeRole,
  loading = false
}) => {
  // États locaux
  const [memberToRemove, setMemberToRemove] = useState(null);
  const [isRemoveModalOpen, setIsRemoveModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState(null); // ID du membre dont on édite le rôle
  const [selectedRole, setSelectedRole] = useState('');

  /**
   * Ouvre le modal de confirmation de suppression
   */
  const handleRemoveClick = (member) => {
    setMemberToRemove(member);
    setIsRemoveModalOpen(true);
  };

  /**
   * Confirme la suppression d'un membre
   */
  const confirmRemove = () => {
    if (memberToRemove) {
      onRemoveMember(memberToRemove.user.id);
      setIsRemoveModalOpen(false);
      setMemberToRemove(null);
    }
  };

  /**
   * Active le mode édition du rôle
   */
  const startEditRole = (member) => {
    setEditingRole(member.id);
    setSelectedRole(member.role);
  };

  /**
   * Sauvegarde le nouveau rôle
   */
  const saveRole = (member) => {
    if (selectedRole !== member.role) {
      onChangeRole(member.user.id, selectedRole);
    }
    setEditingRole(null);
  };

  /**
   * Annule l'édition du rôle
   */
  const cancelEditRole = () => {
    setEditingRole(null);
    setSelectedRole('');
  };

  /**
   * Retourne le badge de couleur selon le rôle
   */
  const getRoleBadge = (role) => {
    const badges = {
      owner: 'bg-purple-100 text-purple-700',
      manager: 'bg-blue-100 text-blue-700',
      member: 'bg-neutral-100 text-neutral-700',
      viewer: 'bg-gray-100 text-gray-700',
    };
    return badges[role] || badges.member;
  };

  /**
   * Retourne le libellé français du rôle
   */
  const getRoleLabel = (role) => {
    const labels = {
      owner: 'Propriétaire',
      manager: 'Gestionnaire',
      member: 'Membre',
      viewer: 'Observateur',
    };
    return labels[role] || 'Membre';
  };

  // Affichage du loading
  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Affichage si aucun membre
  if (members.length === 0) {
    return (
      <div className="text-center py-8 text-neutral-500">
        <Users className="w-12 h-12 mx-auto mb-2 text-neutral-400" />
        <p>Aucun membre dans ce projet</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {members.map((member) => (
          <div
            key={member.id}
            className="flex items-center justify-between p-4 bg-white border border-neutral-200 rounded-lg hover:shadow-sm transition-shadow"
          >
            {/* Infos du membre */}
            <div className="flex items-center gap-4 flex-1">
              {/* Avatar */}
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold text-lg">
                {member.user.username?.charAt(0).toUpperCase() || '?'}
              </div>

              {/* Nom et email */}
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-neutral-900">
                    {member.user.full_name || member.user.username}
                  </h4>
                  {member.role === 'owner' && (
                    <Crown className="w-4 h-4 text-yellow-500" />
                  )}
                </div>
                <p className="text-sm text-neutral-500">{member.user.email}</p>
              </div>

              {/* Rôle (éditable ou badge) */}
              <div className="min-w-[150px]">
                {editingRole === member.id ? (
                  // Mode édition
                  <div className="flex items-center gap-2">
                    <select
                      value={selectedRole}
                      onChange={(e) => setSelectedRole(e.target.value)}
                      className="px-3 py-1 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      {ROLES.map(role => (
                        <option 
                          key={role.value} 
                          value={role.value}
                          disabled={role.value === 'owner'} // Empêche de changer quelqu'un en propriétaire
                        >
                          {role.label}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => saveRole(member)}
                      className="text-green-600 hover:text-green-700 text-sm font-medium"
                    >
                      ✓
                    </button>
                    <button
                      onClick={cancelEditRole}
                      className="text-red-600 hover:text-red-700 text-sm font-medium"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  // Mode affichage
                  <span
                    className={`inline-block px-3 py-1 text-sm font-medium rounded-full ${getRoleBadge(
                      member.role
                    )}`}
                  >
                    {getRoleLabel(member.role)}
                  </span>
                )}
              </div>
            </div>

            {/* Actions (si owner et pas le owner du projet) */}
            {isOwner && member.role !== 'owner' && (
              <div className="flex items-center gap-2 ml-4">
                {/* Bouton changer le rôle */}
                <button
                  onClick={() => startEditRole(member)}
                  className="p-2 text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors"
                  title="Changer le rôle"
                >
                  <Edit2 className="w-4 h-4" />
                </button>

                {/* Bouton retirer */}
                <button
                  onClick={() => handleRemoveClick(member)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Retirer du projet"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Modal de confirmation de suppression */}
      <ConfirmModal
        isOpen={isRemoveModalOpen}
        onClose={() => setIsRemoveModalOpen(false)}
        onConfirm={confirmRemove}
        title="Retirer ce membre ?"
        message={`Êtes-vous sûr de vouloir retirer ${
          memberToRemove?.user.full_name || memberToRemove?.user.username
        } du projet ?`}
        confirmText="Retirer"
        cancelText="Annuler"
        variant="danger"
      />
    </>
  );
};
