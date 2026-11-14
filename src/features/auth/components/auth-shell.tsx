import type { ReactNode } from 'react';
import Image from 'next/image';
import { Store } from 'lucide-react';
import { Notice } from '@/components/ui/notice';

export function AuthShell({ title, description, children, centeredTitle = false }: { title: string; description: string; children: ReactNode; centeredTitle?: boolean }) {
  return <main className="auth-scene grid min-h-screen text-auth-foreground lg:grid-cols-[1.2fr_.8fr]">
    <aside className="auth-visual relative flex min-h-[110px] flex-col justify-between overflow-hidden px-5 py-5 sm:px-8 lg:min-h-screen lg:px-14 lg:py-12 xl:px-20">
      <div className="relative z-10 flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-auth-foreground/20 bg-auth-foreground/10 text-auth-foreground"><Store size={20} aria-hidden="true" /></span>
        <span className="text-sm font-semibold tracking-tight text-auth-foreground">Brochure2Campaign</span>
      </div>
      <p className="relative z-10 mt-3 text-sm text-auth-foreground/80 lg:hidden">From print flyer to web campaign.</p>
      <div className="relative z-10 hidden max-w-xl flex-1 flex-col justify-center lg:flex">
        <h2 className="max-w-lg text-4xl font-semibold leading-[1.08] tracking-[-.04em] sm:text-5xl xl:text-6xl">From print flyer to live web campaign in seconds.</h2>
        <p className="mt-6 max-w-md text-base leading-7 text-auth-foreground/80 sm:text-lg">Upload your physical ad or brochure, let AI structure your products and pricing, and share a mobile-optimized campaign link instantly on WhatsApp and social media.</p>
      </div>
    </aside>
    <section className="flex min-h-[calc(100vh-110px)] items-center justify-center px-5 py-8 sm:px-10 lg:min-h-screen lg:px-8 lg:py-4 xl:px-14">
      <div className="w-full max-w-[440px] rounded-2xl border border-border/70 bg-background p-6 text-foreground shadow-2xl sm:p-8">
        <div className={`mb-6 space-y-2 ${centeredTitle ? 'text-center' : ''}`}>
          <h1 className="text-2xl font-semibold tracking-[-.035em] sm:text-3xl">{title}</h1>
          {description && <p className="text-sm leading-6 text-muted-foreground">{description}</p>}
        </div>
        {children}
      </div>
    </section>
  </main>;
}

const errors: Record<string, string> = {
  invalid: 'Check the fields and try again.',
  password_policy: 'Use at least 8 characters, including one uppercase letter and one special character.',
  password_mismatch: 'The passwords do not match. Enter the same password in both fields.',
  credentials: 'Email or password is incorrect.',
  unconfirmed: 'Confirm your email before signing in. You can request another confirmation email below.',
  configuration: 'Sign-in is not configured yet. Add the Supabase project URL and publishable key to the app environment.',
  signup: 'We could not create the account. Check the details and try again, or sign in if you already registered.',
  email_delivery: 'Supabase’s test email service only sends to addresses in your Supabase organization. Configure custom SMTP in Supabase Auth to send confirmation emails to this address.',
  email_rate_limit: 'Supabase’s built-in email limit has been reached. Wait before retrying, or configure custom SMTP in Supabase Auth.',
  google: 'Google sign-in is not available yet. Use email sign-in while the site owner enables it.',
  callback: 'This link may have expired or already been used. If you were confirming your email, try signing in; if you were resetting your password, request a fresh reset email.',
  reset: 'We could not send a reset link. Check the Supabase Auth email settings and try again.',
  password: 'We could not update the password. Request a new reset link and try again.',
};

export function AuthFeedback({ error, message }: { error?: string; message?: string }) {
  const text = error ? errors[error] || errors.credentials : message === 'signed-out' ? 'You have been signed out.' : message === 'email-verified' ? 'Your email has been verified successfully.' : message === 'reset_sent' ? 'If an account matches this email, a reset link is on its way. Check your inbox and spam folder.' : message === 'confirmation_sent' ? 'If the address is eligible, a new confirmation link has been sent. Check your inbox and spam folder.' : undefined;
  if (!text) return null;
  const variant = error ? (['unconfirmed', 'email_rate_limit', 'callback'].includes(error) ? 'warning' : 'error') : message === 'email-verified' ? 'success' : 'info';
  return <Notice variant={variant}>{text}</Notice>;
}

export function AuthDivider() {
  return <div className="flex items-center gap-3 py-1 text-xs text-subtle"><span className="h-px flex-1 bg-border" /><span>or continue with email</span><span className="h-px flex-1 bg-border" /></div>;
}

export function GoogleMark() {
  return <Image src="/images/google-logo.svg" width={20} height={20} alt="" aria-hidden="true" className="shrink-0" />;
}
