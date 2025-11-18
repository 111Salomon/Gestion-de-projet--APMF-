import React, { useState } from 'react';
import { uploadAttachment } from '../../api/attachments';
import { Button } from '../common/Button';


const AttachmentUploader = ({ taskId, onUploadSuccess }) => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [error, setError] = useState('');

  // Gérer la sélection de fichiers
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    
    // Validation : taille max 10 MB par fichier
    const validFiles = files.filter(file => {
      if (file.size > 10 * 1024 * 1024) {
        setError(`${file.name} dépasse 10 MB`);
        return false;
      }
      return true;
    });
    
    setSelectedFiles(validFiles);
    setError('');
  };

  // Uploader les fichiers
  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    setUploading(true);
    setError('');

    try {
      // Upload chaque fichier séparément
      const uploadPromises = selectedFiles.map((file, index) => 
        uploadAttachment(
          taskId,
          file,
          (progressEvent) => {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setUploadProgress(prev => ({
              ...prev,
              [index]: percentCompleted,
            }));
          }
        )
      );

      await Promise.all(uploadPromises);

      // Succès
      setSelectedFiles([]);
      setUploadProgress({});
      onUploadSuccess && onUploadSuccess();
      
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de l\'upload');
    } finally {
      setUploading(false);
    }
  };

  // Supprimer un fichier de la sélection
  const removeFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      {/* Zone de sélection de fichiers */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
        <input
          type="file"
          id="file-upload"
          multiple
          onChange={handleFileSelect}
          className="hidden"
          disabled={uploading}
        />
        <label
          htmlFor="file-upload"
          className="cursor-pointer text-blue-600 hover:text-blue-700"
        >
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            stroke="currentColor"
            fill="none"
            viewBox="0 0 48 48"
          >
            <path
              d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className="mt-2 block text-sm font-medium">
            Cliquez pour sélectionner des fichiers
          </span>
          <span className="mt-1 block text-xs text-gray-500">
            ou glissez-déposez (max 10 MB par fichier)
          </span>
        </label>
      </div>

      {/* Affichage des erreurs */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Liste des fichiers sélectionnés */}
      {selectedFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium text-sm text-gray-700">
            Fichiers sélectionnés ({selectedFiles.length})
          </h4>
          {selectedFiles.map((file, index) => (
            <div
              key={index}
              className="flex items-center justify-between bg-gray-50 p-3 rounded"
            >
              <div className="flex items-center space-x-3 flex-1">
                <span className="text-sm text-gray-600">{file.name}</span>
                <span className="text-xs text-gray-400">
                  ({(file.size / 1024).toFixed(2)} KB)
                </span>
              </div>

              {/* Barre de progression */}
              {uploading && uploadProgress[index] !== undefined && (
                <div className="w-32 bg-gray-200 rounded-full h-2 mx-3">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{ width: `${uploadProgress[index]}%` }}
                  />
                </div>
              )}

              {/* Bouton supprimer */}
              {!uploading && (
                <button
                  onClick={() => removeFile(index)}
                  className="text-red-600 hover:text-red-700"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              )}
            </div>
          ))}

          {/* Bouton Upload */}
          <Button
            onClick={handleUpload}
            disabled={uploading}
            className="w-full"
          >
            {uploading ? 'Upload en cours...' : `Uploader ${selectedFiles.length} fichier(s)`}
          </Button>
        </div>
      )}
    </div>
  );
};

export default AttachmentUploader;
