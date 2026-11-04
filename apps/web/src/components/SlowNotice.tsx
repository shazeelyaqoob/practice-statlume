'use client';

import { useEffect, useState } from 'react';

/**
 * Appears if a section is still loading after 3 seconds. On a free host the
 * API sleeps after 15 idle minutes and takes a while to start again; this
 * tells people what is going on instead of showing a frozen page.
 */
export function SlowNotice({ delay = 3000 }: { delay?: number }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setShow(true), delay);
    return () => clearTimeout(t);
  }, [delay]);
  if (!show) return null;
  return (
    <p className="bg-panel/90 absolute inset-x-0 top-1/2 mx-auto w-fit -translate-y-1/2 rounded-md px-3 py-2 text-sm">
      Waking up the server… this can take up to a minute on the free plan.
    </p>
  );
}
