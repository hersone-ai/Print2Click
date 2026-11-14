import type { ReactNode } from 'react';
import { CircleAlert, CircleCheck, Info, TriangleAlert } from 'lucide-react';

type NoticeVariant = 'error' | 'warning' | 'success' | 'info';

const variants = {
  error: { label: 'Error', icon: CircleAlert, style: 'border-danger/35 bg-danger-soft text-danger' },
  warning: { label: 'Warning', icon: TriangleAlert, style: 'border-warning/35 bg-warning-soft text-warning' },
  success: { label: 'Success', icon: CircleCheck, style: 'border-success/35 bg-success-soft text-success' },
  info: { label: 'Information', icon: Info, style: 'border-info/35 bg-info-soft text-info' },
} as const;

export function Notice({ variant, children, className = '' }: { variant: NoticeVariant; children: ReactNode; className?: string }) {
  const { label, icon: Icon, style } = variants[variant];
  const urgent = variant === 'error' || variant === 'warning';
  return <div role={urgent ? 'alert' : 'status'} aria-live={urgent ? 'assertive' : 'polite'} className={`flex items-start gap-3 rounded-control border px-3.5 py-3 ${style} ${className}`}>
    <Icon size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
    <div className="min-w-0 text-sm leading-5"><p className="font-semibold">{label}</p><div className="mt-0.5">{children}</div></div>
  </div>;
}
