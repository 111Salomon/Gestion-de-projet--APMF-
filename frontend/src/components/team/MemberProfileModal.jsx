/**
 * ═══════════════════════════════════════════════════════════════
 * MEMBER PROFILE MODAL - DESIGN ÉPURÉ ET MODERNE
 * ═══════════════════════════════════════════════════════════════
 * 
 * ✅ Design subtil et agréable
 * ✅ Thème orange cohérent
 * ✅ Bordures fines (border uniquement)
 * ✅ UX optimisée
 * ✅ Animations smooth
 */

import { useEffect, useState } from 'react';
import { 
  X, 
  Edit2, 
  Save, 
  User, 
  Mail, 
  Phone, 
  FileText,
  Trash2,
  CheckCircle,
  Clock,
  Target,
  TrendingUp,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { getTeamMemberDetail, updateMemberRole, toggleMemberActive, updateMemberProfile } from '../../api/team';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { DeleteMemberModal } from './DeleteMemberModal';
import { AvatarUploader } from './AvatarUploader';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

export const MemberProfileModal = ({ memberId, isOpen, onClose, onMemberUpdated, onMemberDeleted }) => {
  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatingRole, setUpdatingRole] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  
  // États pour l'édition
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    bio: ''
  });
  const [saving, setSaving] = useState(false);
  const { user: currentUser, refreshUser, notifyMemberUpdated} = useAuth();

  // Charge les détails du membre
  useEffect(() => {
    if (isOpen && memberId) {
      loadMemberDetails();
    }
  }, [isOpen, memberId]);

  const loadMemberDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getTeamMemberDetail(memberId);
      setMember(data);
      setEditForm({
        first_name: data.first_name || '',
        last_name: data.last_name || '',
        email: data.email || '',
        phone: data.phone || '',
        bio: data.bio || ''
      });
    } catch (err) {
      setError('Impossible de charger les détails du membre');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (newRole) => {
    if (newRole === member.role) return;
    setUpdatingRole(true);
    try {
      const response = await updateMemberRole(memberId, newRole);
      toast.success(response.message);
      setMember(response.member);
      if (onMemberUpdated) onMemberUpdated(response.member);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erreur lors de la modification du rôle');
    } finally {
      setUpdatingRole(false);
    }
  };

  const handleToggleActive = async () => {
    setUpdatingStatus(true);
    try {
      const response = await toggleMemberActive(memberId);
      toast.success(response.message);
      setMember(response.member);
      if (onMemberUpdated) onMemberUpdated(response.member);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erreur lors du changement de statut');
    } finally {
      setUpdatingStatus(false);
    }
  };

  // const handleAvatarUpdated = (newAvatarUrl) => {
  //   setMember((prev) => ({ ...prev, avatar_url: newAvatarUrl }));
  //   if (currentUser && memberId === currentUser.id) {
  //     refreshUser();
  //   }
  //   if (onMemberUpdated) {
  //     onMemberUpdated({ ...member, avatar_url: newAvatarUrl });
  //   }
  // };

  const handleAvatarUpdated = (newAvatarUrl) => {
    console.log('🖼️ Avatar updated in modal:', newAvatarUrl);
    console.log('📌 Current user ID:', currentUser?.id);
    console.log('📌 Member ID:', memberId);
    
    // Mettre à jour l'état local
    const updatedMember = { ...member, avatar_url: newAvatarUrl };
    setMember(updatedMember);
    
    // ✅ Si c'est l'utilisateur connecté, rafraîchir son contexte
    if (currentUser && Number(memberId) === Number(currentUser.id)) {
      console.log('🔄 Calling refreshUser (own avatar)...');
      refreshUser();
    } else {
      console.log('👤 Notifying member_updated (other user avatar)...');
      // ✅ Sinon, notifier que ce membre a été mis à jour
      notifyMemberUpdated(updatedMember);
    }
    
    // Callback parent
    if (onMemberUpdated) {
      onMemberUpdated(updatedMember);
    }
  };


  const handleEditToggle = () => {
    if (isEditing) {
      setEditForm({
        first_name: member.first_name || '',
        last_name: member.last_name || '',
        email: member.email || '',
        phone: member.phone || '',
        bio: member.bio || ''
      });
    }
    setIsEditing(!isEditing);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = async () => {
    if (!editForm.first_name.trim() || !editForm.last_name.trim()) {
      toast.error('Le prénom et le nom sont requis');
      return;
    }
    if (!editForm.email.trim()) {
      toast.error('L\'email est requis');
      return;
    }

    setSaving(true);
    try {
      const response = await updateMemberProfile(memberId, editForm);
      toast.success(response.message);
      setMember(response.user);
      setIsEditing(false);
      if (onMemberUpdated) onMemberUpdated(response.user);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erreur lors de la mise à jour');
    } finally {
      setSaving(false);
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-hidden shadow-2xl animate-slideUp">
        
        {/* ✨ HEADER MODERNE */}
        <div className="sticky top-0 z-10 bg-white border-b border-neutral-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-md shadow-orange-500/20">
                <User className="w-5 h-5 text-white" strokeWidth={2.5} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-neutral-900">Profil du membre</h2>
                <p className="text-xs text-neutral-600">Informations et statistiques</p>
              </div>
            </div>
            
            <button
              onClick={onClose}
              className="p-2 hover:bg-neutral-100 rounded-lg transition-colors group"
            >
              <X className="w-5 h-5 text-neutral-600 group-hover:text-neutral-900" strokeWidth={2} />
            </button>
          </div>
        </div>

        {/* ✨ CONTENT */}
        <div className="overflow-y-auto max-h-[calc(90vh-140px)] px-6 py-6">
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <LoadingSpinner />
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-800 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          ) : member ? (
            <div className="space-y-6">
              
              {/* ✨ SECTION 1 : AVATAR & IDENTITÉ */}
              <div className=" rounded-xl border  p-6">
                <div className="flex items-start gap-6">
                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    <AvatarUploader
                      userId={member.id}
                      currentAvatar={member.avatar_url}
                      onAvatarUpdated={handleAvatarUpdated}
                    />
                  </div>

                  {/* Identité et Actions */}
                  <div className="flex-1 space-y-4">
                    {/* Nom et Email */}
                    <div>
                      <h3 className="text-4xl font-bold text-neutral-900 mb-2">
                        {member.full_name}
                      </h3>
                      <div className="flex items-center gap-2 text-neutral-600">
                        <Mail className="w-4 h-4" strokeWidth={2} />
                        <span className="text-sm">{member.email}</span>
                      </div>
                    </div>

                    {/* Rôle et Statut */}
                    <div className="flex items-center gap-3 flex-wrap">
                      <select
                        value={member.role}
                        onChange={(e) => handleRoleChange(e.target.value)}
                        disabled={updatingRole}
                        className={`
                          px-4 py-2 rounded-lg text-sm font-semibold border cursor-pointer
                          transition-all duration-200
                          focus:outline-none focus:ring-2  focus:ring-offset-0 hover:bg-neutral-100
                          ${member.role === 'admin'
                            ? 'text-orange-700 border-orange-200 '
                            : member.role === 'chef'
                            ? ' text-neutral-700 border-neutral-200 '
                            : ' text-neutral-700 border-neutral-200 '
                          }
                          ${updatingRole ? 'opacity-50 cursor-not-allowed' : ''}
                        `}
                      >
                        <option value="membre">Membre</option>
                        <option value="chef">Chef de projet</option>
                        <option value="admin">Administrateur</option>
                      </select>

                      <button
                        onClick={handleToggleActive}
                        disabled={updatingStatus}
                        className={`
                          inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold border
                          transition-all duration-200
                          ${member.is_active
                            ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                            : 'bg-neutral-50 text-neutral-600 border-neutral-200 hover:bg-neutral-100'
                          }
                          ${updatingStatus ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                        `}
                      >
                        <span className={`w-2 h-2 rounded-full ${
                          member.is_active ? 'bg-green-500 animate-pulse' : 'bg-neutral-400'
                        }`}></span>
                        {member.is_active ? 'Actif' : 'Inactif'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* ✨ SECTION 2 : INFORMATIONS PERSONNELLES */}
              <div className="bg-white rounded-xl border border-neutral-200 p-6">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-orange-600" strokeWidth={2} />
                    <h4 className="text-lg font-bold text-neutral-900">Informations personnelles</h4>
                  </div>
                  
                  {!isEditing && (
                    <button
                      onClick={handleEditToggle}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-orange-50 hover:bg-orange-100 border border-orange-200 text-orange-700 text-sm font-semibold rounded-lg transition-all hover:scale-105 active:scale-95"
                    >
                      <Edit2 className="w-4 h-4" strokeWidth={2} />
                      Modifier
                    </button>
                  )}
                </div>

                {!isEditing ? (
                  /* ✨ MODE AFFICHAGE */
                  <div className="space-y-4">
                    {/* Téléphone */}
                    <div className="flex items-start gap-3 p-3 bg-neutral-50 rounded-lg">
                      <Phone className="w-5 h-5 text-neutral-600 mt-0.5" strokeWidth={2} />
                      <div className="flex-1">
                        <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-1">
                          Téléphone
                        </label>
                        <p className="text-sm text-neutral-900 font-medium">
                          {member.phone || <span className="text-neutral-400 italic">Non renseigné</span>}
                        </p>
                      </div>
                    </div>

                    {/* Bio */}
                    <div className="flex items-start gap-3 p-3 bg-neutral-50 rounded-lg">
                      <FileText className="w-5 h-5 text-neutral-600 mt-0.5" strokeWidth={2} />
                      <div className="flex-1">
                        <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-1">
                          Biographie
                        </label>
                        <p className="text-sm text-neutral-900 leading-relaxed">
                          {member.bio || <span className="text-neutral-400 italic">Aucune biographie</span>}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* ✨ MODE ÉDITION */
                  <div className="space-y-4 bg-neutral-50 rounded-xl p-5 border border-neutral-200">
                    <div className="grid grid-cols-2 gap-4">
                      {/* Prénom */}
                      <div>
                        <label className="block text-sm font-semibold text-neutral-700 mb-2">
                          Prénom <span className="text-orange-600">*</span>
                        </label>
                        <input
                          type="text"
                          name="first_name"
                          value={editForm.first_name}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                          disabled={saving}
                          placeholder="Prénom"
                        />
                      </div>

                      {/* Nom */}
                      <div>
                        <label className="block text-sm font-semibold text-neutral-700 mb-2">
                          Nom <span className="text-orange-600">*</span>
                        </label>
                        <input
                          type="text"
                          name="last_name"
                          value={editForm.last_name}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                          disabled={saving}
                          placeholder="Nom"
                        />
                      </div>
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-sm font-semibold text-neutral-700 mb-2">
                        Email <span className="text-orange-600">*</span>
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" strokeWidth={2} />
                        <input
                          type="email"
                          name="email"
                          value={editForm.email}
                          onChange={handleInputChange}
                          className="w-full pl-10 pr-4 py-2.5 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                          disabled={saving}
                          placeholder="email@example.com"
                        />
                      </div>
                    </div>

                    {/* Téléphone */}
                    <div>
                      <label className="block text-sm font-semibold text-neutral-700 mb-2">
                        Téléphone
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" strokeWidth={2} />
                        <input
                          type="tel"
                          name="phone"
                          value={editForm.phone}
                          onChange={handleInputChange}
                          placeholder="+33 6 12 34 56 78"
                          className="w-full pl-10 pr-4 py-2.5 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                          disabled={saving}
                        />
                      </div>
                    </div>

                    {/* Bio */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-semibold text-neutral-700">
                          Biographie
                        </label>
                        <span className="text-xs text-neutral-500 font-medium">
                          {editForm.bio.length}/500
                        </span>
                      </div>
                      <textarea
                        name="bio"
                        value={editForm.bio}
                        onChange={handleInputChange}
                        maxLength={500}
                        rows={4}
                        placeholder="Courte description du membre..."
                        className="w-full px-4 py-3 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none transition-all"
                        disabled={saving}
                      />
                    </div>

                    {/* Boutons d'action */}
                    <div className="flex gap-3 pt-2">
                      <button
                        onClick={handleEditToggle}
                        disabled={saving}
                        className="flex-1 px-4 py-2.5 border border-neutral-300 text-neutral-700 text-sm font-semibold rounded-lg hover:bg-neutral-100 transition-all disabled:opacity-50"
                      >
                        Annuler
                      </button>
                      <button
                        onClick={handleSaveProfile}
                        disabled={saving}
                        className="flex-1 px-4 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white text-sm font-semibold rounded-lg hover:shadow-lg hover:shadow-orange-500/30 transition-all disabled:opacity-50 inline-flex items-center justify-center gap-2 hover:scale-105 active:scale-95"
                      >
                        {saving ? (
                          <>
                            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span>Enregistrement...</span>
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4" strokeWidth={2} />
                            <span>Enregistrer</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* ✨ SECTION 3 : STATISTIQUES */}
              <div className="bg-white rounded-xl border border-neutral-200 p-6">
                <div className="flex items-center gap-2 mb-5">
                  <TrendingUp className="w-5 h-5 text-orange-600" strokeWidth={2} />
                  <h4 className="text-lg font-bold text-neutral-900">Statistiques</h4>
                </div>
                
                <div className="grid grid-cols-3 gap-4 mb-6">
                  {/* Total */}
                  <div className="group bg-neutral-50 rounded-xl p-5 border border-neutral-200 hover:border-orange-500 transition-all hover:shadow-lg hover:shadow-orange-500/10">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-neutral-900 rounded-xl flex items-center justify-center group-hover:bg-orange-500 transition-colors shadow-sm">
                        <Target className="w-5 h-5 text-white" strokeWidth={2.5} />
                      </div>
                    </div>
                    <p className="text-xs text-neutral-500 font-semibold uppercase tracking-wide mb-1">Total</p>
                    <p className="text-3xl font-bold text-neutral-900">{member.tasks_total}</p>
                    <p className="text-xs text-neutral-600 mt-1">tâches</p>
                  </div>

                  {/* En cours */}
                  <div className="group bg-neutral-50 rounded-xl p-5 border border-neutral-200 hover:border-orange-500 transition-all hover:shadow-lg hover:shadow-orange-500/10">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-neutral-900 rounded-xl flex items-center justify-center group-hover:bg-orange-500 shadow-sm">
                        <Clock className="w-5 h-5 text-white" strokeWidth={2.5} />
                      </div>
                    </div>
                    <p className="text-xs text-neutral-600 font-semibold uppercase tracking-wide mb-1">En cours</p>
                    <p className="text-3xl font-bold text-neutral-900">{member.tasks_in_progress}</p>
                    <p className="text-xs text-neutral-600 mt-1">tâches</p>
                  </div>

                  {/* Terminées */}
                  <div className="group bg-neutral-50 rounded-xl p-5 border border-neutral-200 hover:border-orange-500 transition-all hover:shadow-lg hover:shadow-orange-500/10">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-neutral-900 rounded-xl flex items-center justify-center group-hover:bg-green-500  shadow-sm">
                        <CheckCircle className="w-5 h-5 text-white" strokeWidth={2.5} />
                      </div>
                    </div>
                    <p className="text-xs text-neutral-600 font-semibold uppercase tracking-wide mb-1">Terminées</p>
                    <p className="text-3xl font-bold text-neutral-900">{member.tasks_done}</p>
                    <p className="text-xs text-neutral-600 mt-1">tâches</p>
                  </div>
                </div>

                {/* Barre de progression */}
                <div className="bg-neutral-50 rounded-xl p-4 border border-neutral-200">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-semibold text-neutral-700">Taux de complétion</p>
                    <p className="text-sm font-bold text-orange-600">
                      {member.completion_rate}%
                    </p>
                  </div>
                  <div className="w-full bg-neutral-200 rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-orange-500 to-orange-600 h-3 rounded-full transition-all duration-1000 shadow-md shadow-orange-500/30"
                      style={{ width: `${member.completion_rate}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* ✨ SECTION 4 : TÂCHES RÉCENTES */}
              {member.recent_tasks && member.recent_tasks.length > 0 && (
                <div className="bg-white rounded-xl border border-neutral-200 p-6">
                  <div className="flex items-center gap-2 mb-5">
                    <Calendar className="w-5 h-5 text-orange-600" strokeWidth={2} />
                    <h4 className="text-lg font-bold text-neutral-900">Tâches récentes</h4>
                  </div>
                  
                  <div className="space-y-3">
                    {member.recent_tasks.map((task) => (
                      <div
                        key={task.id}
                        className="group flex items-center justify-between p-4 bg-neutral-50 rounded-xl border border-neutral-200 hover:bg-orange-50 hover:border-orange-200 transition-all"
                      >
                        <div className="flex-1 min-w-0 mr-4">
                          <p className="text-sm font-semibold text-neutral-900 truncate mb-1">
                            {task.title}
                          </p>
                          {task.due_date && (
                            <div className="flex items-center gap-1.5 text-xs text-neutral-600">
                              <Calendar className="w-3.5 h-3.5" strokeWidth={2} />
                              <span>Échéance : {new Date(task.due_date).toLocaleDateString('fr-FR')}</span>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <span
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                              task.priority === 'high'
                                ? 'bg-red-100 text-red-700 border border-red-200'
                                : task.priority === 'medium'
                                ? 'bg-yellow-100 text-yellow-700 border border-yellow-200'
                                : 'bg-neutral-100 text-neutral-700 border border-neutral-200'
                            }`}
                          >
                            {task.priority === 'high' ? '🔥 Haute' : task.priority === 'medium' ? '⚡ Moyenne' : '📌 Basse'}
                          </span>

                          <span
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                              task.status === 'done'
                                ? 'bg-green-100 text-green-700 border border-green-200'
                                : task.status === 'in_progress'
                                ? 'bg-blue-100 text-blue-700 border border-blue-200'
                                : 'bg-neutral-100 text-neutral-700 border border-neutral-200'
                            }`}
                          >
                            {task.status === 'done' ? '✓ Terminée' : task.status === 'in_progress' ? '⏳ En cours' : '📋 À faire'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>

        {/* ✨ FOOTER MODERNE */}
        <div className="sticky bottom-0 bg-neutral-50 border-t border-neutral-200 px-6 py-4 flex justify-between rounded-b-xl">
          <button
            onClick={() => setIsDeleteModalOpen(true)}
            className="px-4 py-2.5 bg-white border border-red-200 text-red-600 text-sm font-semibold rounded-lg hover:bg-red-50 transition-all inline-flex items-center gap-2 hover:scale-105 active:scale-95"
          >
            <Trash2 className="w-4 h-4" strokeWidth={2} />
            Supprimer le membre
          </button>

          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-white border border-neutral-300 text-neutral-700 text-sm font-semibold rounded-lg hover:bg-neutral-100 transition-all"
          >
            Fermer
          </button>
        </div>
      </div>

      {/* Delete Modal */}
      <DeleteMemberModal
        member={member}
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onMemberDeleted={(deletedId) => {
          setIsDeleteModalOpen(false);
          onClose();
          if (onMemberDeleted) onMemberDeleted(deletedId);
        }}
      />

      {/* ✨ ANIMATIONS */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};
