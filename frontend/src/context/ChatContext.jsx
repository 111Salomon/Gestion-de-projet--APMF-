import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { chatAPI } from '../api/chat';

const ChatContext = createContext(null);

const normalizeWsBase = (value) => {
  if (value.startsWith('https://')) return value.replace('https://', 'wss://');
  if (value.startsWith('http://')) return value.replace('http://', 'ws://');
  return value;
};

const RAW_WS_BASE_URL = normalizeWsBase(import.meta.env.VITE_WS_BASE_URL ?? 'ws://localhost:8000');
const WS_BASE_URL = RAW_WS_BASE_URL.endsWith('/') ? RAW_WS_BASE_URL.slice(0, -1) : RAW_WS_BASE_URL;

export const ChatProvider = ({ children }) => {
  const { user: currentUser } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [currentRoom, setCurrentRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [typingUsers, setTypingUsers] = useState({});
  const wsRef = useRef(null);
  const typingTimeoutsRef = useRef({});

  const cleanupTypingTimeouts = useCallback(() => {
    Object.values(typingTimeoutsRef.current).forEach(clearTimeout);
    typingTimeoutsRef.current = {};
  }, []);

  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      cleanupTypingTimeouts();
    };
  }, [cleanupTypingTimeouts]);

  const loadRooms = useCallback(async () => {
    if (!currentUser) {
      setRooms([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const data = await chatAPI.getRooms();
      const roomsData = Array.isArray(data) ? data : data?.results ?? [];
      setRooms(roomsData);
    } catch (error) {
      console.error('❌ Erreur chargement rooms:', error);
      setRooms([]);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    loadRooms();
  }, [loadRooms]);

  useEffect(() => {
    if (!currentUser) {
      setCurrentRoom(null);
      setMessages([]);
      setTypingUsers({});
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    }
  }, [currentUser]);

  const disconnectWebSocket = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
    setTypingUsers({});
    cleanupTypingTimeouts();
  }, [cleanupTypingTimeouts]);

  const upsertMessage = useCallback((message) => {
    if (!message?.id) return;
    setMessages((prev) => {
      const exists = prev.find((item) => item.id === message.id);
      if (exists) {
        return prev.map((item) => (item.id === message.id ? message : item));
      }
      return [...prev, message];
    });
  }, []);

  const handleTypingEvent = useCallback((eventPayload) => {
    const user = eventPayload?.user;
    const isTyping = eventPayload?.is_typing;

    if (!user || user.id === currentUser?.id) {
      return;
    }

    setTypingUsers((prev) => {
      const next = { ...prev };
      if (isTyping) {
        next[user.id] = user.full_name || user.email || 'Quelqu\'un';
      } else {
        delete next[user.id];
      }
      return next;
    });

    if (typingTimeoutsRef.current[user.id]) {
      clearTimeout(typingTimeoutsRef.current[user.id]);
      delete typingTimeoutsRef.current[user.id];
    }

    if (isTyping) {
      typingTimeoutsRef.current[user.id] = setTimeout(() => {
        setTypingUsers((prev) => {
          const next = { ...prev };
          delete next[user.id];
          return next;
        });
        delete typingTimeoutsRef.current[user.id];
      }, 3000);
    }
  }, [currentUser]);

  const connectWebSocket = useCallback((roomId) => {
    if (!roomId) return;

    disconnectWebSocket();

    const token = localStorage.getItem('access_token');
    const url = `${WS_BASE_URL}/ws/chat/${roomId}/` + (token ? `?token=${token}` : '');
    const socket = new WebSocket(url);
    wsRef.current = socket;

    socket.onopen = () => {
      setIsConnected(true);
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'message' && data.data) {
          upsertMessage(data.data);
        } else if (data.type === 'typing' && data.data) {
          handleTypingEvent(data.data);
        }
      } catch (error) {
        console.error('❌ Erreur parsing WebSocket message:', error);
      }
    };

    socket.onclose = () => {
      setIsConnected(false);
      wsRef.current = null;
    };

    socket.onerror = (error) => {
      console.error('❌ WebSocket error:', error);
    };
  }, [disconnectWebSocket, handleTypingEvent, upsertMessage]);

  const selectRoom = useCallback(async (room) => {
    if (!room) return;
    if (currentRoom?.id === room.id) {
      return;
    }

    try {
      setCurrentRoom(room);
      setMessages([]);
      connectWebSocket(room.id);

      const data = await chatAPI.getMessages(room.id);
      setMessages(Array.isArray(data) ? data : data?.results ?? []);

      await chatAPI.markAsRead(room.id).catch(() => {});
      await loadRooms();
    } catch (error) {
      console.error('❌ Erreur sélection room:', error);
      toast.error(
        error.response?.status === 403 || error.response?.status === 404
          ? 'Vous n\'avez pas accès à cette conversation'
          : 'Erreur lors du chargement de la conversation'
      );
      setCurrentRoom(null);
      setMessages([]);
      await loadRooms();
    }
  }, [connectWebSocket, currentRoom?.id, loadRooms]);

  const sendMessage = useCallback(async (content, file = null) => {
    if (!currentRoom || !currentUser) {
      toast.error('Vous devez être connecté pour envoyer un message');
      return;
    }

    const trimmedContent = content?.trim();
    if (!trimmedContent && !file) {
      toast.error('Un message doit contenir du texte ou un fichier');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('room', currentRoom.id);
      if (trimmedContent) {
        formData.append('content', trimmedContent);
      }
      if (file) {
        formData.append('file', file);
      }

      await chatAPI.createMessage(formData);
    } catch (error) {
      console.error('❌ Erreur envoi message:', error);
      toast.error('Erreur lors de l\'envoi du message');
    }
  }, [currentRoom, currentUser]);

  const notifyTyping = useCallback((isTyping) => {
    const socket = wsRef.current;
    if (!socket || socket.readyState !== WebSocket.OPEN) return;

    try {
      socket.send(JSON.stringify({ type: 'typing', is_typing: isTyping }));
    } catch (error) {
      console.error('❌ Erreur envoi typing:', error);
    }
  }, []);

  const createRoom = async (roomData) => {
    try {
      const newRoom = await chatAPI.createRoom(roomData);
      await loadRooms();
      toast.success('Conversation créée avec succès');
      return newRoom;
    } catch (error) {
      console.error('❌ Erreur création room:', error);
      toast.error('Erreur lors de la création de la conversation');
      throw error;
    }
  };

  const addParticipant = async (roomId, userId) => {
    try {
      await chatAPI.addParticipant(roomId, userId);
      await loadRooms();
      toast.success('Participant ajouté avec succès');
    } catch (error) {
      console.error('❌ Erreur ajout participant:', error);
      toast.error('Erreur lors de l\'ajout du participant');
    }
  };

  const typingUserNames = Object.entries(typingUsers)
    .filter(([userId]) => Number(userId) !== currentUser?.id)
    .map(([, name]) => name);

  return (
    <ChatContext.Provider value={{
      rooms,
      currentRoom,
      messages,
      isLoading,
      isConnected,
      typingUsers: typingUserNames,
      selectRoom,
      sendMessage,
      notifyTyping,
      createRoom,
      addParticipant,
      loadRooms,
    }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within ChatProvider');
  }
  return context;
};