import { clearSession, getAccessToken, getRefreshToken, setSession } from './auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

export class ApiError extends Error {
  status: number;
  body: unknown;

  constructor(message: string, status: number, body?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

type RequestOptions = Omit<RequestInit, 'body'> & {
  body?: unknown;
  auth?: boolean;
  _retried?: boolean;
};

let refreshPromise: Promise<boolean> | null = null;

async function refreshAccessToken(): Promise<boolean> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;
  try {
    const res = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) return false;
    const data = (await res.json()) as {
      accessToken?: string;
      refreshToken?: string;
    };
    if (!data.accessToken) return false;
    setSession({
      accessToken: data.accessToken,
      refreshToken: data.refreshToken ?? refreshToken,
    });
    return true;
  } catch {
    return false;
  }
}

function parseErrorMessage(data: unknown, status: number): string {
  if (typeof data === 'object' && data && 'message' in data) {
    const msg = (data as { message: unknown }).message;
    return Array.isArray(msg) ? msg.join(', ') : String(msg);
  }
  return `Request failed (${status})`;
}

export async function api<T = unknown>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, auth = true, headers, _retried, ...rest } = options;
  const token = getAccessToken();

  if (auth && !token && typeof window !== 'undefined') {
    clearSession();
    if (!window.location.pathname.startsWith('/login')) {
      window.location.href = '/login';
    }
    throw new ApiError('Not authenticated', 401);
  }

  const res = await fetch(`${API_URL}${path.startsWith('/') ? path : `/${path}`}`, {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...(auth && token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (res.status === 401 && auth && !_retried) {
    if (!refreshPromise) {
      refreshPromise = refreshAccessToken().finally(() => {
        refreshPromise = null;
      });
    }
    const ok = await refreshPromise;
    if (ok) {
      return api<T>(path, { ...options, _retried: true });
    }
    clearSession();
    if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
      window.location.href = '/login';
    }
  }

  const text = await res.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!res.ok) {
    throw new ApiError(parseErrorMessage(data, res.status), res.status, data);
  }

  return data as T;
}

export async function logoutApi() {
  const refreshToken = getRefreshToken();
  try {
    if (getAccessToken() && refreshToken) {
      await api('/auth/logout', { method: 'POST', body: { refreshToken } });
    }
  } catch {
    // ignore
  } finally {
    clearSession();
  }
}
