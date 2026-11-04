/**
 * Browser-side calls to /api. If the 15 minute access token ran out while the
 * page was open, refresh once and retry, then send the person to the login
 * page if the session is really over.
 */
export async function apiSend<T>(path: string, init: RequestInit = {}): Promise<T> {
  const doFetch = () =>
    fetch(`/api${path}`, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...init.headers },
    });

  let res = await doFetch();
  if (res.status === 401) {
    const refreshed = await fetch('/api/auth/refresh', { method: 'POST' });
    if (!refreshed.ok) {
      // Full page load: drop all client state from the ended session.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.assign(`/login?reason=expired&next=${encodeURIComponent(location.pathname)}`);
      throw new Error('Session ended');
    }
    res = await doFetch();
  }
  if (res.status === 204) return undefined as T;
  const body = (await res.json().catch(() => null)) as
    (T & { error?: { message?: string } }) | null;
  if (!res.ok) throw new Error(body?.error?.message ?? `Request failed (${res.status})`);
  return body as T;
}
