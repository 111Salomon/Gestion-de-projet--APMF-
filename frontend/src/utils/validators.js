export const required = (value) => {
  if (!value || value.toString().trim() === '') {
    return 'Ce champ est obligatoire';
  }
  return null;
};

export const minLength = (min) => (value) => {
  if (value && value.length < min) {
    return `Minimum ${min} caractères requis`;
  }
  return null;
};

export const email = (value) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (value && !emailRegex.test(value)) {
    return 'Email invalide';
  }
  return null;
};
