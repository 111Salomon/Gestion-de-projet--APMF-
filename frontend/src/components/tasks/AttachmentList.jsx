import React, { useState, useEffect } from 'react';
import { getTaskAttachments, deleteAttachment } from '../../api/attachments';
import { ConfirmModal } from '../common/ConfirmModal';

const AttachmentList = ({ taskId, refresh }) => {
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteModal, setDeleteModal] = useState({ 
    isOpen: false, 
    attachment: null 
  });

  // Charger les attachments
  useEffect(() => {
    loadAttachments();
  }, [taskId, refresh]);

  // 🔧 FONCTION CORRIGÉE
  const loadAttachments = async () => {
    try {
      setLoading(true);
      const data = await getTaskAttachments(taskId);
      
      // ✅ Gérer différents formats de réponse
      if (Array.isArray(data)) {
        // Si c'est déjà un tableau
        setAttachments(data);
      } else if (data && Array.isArray(data.results)) {
        // Si c'est un objet avec pagination { results: [...] }
        setAttachments(data.results);
      } else if (data && data.data && Array.isArray(data.data)) {
        // Si c'est { data: [...] }
        setAttachments(data.data);
      } else {
        // Sinon, tableau vide
        console.warn('Format de données inattendu:', data);
        setAttachments([]);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des attachments:', error);
      setAttachments([]); // ✅ Toujours un tableau en cas d'erreur
    } finally {
      setLoading(false);
    }
  };

  // Supprimer un attachment
  const handleDelete = async () => {
    try {
      await deleteAttachment(deleteModal.attachment.id);
      setAttachments(prev => prev.filter(a => a.id !== deleteModal.attachment.id));
      setDeleteModal({ isOpen: false, attachment: null });
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
    }
  };

  // Obtenir l'icône selon le type de fichier
  const getFileIcon = (fileName, isImage) => {
    if (isImage) {
      return (
        <svg className="w-6 h-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      );
    }

    const ext = fileName.split('.').pop().toLowerCase();
    if (ext === 'pdf') {
      return (
        <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      );
    }

    return (
      <svg className="w-6 h-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center py-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (attachments.length === 0) {
    return (
      <p className="text-gray-500 text-sm py-4">
        Aucune pièce jointe
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {attachments.map((attachment) => (
        <div
          key={attachment.id}
          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {getFileIcon(attachment.file_name, attachment.is_image)}
            
            <div className="flex-1 min-w-0">
              <a
                href={attachment.file}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-blue-600 hover:text-blue-800 truncate block"
              >
                {attachment.file_name}
              </a>
              <p className="text-xs text-gray-500">
                {(attachment.file_size / 1024).toFixed(2)} KB
              </p>
            </div>
          </div>

          <button
            onClick={() => setDeleteModal({ isOpen: true, attachment })}
            className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
            title="Supprimer"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      ))}

      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, attachment: null })}
        onConfirm={handleDelete}
        title="Supprimer la pièce jointe"
        message={`Êtes-vous sûr de vouloir supprimer "${deleteModal.attachment?.file_name}" ?`}
        confirmText="Supprimer"
        variant="danger"
      />
    </div>
  );
};

export default AttachmentList;
