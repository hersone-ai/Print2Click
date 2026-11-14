export const MAX_FILES = 4;
export const MAX_FILE_BYTES = 15 * 1024 * 1024;
export const MAX_TOTAL_BYTES = 30 * 1024 * 1024;

export const acceptedFileTypes = new Set(['application/pdf', 'image/jpeg', 'image/png']);

export type ProductDraft = {
  name?: string | null;
  brand?: string | null;
  model?: string | null;
  category?: string | null;
  price?: string | number | null;
  mrp?: string | number | null;
  offer?: string | null;
  source_file_index?: number | null;
  source_page?: number | string | null;
  source_text?: string | null;
  confidence?: number | null;
  uncertainties?: string[];
  reviewStatus?: 'unverified' | 'confirmed';
  originalValues?: Partial<ProductDraft>;
};

export type WorkspaceMessage = {
  id: string;
  role: 'assistant' | 'user';
  text: string;
  files?: string[];
  products?: ProductDraft[];
  state?: 'processing' | 'error';
  origin?: 'extraction' | 'local-demo';
};

export type SourceAsset = {
  id: string;
  file: File;
  url: string;
  processed?: boolean;
};

export type WorkspaceView = 'home' | 'chat';
export type PreviewTab = 'campaign' | 'source';

export type CampaignDetails = {
  startsOn: string;
  endsOn: string;
  contactName: string;
  contactPhone: string;
};

export function createId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function formatBytes(bytes: number) {
  return bytes >= 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}
