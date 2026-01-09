import { useState } from 'react';
import { Users, Crown, Trash2, Edit2, Check, X, Shield, Eye, User, ChevronDown } from 'lucide-react';
import { ConfirmModal } from '../common/ConfirmModal';


const ROLES = [
  { 
    value: 'owner', 
    label: 'Propriétaire', 
    icon: Crown, 
    color: 'text-orange-600', 
    bg: 'bg-orange-50', 
    badge: 'bg-orange-50 text-orange-700',
    dot: 'bg-orange-500'
  },
  { 
    value: 'manager', 
    label: 'Gestionnaire', 
    icon: Shield, 
    color: 'text-blue-600', 
    bg: 'bg-blue-50', 
    badge: 'bg-blue-50 text-blue-700',
    dot: 'bg-blue-500'
  },
  { 
    value: 'member', 
    label: 'Membre', 
    icon: User, 
    color: 'text-green-600', 
    bg: 'bg-green-50', 
    badge: 'bg-green-50 text-green-700',
    dot: 'bg-green-500'
  },
  { 
    value: 'viewer', 
    label: 'Observateur', 
    icon: Eye, 
    color: 'text-neutral-600', 
    bg: 'bg-neutral-50', 
    badge: 'bg-neutral-50 text-neutral-700',
    dot: 'bg-neutral-400'
  },
];


