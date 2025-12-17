/**
 * Composant pour uploader et prévisualiser un avatar.
 */

import { useState } from 'react';
import { uploadAvatar } from '../../api/team';
import toast from 'react-hot-toast';

export const AvatarUploader = ({ userId, currentAvatar, onAvatarUpdated }) => {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(null);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    
    if (!file) return;

    // Validation du format
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Format non autorisé. Utilisez JPG, PNG, GIF ou WebP');
      return;
    }

    // Validation de la taille (2 MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Le fichier est trop volumineux. Taille maximale : 2 MB');
      return;
    }

    // Prévisualisation
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
    };
    reader.readAsDataURL(file);

    // Upload
    setUploading(true);
    try {
      const response = await uploadAvatar(userId, file);
      toast.success(response.message);
      if (onAvatarUpdated) {
        onAvatarUpdated(response.avatar_url);
      }
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Erreur lors de l\'upload';
      toast.error(errorMsg);
      setPreview(null);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Avatar actuel ou prévisualisation */}
      <div className="relative group">
        <div className="w-32 h-32 rounded-full bg-gradient-to-br border-4 border-neutral-300 from-blue-500 to-purple-600 flex items-center justify-center overflow-hidden">
          {preview || currentAvatar ? (
            <img
              src={preview || currentAvatar}
              alt="Avatar"
              className="w-full h-full object-cover"
            />
          ) : (
            <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          )}
        </div>
        
        {/* Overlay avec icône de caméra */}
        <label
          htmlFor="avatar-upload"
          className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
        >
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </label>
        
        <input
          id="avatar-upload"
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          disabled={uploading}
          className="hidden"
        />
      </div>

      {/* Bouton de changement */}
      {/* <label
        htmlFor="avatar-upload"
        className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer ${
          uploading
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : ' text-neutral-700 border  hover:bg-neutral-100'
        }`}
      >
        {uploading ? 'Upload en cours...' : 'Changer la photo'}
      </label> */}

      {/* Info */}
      <p className="text-xs text-gray-500 text-center">
        JPG, PNG, GIF ou WebP. Max 2 MB
      </p>
    </div>
  );
};
