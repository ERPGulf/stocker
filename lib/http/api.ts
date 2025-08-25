import axios from 'axios';
import { getAccessToken, setAccessToken } from './tokenStore';
import { generateToken } from '@/lib/api/auth';

// Base Axios instance
const API = axios.create({
  baseURL: 'https://aysha.erpgulf.com',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
  },
});

// Attach Authorization header from token store
API.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers = config.headers || {};
    (config.headers as any).Authorization = `Bearer ${token}`;
  }
  try {
    const masked = token ? `${token.slice(0, 6)}...${token.slice(-4)}` : 'none';
    // eslint-disable-next-line no-console
    console.log('[api] request', config.method?.toUpperCase(), config.url, 'auth:', masked);
  } catch {}
  return config;
});

let isRefreshing = false;
let pendingQueue: Array<{ resolve: (token: string | null) => void; reject: (err: any) => void }> = [];

async function refreshAccessToken(): Promise<string | null> {
  if (isRefreshing) {
    // queue callers while a refresh is in-flight
    return new Promise((resolve, reject) => pendingQueue.push({ resolve, reject }));
  }
  isRefreshing = true;
  try {
    const t = await generateToken(); // fallback: call same generator
    const newToken = t?.access_token ?? null;
    setAccessToken(newToken);
    // eslint-disable-next-line no-console
    console.log('[api] refreshed token');
    pendingQueue.forEach((p) => p.resolve(newToken));
    pendingQueue = [];
    return newToken;
  } catch (err) {
    setAccessToken(null);
    pendingQueue.forEach((p) => p.reject(err));
    pendingQueue = [];
    throw err;
  } finally {
    isRefreshing = false;
  }
}

// On 401, attempt a single refresh then retry
API.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error?.config;
    const status = error?.response?.status;
    if (status === 401 && !original?._retry) {
      original._retry = true;
      try {
        const newToken = await refreshAccessToken();
        if (newToken) {
          original.headers = original.headers || {};
          original.headers.Authorization = `Bearer ${newToken}`;
          return API(original);
        }
      } catch (_) {
        // fall-through
      }
    }
    return Promise.reject(error);
  }
);

export default API;
