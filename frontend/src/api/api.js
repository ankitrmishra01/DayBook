import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  withCredentials: true,
  timeout: 60000 // 60 seconds timeout to prevent infinite hanging
});

export default api;
