import { z } from 'zod';

const email = z.string().trim().email().max(254);
const signInPassword = z.string().min(1).max(128);
const newPassword = z.string().min(8).max(128)
  .regex(/[A-Z]/, 'Include at least one uppercase letter.')
  .regex(/[^A-Za-z0-9\s]/, 'Include at least one special character.');

export const passwordInputPattern = '(?=.*[A-Z])(?=.*[^A-Za-z0-9\\s]).{8,128}';

export const signInSchema = z.object({ email, password: signInPassword });

export const signUpSchema = z.object({
  email,
  password: newPassword,
  confirmPassword: z.string().min(1).max(128),
}).refine((value) => value.password === value.confirmPassword, {
  path: ['confirmPassword'],
});

export const emailSchema = z.object({ email });
export const newPasswordSchema = z.object({ password: newPassword, confirmPassword: z.string().min(1).max(128) })
  .refine((value) => value.password === value.confirmPassword, { path: ['confirmPassword'] });

export type AuthError = 'configuration' | 'credentials' | 'unconfirmed' | 'signup' | 'email_delivery' | 'email_rate_limit' | 'google' | 'reset' | 'password';
export type AuthFormState = { error?: AuthError | 'invalid' | 'password_policy' | 'password_mismatch'; success?: 'reset_sent' | 'confirmation_sent'; email?: string; url?: string };
