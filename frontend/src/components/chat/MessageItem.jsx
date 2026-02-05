import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const getInitial = (value) => value?.charAt?.(0)?.toUpperCase() ?? '?';

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
          <a
            href={message.file_url}
            target="_blank"
            rel="noopener noreferrer"
            className="block mt-2 text-xs underline hover:text-orange-600"
          >
            📎 Fichier joint
          </a>
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