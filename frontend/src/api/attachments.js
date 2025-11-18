import api from './axios';

/**
 * Service pour gérer les pièces jointes (attachments)
 */

// Récupérer tous les attachments d'une tâche
export const getTaskAttachments = async (taskId) => {
  const response = await api.get(`/attachments/?task=${taskId}`);
  return response.data;
};

// Uploader un fichier
export const uploadAttachment = async (taskId, file, onUploadProgress) => {
  const formData = new FormData();
  formData.append('task', taskId);
  formData.append('file', file);
  
  const response = await api.post('/attachments/', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress, // Pour afficher la progression
  });
  
  return response.data;
};

// Supprimer un attachment
export const deleteAttachment = async (attachmentId) => {
  await api.delete(`/attachments/${attachmentId}/`);
};

// Récupérer les détails d'un attachment
export const getAttachment = async (attachmentId) => {
  const response = await api.get(`/attachments/${attachmentId}/`);
  return response.data;
};

export default {
  getTaskAttachments,
  uploadAttachment,
  deleteAttachment,
  getAttachment,
};
