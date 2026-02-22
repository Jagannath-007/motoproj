import axios from 'axios';

// In production (Wasmer), VITE_API_URL must be set to your backend URL (e.g. https://autopulse-crm.onrender.com)
// In local dev, it falls back to /api which is proxied by Vite
const api = axios.create({ baseURL: import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api' });

// ── Leads ──
export const getLeads = (params) => api.get('/leads', { params });
export const getLeadSummary = () => api.get('/leads/summary');
export const getLead = (id) => api.get(`/leads/${id}`);
export const createLead = (data) => api.post('/leads', data);
export const updateLead = (id, d) => api.put(`/leads/${id}`, d);
export const deleteLead = (id) => api.delete(`/leads/${id}`);
export const convertLead = (id, d) => api.post(`/leads/${id}/convert`, d);
export const checkDuplicate = (phone) => api.post('/leads/check-duplicate', { phone });

// ── Activities ──
export const getActivities = (id) => api.get(`/leads/${id}/activities`);
export const addActivity = (id, d) => api.post(`/leads/${id}/activities`, d);

// ── Users ──
export const getUsers = (params) => api.get('/users', { params });

// ── Dashboard ──
export const getSalesDashboard = (userId) => api.get('/dashboard/sales', { params: { userId } });
export const getManagerDashboard = () => api.get('/dashboard/manager');

export default api;
