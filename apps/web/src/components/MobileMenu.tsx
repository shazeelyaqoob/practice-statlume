'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Logo } from './Logo';
import { NavLinks } from './NavLinks';

/**
 * Slide-in menu for small screens, built on <dialog>. showModal() gives a
 * real focus trap, makes the rest of the page inert and closes on Escape,
 * without any extra library.
 */
export function MobileMenu({ isAdmin }: { isAdmin: boolean }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const show = () => {
    ref.current?.showModal();
    setOpen(true);
  };
  const close = () => ref.current?.close();

  // Close when the route changes (also covers the browser back button).
  useEffect(() => {
    close();
  }, [pathname]);

  return (
    <>
      <button
        type="button"
        onClick={show}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls="mobile-menu"
        className="btn-quiet px-3 lg:hidden"
      >
        <svg viewBox="0 0 20 20" className="size-5" aria-hidden="true">
          <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="2" />
        </svg>
        <span className="sr-only">Open menu</span>
      </button>
      <dialog
        id="mobile-menu"
        ref={ref}
        aria-label="Main menu"
        onClose={() => setOpen(false)}
        onClick={(e) => {
          // A click on the backdrop lands on the dialog element itself.
          if (e.target === e.currentTarget) close();
        }}
        className="bg-paper text-ink m-0 h-dvh max-h-none w-[min(20rem,85vw)] max-w-none p-0 backdrop:bg-ink/40"
      >
        <div className="flex h-full flex-col gap-6 p-4">
          <div className="flex items-center justify-between">
            <Logo />
            <button type="button" onClick={close} className="btn-quiet px-3" autoFocus>
              <svg viewBox="0 0 20 20" className="size-5" aria-hidden="true">
                <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="2" />
              </svg>
              <span className="sr-only">Close menu</span>
            </button>
          </div>
          <nav aria-label="Main">
            <NavLinks isAdmin={isAdmin} onNavigate={close} />
          </nav>
        </div>
      </dialog>
    </>
  );
}
