import type { TextareaHTMLAttributes } from 'react';

export function Textarea({ className = '', ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={`w-full resize-y rounded-control border border-border bg-surface px-3 py-2.5 text-sm leading-6 text-foreground outline-none placeholder:text-subtle focus-visible:border-focus focus-visible:ring-2 focus-visible:ring-focus/20 disabled:cursor-not-allowed disabled:bg-muted ${className}`} {...props} />;
}
