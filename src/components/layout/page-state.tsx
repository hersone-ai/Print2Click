import type { ReactNode } from 'react';

type PageStateProps = {
  eyebrow?: string;
  title: string;
  description: string;
  children?: ReactNode;
  status?: 'error' | 'loading';
};

export function PageState({ eyebrow, title, description, children, status }: PageStateProps) {
  return <main className="flex min-h-screen items-center justify-center bg-background px-5 py-12 text-foreground">
    <section className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-sm sm:p-8" aria-busy={status === 'loading' || undefined}>
      {eyebrow && <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-primary">{eyebrow}</p>}
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-3 text-sm leading-6 text-muted-foreground" role={status === 'error' ? 'alert' : status === 'loading' ? 'status' : undefined}>{description}</p>
      {children && <div className="mt-6 flex flex-wrap items-center gap-4">{children}</div>}
    </section>
  </main>;
}
