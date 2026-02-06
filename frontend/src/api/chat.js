import axiosInstance from './axios';

export const chatAPI = {
  // Rooms
  getRooms: async () => {
    const response = await axiosInstance.get('/chat/rooms/');
    return response.data;
  },

  getRoom: async (roomId) => {
    const response = await axiosInstance.get(`/chat/rooms/${roomId}/`);
    return response.data;
  },

  createRoom: async (roomData) => {
    const response = await axiosInstance.post('/chat/rooms/', roomData);
    return response.data;
  },

  addParticipant: async (roomId, userId) => {
    const response = await axiosInstance.post(`/chat/rooms/${roomId}/add-participant/`, {
      user_id: userId
    });
    return response.data;
  },

  removeParticipant: async (roomId, userId) => {
    const response = await axiosInstance.post(`/chat/rooms/${roomId}/remove-participant/`, {
      user_id: userId
    });
    return response.data;
  },

  markAsRead: async (roomId) => {
    const response = await axiosInstance.post(`/chat/rooms/${roomId}/mark-as-read/`);
    return response.data;
  },

  getMessages: async (roomId, pageSize = 50) => {
    const response = await axiosInstance.get(`/chat/rooms/${roomId}/messages/?page_size=${pageSize}`);
    return response.data;
  },

  // Messages
  getMessagesList: async () => {
    const response = await axiosInstance.get('/chat/messages/');
    return response.data;
  },

  createMessage: async (messageData) => {
    const isFormData = messageData instanceof FormData;
    const response = await axiosInstance.post('/chat/messages/', messageData, {
      headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : undefined,
    });
    return response.data;
  },

  updateMessage: async (messageId, data) => {
    const response = await axiosInstance.patch(`/chat/messages/${messageId}/`, data);
    return response.data;
  },

  deleteMessage: async (messageId) => {
    const response = await axiosInstance.delete(`/chat/messages/${messageId}/`);
    return response.data;
  },
  deleteRoom: async (roomId) => {
    const response = await axiosInstance.delete(`/chat/rooms/${roomId}/`);
    return response.data;
  },
};