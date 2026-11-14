import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { getOriginFromHeaders, isHttpsOrigin, withAuthCookieOptions } from '@/server/providers/request-origin';
import { getSupabaseAuthConfig } from '@/server/providers/supabase-auth';

function safeNextPath(value: string | null) {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return '/';
  return value;
}

export async function GET(request: NextRequest) {
  const origin = getOriginFromHeaders(request.headers, request.url);
  const isHttps = isHttpsOrigin(origin);
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const tokenHash = url.searchParams.get('token_hash');
  const type = url.searchParams.get('type');
  const flow = url.searchParams.get('flow');
  const next = safeNextPath(url.searchParams.get('next'));
  const verifiedUrl = new URL('/auth/check-email?flow=signup&verified=1', origin);

  if (!code && !(tokenHash && (type === 'email' || type === 'recovery'))) {
    return NextResponse.redirect(new URL('/login?error=callback', origin));
  }

  const config = getSupabaseAuthConfig();
  if (!config) {
    return NextResponse.redirect(new URL('/login?error=configuration', origin));
  }

  const pendingCookies: Array<{ name: string; value: string; options?: CookieOptions }> = [];
  const supabase = createServerClient(config.url, config.key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach((cookie) => pendingCookies.push(cookie));
      },
    },
  });

  try {
    const { error } = code
      ? await supabase.auth.exchangeCodeForSession(code)
      : await supabase.auth.verifyOtp({ token_hash: tokenHash!, type: type as 'email' | 'recovery' });

    if (!error) {
      const targetUrl = flow === 'signup' ? verifiedUrl : new URL(next, origin);
      const response = NextResponse.redirect(targetUrl);
      const writtenNames = new Set(pendingCookies.map((c) => c.name));

      pendingCookies.forEach(({ name, value, options }) => {
        response.cookies.set(name, value, withAuthCookieOptions(options, isHttps));
      });

      // Clean up any leftover PKCE verifier cookies after exchanging the code.
      for (const existing of request.cookies.getAll()) {
        if (existing.name.endsWith('-code-verifier') && !writtenNames.has(existing.name)) {
          response.cookies.set(existing.name, '', {
            ...withAuthCookieOptions({ path: '/' }, isHttps),
            maxAge: 0,
          });
        }
      }

      return response;
    }
  } catch {
    // Keep provider and token details out of the redirect URL.
  }

  if (code && flow === 'signup') return NextResponse.redirect(verifiedUrl);

  return NextResponse.redirect(new URL('/login?error=callback', origin));
}
