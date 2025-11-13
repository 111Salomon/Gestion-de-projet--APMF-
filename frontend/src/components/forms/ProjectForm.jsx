import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { useForm } from '../../hooks/useForm';
import { required, minLength } from '../../utils/validators';

/**
 * Formulaire de création/modification de projet
 */
export const ProjectForm = ({ 
  onSubmit, 
  onCancel, 
  initialData = null,  // ← Peut être null
  isLoading = false 
}) => {
  // Gestion sécurisée des valeurs initiales
  const defaultValues = {
    name: '',
    description: '',
    status: 'active',
    start_date: '',
    end_date: ''
  };

  // Merge les valeurs par défaut avec initialData s'il existe
  const formData = initialData ? { ...defaultValues, ...initialData } : defaultValues;

  const { 
    values, 
    errors, 
    touched, 
    handleChange, 
    handleBlur, 
    validateAll 
  } = useForm(
    formData,  // ← Utilise formData sécurisé
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
    
    if (!validateAll()) {
      return;
    }

    onSubmit(values);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Nom du projet */}
      <Input
        label="Nom du Projet"
        name="name"
        value={values.name}
        onChange={handleChange}
        onBlur={handleBlur}
        error={errors.name}
        touched={touched.name}
        required
        placeholder="Ex: Refonte Site Web"
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
          placeholder="Décrivez les objectifs du projet..."
          className={`input-field ${
            touched.description && errors.description ? 'input-error' : ''
          }`}
        />
        {touched.description && errors.description && (
          <p className="error-message">{errors.description}</p>
        )}
      </div>

      {/* Statut */}
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
          <option value="active">Actif</option>
          <option value="on_hold">En attente</option>
          <option value="completed">Terminé</option>
          <option value="cancelled">Annulé</option>
        </select>
      </div>

      {/* Dates */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Date de Début"
          name="start_date"
          type="date"
          value={values.start_date}
          onChange={handleChange}
          onBlur={handleBlur}
          error={errors.start_date}
          touched={touched.start_date}
          required
        />

        <Input
          label="Date de Fin"
          name="end_date"
          type="date"
          value={values.end_date}
          onChange={handleChange}
          onBlur={handleBlur}
          error={errors.end_date}
          touched={touched.end_date}
          required
        />
      </div>

      {/* Boutons */}
      <div className="flex items-center gap-3 pt-4">
        <Button
          type="submit"
          variant="primary"
          fullWidth
          loading={isLoading}
          disabled={isLoading}
        >
          {initialData ? 'Mettre à Jour' : 'Créer le Projet'}
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
