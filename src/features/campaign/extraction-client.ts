import type { ProductDraft } from '@/features/campaign/domain';

type ExtractionResponse = {
  draft: { products: ProductDraft[] };
  provider?: string;
  model?: string;
};

export async function requestExtraction(files: File[], merchantNote = ''): Promise<ExtractionResponse> {
  const form = new FormData();
  files.forEach((file) => form.append('files', file, file.name));
  if (merchantNote.trim()) form.append('merchantNote', merchantNote.trim());
  let response: Response;
  try {
    response = await fetch('/api/extract', { method: 'POST', body: form });
  } catch {
    throw new Error('Could not reach the extraction service. Check your connection and retry; your files are still selected.');
  }
  const contentType = response.headers.get('content-type') ?? '';
  if (!contentType.includes('application/json')) {
    if (response.redirected && new URL(response.url).pathname.startsWith('/login')) {
      throw new Error('Your session has expired. Sign in again, then retry extraction.');
    }
    const statusHint = response.status ? ` (HTTP ${response.status})` : '';
    throw new Error(`The deployed extraction route returned a web page${statusHint}, not JSON. Check that Vercel's Root Directory is source-code and that this deployment includes /api/extract. Your files are still selected.`);
  }
  let result: ExtractionResponse & { error?: string };
  try {
    result = await response.json() as ExtractionResponse & { error?: string };
  } catch {
    throw new Error('The extraction endpoint returned invalid JSON. Check the deployment and try again.');
  }
  if (!response.ok) throw new Error(typeof result.error === 'string' ? result.error : 'Extraction failed. Try again.');
  if (!result.draft || !Array.isArray(result.draft.products)) throw new Error('The extraction response was incomplete. Your files are still available to retry.');
  return result;
}
