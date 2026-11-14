import 'server-only';

import { headers } from 'next/headers';
import { createSupabaseAuthClient, getGoogleProviderStatus } from '@/server/providers/supabase-auth';

export type AuthFailure = 'configuration' | 'credentials' | 'unconfirmed' | 'signup' | 'email_delivery' | 'email_rate_limit' | 'google' | 'reset' | 'password';
export type AuthResult = { ok: true; emailConfirmationRequired?: boolean; url?: string } | { ok: false; reason: AuthFailure };

function emailActionFailure(error: { code?: string | null; status?: number }, fallback: 'signup' | 'reset'): AuthFailure {
  // Keep logs to provider codes only; never log user input or provider messages.
  console.error('Supabase Auth email action failed', { code: error.code ?? 'unknown', status: error.status ?? 'unknown' });
  if (error.code === 'email_address_not_authorized') return 'email_delivery';
  if (error.code === 'over_email_send_rate_limit' || error.status === 429) return 'email_rate_limit';
  return fallback;
}

export async function appOrigin() {
  const vercelUrl = process.env.VERCEL_URL;
  const productionUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  const vercelEnvironment = process.env.VERCEL_ENV;
  const configuredUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
  const aiStudioAppUrl = process.env.APP_URL?.trim();

  const requestHeaders = await headers();
  const originHeader = requestHeaders.get('origin')?.trim();
  if (originHeader) {
    try {
      const parsedOrigin = new URL(originHeader);
      const isAllowedRunApp = parsedOrigin.protocol === 'https:' && parsedOrigin.hostname.endsWith('.run.app');
      const isLocal = ['localhost', '127.0.0.1'].includes(parsedOrigin.hostname);
      if (isAllowedRunApp || (isLocal && (!aiStudioAppUrl || aiStudioAppUrl === 'MY_APP_URL'))) {
        return parsedOrigin.origin;
      }
    } catch {
      // Ignore malformed origin header.
    }
  }

  const forwardedHost = requestHeaders.get('x-forwarded-host')?.split(',')[0].trim();
  const rawHost = requestHeaders.get('host')?.split(',')[0].trim();
  const activeHost = forwardedHost || rawHost;
  if (activeHost && !activeHost.startsWith('0.0.0.0')) {
    const isLocalHost = activeHost.startsWith('localhost') || activeHost.startsWith('127.0.0.1');
    if (!isLocalHost || (!vercelUrl && (!aiStudioAppUrl || aiStudioAppUrl === 'MY_APP_URL'))) {
      const protocol = isLocalHost ? 'http' : activeHost.endsWith('.run.app') ? 'https' : (requestHeaders.get('x-forwarded-proto') || 'https').split(',')[0].trim();
      try {
        return new URL(`${protocol}://${activeHost}`).origin;
      } catch {
        // Fall through to env-configured origin.
      }
    }
  }

  if (aiStudioAppUrl && aiStudioAppUrl !== 'MY_APP_URL') {
    try {
      return new URL(aiStudioAppUrl).origin;
    } catch {
      // Fall through to Vercel / configured URL.
    }
  }

  if (vercelEnvironment === 'preview' && vercelUrl) return new URL(`https://${vercelUrl}`).origin;

  if (configuredUrl) {
    try {
      const configuredOrigin = new URL(configuredUrl).origin;
      const isLocalhost = ['localhost', '127.0.0.1'].includes(new URL(configuredOrigin).hostname);
      if (!isLocalhost) return configuredOrigin;
    } catch {
      // Fall through to the hosting platform or fallback.
    }
  }

  if (vercelEnvironment === 'production' && productionUrl) return new URL(`https://${productionUrl}`).origin;
  if (vercelUrl) return new URL(`https://${vercelUrl}`).origin;

  return 'http://localhost:3000';
}

function callbackUrl(next?: string, flow?: 'signup' | 'recovery') {
  return appOrigin().then((origin) => {
    const url = new URL('/auth/callback', origin);
    if (next) url.searchParams.set('next', next);
    if (flow) url.searchParams.set('flow', flow);
    return url.toString();
  });
}

export async function signInWithPassword(email: string, password: string): Promise<AuthResult> {
  try {
    const supabase = await createSupabaseAuthClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (!error) return { ok: true };
    return { ok: false, reason: error.code === 'email_not_confirmed' ? 'unconfirmed' : 'credentials' };
  } catch {
    return { ok: false, reason: 'configuration' };
  }
}

export async function signUpWithPassword(email: string, password: string): Promise<AuthResult> {
  try {
    const supabase = await createSupabaseAuthClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: await callbackUrl('/', 'signup') },
    });
    if (error) return { ok: false, reason: emailActionFailure(error, 'signup') };
    const emailConfirmed = Boolean(data.user?.email_confirmed_at);
    if (data.session && !emailConfirmed) await supabase.auth.signOut();
    return { ok: true, emailConfirmationRequired: !emailConfirmed };
  } catch {
    return { ok: false, reason: 'configuration' };
  }
}

export async function resendSignupConfirmation(email: string): Promise<AuthResult> {
  try {
    const supabase = await createSupabaseAuthClient();
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: { emailRedirectTo: await callbackUrl('/', 'signup') },
    });
    return error ? { ok: false, reason: emailActionFailure(error, 'signup') } : { ok: true };
  } catch {
    return { ok: false, reason: 'configuration' };
  }
}

export async function startGoogleOAuth(): Promise<AuthResult> {
  try {
    const providerStatus = await getGoogleProviderStatus();
    if (providerStatus !== 'enabled') return { ok: false, reason: providerStatus === 'disabled' ? 'google' : 'configuration' };
    const supabase = await createSupabaseAuthClient();
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: await callbackUrl('/') },
    });
    return error || !data.url ? { ok: false, reason: 'google' } : { ok: true, url: data.url };
  } catch {
    return { ok: false, reason: 'configuration' };
  }
}

export async function sendPasswordReset(email: string): Promise<AuthResult> {
  try {
    const supabase = await createSupabaseAuthClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: await callbackUrl('/auth/update-password', 'recovery'),
    });
    return error ? { ok: false, reason: emailActionFailure(error, 'reset') } : { ok: true };
  } catch {
    return { ok: false, reason: 'configuration' };
  }
}

export async function updatePassword(password: string): Promise<AuthResult> {
  try {
    const supabase = await createSupabaseAuthClient();
    const { data } = await supabase.auth.getClaims();
    if (!data?.claims) return { ok: false, reason: 'password' };
    const { error } = await supabase.auth.updateUser({ password });
    return error ? { ok: false, reason: 'password' } : { ok: true };
  } catch {
    return { ok: false, reason: 'configuration' };
  }
}

export async function signOut(): Promise<boolean> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)) {
    return true;
  }
  try {
    const supabase = await createSupabaseAuthClient();
    const { error } = await supabase.auth.signOut();
    return !error;
  } catch {
    return false;
  }
}
