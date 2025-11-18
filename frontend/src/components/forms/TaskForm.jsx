/**
 * ═══════════════════════════════════════════════════════════
 * TASKFORM - Formulaire de Création/Modification de Tâche
 * ═══════════════════════════════════════════════════════════
 * 
 * RESPONSABILITÉ : Capturer et valider les données d'une tâche
 * 
 * PRINCIPE : Controlled Form (Formulaire Contrôlé)
 * - React contrôle la valeur de chaque input
 * - Validation en temps réel
 * - Feedback utilisateur immédiat
 * 
 * RÉUTILISABILITÉ : Utilisé pour créer ET modifier
 * - Si initialData est null → Mode création
 * - Si initialData existe → Mode édition (pré-rempli)
 */

import { useState, useEffect } from 'react';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { useForm } from '../../hooks/useForm';
import { required, minLength } from '../../utils/validators';
import { projectsAPI } from '../../api/projects';
import AttachmentUploader from '../tasks/AttachmentUploader';
import AttachmentList from '../tasks/AttachmentList';

/**
 * ───────────────────────────────────────────────────────────
 * COMPOSANT TASKFORM
 * ───────────────────────────────────────────────────────────
 * 
 * @param {Function} onSubmit - Appelé quand le formulaire est valide
 * @param {Function} onCancel - Appelé quand l'utilisateur annule
 * @param {Object} initialData - Données initiales (pour édition)
 * @param {boolean} isLoading - État de chargement pendant la soumission
 * 
 * FLUX DE DONNÉES :
 * 
 *   User tape "Design UI" dans le champ titre
 *           ↓
 *   onChange déclenché
 *           ↓
 *   handleChange() appelé
 *           ↓
 *   setValues({ ...values, title: "Design UI" })
 *           ↓
 *   React re-rend le composant avec la nouvelle valeur
 *           ↓
 *   Le champ affiche "Design UI"
 */
