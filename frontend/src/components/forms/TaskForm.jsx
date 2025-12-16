/**
 * ═══════════════════════════════════════════════════════════════
 * TASK FORM - DESIGN ÉPURÉ ET COHÉRENT
 * ═══════════════════════════════════════════════════════════════
 * 
 * ✅ Design identique à ProjectForm
 * ⚠️ Logique 100% préservée
 */

import { useState, useEffect } from 'react';
import { useForm } from '../../hooks/useForm';
import { required, minLength } from '../../utils/validators';
import { projectsAPI } from '../../api/projects';
import AttachmentUploader from '../tasks/AttachmentUploader';
import toast from 'react-hot-toast';

export const TaskForm = ({ 
  onSubmit, 
  onCancel, 
  initialData = null, 
  isLoading = false 
}) => {
  // États locaux
  const [projects, setProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [projectMembers, setProjectMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  // Valeurs par défaut
  const defaultValues = {
    title: '',
    description: '',
    status: 'todo',
    priority: 'medium',
    project: '',
    assigned_to: '',
    due_date: '',
  };

  // Merge avec initialData
  const formData = initialData 
    ? {
        ...defaultValues,
        ...initialData,
        project: initialData.project?.id || initialData.project || '',
        assigned_to: initialData.assigned_to?.id || initialData.assigned_to || '',
      }
    : defaultValues;

  // Hook de gestion du formulaire
  const { 
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    validateAll
  } = useForm(formData, {
    title: [required, minLength(3)],
    description: [required, minLength(10)],
    status: [required],
    priority: [required],
    due_date: [required],
  });

  // Charger les projets au montage
  useEffect(() => {
    loadProjects();
  }, []);

  // Charger les membres quand le projet change
  useEffect(() => {
    if (values.project) {
      loadProjectMembers(values.project);
    } else {
      setProjectMembers([]);
    }
  }, [values.project]);

  // Chargement des projets
  const loadProjects = async () => {
    try {
      setLoadingProjects(true);
      const data = await projectsAPI.getAll();
      const projectsList = Array.isArray(data) ? data : (data.results || []);
      setProjects(projectsList);
    } catch (error) {
      console.error('Erreur chargement projets:', error);
      setProjects([]);
    } finally {
      setLoadingProjects(false);
    }
  };

  // Chargement des membres du projet
  const loadProjectMembers = async (projectId) => {
    if (!projectId) {
      setProjectMembers([]);
      return;
    }

    try {
      setLoadingMembers(true);
      const data = await projectsAPI.getMembers(projectId);
      const membersList = data.map(member => ({
        id: member.user.id,
        name: member.user.full_name || member.user.username,
        email: member.user.email,
      }));
      setProjectMembers(membersList);
    } catch (error) {
      console.error('Erreur chargement membres:', error);
      setProjectMembers([]);
    } finally {
      setLoadingMembers(false);
    }
  };

  // Callback après upload réussi
  const handleUploadSuccess = () => {
    toast.success('Fichiers ajoutés avec succès !');
  };

  // Soumission du formulaire
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateAll()) {
      console.log('Formulaire invalide:', errors);
      return;
    }
    onSubmit(values);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      
      {/* ✨ TITRE */}
      <div className="space-y-2">
        <label 
          htmlFor="title" 
          className="block text-sm font-semibold text-neutral-900"
        >
          Titre de la Tâche <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <input
            id="title"
            name="title"
            type="text"
            value={values.title}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="Ex: Créer les maquettes UI"
            className={`
              w-full px-4 py-2.5 
              text-sm text-neutral-900 placeholder:text-neutral-400
              bg-white border rounded-lg
              transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-offset-0
              disabled:bg-neutral-50 disabled:cursor-not-allowed
              ${touched.title && errors.title
                ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
                : 'border-neutral-200 focus:border-orange-500 focus:ring-orange-500/20'
              }
            `}
            disabled={isLoading}
          />
          {touched.title && errors.title && (
            <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
              <span className="w-1 h-1 rounded-full bg-red-600"></span>
              {errors.title}
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
            placeholder="Décrivez la tâche en détail..."
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

      {/* ✨ STATUT + PRIORITÉ - Grille */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Statut */}
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
              <option value="todo">À faire</option>
              <option value="in_progress">En cours</option>
              <option value="in_review">En révision</option>
              <option value="done">Terminé</option>
            </select>
            {/* Chevron */}
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <svg className="w-4 h-4 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
          {touched.status && errors.status && (
            <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
              <span className="w-1 h-1 rounded-full bg-red-600"></span>
              {errors.status}
            </p>
          )}
        </div>

        {/* Priorité */}
        <div className="space-y-2">
          <label 
            htmlFor="priority" 
            className="block text-sm font-semibold text-neutral-900"
          >
            Priorité <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <select
              id="priority"
              name="priority"
              value={values.priority}
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
              <option value="low">Faible</option>
              <option value="medium">Moyenne</option>
              <option value="high">Urgente</option>
            </select>
            {/* Chevron */}
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <svg className="w-4 h-4 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
          {touched.priority && errors.priority && (
            <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
              <span className="w-1 h-1 rounded-full bg-red-600"></span>
              {errors.priority}
            </p>
          )}
        </div>
      </div>

      {/* ✨ PROJET */}
      <div className="space-y-2">
        <label 
          htmlFor="project" 
          className="block text-sm font-semibold text-neutral-900"
        >
          Projet <span className="text-neutral-400 font-normal">(optionnel)</span>
        </label>
        <div className="relative">
          <select
            id="project"
            name="project"
            value={values.project}
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
            disabled={loadingProjects || isLoading}
          >
            <option value="">Aucun projet</option>
            {projects.map((proj) => (
              <option key={proj.id} value={proj.id}>
                {proj.name}
              </option>
            ))}
          </select>
          {/* Chevron */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <svg className="w-4 h-4 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
        {loadingProjects && (
          <p className="mt-1.5 text-xs text-neutral-500 flex items-center gap-1.5">
            <svg className="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
            </svg>
            Chargement des projets...
          </p>
        )}
      </div>

      {/* ✨ ASSIGNER À (conditionnel) */}
      {values.project && (
        <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
          <label 
            htmlFor="assigned_to" 
            className="block text-sm font-semibold text-neutral-900"
          >
            Assigner à <span className="text-neutral-400 font-normal">(optionnel)</span>
          </label>
          <div className="relative">
            <select
              id="assigned_to"
              name="assigned_to"
              value={values.assigned_to}
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
              disabled={loadingMembers || isLoading}
            >
              <option value="">Non assigné</option>
              {projectMembers.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name} ({member.email})
                </option>
              ))}
            </select>
            {/* Chevron */}
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <svg className="w-4 h-4 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
          {loadingMembers && (
            <p className="mt-1.5 text-xs text-neutral-500 flex items-center gap-1.5">
              <svg className="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
              </svg>
              Chargement des membres...
            </p>
          )}
        </div>
      )}

      {/* ✨ DATE D'ÉCHÉANCE */}
      <div className="space-y-2">
        <label 
          htmlFor="due_date" 
          className="block text-sm font-semibold text-neutral-900"
        >
          Date d'Échéance <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <input
            id="due_date"
            name="due_date"
            type="date"
            value={values.due_date}
            onChange={handleChange}
            onBlur={handleBlur}
            className={`
              w-full px-4 py-2.5
              text-sm text-neutral-900
              bg-white border rounded-lg
              transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-offset-0
              disabled:bg-neutral-50 disabled:cursor-not-allowed
              ${touched.due_date && errors.due_date
                ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
                : 'border-neutral-200 focus:border-orange-500 focus:ring-orange-500/20'
              }
            `}
            disabled={isLoading}
          />
          {touched.due_date && errors.due_date && (
            <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
              <span className="w-1 h-1 rounded-full bg-red-600"></span>
              {errors.due_date}
            </p>
          )}
        </div>
      </div>

      {/* ✨ PIÈCES JOINTES (mode édition uniquement) */}
      {initialData && initialData.id && (
        <div className="border-t border-neutral-100 pt-5 mt-2 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
            </div>
            <h3 className="text-base font-bold text-neutral-900">
              Pièces jointes
            </h3>
          </div>
          
          <AttachmentUploader
            taskId={initialData.id}
            onUploadSuccess={handleUploadSuccess}
          />
          
          <p className="mt-3 text-xs text-neutral-500 flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Les fichiers uploadés seront visibles dans la page de détail de la tâche
          </p>
        </div>
      )}

      {/* ✨ BOUTONS */}
      <div className="flex items-center gap-3 pt-4 border-t border-neutral-100">
        {/* Bouton Primaire */}
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
            initialData ? 'Mettre à Jour' : 'Créer la Tâche'
          )}
        </button>
        
        {/* Bouton Secondaire */}
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
