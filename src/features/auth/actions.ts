'use server';

import { redirect } from 'next/navigation';
import { emailSchema, newPasswordSchema, signInSchema, signUpSchema, type AuthFormState } from '@/features/auth/domain';
import {
  resendSignupConfirmation,
  sendPasswordReset,
  signInWithPassword,
  signOut,
  signUpWithPassword,
  startGoogleOAuth,
  updatePassword,
} from '@/server/services/auth-service';

function field(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === 'string' ? value : '';
}

export async function signInAction(_previous: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const parsed = signInSchema.safeParse({ email: field(formData, 'email'), password: field(formData, 'password') });
  if (!parsed.success) return { error: 'invalid' };
  const result = await signInWithPassword(parsed.data.email, parsed.data.password);
  if (!result.ok) return { error: result.reason, email: parsed.data.email };
  redirect('/');
}

export async function signUpAction(_previous: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const parsed = signUpSchema.safeParse({
    email: field(formData, 'email'),
    password: field(formData, 'password'),
    confirmPassword: field(formData, 'confirmPassword'),
  });
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    if (issue?.path[0] === 'password') return { error: 'password_policy' };
    if (issue?.path[0] === 'confirmPassword') return { error: 'password_mismatch' };
    return { error: 'invalid' };
  }
  const result = await signUpWithPassword(parsed.data.email, parsed.data.password);
  if (!result.ok) return { error: result.reason };
  redirect(result.emailConfirmationRequired ? '/auth/check-email?flow=signup' : '/');
}

export async function resendSignupAction(_previous: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const parsed = emailSchema.safeParse({ email: field(formData, 'email') });
  if (!parsed.success) return { error: 'invalid' };
  const result = await resendSignupConfirmation(parsed.data.email);
  if (!result.ok) return { error: result.reason };
  return { success: 'confirmation_sent' };
}

export async function sendPasswordResetAction(_previous: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const parsed = emailSchema.safeParse({ email: field(formData, 'email') });
  if (!parsed.success) return { error: 'invalid' };
  const result = await sendPasswordReset(parsed.data.email);
  if (!result.ok) return { error: result.reason };
  return { success: 'reset_sent' };
}

export async function updatePasswordAction(_previous: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const parsed = newPasswordSchema.safeParse({
    password: field(formData, 'password'),
    confirmPassword: field(formData, 'confirmPassword'),
  });
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    if (issue?.path[0] === 'password') return { error: 'password_policy' };
    if (issue?.path[0] === 'confirmPassword') return { error: 'password_mismatch' };
    return { error: 'invalid' };
  }
  const result = await updatePassword(parsed.data.password);
  if (!result.ok) return { error: result.reason };
  redirect('/');
}

export async function signInWithGoogleAction(): Promise<AuthFormState> {
  const result = await startGoogleOAuth();
  if (!result.ok || !result.url) return { error: result.ok ? 'google' : result.reason };
  return { url: result.url };
}

export async function signOutAction() {
  if (!await signOut()) redirect('/?error=signout');
  redirect('/login?message=signed-out');
}
