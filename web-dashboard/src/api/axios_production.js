import axios from 'axios';

// Production mein VITE_API_URL env variable se aayega (Vercel dashboard mein set karo)
// Development mein localhost use hoga
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
