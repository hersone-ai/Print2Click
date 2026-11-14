import type { HTMLAttributes } from 'react';

export function Card({ className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={`rounded-xl border border-border bg-surface ${className}`} {...props} />;
}

export function CardHeader({ className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={`border-b border-border px-4 py-3 ${className}`} {...props} />;
}

export function CardContent({ className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={`p-4 ${className}`} {...props} />;
}
