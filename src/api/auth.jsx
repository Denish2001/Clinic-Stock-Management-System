import { apiClient } from './client';

export const login = async (username, password) => {
  const response = await apiClient.post('/auth/login', {
    username,
    password,
    expiresInMins: 1, // as required
  });
  return response.data;
};

export const refreshToken = async (refreshToken) => {
  const response = await apiClient.post('/auth/refresh', { refreshToken });
  return response.data;
};

export const getCurrentUser = async () => {
  const response = await apiClient.get('/auth/me');
  return response.data;
};
