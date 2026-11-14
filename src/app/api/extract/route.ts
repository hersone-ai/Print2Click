import { NextResponse } from 'next/server';
import { createSupabaseAuthClient, isSupabaseConfigured, LOCAL_WORKSPACE_USER } from '@/server/providers/supabase-auth';
import { ExtractionRateLimitUnavailableError } from '@/server/providers/extraction-rate-limit';
import { ExtractionError, extractBrochure } from '@/server/services/extract-brochure';

export const runtime = 'nodejs';

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(req: Request) {
  let userId: string | undefined;
  if (!isSupabaseConfigured()) {
    userId = LOCAL_WORKSPACE_USER.id;
  } else {
    try {
      const supabase = await createSupabaseAuthClient();
      const { data } = await supabase.auth.getClaims();
      userId = data?.claims?.sub;
    } catch {
      return jsonError('Could not verify your sign-in. Please sign in again and retry extraction.', 503);
    }
  }
  if (!userId) return jsonError('Sign in to extract a brochure.', 401);

  const contentLength = Number(req.headers.get('content-length') ?? 0);
  if (contentLength > 32 * 1024 * 1024) return jsonError('Combined upload must be 30 MB or less.', 413);

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return jsonError('Could not read the uploaded files. Choose PDF, JPG or PNG files and try again.', 400);
  }

  const noteEntry = form.get('merchantNote');
  if (noteEntry != null && typeof noteEntry !== 'string') return jsonError('Campaign instructions must be plain text.', 400);
  const merchantNote = typeof noteEntry === 'string' ? noteEntry.trim() : '';
  if (merchantNote.length > 1000) return jsonError('Keep campaign instructions under 1,000 characters.', 400);

  const entries = form.getAll('files');
  const legacyFile = form.get('file');
  const rawFiles = entries.length ? entries : legacyFile instanceof File ? [legacyFile] : [];
  if (!rawFiles.length || rawFiles.some((entry) => !(entry instanceof File))) {
    return jsonError('Choose at least one PDF, JPG or PNG file.', 400);
  }

  try {
    const result = await extractBrochure(rawFiles as File[], merchantNote);
    return NextResponse.json({ ...result, status: 'unverified', fileCount: rawFiles.length });
  } catch (error) {
    if (error instanceof ExtractionError) {
      const response = jsonError(error.message, error.status);
      if (error.status === 429) response.headers.set('Retry-After', String(error.retryAfterSeconds ?? 3600));
      return response;
    }
    if (error instanceof ExtractionRateLimitUnavailableError) return jsonError(error.message, 503);
    if (error instanceof Error && error.message.includes('GEMINI_API_KEY')) {
      return jsonError(error.message, 503);
    }
    return jsonError('Extraction is unavailable. Check the Gemini configuration and try again.', 503);
  }
}
