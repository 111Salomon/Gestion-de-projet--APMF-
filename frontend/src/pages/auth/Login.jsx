import { useState } from 'react';
import { useNavigate } from "react-router-dom";
import { Mail, Lock, ArrowRight, Check } from "lucide-react";
import logo from "../../assets/img/APMF Logo.png";
import imgSide from "../../assets/img/rightSide.jpg";
import { useAuth } from '../../context/AuthContext';
import { useForm } from '../../hooks/useForm';
import { required, email, minLength } from '../../utils/validators';
import { Input } from '../../components/common/Input';

export const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const { values, errors, touched, handleChange, handleBlur, validateAll } = useForm(
    { username: '', password: '' },
    {
      username: [required, email],
      password: [required, minLength(8)],
    }
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateAll()) {
      return;
    }

    setIsLoading(true);
    
    try {
      const success = await login(values);
      if (success) {
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Erreur de connexion:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* ✨ PARTIE GAUCHE - FORMULAIRE (Améliorée) */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">
          
          {/* Logo Original (sans card) */}
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-8">
              <img 
                src={logo} 
                className="w-20 h-20 object-contain" 
                alt="Logo APMF" 
              />
              <div>
                <h1 className="text-2xl font-bold text-neutral-900">APMF</h1>
                <p className="text-sm text-neutral-600">Gestion de Projets</p>
              </div>
            </div>
            
            <h2 className="text-3xl font-bold text-neutral-900 mb-2">
              Bon retour !
            </h2>
            <p className="text-neutral-600">
              Connectez-vous pour accéder à votre espace
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Adresse Email"
              name="username"
              type="email"
              value={values.username}
              onChange={handleChange}
              onBlur={handleBlur}
              error={errors.username}
              touched={touched.username}
              required
              placeholder="email@entreprise.com"
              icon={Mail}
            />

            <Input
              label="Mot de passe"
              name="password"
              type="password"
              value={values.password}
              onChange={handleChange}
              onBlur={handleBlur}
              error={errors.password}
              touched={touched.password}
              required
              placeholder="Entrez votre mot de passe"
              icon={Lock}
            />

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input 
                  type="checkbox" 
                  className="w-4 h-4 rounded border border-neutral-300 text-orange-600 focus:ring-2 focus:ring-orange-500 transition-all"
                />
                <span className="text-neutral-600">Se souvenir de moi</span>
              </label>
              
              <a href="#" className="text-orange-600 hover:text-orange-700 font-medium">
                Mot de passe oublié ?
              </a>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="
                w-full flex items-center justify-center gap-2 px-5 py-3
                bg-gradient-to-r from-orange-500 to-orange-600 text-white
                rounded-lg font-semibold text-sm
                hover:shadow-lg hover:shadow-orange-500/30
                transition-all duration-300
                hover:scale-[1.02] active:scale-[0.98]
                disabled:opacity-50 disabled:cursor-not-allowed
                focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2
              "
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                  </svg>
                  <span>Connexion...</span>
                </>
              ) : (
                <>
                  <span>Se connecter</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="my-8 flex items-center gap-4">
            <div className="flex-1 h-px bg-neutral-200"></div>
            <span className="text-sm text-neutral-500">ou</span>
            <div className="flex-1 h-px bg-neutral-200"></div>
          </div>

          <div className="text-center text-sm text-neutral-600">
            Pas encore de compte ?{' '}
            <a href="#" className="text-orange-600 hover:text-orange-700 font-medium">
              Créer un compte
            </a>
          </div>
        </div>
      </div>

 {/* Partie droite - Image/Design */}
      <div className="hidden lg:flex lg:w-1/2 relative ">
        {/* Image de fond */}
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${imgSide})` }}
        >

        </div>
        
        {/* Contenu superposé */}
        <div className="relative z-10 w-full flex items-center justify-center p-12 bg-black/25 backdrop-blur-sm m-10 rounded-2xl border border-white/10">
          {/* Cercles décoratifs */}
          <div className="absolute top-10 right-10 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 left-10 w-96 h-96 bg-primary-400/20 rounded-full blur-3xl"></div>
          
          <div className="relative z-10 text-white max-w-lg w-full">
            <div className="mb-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full mb-6">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                <span className="text-sm font-medium">Plateforme Active</span>
              </div>
              
              <h2 className="text-5xl font-bold mb-4 leading-tight  text-white">
                Gérez vos projets efficacement
              </h2>
              <p className="text-xl text-primary-30 mb-8">
                Une solution professionnelle pour orchestrer vos tâches et collaborer en équipe
              </p>
            </div>

            {/* Features */}
            <div className="space-y-4 ">
              {[
                { icon: '✓', text: 'Gestion des projets en temps réel' },
                { icon: '✓', text: 'Collaboration d\'équipe simplifiée' },
                { icon: '✓', text: 'Suivi de progression automatique' },
                { icon: '✓', text: 'Interface intuitive et moderne' },
              ].map((feature, index) => (
                <div 
                  key={index} 
                  className="flex items-center gap-3 text-primary-50"
                >
                  <div className="flex-shrink-0 w-6 h-6 bg-white/20 rounded-full flex items-center justify-center text-sm">
                    {feature.icon}
                  </div>
                  <span>{feature.text}</span>
                </div>
              ))}
            </div>

            {/* Stats */}
            <div className="mt-12 grid grid-cols-3 gap-8">
              <div>
                <div className="text-3xl font-bold">500+</div>
                <div className="text-sm text-primary-200">Projets actifs</div>
              </div>
              <div>
                <div className="text-3xl font-bold">98%</div>
                <div className="text-sm text-primary-200">Satisfaction</div>
              </div>
              <div>
                <div className="text-3xl font-bold">24/7</div>
                <div className="text-sm text-primary-200">Support</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
