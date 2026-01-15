/**
 * ═══════════════════════════════════════════════════════════════
 * PROJECT FORM - DESIGN ÉPURÉ ET SUBTIL
 * ═══════════════════════════════════════════════════════════════
 * 
 * ✅ Améliorations design :
 * - Bordures fines (1px)
 * - Focus states orange subtils
 * - Labels élégants avec astérisque
 * - Espacements généreux
 * - Transitions smooth
 * - Boutons cohérents avec le thème
 * - Select et textarea stylisés
 * 
 * ⚠️ Logique métier 100% préservée
 */

import { Calendar, FileText, Activity } from 'lucide-react';
import { useForm } from '../../hooks/useForm';
import { required, minLength } from '../../utils/validators';

export const ProjectForm = ({ 
  onSubmit, 
  onCancel, 
  initialData = null,
  isLoading = false 
}) => {
  // Valeurs par défaut
  const defaultValues = {
    name: '',
    description: '',
    status: 'active',
    start_date: '',
    end_date: ''
  };

  const formData = initialData ? { ...defaultValues, ...initialData } : defaultValues;

  const { 
    values, 
    errors, 
    touched, 
    handleChange, 
    handleBlur, 
    validateAll 
  } = useForm(
    formData,
    {
      name: [required, minLength(3)],
      description: [required, minLength(10)],
      status: [required],
      start_date: [required],
      end_date: [required],
    }
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateAll()) return;
    onSubmit(values);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      
      {/* ✨ NOM DU PROJET */}
      <div className="space-y-2 mt-4">
        <label 
          htmlFor="name" 
          className="block text-sm font-semibold text-neutral-900"
        >
          Nom du Projet <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <input
            id="name"
            name="name"
            type="text"
            value={values.name}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="Ex: Refonte Site Web"
            className={`
              w-full px-4 py-2.5 
              text-sm text-neutral-900 placeholder:text-neutral-400
              bg-white border rounded-lg
              transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-offset-0
              disabled:bg-neutral-50 disabled:cursor-not-allowed
              ${touched.name && errors.name
                ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
                : 'border-neutral-200 focus:border-orange-500 focus:ring-orange-500/20'
              }
            `}
            disabled={isLoading}
          />
          {touched.name && errors.name && (
            <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
              <span className="w-1 h-1 rounded-full bg-red-600"></span>
              {errors.name}
            </p>
          )}
        </div>
      </div>

      {/* ✨ DESCRIPTION */}
      <div className="space-y-2">
        <label 
          htmlFor="description" 
          className="block text-sm font-semibold text-neutral-900"
        >
          Description <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <textarea
            id="description"
            name="description"
            value={values.description}
            onChange={handleChange}
            onBlur={handleBlur}
            rows={4}
            placeholder="Décrivez les objectifs du projet..."
            className={`
              w-full px-4 py-3
              text-sm text-neutral-900 placeholder:text-neutral-400
              bg-white border rounded-lg
              transition-all duration-200
              resize-none
              focus:outline-none focus:ring-2 focus:ring-offset-0
              disabled:bg-neutral-50 disabled:cursor-not-allowed
              ${touched.description && errors.description
                ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
                : 'border-neutral-200 focus:border-orange-500 focus:ring-orange-500/20'
              }
            `}
            disabled={isLoading}
          />
          {touched.description && errors.description && (
            <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
              <span className="w-1 h-1 rounded-full bg-red-600"></span>
              {errors.description}
            </p>
          )}
        </div>
      </div>

      {/* ✨ STATUT */}
      <div className="space-y-2">
        <label 
          htmlFor="status" 
          className="block text-sm font-semibold text-neutral-900"
        >
          Statut <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <select
            id="status"
            name="status"
            value={values.status}
            onChange={handleChange}
            onBlur={handleBlur}
            className="
              w-full px-4 py-2.5
              text-sm text-neutral-900
              bg-white border border-neutral-200 rounded-lg
              appearance-none cursor-pointer
              transition-all duration-200
              focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20
              disabled:bg-neutral-50 disabled:cursor-not-allowed
            "
            disabled={isLoading}
          >
            <option value="active">Actif</option>
            <option value="on_hold">En attente</option>
            <option value="completed">Terminé</option>
            {/* <option value="cancelled">Annulé</option> */}
          </select>
          {/* Icône chevron custom */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <svg className="w-4 h-4 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>

      {/* ✨ DATES - Grille */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Date de Début */}
        <div className="space-y-2">
          <label 
            htmlFor="start_date" 
            className="block text-sm font-semibold text-neutral-900"
          >
            Date de Début <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              id="start_date"
              name="start_date"
              type="date"
              value={values.start_date}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`
                w-full px-4 py-2.5
                text-sm text-neutral-900
                bg-white border rounded-lg
                transition-all duration-200
                focus:outline-none focus:ring-2 focus:ring-offset-0
                disabled:bg-neutral-50 disabled:cursor-not-allowed
                ${touched.start_date && errors.start_date
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
                  : 'border-neutral-200 focus:border-orange-500 focus:ring-orange-500/20'
                }
              `}
              disabled={isLoading}
            />
            {touched.start_date && errors.start_date && (
              <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                <span className="w-1 h-1 rounded-full bg-red-600"></span>
                {errors.start_date}
              </p>
            )}
          </div>
        </div>

        {/* Date de Fin */}
        <div className="space-y-2">
          <label 
            htmlFor="end_date" 
            className="block text-sm font-semibold text-neutral-900"
          >
            Date de Fin <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              id="end_date"
              name="end_date"
              type="date"
              value={values.end_date}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`
                w-full px-4 py-2.5
                text-sm text-neutral-900
                bg-white border rounded-lg
                transition-all duration-200
                focus:outline-none focus:ring-2 focus:ring-offset-0
                disabled:bg-neutral-50 disabled:cursor-not-allowed
                ${touched.end_date && errors.end_date
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
                  : 'border-neutral-200 focus:border-orange-500 focus:ring-orange-500/20'
                }
              `}
              disabled={isLoading}
            />
            {touched.end_date && errors.end_date && (
              <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                <span className="w-1 h-1 rounded-full bg-red-600"></span>
                {errors.end_date}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ✨ BOUTONS - Cohérents avec le thème */}
      <div className="flex items-center gap-3 pt-4 border-t border-neutral-100">
        {/* Bouton Primaire (Submit) */}
        <button
          type="submit"
          disabled={isLoading}
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
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
              </svg>
              Traitement...
            </span>
          ) : (
            initialData ? 'Mettre à Jour' : 'Créer le Projet'
          )}
        </button>
        
        {/* Bouton Secondaire (Cancel) */}
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
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
  );
};
