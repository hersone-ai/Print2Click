import 'server-only';

import { createSupabaseAuthClient, isSupabaseConfigured } from '@/server/providers/supabase-auth';

export type ExtractionQuota = {
  allowed: boolean;
  remaining: number;
  resetAt: string;
};

export class ExtractionRateLimitUnavailableError extends Error {
  constructor() {
    super('Extraction rate limiting is unavailable. Apply the extraction rate-limit migration in Supabase, then retry.');
    this.name = 'ExtractionRateLimitUnavailableError';
  }
}

const LOCAL_HOURLY_LIMIT = 30;
const LOCAL_WINDOW_MS = 60 * 60 * 1000;
let localWindow = { count: 0, resetAtMs: Date.now() + LOCAL_WINDOW_MS };

function consumeInMemoryQuota(): ExtractionQuota {
  const now = Date.now();
  if (now >= localWindow.resetAtMs) {
    localWindow = { count: 0, resetAtMs: now + LOCAL_WINDOW_MS };
  }
  if (localWindow.count >= LOCAL_HOURLY_LIMIT) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: new Date(localWindow.resetAtMs).toISOString(),
    };
  }
  localWindow.count += 1;
  return {
    allowed: true,
    remaining: Math.max(0, LOCAL_HOURLY_LIMIT - localWindow.count),
    resetAt: new Date(localWindow.resetAtMs).toISOString(),
  };
}

export async function consumeExtractionQuota(): Promise<ExtractionQuota> {
  if (!isSupabaseConfigured()) {
    return consumeInMemoryQuota();
  }
  try {
    const supabase = await createSupabaseAuthClient();
    const { data, error } = await supabase.rpc('consume_extraction_quota');
    if (error) throw error;
    const row = Array.isArray(data) ? data[0] : null;
    if (
      !row ||
      typeof row.allowed !== 'boolean' ||
      typeof row.remaining !== 'number' ||
      typeof row.reset_at !== 'string' ||
      !Number.isFinite(Date.parse(row.reset_at))
    ) {
      throw new Error('Unexpected extraction quota response.');
    }
    return { allowed: row.allowed, remaining: row.remaining, resetAt: row.reset_at };
  } catch {
    throw new ExtractionRateLimitUnavailableError();
  }
}
