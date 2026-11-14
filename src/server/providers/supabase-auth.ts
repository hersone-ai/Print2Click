import 'server-only';

import { createServerClient } from '@supabase/ssr';
import { cookies, headers } from 'next/headers';
import { getOriginFromHeaders, isHttpsOrigin, withAuthCookieOptions } from '@/server/providers/request-origin';

export const LOCAL_WORKSPACE_USER = {
  id: 'local-workspace-user',
  email: 'merchant@brochure2campaign.local',
} as const;

export function getSupabaseAuthConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return { url, key };
}

export function isSupabaseConfigured() {
  return getSupabaseAuthConfig() !== null;
}

export async function getGoogleProviderStatus(): Promise<'enabled' | 'disabled' | 'unavailable'> {
  const config = getSupabaseAuthConfig();
  if (!config) return 'unavailable';
  try {
    const response = await fetch(new URL('/auth/v1/settings', config.url), {
      headers: { apikey: config.key },
      cache: 'no-store',
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) return 'unavailable';
    const settings: unknown = await response.json();
    if (!settings || typeof settings !== 'object' || !('external' in settings)) return 'unavailable';
    const external = settings.external;
    if (!external || typeof external !== 'object' || !('google' in external)) return 'unavailable';
    return external.google === true ? 'enabled' : external.google === false ? 'disabled' : 'unavailable';
  } catch {
    return 'unavailable';
  }
}

export async function createSupabaseAuthClient() {
  const config = getSupabaseAuthConfig();
  if (!config) throw new Error('Supabase Auth is not configured.');
  const cookieStore = await cookies();
  const headerList = await headers();
  const isHttps = isHttpsOrigin(getOriginFromHeaders(headerList));

  return createServerClient(config.url, config.key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, withAuthCookieOptions(options, isHttps))
          );
        } catch {
          // Server Components cannot write cookies; middleware refreshes sessions.
        }
      },
    },
  });
}
