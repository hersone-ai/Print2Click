import type { ComponentPropsWithRef } from 'react';

export function Input({ className = '', ...props }: ComponentPropsWithRef<'input'>) {
  return <input className={`min-h-10 w-full rounded-control border border-border bg-surface px-3 text-sm text-foreground outline-none placeholder:text-subtle focus-visible:border-focus focus-visible:ring-2 focus-visible:ring-focus/20 disabled:cursor-not-allowed disabled:bg-muted ${className}`} {...props} />;
}
