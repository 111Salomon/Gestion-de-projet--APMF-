import axiosInstance from './axios';

export const authAPI = {
  login: async (credentials) => {
    const response = await axiosInstance.post('/token/', credentials);
    return response.data;
  },

  getCurrentUser: async () => {
    const response = await axiosInstance.get('/users/me/');
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  },
};
