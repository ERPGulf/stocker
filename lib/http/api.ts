import axios from 'axios';
import { store } from '@/redux/Store';
import { selectBaseUrl } from '@/redux/Slices/UserSlice';

// Function to get the current base URL from Redux store
const getBaseUrlFromStore = (): string => {
  const state = store.getState();
  return selectBaseUrl(state) || '';
};

// Base Axios instance
export const API = axios.create({
  baseURL: getBaseUrlFromStore(),
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
  },
});

// Function to update API instance with new base URL
export const updateApiBaseUrl = (baseURL: string) => {
  if (baseURL) {
    API.defaults.baseURL = baseURL;
  }
};

// Subscribe to store changes to update base URL
let currentBaseUrl = getBaseUrlFromStore();
store.subscribe(() => {
  const newBaseUrl = getBaseUrlFromStore();
  if (newBaseUrl && newBaseUrl !== currentBaseUrl) {
    currentBaseUrl = newBaseUrl;
    updateApiBaseUrl(newBaseUrl);
  }
});

// Request interceptor without authentication
API.interceptors.request.use((config) => {
  try {
    // eslint-disable-next-line no-console
    console.log('[api] request', config.method?.toUpperCase(), config.url);
  } catch {}
  return config;
});

// Simple response interceptor for error handling
API.interceptors.response.use(
  (res) => res,
  (error) => {
    // Log error if needed
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

export { API as default };
