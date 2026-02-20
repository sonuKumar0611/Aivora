import axios, { AxiosError } from 'axios';

export const getApiUrl = () =>
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

const API_URL = getApiUrl();

export const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('aivora_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err: AxiosError<{ error?: string; message?: string }>) => {
    if (err.response?.status === 401 && typeof window !== 'undefined') {
      const url = err.config?.url ?? '';
      const isAuthEndpoint =
        url.includes('/auth/me') || url.includes('/auth/login') || url.includes('/auth/signup');
      if (!isAuthEndpoint) {
        localStorage.removeItem('aivora_token');
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

/** Extract user-facing error message from API or axios error */
export function getErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const d = err.response?.data as { message?: string; error?: string } | undefined;
    if (d && (d.message || d.error)) return d.message || d.error || 'Something went wrong';
  }
  if (err instanceof Error) return err.message;
  return 'Something went wrong';
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface User {
  id: string;
  email: string;
}

export interface AuthData {
  user: User;
  token: string;
  expiresIn: string;
}

export interface Bot {
  id: string;
  name: string;
  description: string;
  tone: string;
  createdAt: string;
  updatedAt: string;
}
