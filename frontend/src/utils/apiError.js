const toSentence = (value) => {
  if (Array.isArray(value)) {
    return value.map(toSentence).filter(Boolean).join(' ');
  }

  if (value && typeof value === 'object') {
    return Object.values(value)
      .map(toSentence)
      .filter(Boolean)
      .join(' ');
  }

  if (typeof value === 'string') {
    return value.trim();
  }

  return '';
};

const extractValidationMessage = (data) => {
  if (!data || typeof data !== 'object') {
    return '';
  }

  const preferredKeys = ['message', 'error', 'detail', 'non_field_errors'];

  for (const key of preferredKeys) {
    if (data[key]) {
      const message = toSentence(data[key]);
      if (message) {
        return message;
      }
    }
  }

  if (data.errors) {
    const message = toSentence(data.errors);
    if (message) {
      return message;
    }
  }

  const fieldMessages = Object.entries(data)
    .filter(([key, value]) => !['message', 'error', 'detail', 'errors', 'non_field_errors'].includes(key) && value)
    .map(([, value]) => toSentence(value))
    .filter(Boolean);

  if (fieldMessages.length > 0) {
    return fieldMessages.join(' ');
  }

  return '';
};

export const getApiErrorMessage = (error, fallback = 'Une erreur est survenue') => {
  const response = error?.response;
  const data = response?.data;

  if (!response) {
    if (error?.message?.toLowerCase().includes('network')) {
      return 'Impossible de joindre le serveur. Vérifie ta connexion internet.';
    }

    return error?.message || fallback;
  }

  const backendMessage = extractValidationMessage(data);
  if (backendMessage) {
    return backendMessage;
  }

  switch (response.status) {
    case 400:
      return 'La requête est invalide. Vérifie les champs saisis.';
    case 401:
      return 'Session expirée ou non autorisée. Reconnecte-toi.';
    case 403:
      return 'Accès refusé. Tu n’as pas les droits nécessaires pour cette action.';
    case 404:
      return 'La ressource demandée est introuvable.';
    case 409:
      return 'Conflit détecté avec les données existantes.';
    case 413:
      return 'Le fichier envoyé est trop volumineux.';
    case 415:
      return 'Le format envoyé n’est pas accepté.';
    case 500:
      return 'Erreur interne du serveur. Réessaie plus tard.';
    default:
      return fallback;
  }
};

export const getApiFieldErrors = (error) => {
  const data = error?.response?.data;
  if (!data || typeof data !== 'object') {
    return {};
  }

  if (data.errors && typeof data.errors === 'object') {
    return data.errors;
  }

  const fieldErrors = Object.fromEntries(
    Object.entries(data).filter(([key, value]) => {
      return !['message', 'error', 'detail', 'non_field_errors'].includes(key) && value;
    })
  );

  return fieldErrors;
};
