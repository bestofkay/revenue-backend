import { api, ApiError } from './api';

type RequestOptions = Omit<RequestInit, 'body'> & {
  body?: unknown;
};

/** Unauthenticated API helper for the public pay / receipt portal. */
export async function publicApi<T = unknown>(path: string, options: RequestOptions = {}): Promise<T> {
  return api<T>(path, { ...options, auth: false });
}

export { ApiError };
