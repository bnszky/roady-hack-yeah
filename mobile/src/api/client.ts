import { API_URL } from '@/lib/env';
import { supabase } from '@/lib/supabase';

const TIMEOUT_MS = 15_000;

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

/** Auth is optional: a missing or broken Supabase setup must never block a request. */
async function accessToken(): Promise<string | undefined> {
  if (!supabase) return undefined;
  try {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token;
  } catch {
    return undefined;
  }
}

/** FastAPI errors look like `{"detail": "..."}` or `{"detail": [{"msg": "..."}]}`. */
function errorMessage(body: string, status: number): string {
  try {
    const { detail } = JSON.parse(body);
    if (typeof detail === 'string') return detail;
    if (Array.isArray(detail) && detail[0]?.msg) return detail.map((d) => d.msg).join(', ');
  } catch {
    // not JSON
  }
  return body || `Błąd serwera (${status})`;
}

/**
 * Thin fetch wrapper for our FastAPI backend.
 * - Prepends API_URL.
 * - Attaches the Supabase access token as a Bearer token when signed in.
 * - Times out after 15 s and throws ApiError with a readable message on failure.
 */
export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await accessToken();

  const headers = new Headers(options.headers);
  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, { ...options, headers, signal: controller.signal });
  } catch {
    throw new ApiError(`Brak połączenia z serwerem (${API_URL}). Czy backend działa?`, 0);
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    throw new ApiError(errorMessage(await response.text(), response.status), response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}
