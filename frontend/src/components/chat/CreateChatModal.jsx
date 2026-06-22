import { useState, useEffect } from 'react';
import { X, Users, User, Search } from 'lucide-react';
import axiosInstance from '../../api/axios';
import { Avatar } from '../common/Avatar';

export const CreateChatModal = ({ isOpen, onClose, onCreate }) => {
  const [step, setStep] = useState(1); // 1 = type, 2 = participants, 3 = créer
  const [chatType, setChatType] = useState('private'); // 'private' ou 'group'
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  // Récupérer la liste des utilisateurs au montage
  useEffect(() => {
    if (isOpen) {
      loadUsers();
      // Récupérer l'utilisateur connecté
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      setCurrentUser(user);
    }
  }, [isOpen]);

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      const response = await axiosInstance.get('/users/');
      const allUsers = Array.isArray(response.data) ? response.data : response.data.results || [];
      
      // Exclure l'utilisateur connecté
      const currentUserEmail = JSON.parse(localStorage.getItem('user') || '{}').email;
      const otherUsers = allUsers.filter(user => user.email !== currentUserEmail);
      
      setUsers(otherUsers);
      setFilteredUsers(otherUsers);
    } catch (error) {
      console.error('❌ Erreur chargement utilisateurs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Filtrer les utilisateurs en fonction de la recherche
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredUsers(users);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredUsers(users.filter(user => 
        user.email.toLowerCase().includes(query) || 
        (user.full_name && user.full_name.toLowerCase().includes(query))
      ));
    }
  }, [searchQuery, users]);

  const handleUserSelect = (user) => {
    if (chatType === 'private') {
      // Pour une conversation privée, un seul utilisateur
      setSelectedUsers([user]);
    } else {
      // Pour un groupe, toggle la sélection
      setSelectedUsers(prev => 
        prev.some(u => u.id === user.id) 
          ? prev.filter(u => u.id !== user.id) 
          : [...prev, user]
      );
    }
  };

  const handleCreate = async () => {
    try {
      const roomData = {
        type: chatType,
        name: chatType === 'group' && selectedUsers.length > 1 
          ? `Groupe ${selectedUsers.map(u => u.full_name || u.email.split('@')[0]).join(', ')}`
          : '',
        participant_ids: selectedUsers.map(u => u.id)
      };

      await onCreate(roomData);
      // Fermer le modal après création
      setSelectedUsers([]);
      setChatType('private');
      setStep(1);
      onClose();
    } catch (error) {
      console.error('❌ Erreur création conversation:', error);
    }
  };

  const nextStep = () => {
    if (step === 1) {
      // Vérifier si au moins un utilisateur est sélectionné pour le privé
      if (chatType === 'private' && selectedUsers.length === 0) {
        alert('Veuillez sélectionner un utilisateur pour la conversation privée');
        return;
      }
      setStep(3); // Aller directement à la création
    }
  };

  const prevStep = () => {
    setStep(prev => Math.max(1, prev - 1));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            {step === 1 && 'Nouvelle conversation'}
            {step === 2 && 'Sélectionner les participants'}
            {step === 3 && 'Confirmer'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            title="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step 1: Choisir le type de conversation */}
        {step === 1 && (
          <div className="p-6 space-y-6 flex-1 overflow-y-auto">
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-4">Type de conversation</h3>
              <div className="space-y-3">
                <button
                  onClick={() => setChatType('private')}
                  className={`w-full flex items-center gap-3 p-4 border-2 rounded-lg transition-colors ${
                    chatType === 'private' 
                      ? 'border-orange-500 bg-orange-50' 
                      : 'border-gray-200 hover:border-orange-300'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    chatType === 'private' ? 'bg-orange-500' : 'bg-gray-100'
                  }`}>
                    <User className={`w-5 h-5 ${
                      chatType === 'private' ? 'text-white' : 'text-gray-600'
                    }`} />
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-gray-900">Conversation privée</div>
                    <div className="text-sm text-gray-500">Discuter avec une personne</div>
                  </div>
                </button>

                <button
                  onClick={() => setChatType('group')}
                  className={`w-full flex items-center gap-3 p-4 border-2 rounded-lg transition-colors ${
                    chatType === 'group' 
                      ? 'border-orange-500 bg-orange-50' 
                      : 'border-gray-200 hover:border-orange-300'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    chatType === 'group' ? 'bg-orange-500' : 'bg-gray-100'
                  }`}>
                    <Users className={`w-5 h-5 ${
                      chatType === 'group' ? 'text-white' : 'text-gray-600'
                    }`} />
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-gray-900">Groupe de discussion</div>
                    <div className="text-sm text-gray-500">Discuter avec plusieurs personnes</div>
                  </div>
                </button>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <h3 className="text-sm font-medium text-gray-700 mb-4">Participants</h3>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Rechercher un utilisateur..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div className="mt-4 space-y-2 max-h-64 overflow-y-auto">
                {isLoading ? (
                  <div className="text-center py-4 text-gray-500">Chargement...</div>
                ) : filteredUsers.length === 0 ? (
                  <div className="text-center py-4 text-gray-500">
                    {searchQuery ? 'Aucun utilisateur trouvé' : 'Aucun utilisateur disponible'}
                  </div>
                ) : (
                  filteredUsers.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => handleUserSelect(user)}
                      className={`w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors ${
                        selectedUsers.some(u => u.id === user.id) 
                          ? 'bg-orange-50 border border-orange-200' 
                          : ''
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar avatarUrl={user.avatar_url || user.avatar} name={user.full_name || user.email} size="sm" showBorder={false} />
                        <div className="text-left">
                          <div className="font-medium text-gray-900">
                            {user.full_name || user.email}
                          </div>
                          <div className="text-xs text-gray-500 capitalize">
                            {user.role === 'admin' ? 'Administrateur' : 
                             user.role === 'chef' ? 'Chef de Projet' : 'Membre'}
                          </div>
                        </div>
                      </div>
                      {selectedUsers.some(u => u.id === user.id) && (
                        <div className="w-5 h-5 rounded-full bg-orange-500 flex items-center justify-center">
                          <span className="text-white text-xs">✓</span>
                        </div>
                      )}
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Confirmation et création */}
        {step === 3 && (
          <div className="p-6 space-y-6">
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-4">Récapitulatif</h3>
              <div className="space-y-4">
                <div>
                  <div className="text-sm text-gray-500 mb-1">Type</div>
                  <div className="font-medium text-gray-900">
                    {chatType === 'private' ? 'Conversation privée' : 'Groupe de discussion'}
                  </div>
                </div>

                <div>
                  <div className="text-sm text-gray-500 mb-1">Participants</div>
                  <div className="space-y-2">
                    {selectedUsers.map((user) => (
                      <div key={user.id} className="flex items-center gap-3">
                        <Avatar avatarUrl={user.avatar_url || user.avatar} name={user.full_name || user.email} size="sm" showBorder={false} />
                        <div>
                          <div className="font-medium text-gray-900">
                            {user.full_name || user.email}
                          </div>
                          <div className="text-xs text-gray-500 capitalize">
                            {user.role === 'admin' ? 'Administrateur' : 
                             user.role === 'chef' ? 'Chef de Projet' : 'Membre'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer avec boutons de navigation */}
        <div className="border-t border-gray-200 px-6 py-4 flex gap-3">
          {step > 1 && (
            <button
              onClick={prevStep}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Retour
            </button>
          )}

          <div className="flex-1" />

          {step < 3 ? (
            <button
              onClick={nextStep}
              disabled={selectedUsers.length === 0}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                selectedUsers.length === 0
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-orange-500 text-white hover:bg-orange-600'
              }`}
            >
              Continuer
            </button>
          ) : (
            <button
              onClick={handleCreate}
              className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 font-medium transition-colors"
            >
              Créer la conversation
            </button>
          )}
        </div>
      </div>
    </div>
  );
};