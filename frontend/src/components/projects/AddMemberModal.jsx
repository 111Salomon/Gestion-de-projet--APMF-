/**
 * ═══════════════════════════════════════════════════════════════
 * ADD MEMBER MODAL - DESIGN ÉPURÉ COHÉRENT AVEC PROJECTFORM
 * ═══════════════════════════════════════════════════════════════
 * 
 * ✅ Style adapté :
 * - Labels semibold avec astérisque rouge
 * - Focus states orange subtils
 * - Select avec chevron custom
 * - Boutons gradient orange
 * - Divider avant actions
 * - Transitions smooth
 */

import { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { UserPlus, Search, Crown, Shield, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

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

  // ✅ Vérifier si un propriétaire existe déjà
  const hasOwner = existingMembers.some(member => member.role === 'owner');

  // ✅ Rôles dynamiques
  const ROLES = user?.role === 'admin' 
    ? [
        { 
          value: 'owner', 
          label: 'Propriétaire', 
          icon: Crown, 
          color: 'text-orange-600',
          disabled: hasOwner
        },
        { value: 'manager', label: 'Gestionnaire', icon: Shield, color: 'text-blue-600', disabled: false },
        { value: 'member', label: 'Membre', color: 'text-green-600', disabled: false },
        { value: 'viewer', label: 'Observateur', color: 'text-neutral-600', disabled: false },
      ]
    : [
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
    if (!selectedUserId) return;
    onAddMember(parseInt(selectedUserId), selectedRole);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Ajouter un membre"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        
        {/* ✨ RECHERCHE UTILISATEUR */}
        <div className="space-y-2 mt-2">
          <label 
            htmlFor="search" 
            className="block text-sm font-semibold text-neutral-900"
          >
            Rechercher un utilisateur
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
            <input
              id="search"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Nom, email ou username..."
              className="
                w-full pl-10 pr-4 py-2.5
                text-sm text-neutral-900 placeholder:text-neutral-400
                bg-white border border-neutral-200 rounded-lg
                transition-all duration-200
                focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20
                disabled:bg-neutral-50 disabled:cursor-not-allowed
              "
              disabled={loading}
            />
          </div>
        </div>

        {/* ✨ SÉLECTION UTILISATEUR */}
        <div className="space-y-2">
          <label 
            htmlFor="user" 
            className="block text-sm font-semibold text-neutral-900"
          >
            Utilisateur <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <select
              id="user"
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              required
              className="
                w-full px-4 py-2.5
                text-sm text-neutral-900
                bg-white border border-neutral-200 rounded-lg
                appearance-none cursor-pointer
                transition-all duration-200
                focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20
                disabled:bg-neutral-50 disabled:cursor-not-allowed
              "
              disabled={loading}
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
            {/* Icône chevron custom */}
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <svg className="w-4 h-4 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
          {filteredUsers.length === 0 && availableUsers.length > 0 && (
            <p className="mt-1.5 text-xs text-neutral-500 flex items-center gap-1">
              <span className="w-1 h-1 rounded-full bg-neutral-400"></span>
              Tous les utilisateurs sont déjà membres du projet
            </p>
          )}
        </div>

        {/* ✨ SÉLECTION RÔLE */}
        <div className="space-y-2">
          <label 
            htmlFor="role" 
            className="block text-sm font-semibold text-neutral-900"
          >
            Rôle <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <select
              id="role"
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              required
              className="
                w-full px-4 py-2.5
                text-sm text-neutral-900
                bg-white border border-neutral-200 rounded-lg
                appearance-none cursor-pointer
                transition-all duration-200
                focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20
                disabled:bg-neutral-50 disabled:cursor-not-allowed
              "
              disabled={loading}
            >
              {ROLES.map(role => (
                <option 
                  key={role.value} 
                  value={role.value}
                  disabled={role.disabled}
                  className={role.disabled ? 'text-neutral-400' : ''}
                >
                  {role.label} {role.disabled ? '(Déjà attribué)' : ''}
                </option>
              ))}
            </select>
            {/* Icône chevron custom */}
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <svg className="w-4 h-4 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
          
          {/* Messages informatifs */}
          {user?.role === 'admin' ? (
            hasOwner ? (
              <div className="mt-2 p-2.5 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-amber-800">
                  <p className="font-semibold mb-0.5">Un propriétaire est déjà désigné</p>
                  <p className="leading-snug">
                    Pour changer de propriétaire, retirez d'abord le propriétaire actuel.
                  </p>
                </div>
              </div>
            ) : (
              <p className="mt-1.5 text-xs text-orange-600 flex items-center gap-1.5">
                <Crown className="w-3.5 h-3.5" />
                <span>
                  En tant qu'admin, vous pouvez désigner un propriétaire (1 seul par projet).
                </span>
              </p>
            )
          ) : (
            <p className="mt-1.5 text-xs text-neutral-500 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5" />
              <span>
                Seul un administrateur peut désigner un propriétaire de projet.
              </span>
            </p>
          )}
        </div>

        {/* ✨ BOUTONS - Style cohérent avec ProjectForm */}
        <div className="flex items-center gap-3 pt-4 border-t border-neutral-100">
          {/* Bouton Primaire (Submit) */}
          <button
            type="submit"
            disabled={!selectedUserId || loading}
            className="
              flex-1 px-5 py-3
              bg-gradient-to-r from-orange-500 to-orange-600 text-white
              rounded-lg font-semibold text-sm
              hover:shadow-lg hover:shadow-orange-500/30
              transition-all duration-300
              hover:scale-[1.02] active:scale-[0.98]
              disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
              focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2
            "
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                </svg>
                Traitement...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <UserPlus className="w-4 h-4" />
                Ajouter au projet
              </span>
            )}
          </button>
          
          {/* Bouton Secondaire (Cancel) */}
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="
              flex-1 px-5 py-3
              bg-white text-neutral-700 border border-neutral-200
              rounded-lg font-semibold text-sm
              hover:bg-neutral-50 hover:border-neutral-300
              transition-all duration-200
              disabled:opacity-50 disabled:cursor-not-allowed
              focus:outline-none focus:ring-2 focus:ring-neutral-500 focus:ring-offset-2
            "
          >
            Annuler
          </button>
        </div>
      </form>
    </Modal>
  );
};
