// TaskForm.jsx - Formulaire de création/modification de tâche (Controlled Form)
import { useState, useEffect } from 'react';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
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

  // Merge avec initialData (extraction des IDs si nécessaire)
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
    <form onSubmit={handleSubmit} className="space-y-6">
      
      {/* Titre */}
      <Input
        label="Titre de la Tâche"
        name="title"
        value={values.title}
        onChange={handleChange}
        onBlur={handleBlur}
        error={errors.title}
        touched={touched.title}
        required
        placeholder="Ex: Créer les maquettes UI"
      />

      {/* Description */}
      <div>
        <label htmlFor="description" className="label label-required">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          value={values.description}
          onChange={handleChange}
          onBlur={handleBlur}
          rows={4}
          placeholder="Décrivez la tâche en détail..."
          className={`input-field ${touched.description && errors.description ? 'input-error' : ''}`}
        />
        {touched.description && errors.description && (
          <p className="error-message">{errors.description}</p>
        )}
      </div>

      {/* Statut + Priorité */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="status" className="label label-required">
            Statut
          </label>
          <select
            id="status"
            name="status"
            value={values.status}
            onChange={handleChange}
            onBlur={handleBlur}
            className="input-field"
          >
            <option value="todo">À faire</option>
            <option value="in_progress">En cours</option>
            <option value="done">Terminé</option>
            <option value="blocked">Bloqué</option>
          </select>
          {touched.status && errors.status && (
            <p className="error-message">{errors.status}</p>
          )}
        </div>

        <div>
          <label htmlFor="priority" className="label label-required">
            Priorité
          </label>
          <select
            id="priority"
            name="priority"
            value={values.priority}
            onChange={handleChange}
            onBlur={handleBlur}
            className="input-field"
          >
            <option value="low">Faible</option>
            <option value="medium">Moyenne</option>
            <option value="high">Urgente</option>
          </select>
          {touched.priority && errors.priority && (
            <p className="error-message">{errors.priority}</p>
          )}
        </div>
      </div>

      {/* Projet */}
      <div>
        <label htmlFor="project" className="label">
          Projet (optionnel)
        </label>
        <select
          id="project"
          name="project"
          value={values.project}
          onChange={handleChange}
          onBlur={handleBlur}
          className="input-field"
          disabled={loadingProjects}
        >
          <option value="">Aucun projet</option>
          {projects.map((proj) => (
            <option key={proj.id} value={proj.id}>
              {proj.name}
            </option>
          ))}
        </select>
      </div>

      {/* Assigner à (conditionnel) */}
      {values.project && (
        <div>
          <label htmlFor="assigned_to" className="label">
            Assigner à
          </label>
          <select
            id="assigned_to"
            name="assigned_to"
            value={values.assigned_to}
            onChange={handleChange}
            onBlur={handleBlur}
            className="input-field"
            disabled={loadingMembers}
          >
            <option value="">Non assigné</option>
            {projectMembers.map((member) => (
              <option key={member.id} value={member.id}>
                {member.name} ({member.email})
              </option>
            ))}
          </select>
          {loadingMembers && (
            <p className="text-sm text-neutral-500 mt-1">
              Chargement des membres...
            </p>
          )}
        </div>
      )}

      {/* Date d'échéance */}
      <Input
        label="Date d'Échéance"
        name="due_date"
        type="date"
        value={values.due_date}
        onChange={handleChange}
        onBlur={handleBlur}
        error={errors.due_date}
        touched={touched.due_date}
        required
      />

      {/* Pièces jointes (mode édition uniquement) */}
      {initialData && initialData.id && (
        <div className="border-t border-neutral-200 pt-6 mt-6">
          <h3 className="text-lg font-semibold text-neutral-900 mb-4">
            📎 Ajouter des pièces jointes
          </h3>
          <AttachmentUploader
            taskId={initialData.id}
            onUploadSuccess={handleUploadSuccess}
          />
          <p className="mt-3 text-xs text-neutral-500">
            💡 Les fichiers uploadés seront visibles dans la page de détail de la tâche
          </p>
        </div>
      )}

      {/* Boutons */}
      <div className="flex items-center gap-3 pt-4">
        <Button
          type="submit"
          variant="primary"
          fullWidth
          loading={isLoading}
          disabled={isLoading}
        >
          {initialData ? 'Mettre à Jour' : 'Créer la Tâche'}
        </Button>
        <Button
          type="button"
          variant="secondary"
          fullWidth
          onClick={onCancel}
          disabled={isLoading}
        >
          Annuler
        </Button>
      </div>
    </form>
  );
};
