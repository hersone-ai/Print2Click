import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { getOriginFromHeaders, isHttpsOrigin, withAuthCookieOptions } from '@/server/providers/request-origin';

function withCookies(url: URL, response: NextResponse) {
  const redirectResponse = NextResponse.redirect(url);
  response.cookies.getAll().forEach((cookie) => redirectResponse.cookies.set(cookie));
  for (const name of ['cache-control', 'expires', 'pragma']) {
    const value = response.headers.get(name);
    if (value) redirectResponse.headers.set(name, value);
  }
  return redirectResponse;
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const origin = getOriginFromHeaders(request.headers, request.url);
  const isHttps = isHttpsOrigin(origin);
  const isApiRequest = pathname.startsWith('/api/');
  const isProtectedPath = pathname === '/' || pathname.startsWith('/account') || pathname === '/auth/update-password' || pathname.startsWith('/api/');

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, withAuthCookieOptions(options, isHttps))
        );
      },
    },
  });

  let claims: { sub?: string } | null = null;
  try {
    const { data } = await supabase.auth.getClaims();
    claims = data?.claims ?? null;
  } catch {
    if (isApiRequest) return NextResponse.json({ error: 'Could not verify your sign-in. Please retry.' }, { status: 503 });
    if (isProtectedPath) return withCookies(new URL('/login?error=configuration', origin), response);
  }

  const isAuthenticated = Boolean(claims?.sub);
  if (isProtectedPath && !isAuthenticated) {
    if (isApiRequest) return NextResponse.json({ error: 'Your session has expired. Sign in again, then retry extraction.' }, { status: 401 });
    const loginUrl = new URL('/login', origin);
    loginUrl.searchParams.set('next', pathname);
    return withCookies(loginUrl, response);
  }

  if (isAuthenticated && (pathname === '/login' || pathname === '/signup')) {
    return withCookies(new URL('/', origin), response);
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
