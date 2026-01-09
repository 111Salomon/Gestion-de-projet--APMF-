import { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { UserPlus, Search, Crown, Shield, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';


/**
 * Modal pour ajouter un membre à un projet
 * 
 * ✅ CORRECTION : "Propriétaire" grisé si un propriétaire existe déjà
 */


export const AddMemberModal = ({
  isOpen,
  onClose,
  onAddMember,
  availableUsers = [],
  existingMembers = [],
  loading = false
}) => {
  const { user } = useAuth();
  
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedRole, setSelectedRole] = useState('member');
  const [searchQuery, setSearchQuery] = useState('');

  // ✅ NOUVEAU : Vérifier si un propriétaire existe déjà
  const hasOwner = existingMembers.some(member => member.role === 'owner');

  // ✅ Rôles dynamiques selon le rôle de l'utilisateur ET l'existence d'un owner
  const ROLES = user?.role === 'admin' 
    ? [
        // Admin voit tous les rôles
        { 
          value: 'owner', 
          label: 'Propriétaire', 
          icon: Crown, 
          color: 'text-orange-600',
          disabled: hasOwner  // ← NOUVEAU : Grisé si owner existe
        },
        { value: 'manager', label: 'Gestionnaire', icon: Shield, color: 'text-blue-600', disabled: false },
        { value: 'member', label: 'Membre', color: 'text-green-600', disabled: false },
        { value: 'viewer', label: 'Observateur', color: 'text-neutral-600', disabled: false },
      ]
    : [
        // Non-admin ne voit pas "Propriétaire"
        { value: 'manager', label: 'Gestionnaire', icon: Shield, color: 'text-blue-600', disabled: false },
        { value: 'member', label: 'Membre', color: 'text-green-600', disabled: false },
        { value: 'viewer', label: 'Observateur', color: 'text-neutral-600', disabled: false },
      ];

  useEffect(() => {
    if (isOpen) {
      setSelectedUserId('');
      setSelectedRole('member');
      setSearchQuery('');
    }
  }, [isOpen]);

  const filteredUsers = availableUsers
    .filter((user) => {
      const isAlreadyMember = existingMembers.some(
        (member) => member.user.id === user.id
      );
      if (isAlreadyMember) return false;

      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          user.username.toLowerCase().includes(query) ||
          user.email.toLowerCase().includes(query) ||
          (user.full_name && user.full_name.toLowerCase().includes(query))
        );
      }

      return true;
    })
    .sort((a, b) => a.username.localeCompare(b.username));

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!selectedUserId) {
      return;
    }

    onAddMember(parseInt(selectedUserId), selectedRole);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Ajouter un membre"
      size="md"
    >
      <form onSubmit={handleSubmit} >
        {/* Recherche */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Rechercher un utilisateur
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Nom, email ou username..."
              className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>

        {/* Sélection utilisateur */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Utilisateur *
          </label>
          <select
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
            required
            className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">-- Sélectionner un utilisateur --</option>
            {filteredUsers.length === 0 ? (
              <option disabled>Aucun utilisateur disponible</option>
            ) : (
              filteredUsers.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.full_name || user.username} ({user.email})
                </option>
              ))
            )}
          </select>
          {filteredUsers.length === 0 && availableUsers.length > 0 && (
            <p className="text-sm text-neutral-500 mt-1">
              Tous les utilisateurs sont déjà membres du projet
            </p>
          )}
        </div>

        {/* Sélection rôle */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Rôle *
          </label>
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            required
            className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            {ROLES.map(role => (
              <option 
                key={role.value} 
                value={role.value}
                disabled={role.disabled}  // ← NOUVEAU : Option grisée si disabled
                className={role.disabled ? 'text-neutral-400' : ''}
              >
                {role.label} {role.disabled ? '(Déjà attribué)' : ''}
              </option>
            ))}
          </select>
          
          {/* ✅ NOUVEAU : Affichage dynamique selon le contexte */}
          {user?.role === 'admin' ? (
            hasOwner ? (
              // Si un owner existe déjà
              <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-amber-800">
                  <p className="font-semibold mb-1">Un propriétaire est déjà désigné</p>
                  <p>
                    Pour changer de propriétaire, retirez d'abord le propriétaire actuel, 
                    puis ajoutez le nouveau.
                  </p>
                </div>
              </div>
            ) : (
              // Si aucun owner n'existe
              <p className="text-xs text-orange-600 mt-2 flex items-center gap-1">
                <Crown className="w-3.5 h-3.5" />
                <span>
                  En tant qu'admin, vous pouvez désigner un propriétaire (1 seul par projet).
                </span>
              </p>
            )
          ) : (
            <p className="text-xs text-neutral-500 mt-2 flex items-center gap-1">
              <Shield className="w-3.5 h-3.5" />
              <span>
                Seul un administrateur peut désigner un propriétaire de projet.
              </span>
            </p>
          )}
        </div>

        {/* Boutons */}
        <div className="flex items-center gap-3 pt-4">
          <Button
            type="submit"
            variant="primary"
            fullWidth
            disabled={!selectedUserId || loading}
            loading={loading}
          >
            <UserPlus className="w-4 h-4" />
            Ajouter au projet
          </Button>

          <Button
            type="button"
            variant="secondary"
            fullWidth
            onClick={onClose}
            disabled={loading}
          >
            Annuler
          </Button>
        </div>
      </form>
    </Modal>
  );
};