export const TaskForm = ({ 
  onSubmit, 
  onCancel, 
  initialData = null, 
  isLoading = false 
}) => {

  /**
   * ─────────────────────────────────────────────────────────
   * ÉTAT LOCAL : Liste des Projets
   * ─────────────────────────────────────────────────────────
   * 
   * PRINCIPE : Chargement de données pour un select
   * 
   * On a besoin de la liste des projets pour que l'utilisateur
   * puisse choisir à quel projet appartient la tâche.
   * 
   * PATTERN : Fetch on Mount (charger au montage)
   */
  const [projects, setProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(true);

  // 🆕 AJOUT : État pour forcer le refresh des attachments
  const [refreshAttachments, setRefreshAttachments] = useState(0);

  /**
   * ─────────────────────────────────────────────────────────
   * VALEURS INITIALES DU FORMULAIRE
   * ─────────────────────────────────────────────────────────
   * 
   * PRINCIPE : Valeurs par défaut
   * 
   * Si initialData existe (mode édition), on pré-remplit.
   * Sinon, on met des valeurs vides (mode création).
   */
  const defaultValues = {
    title: '',
    description: '',
    status: 'todo',          // Statut par défaut
    priority: 'medium',      // Priorité par défaut
    project: '',             // ID du projet
    assigned_to: '',         // ID de l'utilisateur assigné
    due_date: '',            // Date d'échéance
  };

  /**
   * Merge des valeurs par défaut avec initialData
   * 
   * PRINCIPE : Object Spread (...)
   * 
   * { ...defaultValues, ...initialData }
   * 
   * Étape 1 : Copie defaultValues
   * Étape 2 : Écrase avec les valeurs de initialData si elles existent
   * 
   * Exemple :
   * defaultValues = { title: '', status: 'todo' }
   * initialData = { title: 'Design', status: 'done' }
   * Résultat = { title: 'Design', status: 'done' }
   */
  const formData = initialData 
    ? { ...defaultValues, ...initialData } 
    : defaultValues;

  /**
   * ─────────────────────────────────────────────────────────
   * HOOK USEFORM (Gestion du formulaire)
   * ─────────────────────────────────────────────────────────
   * 
   * PRINCIPE : Abstraction de la logique de formulaire
   * 
   * Ce hook custom gère :
   * - L'état des valeurs (values)
   * - L'état des erreurs (errors)
   * - Les champs touchés (touched)
   * - La validation
   * 
   * RÈGLES DE VALIDATION :
   * - title : obligatoire + minimum 3 caractères
   * - description : obligatoire + minimum 10 caractères
   * - status, priority, due_date : obligatoires
   */
  const { 
    values,       // { title: "...", description: "...", ... }
    errors,       // { title: "Ce champ est obligatoire", ... }
    touched,      // { title: true, description: false, ... }
    handleChange, // Fonction pour gérer onChange
    handleBlur,   // Fonction pour gérer onBlur
    validateAll   // Fonction pour tout valider
  } = useForm(
    formData,     // ← Valeurs initiales
    {
      // Règles de validation (tableau de fonctions)
      title: [required, minLength(3)],
      description: [required, minLength(10)],
      status: [required],
      priority: [required],
      due_date: [required],
    }
  );

  /**
   * ─────────────────────────────────────────────────────────
   * EFFET : Charger les Projets au Montage
   * ─────────────────────────────────────────────────────────
   * 
   * PRINCIPE : useEffect avec dépendances vides []
   * 
   * useEffect(() => { ... }, [])
   *                           ↑
   *                  [] = s'exécute UNE SEULE FOIS au montage
   * 
   * FLOW :
   * 1. Composant monte (s'affiche pour la première fois)
   * 2. useEffect s'exécute
   * 3. loadProjects() fait un appel API
   * 4. Django retourne les projets
   * 5. setProjects(data) met à jour l'état
   * 6. React re-rend le composant avec les projets
   * 7. Le <select> affiche la liste
   */
  useEffect(() => {
    loadProjects();
  }, []); // ← Dépendances vides = une seule fois

  /**
   * Charge la liste des projets depuis l'API
   * 
   * PRINCIPE : Async/Await dans useEffect
   * 
   * On ne peut pas faire useEffect(async () => { ... })
   * directement. On crée une fonction async à l'intérieur.
   */
  const loadProjects = async () => {
    try {
      setLoadingProjects(true);
      
      // Appel API (on a déjà créé cette fonction)
      const data = await projectsAPI.getAll();
      
      // Gère le format paginé de Django REST Framework
      const projectsList = Array.isArray(data) ? data : (data.results || []);
      
      setProjects(projectsList);
    } catch (error) {
      console.error('Erreur chargement projets:', error);
      setProjects([]); // Tableau vide en cas d'erreur
    } finally {
      setLoadingProjects(false);
    }
  };

    /**
   * ─────────────────────────────────────────────────────────
   * CALLBACK : Après Upload Réussi
   * ─────────────────────────────────────────────────────────
   * 
   * PRINCIPE : Forcer le refresh de AttachmentList
   * 
   * Quand un fichier est uploadé, on incrémente refreshAttachments
   * AttachmentList reçoit cette valeur comme prop et se recharge
   */
  const handleUploadSuccess = () => {
    setRefreshAttachments(prev => prev + 1);
  };

  /**
   * ─────────────────────────────────────────────────────────
   * GESTIONNAIRE DE SOUMISSION
   * ─────────────────────────────────────────────────────────
   * 
   * PRINCIPE : Validation avant soumission
   * 
   * FLOW :
   * 1. User clique sur "Créer la tâche"
   * 2. handleSubmit() est appelé
   * 3. e.preventDefault() empêche le rechargement de la page
   * 4. validateAll() vérifie tous les champs
   * 5. Si invalide → return (affiche les erreurs)
   * 6. Si valide → onSubmit(values) remonte au parent
   */
  const handleSubmit = (e) => {
    // Empêche le comportement par défaut du formulaire
    // (qui rechargerait la page)
    e.preventDefault();
    
    // Valide tous les champs
    // validateAll() retourne true si tout est valide
    if (!validateAll()) {
      console.log('Formulaire invalide:', errors);
      return; // Stop ici si invalide
    }

    // Formulaire valide → on soumet
    // values contient toutes les données du formulaire
    onSubmit(values);
  };
  /**
   * ─────────────────────────────────────────────────────────
   * RENDU JSX (Interface du Formulaire)
   * ─────────────────────────────────────────────────────────
   * 
   * STRUCTURE :
   * <form>
   *   <Input title />
   *   <textarea description />
   *   <select status />
   *   <select priority />
   *   <select project />
   *   <Input date />
   *   <Buttons />
   * </form>
   */
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      
      {/* ───────────────────────────────────────────────── */}
      {/* CHAMP : Titre de la Tâche                         */}
      {/* ───────────────────────────────────────────────── */}
      {/* 
        PRINCIPE : Composant Input Réutilisable
        
        On a créé un composant Input qui gère :
        - Le label
        - L'input
        - Le message d'erreur
        - Les styles
        
        Props passées :
        - label : Texte affiché au-dessus
        - name : Nom du champ (doit correspondre à la clé dans values)
        - value : Valeur actuelle (depuis values)
        - onChange : Fonction appelée quand l'user tape
        - onBlur : Fonction appelée quand l'user quitte le champ
        - error : Message d'erreur (depuis errors)
        - touched : Si l'user a touché ce champ (depuis touched)
      */}
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

      {/* ───────────────────────────────────────────────── */}
      {/* CHAMP : Description                               */}
      {/* ───────────────────────────────────────────────── */}
      {/*
        PRINCIPE : Textarea vs Input
        
        textarea = champ multi-lignes
        Input = champ une ligne
        
        On n'utilise pas le composant Input ici car c'est un textarea.
        On doit gérer manuellement les classes et les erreurs.
      */}
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
          className={`
            input-field
            ${touched.description && errors.description ? 'input-error' : ''}
          `}
        />
        {/* Affiche l'erreur seulement si le champ a été touché ET qu'il y a une erreur */}
        {touched.description && errors.description && (
          <p className="error-message">{errors.description}</p>
        )}
      </div>

      {/* ───────────────────────────────────────────────── */}
      {/* LIGNE : Statut + Priorité (2 colonnes)            */}
      {/* ───────────────────────────────────────────────── */}
      {/*
        PRINCIPE : Grid Layout avec Tailwind
        
        grid grid-cols-1 md:grid-cols-2 gap-4
        
        - grid : Active le système de grille CSS
        - grid-cols-1 : 1 colonne sur mobile
        - md:grid-cols-2 : 2 colonnes sur écrans moyens (≥768px)
        - gap-4 : Espace de 1rem entre les colonnes
      */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* SELECT : Statut */}
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
            {/*
              PRINCIPE : Options d'un select
              
              value = valeur technique (envoyée au backend)
              Texte = valeur affichée à l'utilisateur
            */}
            <option value="todo">À faire</option>
            <option value="in_progress">En cours</option>
            <option value="done">Terminé</option>
            <option value="blocked">Bloqué</option>
          </select>
          {touched.status && errors.status && (
            <p className="error-message">{errors.status}</p>
          )}
        </div>

        {/* SELECT : Priorité */}
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

      {/* ───────────────────────────────────────────────── */}
      {/* SELECT : Projet                                    */}
      {/* ───────────────────────────────────────────────── */}
      {/*
        PRINCIPE : Select Dynamique (chargé depuis l'API)
        
        Les options ne sont pas codées en dur, elles viennent
        de la base de données via l'API.
        
        FLOW :
        1. useEffect charge les projets
        2. setProjects(data) met à jour l'état
        3. React re-rend avec projects rempli
        4. .map() génère les <option>
      */}
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
          disabled={loadingProjects} // Désactivé pendant le chargement
        >
          <option value="">Aucun projet</option>
          
          {/*
            PRINCIPE : .map() pour générer des éléments React
            
            projects.map((proj) => <option key={proj.id} .../>)
            
            Pour chaque projet, on crée un <option>
            
            IMPORTANT : key={proj.id}
            React a besoin d'une clé unique pour identifier
            chaque élément et optimiser le rendu.
          */}
          {projects.map((proj) => (
            <option key={proj.id} value={proj.id}>
              {proj.name}
            </option>
          ))}
        </select>
      </div>

      {/* ───────────────────────────────────────────────── */}
      {/* INPUT : Date d'Échéance                           */}
      {/* ───────────────────────────────────────────────── */}
      {/*
        PRINCIPE : Input de type date
        
        type="date" affiche un date picker natif du navigateur
        
        Format de la valeur : "YYYY-MM-DD" (ISO 8601)
        Ex: "2025-11-20"
      */}
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

      {/* ───────────────────────────────────────────────── */}
      {/* SECTION : PIÈCES JOINTES (Seulement en mode édition) */}
      {/* ───────────────────────────────────────────────── */}
      {/*
        PRINCIPE : Conditional Rendering (Rendu Conditionnel)
        
        On affiche les pièces jointes SEULEMENT si :
        - initialData existe (mode édition)
        - ET initialData.id existe (tâche déjà créée)
        
        Pourquoi ?
        - On ne peut pas uploader de fichiers vers une tâche
          qui n'existe pas encore en base de données
        - L'API a besoin du taskId pour lier les fichiers
        
        FLOW :
        1. User crée une tâche → formulaire en mode création
        2. Pas d'initialData.id → section cachée
        3. User clique "Créer" → tâche créée en DB
        4. User ouvre la tâche → formulaire en mode édition
        5. initialData.id existe → section visible
      */}
      {initialData && initialData.id && (
        <div className="border-t border-gray-200 pt-6 mt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            📎 Pièces jointes
          </h3>
          
          {/* Uploader */}
          <div className="mb-6">
            <AttachmentUploader
              taskId={initialData.id}
              onUploadSuccess={handleUploadSuccess}
            />
          </div>
          
          {/* Liste des fichiers */}
          <div>
            <AttachmentList
              taskId={initialData.id}
              refresh={refreshAttachments}
            />
          </div>
        </div>
      )}


      {/* ───────────────────────────────────────────────── */}
      {/* BOUTONS : Soumettre + Annuler                     */}
      {/* ───────────────────────────────────────────────── */}
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


/**
 * ═══════════════════════════════════════════════════════════
 * CONCEPTS REACT UTILISÉS
 * ═══════════════════════════════════════════════════════════
 * 
 * 1. CONTROLLED COMPONENTS
 *    - value={values.title}
 *    - onChange={handleChange}
 *    - React contrôle la valeur
 * 
 * 2. useEffect
 *    - Charger les projets au montage
 *    - Dépendances vides [] = une seule fois
 * 
 * 3. CONDITIONAL RENDERING
 *    - {touched.title && errors.title && <p>...</p>}
 *    - Affiche l'erreur seulement si conditions vraies
 * 
 * 4. ARRAY.MAP()
 *    - projects.map(p => <option>...)
 *    - Génère des éléments React à partir d'un tableau
 * 
 * 5. EVENT.PREVENTDEFAULT()
 *    - e.preventDefault()
 *    - Empêche le rechargement de la page
 * 
 * 6. SPREAD OPERATOR
 *    - { ...defaultValues, ...initialData }
 *    - Fusionne deux objets
 * 
 * 7. TERNARY OPERATOR
 *    - condition ? valeurSiVrai : valeurSiFaux
 *    - Pour les conditions inline
 * 
 * 8. DISABLED STATE
 *    - disabled={isLoading}
 *    - Désactive les interactions pendant le chargement
 */
