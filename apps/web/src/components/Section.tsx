import { Suspense, type ReactNode } from 'react';
import { SectionBoundary } from './SectionBoundary';

/**
 * One block of a page: heading, optional actions, and content that loads on
 * its own. Each section streams in when its query finishes, and fails on its
 * own without taking the rest of the page down.
 */
export function Section({
  id,
  title,
  description,
  actions,
  fallback,
  children,
}: {
  id: string;
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  fallback: ReactNode;
  children: ReactNode;
}) {
  return (
    <section aria-labelledby={`${id}-title`} className="border-rule border-t pt-5">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id={`${id}-title`} className="text-lg font-extrabold">
            {title}
          </h2>
          {description ? <p className="eyebrow mt-0.5">{description}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
      <SectionBoundary label={title}>
        <Suspense fallback={fallback}>{children}</Suspense>
      </SectionBoundary>
    </section>
  );
}

export function PageHeader({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <header className="mb-6">
      <h1 className="text-3xl font-extrabold sm:text-4xl">{title}</h1>
      {children ? <div className="text-muted mt-1">{children}</div> : null}
    </header>
  );
}
