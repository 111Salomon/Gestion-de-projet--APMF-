import { useRef, useEffect } from 'react';
import { MessageItem } from './MessageItem';
import { MessageInput } from './MessageInput';
import { ChatHeader } from './ChatHeader';
import { TypingIndicator } from './TypingIndicator';

export const ChatRoom = ({
  room,
  messages,
  typingUsers = [],
  onSend,
  onEdit, 
  onDelete,
  onTyping,
  currentUser,
  onClose,
}) => {
  const messagesEndRef = useRef(null);

  // Scroll automatique vers le bas quand de nouveaux messages arrivent
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <ChatHeader room={room} onClose={onClose} />

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <MessageItem
            key={message.id ?? `temp-${index}`}
            message={message}
            currentUser={currentUser}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
        <TypingIndicator users={typingUsers} />
        <div ref={messagesEndRef} />
      </div>

      <MessageInput onSend={onSend} onTyping={onTyping} disabled={!room} />
    </div>
  );
};