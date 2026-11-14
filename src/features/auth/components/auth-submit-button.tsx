'use client';

import { LoaderCircle } from 'lucide-react';
import type { ReactNode } from 'react';
import { useFormStatus } from 'react-dom';
import { Button, type ButtonProps } from '@/components/ui/button';

type Props = Omit<ButtonProps, 'children' | 'type'> & {
  label: string;
  pendingLabel: string;
  icon?: ReactNode;
};

export function AuthSubmitButton({ label, pendingLabel, disabled, icon, ...props }: Props) {
  const { pending } = useFormStatus();

  return <Button type="submit" disabled={disabled || pending} aria-busy={pending} {...props}>
    {pending
      ? <LoaderCircle size={16} className="animate-spin" aria-hidden="true" />
      : icon}
    <span aria-live="polite">{pending ? pendingLabel : label}</span>
  </Button>;
}
