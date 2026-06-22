import { useState } from 'react';
import { MEDIA_URL } from '../../api/axios';

/**
 * ═══════════════════════════════════════════════════════════════
 * COMPOSANT AVATAR - Réutilisable avec cache busting
 * ═══════════════════════════════════════════════════════════════
 */
export const Avatar = ({ 
  avatarUrl, 
  name = 'User', 
  size = 'md',
  className = '',
  showBorder = true,
  showOnlineIndicator = false,
  isOnline = false
}) => {
  const [imageError, setImageError] = useState(false);

  // Tailles disponibles
  const sizes = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-7 h-7 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-14 h-14 text-base',
    xl: 'w-20 h-20 text-xl'
  };

  // Taille de l'indicateur en ligne
  const indicatorSizes = {
    xs: 'w-1.5 h-1.5',
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5',
    lg: 'w-3 h-3',
    xl: 'w-4 h-4'
  };

  const sizeClass = sizes[size] || sizes.md;
  const indicatorSize = indicatorSizes[size] || indicatorSizes.md;
  
  // Extraire les initiales
  const getInitials = (displayName) => {
    if (!displayName) return 'U';
    
    // Si c'est un email, prendre la première lettre avant @
    if (displayName.includes('@')) {
      return displayName.split('@')[0].charAt(0).toUpperCase();
    }
    
    // Si c'est un nom complet, prendre les initiales (max 2)
    const parts = displayName.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
    }
    
    return displayName.charAt(0).toUpperCase();
  };

  const initials = getInitials(name);
  
  // Cache busting : construire l'URL finale en gérant
  // - avatarUrl (full URL)
  // - avatar (chemin relatif retourné par certaines API)
  // - préfixer MEDIA_URL si nécessaire
  const buildAvatarUrl = () => {
    let url = null;
    if (avatarUrl) url = avatarUrl;
    else if (typeof avatar === 'string' && avatar.length > 0) url = avatar;
    else if (typeof avatarPath === 'string' && avatarPath.length > 0) url = avatarPath;

    if (!url) return null;

    // Si URL relative (commence par / or does not contain http), préfixer MEDIA_URL
    if (!/^https?:\/\//i.test(url)) {
      const cleaned = url.startsWith('/') ? url.slice(1) : url;
      url = `${MEDIA_URL.replace(/\/$/, '')}/${cleaned}`;
    }

    const timestamp = Date.now();
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}t=${timestamp}`;
  };

  const finalAvatarUrl = !imageError ? buildAvatarUrl() : null;

  return (
    <div 
      className={`
        relative ${sizeClass} rounded-full overflow-hidden flex-shrink-0
        ${showBorder ? 'border-2 border-white shadow-sm' : ''}
        ${className}
      `}
      title={name}
    >
      {/* Image ou Fallback */}
      {finalAvatarUrl ? (
        <img
          src={finalAvatarUrl}
          alt={name}
          className="w-full h-full object-cover"
          onError={() => setImageError(true)}
        />
      ) : (
        <div 
          className="w-full h-full bg-gradient-to-br from-orange-400 to-orange-600
                   flex items-center justify-center text-white font-bold"
        >
          {initials}
        </div>
      )}

      {/* Indicateur en ligne */}
      {showOnlineIndicator && isOnline && (
        <div 
          className={`
            absolute -bottom-0.5 -right-0.5 ${indicatorSize}
            bg-green-500 rounded-full border-2 border-white
            ${isOnline ? 'animate-pulse' : ''}
          `}
        />
      )}
    </div>
  );
};
