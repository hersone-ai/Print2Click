import { z } from 'zod';
import { productDraftSchema } from '@/features/campaign/extraction-schema';
import type { CampaignDetails, PreviewTab, ProductDraft, WorkspaceMessage, WorkspaceView } from '@/features/campaign/domain';

const databaseName = 'brochure2campaign-print-data';
const storeName = 'workspaces';
const archiveStoreName = 'recent-drafts';
const draftProductSchema = productDraftSchema.extend({
  reviewStatus: z.enum(['unverified', 'confirmed']).optional(),
  originalValues: productDraftSchema.partial().optional(),
});
const messageSchema = z.object({
  id: z.string().max(120),
  role: z.enum(['assistant', 'user']),
  text: z.string().max(5000),
  files: z.array(z.string().max(255)).max(4).optional(),
  products: z.array(draftProductSchema).max(250).optional(),
  state: z.enum(['processing', 'error']).optional(),
  origin: z.enum(['extraction', 'local-demo']).optional(),
}).strict();
const detailsSchema = z.object({
  startsOn: z.string().max(20),
  endsOn: z.string().max(20),
  contactName: z.string().max(120),
  contactPhone: z.string().max(40),
}).strict();
const persistedWorkspaceSchema = z.object({
  userId: z.string().uuid(),
  uploads: z.array(z.object({ id: z.string().max(120), file: z.custom<File>((value) => typeof File !== 'undefined' && value instanceof File), processed: z.boolean().optional() }).strict()).max(4),
  messages: z.array(messageSchema).max(500),
  campaignDetails: detailsSchema,
  detailsSaved: z.boolean(),
  finalApproval: z.boolean(),
  demoPublished: z.boolean(),
  view: z.enum(['home', 'chat']),
  activeRecent: z.boolean(),
  previewTab: z.enum(['campaign', 'source']),
  activeUploadId: z.string().max(120).nullable(),
  draft: z.string().max(1000),
}).strict();

export type LocalWorkspaceSnapshot = {
  userId: string;
  uploads: Array<{ id: string; file: File; processed?: boolean }>;
  messages: WorkspaceMessage[];
  campaignDetails: CampaignDetails;
  detailsSaved: boolean;
  finalApproval: boolean;
  demoPublished: boolean;
  view: WorkspaceView;
  activeRecent: boolean;
  previewTab: PreviewTab;
  activeUploadId: string | null;
  draft: string;
};

function openDatabase() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('This browser does not support local print-data storage.'));
      return;
    }
    const request = indexedDB.open(databaseName, 2);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(storeName)) database.createObjectStore(storeName, { keyPath: 'userId' });
      if (!database.objectStoreNames.contains(archiveStoreName)) database.createObjectStore(archiveStoreName, { keyPath: 'id' });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Could not open local print-data storage.'));
    request.onblocked = () => reject(new Error('Local print-data storage is busy in another tab.'));
  });
}

export type RecentDraft = { id: string; title: string; savedAt: number };
type ArchivedDraft = RecentDraft & { userId: string; snapshot: LocalWorkspaceSnapshot };

function archiveTitle(snapshot: LocalWorkspaceSnapshot) {
  return snapshot.uploads[0]?.file.name || snapshot.messages.find((message) => message.role === 'user')?.text.slice(0, 48) || 'Campaign draft';
}

export async function listRecentDrafts(userId: string): Promise<RecentDraft[]> {
  const database = await openDatabase();
  try {
    const records = await new Promise<ArchivedDraft[]>((resolve, reject) => {
      const request = database.transaction(archiveStoreName, 'readonly').objectStore(archiveStoreName).getAll();
      request.onsuccess = () => resolve(request.result as ArchivedDraft[]);
      request.onerror = () => reject(request.error ?? new Error('Could not read recent drafts.'));
    });
    return records.filter((record) => record.userId === userId).sort((a, b) => b.savedAt - a.savedAt).map(({ id, title, savedAt }) => ({ id, title, savedAt }));
  } finally { database.close(); }
}

export async function archiveLocalWorkspace(snapshot: LocalWorkspaceSnapshot): Promise<RecentDraft> {
  const parsed = persistedWorkspaceSchema.safeParse(snapshot);
  if (!parsed.success) throw new Error('The current draft could not be saved.');
  const recent = { id: crypto.randomUUID(), title: archiveTitle(snapshot), savedAt: Date.now() };
  const database = await openDatabase();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(archiveStoreName, 'readwrite');
      transaction.objectStore(archiveStoreName).put({ ...recent, userId: snapshot.userId, snapshot: parsed.data });
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error ?? new Error('Could not save the current draft.'));
      transaction.onabort = () => reject(transaction.error ?? new Error('Saving the current draft was interrupted.'));
    });
    return recent;
  } finally { database.close(); }
}

export async function loadArchivedWorkspace(userId: string, id: string): Promise<LocalWorkspaceSnapshot> {
  const database = await openDatabase();
  try {
    const record = await new Promise<ArchivedDraft | undefined>((resolve, reject) => {
      const request = database.transaction(archiveStoreName, 'readonly').objectStore(archiveStoreName).get(id);
      request.onsuccess = () => resolve(request.result as ArchivedDraft | undefined);
      request.onerror = () => reject(request.error ?? new Error('Could not open the recent draft.'));
    });
    if (record?.userId !== userId) throw new Error('This draft is not available for this account.');
    const parsed = persistedWorkspaceSchema.safeParse(record.snapshot);
    if (!parsed.success || parsed.data.userId !== userId) throw new Error('The saved draft could not be read safely.');
    return parsed.data as LocalWorkspaceSnapshot;
  } finally { database.close(); }
}

export async function removeArchivedWorkspace(id: string): Promise<void> {
  const database = await openDatabase();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(archiveStoreName, 'readwrite');
      transaction.objectStore(archiveStoreName).delete(id);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error ?? new Error('Could not update recent drafts.'));
    });
  } finally { database.close(); }
}

export async function loadLocalWorkspace(userId: string): Promise<LocalWorkspaceSnapshot | null> {
  const database = await openDatabase();
  try {
    const record = await new Promise<unknown>((resolve, reject) => {
      const request = database.transaction(storeName, 'readonly').objectStore(storeName).get(userId);
      request.onsuccess = () => resolve(request.result ?? null);
      request.onerror = () => reject(request.error ?? new Error('Could not read the local print-data draft.'));
    });
    if (!record) return null;
    const parsed = persistedWorkspaceSchema.safeParse(record);
    if (!parsed.success || parsed.data.userId !== userId) throw new Error('The saved local print-data draft could not be read safely.');
    return parsed.data as LocalWorkspaceSnapshot;
  } finally {
    database.close();
  }
}

export async function saveLocalWorkspace(snapshot: LocalWorkspaceSnapshot): Promise<void> {
  const parsed = persistedWorkspaceSchema.safeParse(snapshot);
  if (!parsed.success) throw new Error('The local print-data draft contains invalid data and was not saved.');

  const database = await openDatabase();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(storeName, 'readwrite');
      transaction.objectStore(storeName).put(parsed.data);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error ?? new Error('Could not save the local print-data draft.'));
      transaction.onabort = () => reject(transaction.error ?? new Error('Local print-data save was interrupted.'));
    });
  } finally {
    database.close();
  }
}

export const localDemoProducts: ProductDraft[] = [
  { name: 'Sample item 1', uncertainties: ['Synthetic local test record; not extracted from a brochure.'] },
  { name: 'Sample item 2', uncertainties: ['Synthetic local test record; not extracted from a brochure.'] },
];
