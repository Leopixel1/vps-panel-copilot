import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const api = axios.create({
  baseURL: API_URL,
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth API
export const authAPI = {
  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },
  register: async (email: string, password: string, name: string) => {
    const response = await api.post('/auth/register', { email, password, name });
    return response.data;
  },
};

// VMs API
export const vmsAPI = {
  list: async () => {
    const response = await api.get('/vms');
    return response.data;
  },
  create: async (data: { name: string; templateId: string; planId: string }) => {
    const response = await api.post('/vms', data);
    return response.data;
  },
  start: async (id: string) => {
    const response = await api.post(`/vms/${id}/start`);
    return response.data;
  },
  stop: async (id: string) => {
    const response = await api.post(`/vms/${id}/stop`);
    return response.data;
  },
  reboot: async (id: string) => {
    const response = await api.post(`/vms/${id}/reboot`);
    return response.data;
  },
  reinstall: async (id: string) => {
    const response = await api.post(`/vms/${id}/reinstall`);
    return response.data;
  },
  getCredentials: async (id: string) => {
    const response = await api.get(`/vms/${id}/credentials`);
    return response.data;
  },
  getConsole: async (id: string) => {
    const response = await api.get(`/vms/${id}/console`);
    return response.data;
  },
};

// Templates API
export const templatesAPI = {
  list: async () => {
    const response = await api.get('/templates');
    return response.data;
  },
};

// Plans API
export const plansAPI = {
  list: async () => {
    const response = await api.get('/plans');
    return response.data;
  },
};

// Snapshots API
export const snapshotsAPI = {
  list: async (vmId: string) => {
    const response = await api.get(`/vms/${vmId}/snapshots`);
    return response.data;
  },
  create: async (vmId: string, data: { name: string; description?: string }) => {
    const response = await api.post(`/vms/${vmId}/snapshots`, data);
    return response.data;
  },
  rollback: async (vmId: string, snapshotId: string) => {
    const response = await api.post(`/vms/${vmId}/snapshots/${snapshotId}/rollback`);
    return response.data;
  },
  delete: async (vmId: string, snapshotId: string) => {
    const response = await api.delete(`/vms/${vmId}/snapshots/${snapshotId}`);
    return response.data;
  },
};
