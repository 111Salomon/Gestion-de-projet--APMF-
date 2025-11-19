import { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { UserPlus, Search } from 'lucide-react';

/**
 * Modal pour ajouter un membre à un projet
 */

const ROLES = [
  { value: 'owner', label: 'Propriétaire' },
  { value: 'manager', label: 'Gestionnaire' },
  { value: 'member', label: 'Membre' },
  { value: 'viewer', label: 'Observateur' },
];

export const AddMemberModal = ({
  isOpen,
  onClose,
  onAddMember,
  availableUsers = [],
  existingMembers = [],
  loading = false
}) => {
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedRole, setSelectedRole] = useState('member');
  const [searchQuery, setSearchQuery] = useState('');

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
      <form onSubmit={handleSubmit} className="space-y-6">
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
    <option key={role.value} value={role.value}>
      {role.label}
    </option>
  ))}
</select>

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
