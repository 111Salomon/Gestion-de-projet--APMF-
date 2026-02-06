import { useEffect, useRef, useState } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { MoreVertical, Edit, Trash2 } from 'lucide-react';


const getInitial = (value) => value?.charAt?.(0)?.toUpperCase() ?? '?';

const formatFileSize = (bytes) => {
  if (bytes === null || bytes === undefined) return null;
  const k = 1024;
  if (bytes < k) return `${bytes} B`;
  if (bytes < k * k) return `${(bytes / k).toFixed(1)} KB`;
  return `${(bytes / (k * k)).toFixed(1)} MB`;
};

const getFileIcon = (fileType) => {
  const type = (fileType || '').toLowerCase();
  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(type)) return '🖼️';
  if (type === 'pdf') return '📕';
  if (['doc', 'docx'].includes(type)) return '📘';
  if (['xls', 'xlsx'].includes(type)) return '📗';
  return '📎';
};

export const MessageItem = ({ 
  message, 
  currentUser, 
  onEdit, 
  onDelete,
  showActions = true 
}) => {
  const isOwnMessage = message.sender?.id === currentUser?.id;
  const time = format(new Date(message.created_at), 'HH:mm', { locale: fr });
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);
  const menuButtonRef = useRef(null);

    // Fermer le menu si on clique ailleurs
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!showMenu) return;
      const target = event.target;
      if (menuRef.current && menuRef.current.contains(target)) return;
      if (menuButtonRef.current && menuButtonRef.current.contains(target)) return;
      setShowMenu(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMenu]);

  const handleEdit = () => {
    setShowMenu(false);
    onEdit?.(message);
  };

  const handleDelete = () => {
    setShowMenu(false);
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce message ?')) {
      onDelete?.(message.id);
    }
  };

  return (
    <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-4`}>
      {!isOwnMessage && (
        <div className="flex-shrink-0 mr-3">
          <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center">
            <span className="text-white font-semibold text-xs">
              {getInitial(message.sender?.full_name) || getInitial(message.sender?.email)}
            </span>
          </div>
        </div>
      )}

      <div className={`max-w-[70%] rounded-lg p-3 relative ${isOwnMessage ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-800'}`}>
        {showActions && isOwnMessage && (
          <div className="absolute top-2 right-2">
            <button
              type="button"
              ref={menuButtonRef}
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu((prev) => !prev);
              }}
              className="p-1 rounded hover:bg-black/10"
              title="Actions"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {showMenu && (
              <div
                ref={menuRef}
                className="absolute right-0 mt-1 w-40 bg-white rounded-lg shadow-lg border border-gray-200 z-50"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={handleEdit}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-t-lg"
                >
                  <Edit className="w-4 h-4" />
                  Éditer
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-b-lg"
                >
                  <Trash2 className="w-4 h-4" />
                  Supprimer
                </button>
              </div>
            )}
          </div>
        )}

        {!isOwnMessage && (
          <div className="text-xs font-semibold mb-1">
            {message.sender?.full_name || message.sender?.email}
          </div>
        )}

        <div className="text-sm whitespace-pre-wrap">
          {message.content}
        </div>

        {message.file_url && (
          <div className="mt-2">
            {message.file_is_image ? (
              <a
                href={message.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="block"
                title={message.file_name || 'Voir l\'image'}
              >
                <img
                  src={message.file_url}
                  alt={message.file_name || 'image'}
                  className="max-h-64 rounded-lg border border-black/10 object-contain"
                />
              </a>
            ) : (
              <div className={`flex items-center justify-between gap-3 rounded-lg p-2 ${isOwnMessage ? 'bg-orange-600/40' : 'bg-white'} border border-black/10`}>
                <div className="flex items-center gap-2 min-w-0">
                  <span className="flex-shrink-0">{getFileIcon(message.file_type)}</span>
                  <div className="min-w-0">
                    <a
                      href={message.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`text-xs font-semibold underline ${isOwnMessage ? 'text-white' : 'text-gray-800'}`}
                    >
                      {message.file_name || 'Fichier'}
                    </a>
                    {message.file_size !== null && message.file_size !== undefined && (
                      <div className={`${isOwnMessage ? 'text-orange-100' : 'text-gray-500'} text-[11px]`}>
                        {formatFileSize(message.file_size)}
                      </div>
                    )}
                  </div>
                </div>

                <a
                  href={message.file_url}
                  download
                  className={`text-xs px-2 py-1 rounded ${isOwnMessage ? 'bg-orange-200/20 text-white hover:bg-orange-200/30' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                  title="Télécharger"
                >
                  📥
                </a>
              </div>
            )}
          </div>
        )}

        <div className={`text-xs mt-1 ${isOwnMessage ? 'text-orange-100' : 'text-gray-500'}`}>
          {time}
          {message.is_edited && (
            <span className="ml-2">✏️</span>
          )}
        </div>
      </div>

      {isOwnMessage && (
        <div className="flex-shrink-0 ml-3">
          <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center">
            <span className="text-white font-semibold text-xs">
              {getInitial(currentUser?.full_name) || getInitial(currentUser?.email)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};