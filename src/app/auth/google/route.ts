import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { getOriginFromHeaders, isHttpsOrigin, withAuthCookieOptions } from '@/server/providers/request-origin';
import { getGoogleProviderStatus, getSupabaseAuthConfig } from '@/server/providers/supabase-auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const origin = getOriginFromHeaders(request.headers, request.url);
  const isHttps = isHttpsOrigin(origin);
  const config = getSupabaseAuthConfig();

  if (!config) {
    return NextResponse.redirect(new URL('/login?error=configuration', origin));
  }

  const providerStatus = await getGoogleProviderStatus();
  if (providerStatus !== 'enabled') {
    const reason = providerStatus === 'disabled' ? 'google' : 'configuration';
    return NextResponse.redirect(new URL(`/login?error=${reason}`, origin));
  }

  const pendingCookies: Array<{ name: string; value: string; options?: CookieOptions }> = [];
  const supabase = createServerClient(config.url, config.key, {
    cookies: {
      // Start a fresh PKCE flow so stale flow cookies do not accumulate in the header.
      getAll() {
        return [];
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach((cookie) => pendingCookies.push(cookie));
      },
    },
  });

  const redirectTo = new URL('/auth/callback?next=/', origin).toString();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo },
  });

  if (error || !data?.url) {
    return NextResponse.redirect(new URL('/login?error=google', origin));
  }

  const response = NextResponse.redirect(data.url);
  const newCookieNames = new Set(pendingCookies.map((c) => c.name));

  // Clear any old PKCE verifier cookies to keep Cookie headers compact.
  for (const existing of request.cookies.getAll()) {
    if (existing.name.endsWith('-code-verifier') && !newCookieNames.has(existing.name)) {
      response.cookies.set(existing.name, '', {
        ...withAuthCookieOptions({ path: '/' }, isHttps),
        maxAge: 0,
      });
    }
  }

  pendingCookies.forEach(({ name, value, options }) => {
    const cookieOpts = withAuthCookieOptions(options, isHttps);
    if (name.endsWith('-code-verifier') && value) {
      cookieOpts.maxAge = 600;
    }
    response.cookies.set(name, value, cookieOpts);
  });
  return response;
}
