import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

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

export const MessageItem = ({ message, currentUser }) => {
  const isOwnMessage = message.sender?.id === currentUser?.id;
  const time = format(new Date(message.created_at), 'HH:mm', { locale: fr });

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

      <div className={`max-w-[70%] rounded-lg p-3 ${isOwnMessage ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-800'}`}>
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