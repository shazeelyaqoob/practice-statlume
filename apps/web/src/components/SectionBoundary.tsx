'use client';

import { useRouter } from 'next/navigation';
import { Component, startTransition, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  label: string;
}

interface State {
  error: Error | null;
}

class Boundary extends Component<Props & { onRetry: () => void }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`[${this.props.label}]`, error, info.componentStack);
  }

  retry = () => {
    this.props.onRetry();
    this.setState({ error: null });
  };

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;
    // redirect() and notFound() work by throwing. Let Next.js handle those.
    const digest = (error as Error & { digest?: unknown }).digest;
    if (
      typeof digest === 'string' &&
      (digest.startsWith('NEXT_REDIRECT') || digest.startsWith('NEXT_HTTP_ERROR_FALLBACK'))
    ) {
      throw error;
    }
    return (
      <div
        role="alert"
        className="panel border-sodium-text/40 grid justify-items-start gap-2 border p-5"
      >
        <p className="font-semibold">{this.props.label} could not load.</p>
        <p className="text-muted text-sm">
          The rest of the page still works. This is usually a short network problem.
        </p>
        <button type="button" onClick={this.retry} className="btn-quiet mt-1">
          Try again
        </button>
      </div>
    );
  }
}

/**
 * Error boundary for one section of a page. A failed query shows a small
 * retry box in its place instead of breaking the whole page.
 */
export function SectionBoundary({ children, label }: Props) {
  const router = useRouter();
  return (
    <Boundary label={label} onRetry={() => startTransition(() => router.refresh())}>
      {children}
    </Boundary>
  );
}
