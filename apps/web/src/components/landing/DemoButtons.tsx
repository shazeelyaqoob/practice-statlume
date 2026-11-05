'use client';

import { useState } from 'react';
import type { Role } from '@statlume/shared/client';

/** One-click demo login straight from the landing page. */
export function DemoButtons({ tone = 'light' }: { tone?: 'light' | 'dark' }) {
  const [busy, setBusy] = useState<Role | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function open(role: Role) {
    setBusy(role);
    setError(null);
    try {
      const res = await fetch('/api/auth/demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });
      if (res.ok) {
        // Full page load so the dashboard renders with the new session cookies.
        // eslint-disable-next-line @next/next/no-location-assign-relative-destination
        window.location.assign('/overview');
        return;
      }
      setError('The demo could not start. Try the login page instead.');
    } catch {
      setError('The server did not answer. It may be waking up, try again in a moment.');
    }
    setBusy(null);
  }

  const primary =
    tone === 'dark' ? 'btn border-paper bg-paper text-ink hover:bg-paper/85' : 'btn-primary';
  const quiet = tone === 'dark' ? 'btn border-paper/40 text-paper hover:border-paper' : 'btn-quiet';

  return (
    <div className="grid gap-2">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className={primary}
          disabled={busy !== null}
          onClick={() => open('admin')}
        >
          {busy === 'admin' ? 'Opening…' : 'Try as admin'}
        </button>
        <button
          type="button"
          className={quiet}
          disabled={busy !== null}
          onClick={() => open('viewer')}
        >
          {busy === 'viewer' ? 'Opening…' : 'Try as viewer'}
        </button>
      </div>
      <p
        role="status"
        className={`min-h-5 text-sm ${tone === 'dark' ? 'text-paper/80' : 'text-sodium-text'}`}
      >
        {error}
      </p>
    </div>
  );
}
