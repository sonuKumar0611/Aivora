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
        url.includes('/auth/me') ||
        url.includes('/auth/login') ||
        url.includes('/auth/signup') ||
        url.includes('/auth/forgot-password') ||
        url.includes('/auth/reset-password');
      if (!isAuthEndpoint) {
        localStorage.removeItem('aivora_token');
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

/** Normalize long or technical API key / OpenAI messages to short user-facing text */
function normalizeApiKeyMessage(message: string): string {
  if (/incorrect API key|invalid API key|invalid authentication/i.test(message)) {
    return 'Invalid or expired OpenAI API key. Check Settings.';
  }
  if (/openai\.com\/account\/api-keys/i.test(message)) {
    return 'Invalid or expired OpenAI API key. Check Settings.';
  }
  if (/too many requests|rate limit/i.test(message)) {
    return 'Too many requests. Please try again in a moment.';
  }
  return message;
}

/** Extract user-facing error message from API or axios error */
export function getErrorMessage(err: unknown): string {
  let message = 'Something went wrong';
  if (axios.isAxiosError(err)) {
    const d = err.response?.data as { message?: string; error?: string } | undefined;
    if (d && (d.message || d.error)) message = d.message || d.error || message;
  } else if (err instanceof Error) {
    message = err.message;
  }
  return normalizeApiKeyMessage(message);
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export type UserRole = 'owner' | 'admin' | 'member' | 'viewer';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  organizationId: string | null;
  displayName?: string;
  onboardingStep?: number;
  onboardingCompleted?: boolean;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  updatedAt: string;
}

export type ApiKeyProvider = 'openai';

export interface ApiKeyItem {
  id: string;
  provider: ApiKeyProvider;
  label: string;
  keyPrefix: string;
  lastUsedAt?: string;
  createdAt: string;
}

export type TeamMemberStatus = 'pending_invite' | 'active' | 'suspended';

export interface TeamMember {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  status: TeamMemberStatus;
  createdAt: string;
  updatedAt: string;
  invitedAt?: string;
}

export interface AuthData {
  user: User;
  token: string;
  expiresIn: string;
}

export interface FlowDefinition {
  nodes: Array<{
    id: string;
    type?: string;
    position: { x: number; y: number };
    data: Record<string, unknown>;
  }>;
  edges: Array<{
    id: string;
    source: string;
    target: string;
    sourceHandle?: string | null;
    targetHandle?: string | null;
    label?: string;
    data?: Record<string, unknown>;
  }>;
}

export type AgentToolType =
  | 'google_calendar_create_event'
  | 'google_calendar_check_availability'
  | 'google_sheets_create_row';

export interface AgentTool {
  id: string;
  organizationId: string;
  name: string;
  description?: string;
  type: AgentToolType;
  config: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface Bot {
  id: string;
  name: string;
  description: string;
  tone: string;
  botType?: string;
  systemPrompt?: string;
  assignedSourceIds: string[];
  assignedToolIds?: string[];
  flowDefinition?: FlowDefinition;
  status: 'draft' | 'published';
  /** When false, published agent returns inactive message. Ignored for draft. Default true. */
  isActive?: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Generate a flow using AI from bot profile and knowledge base. */
export async function generateFlowFromAI(botId: string): Promise<FlowDefinition> {
  const { data } = await api.post<{ data: { flow: FlowDefinition } }>(
    `/bots/${botId}/generate-flow`
  );
  return data!.data!.flow;
}

export type IntegrationProvider = 'google_calendar' | 'google_sheets';

export interface IntegrationItem {
  id: IntegrationProvider;
  name: string;
  description: string;
  category: string;
  connected: boolean;
  connectedAt?: string;
  /** Set when connected via OAuth (e.g. Google account email). */
  linkedEmail?: string;
}

export interface IntegrationsResponse {
  categories: { category: string; integrations: IntegrationItem[] }[];
}
