import type { HTMLAttributes } from 'react';

type BadgeVariant = 'neutral' | 'primary' | 'danger' | 'outline';

const variants: Record<BadgeVariant, string> = {
  neutral: 'bg-muted text-muted-foreground',
  primary: 'bg-primary-soft text-primary-strong',
  danger: 'bg-danger-soft text-danger',
  outline: 'border border-border bg-surface text-muted-foreground',
};

export function Badge({ variant = 'neutral', className = '', ...props }: HTMLAttributes<HTMLSpanElement> & { variant?: BadgeVariant }) {
  return <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${variants[variant]} ${className}`} {...props} />;
}
