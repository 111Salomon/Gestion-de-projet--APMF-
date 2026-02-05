import axiosInstance from './axios';

export const usersAPI = {
  // Liste tous les utilisateurs
  getUsers: async () => {
    const response = await axiosInstance.get('/users/');
    return response.data;
  },

  // Récupère un utilisateur par ID
  getUser: async (userId) => {
    const response = await axiosInstance.get(`/users/${userId}/`);
    return response.data;
  },
};