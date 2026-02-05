import { useState } from 'react';
import { ChatSidebar } from '../../components/chat/ChatSidebar';
import { ChatRoom } from '../../components/chat/ChatRoom';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';
import { Layout } from '../../components/layout/Layout';

export const ChatPage = () => {
  const { user } = useAuth();
  const {
    rooms,
    currentRoom,
    messages,
    selectRoom,
    sendMessage,
    createRoom,
    loadRooms,
  } = useChat();
  const [showChat, setShowChat] = useState(true);

  const handleCreateRoom = async () => {
    // TODO: Ouvrir un modal pour créer une nouvelle room
    const roomData = {
      name: 'Nouvelle conversation',
      type: 'group',
    };
    await createRoom(roomData);
  };

  return (
    <Layout>
      <div className="flex h-[calc(100vh-80px)]">
        {showChat && (
          <ChatSidebar
            rooms={rooms}
            currentRoom={currentRoom}
            onSelectRoom={selectRoom}
            onCreateRoom={handleCreateRoom}
          />
        )}

        <div className="flex-1">
          {currentRoom ? (
            <ChatRoom
              room={currentRoom}
              messages={messages}
              onSend={sendMessage}
              currentUser={user}
              onClose={() => setShowChat(!showChat)}
            />
          ) : (
            <div className="h-full flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                  Bienvenue sur le Chat
                </h2>
                <p className="text-gray-600 mb-6">
                  Sélectionnez une conversation ou commencez-en une nouvelle
                </p>
                <button
                  onClick={handleCreateRoom}
                  className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                >
                  Nouvelle conversation
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};