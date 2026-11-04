'use client';

import { useState } from 'react';

export function LogoutButton() {
  const [busy, setBusy] = useState(false);
  return (
    <button
      type="button"
      className="btn-quiet"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        await fetch('/api/auth/logout', { method: 'POST' }).catch(() => null);
        // Full page load so no cached data from the session stays in memory.
        window.location.assign('/login');
      }}
    >
      {busy ? 'Logging out…' : 'Log out'}
    </button>
  );
}