export const MemberList = ({ 
  members = [], 
  canManageMembers = false,
  isOwner = false,
  onRemoveMember,
  onChangeRole,
  loading = false
}) => {
  const [memberToRemove, setMemberToRemove] = useState(null);
  const [isRemoveModalOpen, setIsRemoveModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [selectedRole, setSelectedRole] = useState('');
  const [showAll, setShowAll] = useState(false);


  // Limite d'affichage
  const DISPLAY_LIMIT = 4;
  const hasMore = members.length > DISPLAY_LIMIT;
  const displayedMembers = showAll ? members : members.slice(0, DISPLAY_LIMIT);
  const remainingCount = members.length - DISPLAY_LIMIT;


  const handleRemoveClick = (member) => {
    setMemberToRemove(member);
    setIsRemoveModalOpen(true);
  };


  const confirmRemove = () => {
    if (memberToRemove) {
      onRemoveMember(memberToRemove.user.id);
      setIsRemoveModalOpen(false);
      setMemberToRemove(null);
    }
  };


  const startEditRole = (member) => {
    setEditingRole(member.id);
    setSelectedRole(member.role);
  };


  const saveRole = (member) => {
    if (selectedRole !== member.role) {
      onChangeRole(member.user.id, selectedRole);
    }
    setEditingRole(null);
  };


  const cancelEditRole = () => {
    setEditingRole(null);
    setSelectedRole('');
  };


  const getRoleConfig = (role) => {
    return ROLES.find(r => r.value === role) || ROLES[2];
  };


  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mb-3"></div>
        <p className="text-neutral-600 text-sm font-medium">Chargement des membres...</p>
      </div>
    );
  }


  if (members.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-14 h-14 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <Users className="w-7 h-7 text-neutral-400" />
        </div>
        <p className="text-neutral-600 font-medium text-sm">Aucun membre dans ce projet</p>
        <p className="text-neutral-400 text-xs mt-1">Ajoutez des membres pour collaborer</p>
      </div>
    );
  }


  return (
    <>
      <div className="space-y-2">
        {displayedMembers.map((member, index) => {
          const roleConfig = getRoleConfig(member.role);
          const RoleIcon = roleConfig.icon;
          const isEditing = editingRole === member.id;
          
          return (
            <div
              key={member.id}
              className="group bg-white rounded-lg border border-neutral-200 
                       hover:border-neutral-300 hover:shadow-sm 
                       transition-all duration-200"
              style={{
                animation: `fadeInUp 0.3s ease-out ${index * 0.05}s both`
              }}
            >
              <div className="p-3">
                <div className="flex items-center gap-3">
                  {/* Avatar ROND */}
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-neutral-300 to-neutral-400
                               flex items-center justify-center text-white font-bold text-sm 
                               shadow-sm flex-shrink-0">
                    {member.user.username?.charAt(0).toUpperCase() || '?'}
                  </div>


                  {/* Infos membre */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h4 className="font-semibold text-neutral-900 text-sm truncate">
                        {member.user.full_name || member.user.username}
                      </h4>
                      {member.role === 'owner' && (
                        <Crown className="w-3.5 h-3.5 text-orange-500 flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-neutral-500 truncate">
                      {member.user.email}
                    </p>
                  </div>


                  {/* Rôle - Version épurée */}
                  <div className="flex items-center gap-2">
                    {isEditing ? (
                      // Mode édition
                      <div className="flex items-center gap-1.5">
                        <select
                          value={selectedRole}
                          onChange={(e) => setSelectedRole(e.target.value)}
                          className="px-2.5 py-1.5 text-xs font-medium border-2 border-orange-500 
                                   rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20
                                   bg-white text-neutral-900"
                        >
                          {ROLES.map(role => (
                            <option 
                              key={role.value} 
                              value={role.value}
                              disabled={role.value === 'owner'}
                            >
                              {role.label}
                            </option>
                          ))}
                        </select>
                        
                        <button
                          onClick={() => saveRole(member)}
                          className="p-1.5 bg-green-100 text-green-700 hover:bg-green-200 
                                   rounded-md transition-colors"
                          title="Sauvegarder"
                        >
                          <Check className="w-3.5 h-3.5" strokeWidth={2.5} />
                        </button>
                        
                        <button
                          onClick={cancelEditRole}
                          className="p-1.5 bg-red-100 text-red-700 hover:bg-red-200 
                                   rounded-md transition-colors"
                          title="Annuler"
                        >
                          <X className="w-3.5 h-3.5" strokeWidth={2.5} />
                        </button>
                      </div>
                    ) : (
                      // Mode affichage - Minimaliste avec dot
                      <div className="flex items-center gap-2">
                        {/* Dot coloré */}
                        <div className={`w-1.5 h-1.5 rounded-full ${roleConfig.dot}`} />
                        
                        {/* Badge discret */}
                        <span className={`inline-flex items-center gap-1 px-2 py-1 
                                       text-xs font-medium rounded-md ${roleConfig.badge}`}>
                          <RoleIcon className="w-3 h-3" strokeWidth={2.5} />
                          {roleConfig.label}
                        </span>
                      </div>
                    )}
                  </div>


                  {/* ✅ CORRECTION : Actions toujours visibles, protection backend */}
                  {canManageMembers && !isEditing && (
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      
                      {/* Bouton Modifier - Désactivé pour owner */}
                      <button
                        onClick={() => startEditRole(member)}
                        disabled={member.role === 'owner'}
                        className={`p-1.5 rounded-md transition-colors ${
                          member.role === 'owner'
                            ? 'text-neutral-300 cursor-not-allowed'
                            : 'text-neutral-600 hover:bg-neutral-100'
                        }`}
                        title={
                          member.role === 'owner'
                            ? 'Le rôle propriétaire ne peut pas être modifié'
                            : 'Changer le rôle'
                        }
                      >
                        <Edit2 className="w-3.5 h-3.5" strokeWidth={2.5} />
                      </button>

                      {/* Bouton Supprimer - Toujours visible (protection backend) */}
                      <button
                        onClick={() => handleRemoveClick(member)}
                        className="p-1.5 text-red-600 hover:bg-red-50 
                                 rounded-md transition-colors"
                        title={
                          member.role === 'owner'
                            ? 'Seul un administrateur peut retirer le propriétaire'
                            : 'Retirer du projet'
                        }
                      >
                        <Trash2 className="w-3.5 h-3.5" strokeWidth={2.5} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>


      {/* BOUTON VOIR PLUS / VOIR MOINS */}
      {hasMore && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="w-full mt-3 py-2.5 px-4 
                   border-2 border-neutral-200 text-neutral-700 
                   font-medium text-sm rounded-xl
                   hover:border-neutral-300 hover:bg-neutral-50
                   transition-all duration-200
                   flex items-center justify-center gap-2"
        >
          {showAll ? (
            <>
              <ChevronDown className="w-4 h-4 rotate-180 transition-transform" strokeWidth={2.5} />
              <span>Voir moins</span>
            </>
          ) : (
            <>
              <ChevronDown className="w-4 h-4 transition-transform" strokeWidth={2.5} />
              <span>Voir {remainingCount} autre{remainingCount > 1 ? 's' : ''} membre{remainingCount > 1 ? 's' : ''}</span>
            </>
          )}
        </button>
      )}


      <ConfirmModal
        isOpen={isRemoveModalOpen}
        onClose={() => setIsRemoveModalOpen(false)}
        onConfirm={confirmRemove}
        title="Retirer ce membre ?"
        message={`Êtes-vous sûr de vouloir retirer ${
          memberToRemove?.user.full_name || memberToRemove?.user.username
        } du projet ?${
          memberToRemove?.role === 'owner' 
            ? '\n\n⚠️ Attention : Seul un administrateur peut retirer un propriétaire.' 
            : ''
        }`}
        confirmText="Retirer"
        cancelText="Annuler"
        variant="danger"
      />


      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </>
  );
};
