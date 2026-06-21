/**
 * ═══════════════════════════════════════════════════════════════
 * AVATAR UPLOADER - VERSION CORRIGÉE
 * ═══════════════════════════════════════════════════════════════
 */

import { useState, useEffect } from 'react';
import { uploadAvatar } from '../../api/team';
import toast from 'react-hot-toast';
import { getApiErrorMessage } from '../../utils/apiError';

export const AvatarUploader = ({ userId, currentAvatar, onAvatarUpdated }) => {
  const [uploading, setUploading] = useState(false);
  const [localAvatar, setLocalAvatar] = useState(currentAvatar);

  // ✅ Synchroniser quand currentAvatar change
  useEffect(() => {
    setLocalAvatar(currentAvatar);
  }, [currentAvatar]);

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

    // ✅ Prévisualisation temporaire
    const reader = new FileReader();
    reader.onloadend = () => {
      setLocalAvatar(reader.result);
    };
    reader.readAsDataURL(file);

    // Upload
    setUploading(true);
    try {
      const response = await uploadAvatar(userId, file);
      toast.success(response.message);
      
      // ✅ Mettre à jour avec l'URL du serveur (+ cache busting)
      const newAvatarUrl = `${response.avatar_url}?t=${Date.now()}`;
      setLocalAvatar(newAvatarUrl);
      
      console.log('✅ Avatar uploaded:', newAvatarUrl);
      
      if (onAvatarUpdated) {
        onAvatarUpdated(response.avatar_url); // Sans timestamp pour la DB
      }
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Erreur lors de l\'upload'));
      
      // ✅ Revenir à l'ancien avatar en cas d'erreur
      setLocalAvatar(currentAvatar);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Avatar actuel ou prévisualisation */}
      <div className="relative group">
        <div className="w-32 h-32 rounded-full bg-gradient-to-br border-4 border-neutral-300 from-orange-500 to-orange-600 flex items-center justify-center overflow-hidden shadow-lg">
          {localAvatar ? (
            <img
              src={localAvatar}
              alt="Avatar"
              className="w-full h-full object-cover"
              onError={() => {
                console.error('❌ Image load error:', localAvatar);
                setLocalAvatar(null);
              }}
            />
          ) : (
            <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          )}
          
          {/* ✨ Loading overlay */}
          {uploading && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm">
              <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
        </div>
        
        {/* Overlay avec icône de caméra */}
        {!uploading && (
          <label
            htmlFor="avatar-upload"
            className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
          >
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </label>
        )}
        
        <input
          id="avatar-upload"
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          disabled={uploading}
          className="hidden"
        />
      </div>

      {/* Info */}
      <p className="text-xs text-neutral-500 text-center">
        {uploading ? 'Upload en cours...' : 'JPG, PNG, GIF ou WebP. Max 2 MB'}
      </p>
    </div>
  );
};
