import type { CookieOptions } from '@supabase/ssr';

type HeaderReader = {
  get(name: string): string | null;
};

export function getOriginFromHeaders(headerList: HeaderReader, fallbackUrl?: string): string {
  const forwardedHost = headerList.get('x-forwarded-host')?.split(',')[0].trim();
  const rawHost = headerList.get('host')?.split(',')[0].trim();
  const activeHost = forwardedHost || rawHost;

  if (activeHost && !activeHost.startsWith('0.0.0.0')) {
    const isLocalHost = activeHost.startsWith('localhost') || activeHost.startsWith('127.0.0.1');
    const aiStudioAppUrl = process.env.APP_URL?.trim();
    const vercelUrl = process.env.VERCEL_URL?.trim();

    if (!isLocalHost || (!vercelUrl && (!aiStudioAppUrl || aiStudioAppUrl === 'MY_APP_URL'))) {
      const protocol = (headerList.get('x-forwarded-proto') || (isLocalHost ? 'http' : 'https')).split(',')[0].trim();
      try {
        return new URL(`${protocol}://${activeHost}`).origin;
      } catch {
        // Fall through to env/fallback.
      }
    }
  }

  const configuredUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (configuredUrl) {
    try {
      const origin = new URL(configuredUrl).origin;
      if (!['localhost', '127.0.0.1'].includes(new URL(origin).hostname)) return origin;
    } catch {
      // Fall through.
    }
  }

  const aiStudioAppUrl = process.env.APP_URL?.trim();
  if (aiStudioAppUrl && aiStudioAppUrl !== 'MY_APP_URL') {
    try {
      return new URL(aiStudioAppUrl).origin;
    } catch {
      // Fall through.
    }
  }

  if (fallbackUrl) {
    try {
      const origin = new URL(fallbackUrl).origin;
      if (!origin.includes('0.0.0.0')) return origin;
    } catch {
      // Fall through.
    }
  }

  return 'http://localhost:3000';
}

export function isHttpsOrigin(origin: string): boolean {
  return origin.startsWith('https://');
}

export function withAuthCookieOptions(options: CookieOptions | undefined, isHttps: boolean): CookieOptions {
  if (!isHttps) return options ?? {};
  return {
    ...options,
    sameSite: 'none',
    secure: true,
  };
}
