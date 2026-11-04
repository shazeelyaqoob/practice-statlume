import 'server-only';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { ApiError as ApiErrorBody } from '@statlume/shared';

const API_URL = process.env.API_URL ?? 'http://localhost:4000';

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

/**
 * GET from the Express API during a server render, passing the visitor's
 * cookies along. The proxy (src/proxy.ts) has already refreshed an expired
 * access token, so a 401 here means the session is really over.
 */
export async function apiGet<T>(path: string): Promise<T> {
  const cookieHeader = (await cookies()).toString();
  const res = await fetch(`${API_URL}/api${path}`, {
    headers: { cookie: cookieHeader, accept: 'application/json' },
    cache: 'no-store',
  });
  if (res.status === 401) redirect('/login?reason=expired');
  if (!res.ok) {
    let body: ApiErrorBody | undefined;
    try {
      body = (await res.json()) as ApiErrorBody;
    } catch {
      // not JSON
    }
    throw new ApiError(
      res.status,
      body?.error.code ?? 'http_error',
      body?.error.message ?? `Request failed (${res.status})`,
    );
  }
  return (await res.json()) as T;
}
