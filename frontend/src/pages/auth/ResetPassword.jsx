/**
 * ═══════════════════════════════════════════════════════════════
 * RESET PASSWORD PAGE - VERSION CORRIGÉE
 * ═══════════════════════════════════════════════════════════════
 */

import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Shield,
  ArrowLeft
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import logo from '../../assets/img/APMF Logo.png';

export const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const uid = searchParams.get('uid');
  const token = searchParams.get('token');
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Calcul de la force du mot de passe
  const getPasswordStrength = () => {
    if (!password) return null;
    if (password.length < 8) return { label: 'Faible', color: 'red', width: '33%' };
    if (password.length < 12) return { label: 'Moyen', color: 'yellow', width: '66%' };
    return { label: 'Fort', color: 'green', width: '100%' };
  };
  
  const strength = getPasswordStrength();
  
  // Vérifications pour affichage visuel uniquement
  const isPasswordTooShort = password.length > 0 && password.length < 8;
  const isPasswordsMatch = confirmPassword.length > 0 && password === confirmPassword;
  const isPasswordsMismatch = confirmPassword.length > 0 && password !== confirmPassword;
  
  // Vérifier si le formulaire est valide pour activer le bouton
  const isFormValid = password.length >= 8 && confirmPassword.length >= 8 && password === confirmPassword;
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation finale avant soumission
    if (password !== confirmPassword) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }
    
    if (password.length < 8) {
      toast.error('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }
    
    setLoading(true);
    
    try {
      await axios.post('http://localhost:8000/api/users/reset-password/', {
        uid,
        token,
        password
      });
      
      toast.success('Mot de passe créé avec succès !');
      setTimeout(() => navigate('/login'), 1500);
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Lien invalide ou expiré';
      toast.error(errorMsg);
      console.error('Reset password error:', error);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-neutral-50 to-neutral-100 px-4 py-8">
      <div className="max-w-md w-full animate-fadeIn">
        
        {/* ✨ LOGO & HEADER */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl shadow-lg shadow-orange-500/30 mb-4 animate-slideDown">
            {logo ? (
              <img src={logo} alt="Logo" className="w-12 h-12 object-contain" />
            ) : (
              <Shield className="w-10 h-10 text-white" strokeWidth={2.5} />
            )}
          </div>
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">
            Nouveau mot de passe
          </h1>
          <p className="text-neutral-600">
            Créez un mot de passe sécurisé pour votre compte
          </p>
        </div>
        
        {/* ✨ CARD PRINCIPALE */}
        <div className="bg-white rounded-2xl shadow-xl border border-neutral-200 p-8 animate-slideUp">
          
          {/* Info Box */}
          <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl mb-6">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" strokeWidth={2} />
            <p className="text-xs text-blue-800 leading-relaxed">
              Choisissez un mot de passe d'au moins 8 caractères pour sécuriser votre compte.
            </p>
          </div>
          
          {/* ✨ FORMULAIRE */}
          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* Nouveau mot de passe */}
            <div>
              <label className="block text-sm font-semibold text-neutral-700 mb-2">
                Nouveau mot de passe
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" strokeWidth={2} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 8 caractères"
                  className={`
                    w-full pl-10 pr-12 py-2.5 border rounded-lg text-sm
                    focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-0
                    transition-all
                    ${isPasswordTooShort
                      ? 'border-red-300 bg-red-50' 
                      : password.length >= 8
                      ? 'border-green-300 bg-green-50'
                      : 'border-neutral-300 hover:border-neutral-400'
                    }
                  `}
                  required
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
              
              {/* Barre de force du mot de passe */}
              {password && (
                <div className="mt-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-medium text-neutral-600">
                      Force du mot de passe
                    </span>
                    {strength && (
                      <span className={`text-xs font-bold ${
                        strength.color === 'red' ? 'text-red-600' :
                        strength.color === 'yellow' ? 'text-yellow-600' :
                        'text-green-600'
                      }`}>
                        {strength.label}
                      </span>
                    )}
                  </div>
                  <div className="w-full bg-neutral-200 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${
                        strength.color === 'red' ? 'bg-red-500' :
                        strength.color === 'yellow' ? 'bg-yellow-500' :
                        'bg-green-500'
                      }`}
                      style={{ width: strength.width }}
                    />
                  </div>
                </div>
              )}
              
              {/* Message erreur */}
              {isPasswordTooShort && (
                <div className="flex items-center gap-1.5 mt-2">
                  <AlertCircle className="w-3.5 h-3.5 text-red-600" strokeWidth={2} />
                  <p className="text-xs text-red-600 font-medium">
                    Le mot de passe doit contenir au moins 8 caractères
                  </p>
                </div>
              )}
            </div>
            
            {/* Confirmer mot de passe */}
            <div>
              <label className="block text-sm font-semibold text-neutral-700 mb-2">
                Confirmer le mot de passe
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" strokeWidth={2} />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Retapez votre mot de passe"
                  className={`
                    w-full pl-10 pr-12 py-2.5 border rounded-lg text-sm
                    focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-0
                    transition-all
                    ${isPasswordsMismatch
                      ? 'border-red-300 bg-red-50' 
                      : isPasswordsMatch
                      ? 'border-green-300 bg-green-50'
                      : 'border-neutral-300 hover:border-neutral-400'
                    }
                  `}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors p-1"
                >
                  {showConfirmPassword ? 
                    <EyeOff className="w-4 h-4" strokeWidth={2} /> : 
                    <Eye className="w-4 h-4" strokeWidth={2} />
                  }
                </button>
                
                {/* Icon validation */}
                {isPasswordsMatch && (
                  <div className="absolute right-11 top-1/2 -translate-y-1/2">
                    <CheckCircle2 className="w-5 h-5 text-green-600" strokeWidth={2} />
                  </div>
                )}
              </div>
              
              {/* Message erreur */}
              {isPasswordsMismatch && (
                <div className="flex items-center gap-1.5 mt-2">
                  <AlertCircle className="w-3.5 h-3.5 text-red-600" strokeWidth={2} />
                  <p className="text-xs text-red-600 font-medium">
                    Les mots de passe ne correspondent pas
                  </p>
                </div>
              )}
              
              {/* Message succès */}
              {isPasswordsMatch && (
                <div className="flex items-center gap-1.5 mt-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-600" strokeWidth={2} />
                  <p className="text-xs text-green-600 font-medium">
                    Les mots de passe correspondent
                  </p>
                </div>
              )}
            </div>
            
            {/* Bouton Submit */}
            <button
              type="submit"
              disabled={loading || !isFormValid}
              className="
                w-full flex items-center justify-center gap-2.5 
                px-6 py-3
                bg-gradient-to-r from-orange-500 to-orange-600 
                text-white font-semibold text-base
                rounded-lg
                shadow-lg shadow-orange-500/25
                hover:shadow-xl hover:shadow-orange-500/40
                hover:scale-[1.02] 
                active:scale-[0.98]
                transition-all duration-300
                disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
                focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2
              "
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                    <circle 
                      className="opacity-25" 
                      cx="12" 
                      cy="12" 
                      r="10" 
                      stroke="currentColor" 
                      strokeWidth="4"
                    />
                    <path 
                      className="opacity-75" 
                      fill="currentColor" 
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  <span>Création en cours...</span>
                </>
              ) : (
                <>
                  <span>Créer mon mot de passe</span>
                  <ArrowRight className="w-5 h-5" strokeWidth={2.5} />
                </>
              )}
            </button>
          </form>
          
          {/* Divider */}
          <div className="my-6 flex items-center gap-4">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-neutral-200 to-transparent"></div>
            <span className="text-sm text-neutral-500 font-medium">ou</span>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-neutral-200 to-transparent"></div>
          </div>
          
          {/* Retour à la connexion */}
          <button
            onClick={() => navigate('/login')}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-neutral-700 text-sm font-semibold hover:bg-neutral-50 rounded-lg transition-all border border-neutral-200 hover:border-neutral-300"
          >
            <ArrowLeft className="w-4 h-4" strokeWidth={2} />
            <span>Retour à la connexion</span>
          </button>
        </div>
        
        {/* Footer info */}
        <div className="mt-6 text-center">
          <p className="text-xs text-neutral-600">
            Besoin d'aide ? Contactez{' '}
            <a href="mailto:support@example.com" className="text-orange-600 hover:text-orange-700 font-semibold">
              le support
            </a>
          </p>
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
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }
        .animate-slideUp {
          animation: slideUp 0.5s ease-out 0.1s both;
        }
        .animate-slideDown {
          animation: slideDown 0.5s ease-out both;
        }
      `}</style>
    </div>
  );
};
