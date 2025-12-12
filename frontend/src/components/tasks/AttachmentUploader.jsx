import React, { useState, useRef } from 'react';
import { Upload, X, File, Image, Paperclip } from 'lucide-react';
import { uploadAttachment } from '../../api/attachments';
import toast from 'react-hot-toast';

const AttachmentUploader = ({ taskId, onUploadSuccess }) => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const fileInputRef = useRef(null);

  // Gérer la sélection de fichiers
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    
    // Validation : taille max 10 MB par fichier
    const validFiles = files.filter(file => {
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} dépasse 10 MB`);
        return false;
      }
      return true;
    });
    
    setSelectedFiles(prev => [...prev, ...validFiles]);
  };

  // Supprimer un fichier de la sélection
  const removeFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Uploader les fichiers
  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    setUploading(true);

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
      toast.success(`${selectedFiles.length} fichier${selectedFiles.length > 1 ? 's' : ''} ajouté${selectedFiles.length > 1 ? 's' : ''} !`);
      setSelectedFiles([]);
      setUploadProgress({});
      if (fileInputRef.current) fileInputRef.current.value = '';
      onUploadSuccess && onUploadSuccess();
      
    } catch (err) {
      console.error('Erreur upload:', err);
      toast.error(err.response?.data?.message || 'Impossible d\'ajouter les fichiers');
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const isImage = (fileName) => {
    const ext = fileName.split('.').pop().toLowerCase();
    return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext);
  };

  return (
    <div className="space-y-4">
      {/* Zone de sélection */}
      <div 
        className="border-2 border-dashed border-neutral-200 rounded-xl p-6 
                  hover:border-orange-300 hover:bg-orange-50/50 
                  transition-all duration-200 cursor-pointer group"
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileSelect}
          className="hidden"
          accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.zip,.rar"
          disabled={uploading}
        />
        
        <div className="text-center">
          <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3
                        group-hover:scale-110 transition-transform">
            <Upload className="w-6 h-6 text-orange-600" strokeWidth={2} />
          </div>
          <p className="text-sm font-semibold text-neutral-900 mb-1">
            Cliquez pour sélectionner des fichiers
          </p>
          <p className="text-xs text-neutral-500">
            ou glissez-déposez (max 10 MB par fichier)
          </p>
        </div>
      </div>

      {/* Liste des fichiers sélectionnés */}
      {selectedFiles.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-neutral-700">
              {selectedFiles.length} fichier{selectedFiles.length > 1 ? 's' : ''} sélectionné{selectedFiles.length > 1 ? 's' : ''}
            </p>
            <button
              onClick={() => setSelectedFiles([])}
              className="text-xs text-neutral-500 hover:text-neutral-900 font-medium"
              disabled={uploading}
            >
              Tout effacer
            </button>
          </div>

          <div className="max-h-48 overflow-y-auto space-y-2">
            {selectedFiles.map((file, index) => (
              <div
                key={index}
                className="flex items-center gap-3 px-3 py-2.5 bg-neutral-50 rounded-lg
                         border border-neutral-200 hover:border-neutral-300
                         transition-all group"
              >
                {/* Icône */}
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0
                              ${isImage(file.name) ? 'bg-blue-100' : 'bg-neutral-200'}`}>
                  {isImage(file.name) ? (
                    <Image className="w-4 h-4 text-blue-600" strokeWidth={2} />
                  ) : (
                    <File className="w-4 h-4 text-neutral-600" strokeWidth={2} />
                  )}
                </div>

                {/* Infos */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-neutral-900 truncate">
                    {file.name}
                  </p>
                  <p className="text-xs text-neutral-500">
                    {formatFileSize(file.size)}
                  </p>
                </div>

                {/* Barre de progression */}
                {uploading && uploadProgress[index] !== undefined ? (
                  <div className="w-24 bg-neutral-200 rounded-full h-1.5">
                    <div
                      className="bg-orange-500 h-1.5 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress[index]}%` }}
                    />
                  </div>
                ) : (
                  /* Bouton supprimer */
                  <button
                    onClick={() => removeFile(index)}
                    className="p-1.5 hover:bg-red-50 rounded-lg transition-colors 
                             opacity-0 group-hover:opacity-100"
                  >
                    <X className="w-4 h-4 text-red-500" strokeWidth={2} />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Bouton upload */}
          <button
            onClick={handleUpload}
            disabled={uploading}
            className="w-full py-2.5 px-4 
                     bg-gradient-to-r from-orange-500 to-orange-600 
                     text-white font-semibold rounded-lg text-sm
                     hover:shadow-lg hover:shadow-orange-500/30 
                     transition-all duration-300
                     disabled:opacity-50 disabled:cursor-not-allowed
                     flex items-center justify-center gap-2"
          >
            {uploading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Upload en cours...</span>
              </>
            ) : (
              <>
                <Paperclip className="w-4 h-4" strokeWidth={2} />
                <span>Ajouter {selectedFiles.length} fichier{selectedFiles.length > 1 ? 's' : ''}</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default AttachmentUploader;
