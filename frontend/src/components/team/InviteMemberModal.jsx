/**
 * ═══════════════════════════════════════════════════════════════
 * INVITE MEMBER MODAL - DESIGN ÉPURÉ ET MODERNE
 * ═══════════════════════════════════════════════════════════════
 * 
 * ✅ Design minimaliste et professionnel
 * ✅ Thème orange cohérent
 * ✅ Icons Lucide
 * ✅ Animations smooth
 * ✅ UX optimisée
 */

import { useState } from 'react';
import { 
  X, 
  Mail, 
  User, 
  Users, 
  Send,
  AlertCircle,
  Info
} from 'lucide-react';
import { inviteMember } from '../../api/team';
import toast from 'react-hot-toast';

export const InviteMemberModal = ({ isOpen, onClose, onMemberInvited }) => {
  const [formData, setFormData] = useState({
    email: '',
    role: 'membre',
    first_name: '',
    last_name: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Reset le formulaire quand le modal s'ouvre
  const handleClose = () => {
    setFormData({
      email: '',
      role: 'membre',
      first_name: '',
      last_name: '',
    });
    setErrors({});
    onClose();
  };

  // Gère les changements du formulaire
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Efface l'erreur du champ modifié
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: null,
      }));
    }
  };

  // Validation du formulaire
  const validate = () => {
    const newErrors = {};

    if (!formData.email) {
      newErrors.email = 'L\'email est requis';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email invalide';
    }

    if (!formData.role) {
      newErrors.role = 'Le rôle est requis';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Soumet le formulaire
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setLoading(true);

    try {
      const response = await inviteMember(formData);
      toast.success(response.message || 'Membre invité avec succès !');
      onMemberInvited(response.member);
      handleClose();
    } catch (error) {
      const errorMessage =
        error.response?.data?.error || 'Erreur lors de l\'invitation';
      toast.error(errorMessage);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn"
      onClick={(e) => e.target === e.currentTarget && handleClose()}
    >
      <div className="bg-white rounded-xl max-w-md w-full shadow-2xl animate-slideUp">
        
        {/* ✨ HEADER MODERNE */}
        <div className="border-b border-neutral-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-md shadow-orange-500/20">
                <Users className="w-5 h-5 text-white" strokeWidth={2.5} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-neutral-900">
                  Inviter un membre
                </h2>
                <p className="text-xs text-neutral-600">
                  Ajouter un collaborateur à l'équipe
                </p>
              </div>
            </div>
            
            <button
              onClick={handleClose}
              className="p-2 hover:bg-neutral-100 rounded-lg transition-colors group"
            >
              <X className="w-5 h-5 text-neutral-600 group-hover:text-neutral-900" strokeWidth={2} />
            </button>
          </div>
        </div>

        {/* ✨ CONTENT - FORMULAIRE */}
        <form onSubmit={handleSubmit} className="px-6 py-6">
          <div className="space-y-5">
            
            {/* Email avec icon */}
            <div>
              <label className="block text-sm font-semibold text-neutral-700 mb-2">
                Adresse email <span className="text-orange-600">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" strokeWidth={2} />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="membre@example.com"
                  className={`
                    w-full pl-10 pr-4 py-2.5 border rounded-lg text-sm
                    focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-0
                    transition-all
                    ${errors.email 
                      ? 'border-red-300 bg-red-50 focus:ring-red-500' 
                      : 'border-neutral-300 hover:border-neutral-400'
                    }
                  `}
                />
              </div>
              {errors.email && (
                <div className="flex items-center gap-1.5 mt-2">
                  <AlertCircle className="w-3.5 h-3.5 text-red-600" strokeWidth={2} />
                  <p className="text-xs text-red-600 font-medium">{errors.email}</p>
                </div>
              )}
            </div>

            {/* Grid Prénom/Nom */}
            <div className="grid grid-cols-2 gap-4">
              {/* Prénom */}
              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-2">
                  Prénom
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" strokeWidth={2} />
                  <input
                    type="text"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleChange}
                    placeholder="Jean"
                    className="w-full pl-10 pr-4 py-2.5 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-0 hover:border-neutral-400 transition-all"
                  />
                </div>
              </div>

              {/* Nom */}
              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-2">
                  Nom
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" strokeWidth={2} />
                  <input
                    type="text"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleChange}
                    placeholder="Dupont"
                    className="w-full pl-10 pr-4 py-2.5 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-0 hover:border-neutral-400 transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Rôle - Select custom */}
            <div>
              <label className="block text-sm font-semibold text-neutral-700 mb-2">
                Rôle <span className="text-orange-600">*</span>
              </label>
              <div className="relative">
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className={`
                    appearance-none w-full pl-4 pr-10 py-2.5 border rounded-lg text-sm font-medium
                    focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-0
                    cursor-pointer transition-all
                    ${errors.role 
                      ? 'border-red-300 bg-red-50 focus:ring-red-500' 
                      : 'border-neutral-300 hover:border-neutral-400'
                    }
                    ${formData.role === 'admin' ? 'bg-red-50 text-red-700' :
                      formData.role === 'chef' ? 'bg-blue-50 text-blue-700' :
                      'bg-neutral-50 text-neutral-700'
                    }
                  `}
                >
                  <option value="membre">Membre</option>
                  <option value="chef">Chef de projet</option>
                  <option value="admin">Administrateur</option>
                </select>
                
                {/* Chevron custom */}
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
              {errors.role && (
                <div className="flex items-center gap-1.5 mt-2">
                  <AlertCircle className="w-3.5 h-3.5 text-red-600" strokeWidth={2} />
                  <p className="text-xs text-red-600 font-medium">{errors.role}</p>
                </div>
              )}
            </div>

            {/* Info Box */}
            <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl">
              <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" strokeWidth={2} />
              <div>
                <p className="text-xs text-blue-800 font-medium leading-relaxed">
                  Le membre recevra ses identifiants de connexion par email.
                </p>
              </div>
            </div>
          </div>
        </form>

        {/* ✨ FOOTER - BOUTONS D'ACTION */}
        <div className="border-t border-neutral-200 px-6 py-4 flex justify-end gap-3 bg-neutral-50 rounded-b-xl">
          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="px-5 py-2.5 border border-neutral-300 text-neutral-700 text-sm font-semibold rounded-lg hover:bg-neutral-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Annuler
          </button>
          
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="
              inline-flex items-center justify-center gap-2 
              px-5 py-2.5
              bg-gradient-to-r from-orange-500 to-orange-600 
              text-white text-sm font-semibold rounded-lg
              hover:shadow-lg hover:shadow-orange-500/30
              hover:scale-105 active:scale-95
              transition-all duration-200
              disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
              focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2
            "
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Envoi en cours...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" strokeWidth={2} />
                <span>Inviter</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ✨ ANIMATIONS */}
      <style jsx>{`
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
