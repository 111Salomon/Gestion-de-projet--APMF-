/**
 * ═══════════════════════════════════════════════════════════════
 * ADD MEMBER MODAL - DESIGN ÉPURÉ ET MODERNE
 * ═══════════════════════════════════════════════════════════════
 * 
 * ✅ Formulaire complet avec validation
 * ✅ Design minimaliste et professionnel
 * ✅ Thème orange cohérent
 * ✅ Icons Lucide
 * ✅ Animations smooth
 */

import { useState } from 'react';
import { 
  X, 
  Mail, 
  User, 
  UserPlus,
  Lock,
  Eye, 
  EyeOff,
  Phone,
  FileText,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { addMember } from '../../api/team';
import toast from 'react-hot-toast';

export const AddMemberModal = ({ isOpen, onClose, onMemberAdded }) => {
  const [formData, setFormData] = useState({
    email: '',
    first_name: '',
    last_name: '',
    role: 'membre',
    password: '',
    password_confirm: '',
    phone: '',
    bio: '',
  });
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);

  // Reset le formulaire
  const handleClose = () => {
    setFormData({
      email: '',
      first_name: '',
      last_name: '',
      role: 'membre',
      password: '',
      password_confirm: '',
      phone: '',
      bio: '',
    });
    setErrors({});
    setShowPassword(false);
    setShowPasswordConfirm(false);
    onClose();
  };

  // Gère les changements
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

  // Validation frontend
  const validate = () => {
    const newErrors = {};

    // Email
    if (!formData.email) {
      newErrors.email = 'L\'email est requis';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email invalide';
    }

    // Prénom
    if (!formData.first_name) {
      newErrors.first_name = 'Le prénom est requis';
    } else if (formData.first_name.length < 2) {
      newErrors.first_name = 'Le prénom doit contenir au moins 2 caractères';
    }

    // Nom
    if (!formData.last_name) {
      newErrors.last_name = 'Le nom est requis';
    } else if (formData.last_name.length < 2) {
      newErrors.last_name = 'Le nom doit contenir au moins 2 caractères';
    }

    // Rôle
    if (!formData.role) {
      newErrors.role = 'Le rôle est requis';
    }

    // Mot de passe
    if (!formData.password) {
      newErrors.password = 'Le mot de passe est requis';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Le mot de passe doit contenir au moins 8 caractères';
    }

    // Confirmation
    if (!formData.password_confirm) {
      newErrors.password_confirm = 'La confirmation est requise';
    } else if (formData.password !== formData.password_confirm) {
      newErrors.password_confirm = 'Les mots de passe ne correspondent pas';
    }

    // Bio
    if (formData.bio && formData.bio.length > 500) {
      newErrors.bio = 'La biographie ne peut pas dépasser 500 caractères';
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
      const response = await addMember(formData);
      toast.success(response.message || 'Membre ajouté avec succès !');
      onMemberAdded(response.member);
      handleClose();
    } catch (error) {
      // Gestion des erreurs backend
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
        toast.error('Veuillez corriger les erreurs du formulaire');
      } else {
        const errorMessage =
          error.response?.data?.error || 'Erreur lors de l\'ajout du membre';
        toast.error(errorMessage);
      }
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
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl animate-slideUp">
        
        {/* ✨ HEADER MODERNE */}
        <div className="sticky top-0 bg-white border-b border-neutral-200 px-6 py-4 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-md shadow-orange-500/20">
                <UserPlus className="w-5 h-5 text-white" strokeWidth={2.5} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-neutral-900">
                  Ajouter un membre
                </h2>
                <p className="text-xs text-neutral-600">
                  Créer un nouveau compte avec accès immédiat
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
        <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
          <form onSubmit={handleSubmit} className="px-6 py-6">
            <div className="space-y-5">
              
              {/* ═══ SECTION 1: IDENTITÉ ═══ */}
              <div className="space-y-5 pb-5 border-b border-neutral-200">
                <h3 className="text-sm font-bold text-neutral-900 uppercase tracking-wide flex items-center gap-2">
                  <User className="w-4 h-4 text-orange-600" strokeWidth={2} />
                  Identité
                </h3>

                {/* Email */}
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
                      Prénom <span className="text-orange-600">*</span>
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" strokeWidth={2} />
                      <input
                        type="text"
                        name="first_name"
                        value={formData.first_name}
                        onChange={handleChange}
                        placeholder="Jean"
                        className={`
                          w-full pl-10 pr-4 py-2.5 border rounded-lg text-sm
                          focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-0
                          transition-all
                          ${errors.first_name 
                            ? 'border-red-300 bg-red-50 focus:ring-red-500' 
                            : 'border-neutral-300 hover:border-neutral-400'
                          }
                        `}
                      />
                    </div>
                    {errors.first_name && (
                      <div className="flex items-center gap-1.5 mt-2">
                        <AlertCircle className="w-3.5 h-3.5 text-red-600" strokeWidth={2} />
                        <p className="text-xs text-red-600 font-medium">{errors.first_name}</p>
                      </div>
                    )}
                  </div>

                  {/* Nom */}
                  <div>
                    <label className="block text-sm font-semibold text-neutral-700 mb-2">
                      Nom <span className="text-orange-600">*</span>
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" strokeWidth={2} />
                      <input
                        type="text"
                        name="last_name"
                        value={formData.last_name}
                        onChange={handleChange}
                        placeholder="Dupont"
                        className={`
                          w-full pl-10 pr-4 py-2.5 border rounded-lg text-sm
                          focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-0
                          transition-all
                          ${errors.last_name 
                            ? 'border-red-300 bg-red-50 focus:ring-red-500' 
                            : 'border-neutral-300 hover:border-neutral-400'
                          }
                        `}
                      />
                    </div>
                    {errors.last_name && (
                      <div className="flex items-center gap-1.5 mt-2">
                        <AlertCircle className="w-3.5 h-3.5 text-red-600" strokeWidth={2} />
                        <p className="text-xs text-red-600 font-medium">{errors.last_name}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Rôle */}
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
              </div>

              {/* ═══ SECTION 2: SÉCURITÉ ═══ */}
              <div className="space-y-5 pb-5 border-b border-neutral-200">
                <h3 className="text-sm font-bold text-neutral-900 uppercase tracking-wide flex items-center gap-2">
                  <Lock className="w-4 h-4 text-orange-600" strokeWidth={2} />
                  Sécurité
                </h3>

                {/* Mot de passe */}
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-2">
                    Mot de passe <span className="text-orange-600">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" strokeWidth={2} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Minimum 8 caractères"
                      className={`
                        w-full pl-10 pr-12 py-2.5 border rounded-lg text-sm
                        focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-0
                        transition-all
                        ${errors.password 
                          ? 'border-red-300 bg-red-50 focus:ring-red-500' 
                          : 'border-neutral-300 hover:border-neutral-400'
                        }
                      `}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors p-1"
                    >
                      {showPassword ? 
                        <EyeOff className="w-4 h-4" strokeWidth={2} /> : 
                        <Eye className="w-4 h-4" strokeWidth={2} />
                      }
                    </button>
                  </div>
                  {errors.password && (
                    <div className="flex items-center gap-1.5 mt-2">
                      <AlertCircle className="w-3.5 h-3.5 text-red-600" strokeWidth={2} />
                      <p className="text-xs text-red-600 font-medium">{errors.password}</p>
                    </div>
                  )}
                </div>

                {/* Confirmation mot de passe */}
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-2">
                    Confirmer le mot de passe <span className="text-orange-600">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" strokeWidth={2} />
                    <input
                      type={showPasswordConfirm ? 'text' : 'password'}
                      name="password_confirm"
                      value={formData.password_confirm}
                      onChange={handleChange}
                      placeholder="Retapez le mot de passe"
                      className={`
                        w-full pl-10 pr-12 py-2.5 border rounded-lg text-sm
                        focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-0
                        transition-all
                        ${errors.password_confirm 
                          ? 'border-red-300 bg-red-50 focus:ring-red-500' 
                          : 'border-neutral-300 hover:border-neutral-400'
                        }
                      `}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors p-1"
                    >
                      {showPasswordConfirm ? 
                        <EyeOff className="w-4 h-4" strokeWidth={2} /> : 
                        <Eye className="w-4 h-4" strokeWidth={2} />
                      }
                    </button>
                  </div>
                  {errors.password_confirm && (
                    <div className="flex items-center gap-1.5 mt-2">
                      <AlertCircle className="w-3.5 h-3.5 text-red-600" strokeWidth={2} />
                      <p className="text-xs text-red-600 font-medium">{errors.password_confirm}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* ═══ SECTION 3: INFORMATIONS COMPLÉMENTAIRES ═══ */}
              <div className="space-y-5">
                <h3 className="text-sm font-bold text-neutral-900 uppercase tracking-wide flex items-center gap-2">
                  <FileText className="w-4 h-4 text-orange-600" strokeWidth={2} />
                  Informations complémentaires
                  <span className="text-xs font-normal text-neutral-500 normal-case">(optionnel)</span>
                </h3>

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
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="+33 6 12 34 56 78"
                      className="w-full pl-10 pr-4 py-2.5 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-0 hover:border-neutral-400 transition-all"
                    />
                  </div>
                </div>

                {/* Bio */}
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-2">
                    Biographie
                  </label>
                  <textarea
                    name="bio"
                    value={formData.bio}
                    onChange={handleChange}
                    placeholder="Courte description du membre..."
                    rows={4}
                    maxLength={500}
                    className={`
                      w-full px-4 py-3 border rounded-lg text-sm
                      focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-0
                      resize-none transition-all
                      ${errors.bio 
                        ? 'border-red-300 bg-red-50 focus:ring-red-500' 
                        : 'border-neutral-300 hover:border-neutral-400'
                      }
                    `}
                  />
                  <div className="flex justify-between items-center mt-2">
                    {errors.bio ? (
                      <div className="flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 text-red-600" strokeWidth={2} />
                        <p className="text-xs text-red-600 font-medium">{errors.bio}</p>
                      </div>
                    ) : (
                      <span className="text-xs text-neutral-500 font-medium">
                        {formData.bio.length}/500 caractères
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* ✨ INFO BOX */}
              <div className="flex items-start gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" strokeWidth={2} />
                <div>
                  <p className="text-xs text-emerald-800 font-medium leading-relaxed">
                    Le membre sera créé immédiatement et pourra se connecter avec ces identifiants.
                  </p>
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* ✨ FOOTER - BOUTONS D'ACTION */}
        <div className="sticky bottom-0 bg-neutral-50 border-t border-neutral-200 px-6 py-4 flex justify-end gap-3 rounded-b-xl">
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
                <span>Création en cours...</span>
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4" strokeWidth={2} />
                <span>Créer le membre</span>
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
