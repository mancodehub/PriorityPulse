import axios from 'axios';

const api = axios.create({
  baseURL:
    import.meta.env.VITE_API_URL ||
    'http://localhost:5000/api',

  headers: {
    'Content-Type': 'application/json',
  },

  timeout: 30000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('pp_token');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export const sendOtp = (email) =>
  api.post('/auth/send-otp', { email });

export const verifyOtp = (email, otp) =>
  api.post('/auth/verify-otp', { email, otp });

export const fetchMe = () =>
  api.get('/auth/me');

export const fetchEmails = (params = {}) =>
  api.get('/emails', { params });

export const fetchCustomKeywordEmails = (params = {}) =>
  api.get('/emails/custom-keyword', { params });

export const fetchEmailAnalytics = () =>
  api.get('/emails/analytics');

export const fetchAIInsights = () =>
  api.get('/emails/ai-insights');

export const syncEmails = () =>
  api.post('/emails/sync');

export const fetchEmailById = (id) =>
  api.get(`/emails/${encodeURIComponent(id)}`);

export const fetchEmailContent = fetchEmailById;

export const fetchEmailThread = (threadId) =>
  api.get(`/emails/thread/${encodeURIComponent(threadId)}`);

export const downloadEmailAttachment = (emailId, attachmentId) =>
  api.get(
    `/emails/${encodeURIComponent(emailId)}/attachments/${encodeURIComponent(attachmentId)}`,
    { responseType: 'blob' },
  );

export const markEmailAsRead = (id) =>
  api.patch(`/emails/${encodeURIComponent(id)}/read`);

export const markEmailRead = markEmailAsRead;

export const getGmailConnectUrl = () =>
  api.get('/gmail/connect');

export const getGmailStatus = () =>
  api.get('/gmail/status');

export const disconnectGmail = () =>
  api.post('/gmail/disconnect');

export const fetchKeywords = () =>
  api.get('/keywords');

export const createKeyword = (payload) =>
  api.post('/keywords', payload);

export const updateKeyword = (id, payload) =>
  api.patch(`/keywords/${encodeURIComponent(id)}`, payload);

export const deleteKeyword = (id) =>
  api.delete(`/keywords/${encodeURIComponent(id)}`);

export const refreshKeywordMatches = () =>
  api.post('/keywords/refresh');

export default api;
