import type { ButtonHTMLAttributes } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'icon';

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-primary-foreground hover:bg-primary-hover disabled:bg-disabled disabled:text-disabled-foreground aria-[busy=true]:disabled:bg-primary aria-[busy=true]:disabled:text-primary-foreground',
  secondary: 'bg-muted text-foreground hover:bg-muted-strong disabled:bg-disabled disabled:text-disabled-foreground',
  outline: 'border border-border bg-surface text-foreground hover:bg-muted disabled:bg-disabled disabled:text-disabled-foreground',
  ghost: 'bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground disabled:text-disabled-foreground',
  danger: 'bg-danger-soft text-danger hover:bg-danger-soft-strong disabled:bg-disabled disabled:text-disabled-foreground',
};

const sizes: Record<ButtonSize, string> = {
  sm: 'min-h-8 rounded-control px-3 text-xs',
  md: 'min-h-10 rounded-control px-4 text-sm',
  icon: 'h-9 w-9 rounded-control p-0',
};

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

export function Button({ variant = 'secondary', size = 'md', className = '', type = 'button', ...props }: ButtonProps) {
  return <button type={type} className={`inline-flex items-center justify-center gap-2 font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`} {...props} />;
}
