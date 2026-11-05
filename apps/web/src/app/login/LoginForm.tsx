'use client';

import { useState } from 'react';
import type { Role } from '@statlume/shared/client';

const REASONS: Record<string, string> = {
  expired: 'Your session ended. Please log in again.',
  error: 'Something went wrong with your session. Please log in again.',
};

/** Only allow redirects to paths on this site. */
function safeNext(value: string | null): string {
  return value && value.startsWith('/') && !value.startsWith('//') ? value : '/overview';
}

/**
 * The page passes the query string in from the server, so the form is part of
 * the first HTML and does not pop in after loading (no layout shift).
 */
export function LoginForm({ next: rawNext, reason }: { next?: string; reason?: string }) {
  const next = safeNext(rawNext ?? null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<'form' | Role | null>(null);

  async function send(url: string, body: unknown, who: 'form' | Role) {
    setBusy(who);
    setError(null);
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        // Full navigation so the server renders with the new cookies.
        window.location.assign(next);
        return;
      }
      const data = (await res.json().catch(() => null)) as { error?: { message?: string } } | null;
      setError(data?.error?.message ?? 'Could not log in. Try again.');
    } catch {
      setError('Could not reach the server. Check that the API is running.');
    }
    setBusy(null);
  }

  return (
    <div className="grid gap-6">
      <div>
        <h2 className="text-2xl font-extrabold">Log in</h2>
        <p className="text-muted mt-1">Have a look with a demo account. No sign-up needed.</p>
      </div>

      {reason && REASONS[reason] && !error ? (
        <p role="status" className="bg-paper rounded-md px-3 py-2 text-sm">
          {REASONS[reason]}
        </p>
      ) : null}

      <div className="grid gap-2 sm:grid-cols-2">
        <button
          type="button"
          className="btn-primary"
          disabled={busy !== null}
          onClick={() => send('/api/auth/demo', { role: 'admin' }, 'admin')}
        >
          {busy === 'admin' ? 'Opening…' : 'Try as admin'}
        </button>
        <button
          type="button"
          className="btn-quiet"
          disabled={busy !== null}
          onClick={() => send('/api/auth/demo', { role: 'viewer' }, 'viewer')}
        >
          {busy === 'viewer' ? 'Opening…' : 'Try as viewer'}
        </button>
      </div>

      <div className="text-muted flex items-center gap-3 text-sm" aria-hidden="true">
        <span className="bg-rule h-px flex-1" />
        or use your email
        <span className="bg-rule h-px flex-1" />
      </div>

      <form
        className="grid gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          const data = new FormData(e.currentTarget);
          void send(
            '/api/auth/login',
            { email: data.get('email'), password: data.get('password') },
            'form',
          );
        }}
      >
        <div>
          <label htmlFor="email" className="label">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="username"
            required
            className="field"
          />
        </div>
        <div>
          <label htmlFor="password" className="label">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className="field"
          />
        </div>
        {error ? (
          <p role="alert" className="text-sodium-text text-sm font-semibold">
            {error}
          </p>
        ) : null}
        <button type="submit" className="btn-quiet" disabled={busy !== null}>
          {busy === 'form' ? 'Logging in…' : 'Log in'}
        </button>
      </form>
    </div>
  );
}
