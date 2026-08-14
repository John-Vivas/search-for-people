import { ok, fail, ServiceResponse } from '@/src/services/api/errors';

/**
 * Base URL of the Express backend (search-for-people-backend) — a separate
 * deployment from Supabase, used for endpoints that need the service-role
 * key (e.g. anything touching phone numbers). See src/features/phone-auth
 * and src/features/aid for the features that call it.
 */
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '').trim().replace(/\/$/, '');

export const isApiConfigured = Boolean(API_BASE_URL);

interface ApiErrorBody {
  error?: {
    message?: string;
    code?: string;
    details?: { path: string; message: string }[];
  };
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'DELETE';
  body?: unknown;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<ServiceResponse<T>> {
  if (!isApiConfigured) {
    return fail(new Error('VITE_API_BASE_URL no está configurada'), 'El servidor no está configurado');
  }

  try {
    const hasBody = options.body !== undefined;
    const res = await fetch(`${API_BASE_URL}${path}`, {
      method: options.method ?? 'GET',
      credentials: 'include',
      headers: hasBody ? { 'Content-Type': 'application/json' } : undefined,
      body: hasBody ? JSON.stringify(options.body) : undefined,
    });

    const contentType = res.headers.get('content-type') ?? '';
    const payload = contentType.includes('application/json') ? await res.json().catch(() => null) : null;

    if (!res.ok) {
      const body = payload as ApiErrorBody | null;
      // Zod validation errors come back as a generic "Invalid request data"
      // plus a `details` array with the actual (already user-facing, Spanish)
      // per-field messages — surface those instead of the generic one.
      const detailMessages = body?.error?.details?.map((d) => d.message).filter(Boolean);
      const message =
        (detailMessages && detailMessages.length > 0 ? detailMessages.join(' ') : body?.error?.message) ||
        'No se pudo completar la operación';
      return fail(new Error(message), message);
    }

    return ok(payload as T);
  } catch (error) {
    return fail(error, 'No se pudo conectar con el servidor');
  }
}

export const apiClient = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown = {}) => request<T>(path, { method: 'POST', body }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};
