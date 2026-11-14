import { extractionResponseSchema, type ValidatedExtraction } from '@/features/campaign/extraction-schema';
import { consumeExtractionQuota, ExtractionRateLimitUnavailableError } from '@/server/providers/extraction-rate-limit';
import { extractWithGoogleGemini, GeminiProviderError } from '@/server/providers/google-gemini';

const MiB = 1024 * 1024;
const MAX_FILES = 4;
const MAX_FILE_BYTES = 15 * MiB;
const MAX_TOTAL_BYTES = 30 * MiB;
const acceptedTypes = new Set(['application/pdf', 'image/jpeg', 'image/png']);

export class ExtractionError extends Error {
  constructor(message: string, public readonly status: number, public readonly retryAfterSeconds?: number) {
    super(message);
    this.name = 'ExtractionError';
  }
}

function hasExpectedSignature(bytes: Buffer, mimeType: string) {
  if (mimeType === 'application/pdf') return bytes.subarray(0, 5).toString('ascii') === '%PDF-';
  if (mimeType === 'image/jpeg') return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (mimeType === 'image/png') return bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  return false;
}

export async function extractBrochure(files: File[], merchantNote = ''): Promise<{ draft: ValidatedExtraction; provider: string; model: string }> {
  if (merchantNote.length > 1000) throw new ExtractionError('Keep campaign instructions under 1,000 characters.', 400);
  if (!files.length) throw new ExtractionError('Choose at least one PDF, JPG or PNG file.', 400);
  if (files.length > MAX_FILES) throw new ExtractionError(`Choose up to ${MAX_FILES} files at a time.`, 400);
  if (files.some((file) => file.size === 0)) throw new ExtractionError('One or more files are empty. Choose different files.', 400);
  if (files.some((file) => file.size > MAX_FILE_BYTES)) throw new ExtractionError('Each file must be 15 MB or less.', 413);
  if (files.reduce((total, file) => total + file.size, 0) > MAX_TOTAL_BYTES) throw new ExtractionError('Combined upload must be 30 MB or less.', 413);
  if (files.some((file) => !acceptedTypes.has(file.type))) throw new ExtractionError('Use PDF, JPG or PNG files.', 415);

  const documents = [];
  for (const [index, file] of files.entries()) {
    const bytes = Buffer.from(await file.arrayBuffer());
    if (!hasExpectedSignature(bytes, file.type)) throw new ExtractionError(`${file.name} does not match its file type. Choose a valid PDF, JPG or PNG.`, 415);
    documents.push({ mimeType: file.type, bytes, fileIndex: index + 1 });
  }

  try {
    const quota = await consumeExtractionQuota();
    if (!quota.allowed) {
      const retryAfterSeconds = Math.max(1, Math.ceil((Date.parse(quota.resetAt) - Date.now()) / 1000));
      throw new ExtractionError(`You have reached the extraction limit. Try again in about ${Math.ceil(retryAfterSeconds / 60)} minutes.`, 429, retryAfterSeconds);
    }
  } catch (error) {
    if (error instanceof ExtractionError || error instanceof ExtractionRateLimitUnavailableError) throw error;
    throw new ExtractionRateLimitUnavailableError();
  }

  let modelResponse;
  try {
    modelResponse = await extractWithGoogleGemini(documents, merchantNote);
  } catch (error) {
    if (error instanceof GeminiProviderError) throw new ExtractionError(error.message, 503);
    throw error;
  }
  let decoded: unknown;
  try {
    decoded = JSON.parse(modelResponse.text);
  } catch {
    throw new ExtractionError('The extraction result could not be read. Try again with a clearer scan.', 502);
  }
  const parsed = extractionResponseSchema.safeParse(decoded);
  if (!parsed.success || parsed.data.products.some((product) => product.source_file_index != null && product.source_file_index > files.length)) {
    throw new ExtractionError('The extraction result was incomplete. Try again with a clearer scan.', 502);
  }
  return { draft: parsed.data, provider: modelResponse.provider, model: modelResponse.model };
}
