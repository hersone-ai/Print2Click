'use client';

import { useActionState, useEffect, useState } from 'react';
import Link from 'next/link';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { signInAction, signUpAction, resendSignupAction, sendPasswordResetAction, updatePasswordAction } from '@/features/auth/actions';
import type { AuthFormState } from '@/features/auth/domain';
import { AuthFeedback, GoogleMark } from '@/features/auth/components/auth-shell';
import { AuthSubmitButton } from '@/features/auth/components/auth-submit-button';
import { PasswordFields } from '@/features/auth/components/password-fields';

const initialState: AuthFormState = {};

export function GoogleSignInForm() {
  const [inIframe, setInIframe] = useState(false);

  useEffect(() => {
    setInIframe(window.self !== window.top);
  }, []);

  return <div className="space-y-2">
    <a
      href="/auth/google"
      target={inIframe ? '_blank' : undefined}
      rel={inIframe ? 'noopener noreferrer' : undefined}
      className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-control border border-border bg-surface px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
    >
      <GoogleMark />
      <span>Continue with Google</span>
    </a>
    {inIframe && (
      <p className="text-center text-xs leading-5 text-subtle">
        Opens Google sign-in in a new tab because Google blocks sign-in inside preview frames.
      </p>
    )}
  </div>;
}

export function SignInForm() {
  const [state, action] = useActionState(signInAction, initialState);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  return <>
    <form action={action} className="space-y-4">
      <AuthFeedback error={state.error} />
      <FormField label="Email" htmlFor="email"><Input id="email" name="email" type="email" autoComplete="email" autoCapitalize="none" required value={email} onChange={(event) => setEmail(event.target.value)} /></FormField>
      <FormField label="Password" htmlFor="password"><Input id="password" name="password" type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} /></FormField>
      <div className="flex justify-end"><Link href="/forgot-password" className="text-sm font-medium text-primary hover:underline">Forgot password?</Link></div>
      <AuthSubmitButton label="Sign in" pendingLabel="Signing in…" variant="primary" className="w-full" />
    </form>
    {state.error === 'unconfirmed' && <ResendConfirmationForm defaultEmail={state.email || email} compact />}
  </>;
}

export function SignUpForm() {
  const [state, action] = useActionState(signUpAction, initialState);
  const [email, setEmail] = useState('');
  return <form action={action} className="space-y-4">
    <AuthFeedback error={state.error} />
    <FormField label="Email" htmlFor="email"><Input id="email" name="email" type="email" autoComplete="email" autoCapitalize="none" required value={email} onChange={(event) => setEmail(event.target.value)} /></FormField>
    <PasswordFields />
    <div className="pt-2"><AuthSubmitButton label="Create account" pendingLabel="Creating account…" variant="primary" className="w-full" /></div>
  </form>;
}

export function ForgotPasswordForm() {
  const [state, action] = useActionState(sendPasswordResetAction, initialState);
  const [email, setEmail] = useState('');
  return <form action={action} className="space-y-4">
    <AuthFeedback error={state.error} message={state.success} />
    <FormField label="Email" htmlFor="email"><Input id="email" name="email" type="email" autoComplete="email" autoCapitalize="none" required value={email} onChange={(event) => setEmail(event.target.value)} /></FormField>
    <AuthSubmitButton label="Send reset link" pendingLabel="Sending reset link…" variant="primary" className="w-full" />
  </form>;
}

export function UpdatePasswordForm() {
  const [state, action] = useActionState(updatePasswordAction, initialState);
  return <form action={action} className="space-y-4">
    <AuthFeedback error={state.error} />
    <PasswordFields newLabel="New password" />
    <AuthSubmitButton label="Update password" pendingLabel="Updating password…" variant="primary" className="w-full" />
  </form>;
}

export function ResendConfirmationForm({ defaultEmail = '', compact = false }: { defaultEmail?: string; compact?: boolean }) {
  const [state, action] = useActionState(resendSignupAction, initialState);
  const [email, setEmail] = useState(defaultEmail);
  return <form action={action} className={compact ? 'space-y-3 rounded-lg border border-border bg-muted p-3' : 'space-y-3 rounded-lg border border-border bg-muted p-4'}>
    <p className="text-sm font-medium text-foreground">No confirmation email yet?</p>
    <p className="text-xs leading-5 text-muted-foreground">Check your spam folder, then request another link.</p>
    <AuthFeedback error={state.error} message={state.success} />
    <FormField label="Email" htmlFor="resend-email"><Input id="resend-email" name="email" type="email" autoComplete="email" autoCapitalize="none" required value={email} onChange={(event) => setEmail(event.target.value)} /></FormField>
    <AuthSubmitButton label="Resend confirmation" pendingLabel="Sending confirmation…" variant="outline" className="w-full" />
  </form>;
}
