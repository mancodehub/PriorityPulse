import axios from 'axios';

const api = axios.create({
  baseURL:
    import.meta.env.VITE_API_URL ||
    'http://localhost:5000/api',

  headers: {
    'Content-Type': 'application/json',
  },
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

export const fetchEmails = () =>
  api.get('/emails');

export const getGmailConnectUrl = () =>
  api.get('/gmail/connect');

export const getGmailStatus = () =>
  api.get('/gmail/status');

export const disconnectGmail = () =>
  api.post('/gmail/disconnect');

export default api;