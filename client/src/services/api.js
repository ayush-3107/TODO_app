import axios from 'axios';

// Base URL for your backend API
const BASE_URL = 'http://localhost:5000/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Authentication API calls
export const authAPI = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
  getCurrentUser: () => api.get('/auth/me'),
  changePassword: (passwordData) => api.put('/auth/change-password', passwordData),
  logout: () => api.post('/auth/logout'),
};

// Lists API calls
export const listsAPI = {
  getAll: () => api.get('/lists'),
  create: (listData) => api.post('/lists', listData),
  update: (id, listData) => api.put(`/lists/${id}`, listData),
  delete: (id) => api.delete(`/lists/${id}`),
  reorder: (listIds) => api.put('/lists/reorder', { listIds }),
};

// Tasks API calls
export const tasksAPI = {
  getByList: (listId) => api.get(`/tasks/list/${listId}`),
  create: (taskData) => api.post('/tasks', taskData),
  update: (id, taskData) => {
    console.log('🔧 API: Updating task', id, 'with data:', taskData);
    return api.put(`/tasks/${id}`, taskData);
  },
  toggle: (id) => api.put(`/tasks/${id}/toggle`),
  delete: (id) => api.delete(`/tasks/${id}`),
  reorder: (taskIds, sourceListId, destinationListId) => 
    api.put('/tasks/reorder', { taskIds, sourceListId, destinationListId }),
};

// Search API calls
export const searchAPI = {
  search: (query) => api.get(`/search?q=${encodeURIComponent(query)}`),
};

export default api;
