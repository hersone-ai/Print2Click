'use client';

import { useEffect, useRef, useState } from 'react';
import {
  acceptedFileTypes, createId, MAX_FILES, MAX_FILE_BYTES, MAX_TOTAL_BYTES,
  type CampaignDetails, type PreviewTab, type ProductDraft, type SourceAsset, type WorkspaceMessage, type WorkspaceView,
} from '@/features/campaign/domain';
import { requestExtraction } from '@/features/campaign/extraction-client';
import { archiveLocalWorkspace, listRecentDrafts, loadArchivedWorkspace, loadLocalWorkspace, localDemoProducts, removeArchivedWorkspace, saveLocalWorkspace, type LocalWorkspaceSnapshot, type RecentDraft } from '@/features/campaign/local-workspace-store';

export function useCampaignController(userId: string) {
  const [view, setView] = useState<WorkspaceView>('home');
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobilePanelOpen, setMobilePanelOpen] = useState(false);
  const [activeRecent, setActiveRecent] = useState(false);
  const [draft, setDraft] = useState('');
  const [uploads, setUploads] = useState<SourceAsset[]>([]);
  const uploadsRef = useRef<SourceAsset[]>([]);
  const [activeUploadId, setActiveUploadId] = useState<string | null>(null);
  const [previewTab, setPreviewTab] = useState<PreviewTab>('campaign');
  const [uploadNotice, setUploadNotice] = useState('');
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState<WorkspaceMessage[]>([]);
  const [campaignDetails, setCampaignDetails] = useState<CampaignDetails>({ startsOn: '', endsOn: '', contactName: '', contactPhone: '' });
  const [detailsSaved, setDetailsSaved] = useState(false);
  const [finalApproval, setFinalApproval] = useState(false);
  const [demoPublished, setDemoPublished] = useState(false);
  const [localReady, setLocalReady] = useState(false);
  const [localSaveStatus, setLocalSaveStatus] = useState<'loading' | 'saved' | 'saving' | 'error'>('loading');
  const [localSaveError, setLocalSaveError] = useState('');
  const [recentDrafts, setRecentDrafts] = useState<RecentDraft[]>([]);
  const [changingDraft, setChangingDraft] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void Promise.all([loadLocalWorkspace(userId), listRecentDrafts(userId)]).then(([snapshot, recent]) => {
      if (cancelled) return;
      setRecentDrafts(recent);
      if (snapshot) {
        const restoredUploads = snapshot.uploads.map(({ id, file, processed }) => ({ id, file, processed, url: URL.createObjectURL(file) }));
        updateUploads(restoredUploads);
        setMessages(snapshot.messages.map((message) => message.state === 'processing' ? { ...message, state: 'error', text: 'Extraction was interrupted. Your selected files are still available so you can retry.' } : message));
        setCampaignDetails(snapshot.campaignDetails);
        setDetailsSaved(snapshot.detailsSaved);
        setFinalApproval(snapshot.finalApproval);
        setDemoPublished(snapshot.demoPublished);
        setView(snapshot.view);
        setActiveRecent(snapshot.activeRecent);
        setPreviewTab(snapshot.previewTab);
        setActiveUploadId(snapshot.activeUploadId);
        setDraft(snapshot.draft);
      }
      setLocalReady(true);
      setLocalSaveStatus('saved');
    }).catch((error: unknown) => {
      if (cancelled) return;
      setLocalReady(true);
      setLocalSaveStatus('error');
      setLocalSaveError(error instanceof Error ? error.message : 'Local print data could not be restored.');
    });
    return () => { cancelled = true; };
  }, [userId]);

  useEffect(() => {
    if (!localReady || changingDraft) return;
    setLocalSaveStatus('saving');
    const timer = window.setTimeout(() => {
      void saveLocalWorkspace({
        userId,
        uploads: uploads.map(({ id, file, processed }) => ({ id, file, processed })),
        messages: messages.map((message) => message.state === 'processing' ? { ...message, state: 'error', text: 'Extraction was interrupted. Your selected files are still available so you can retry.' } : message),
        campaignDetails, detailsSaved, finalApproval, demoPublished, view, activeRecent,
        previewTab, activeUploadId, draft,
      }).then(() => { setLocalSaveStatus('saved'); setLocalSaveError(''); }).catch((error: unknown) => {
        setLocalSaveStatus('error');
        setLocalSaveError(error instanceof Error ? error.message : 'Local print data could not be saved.');
      });
    }, 400);
    return () => window.clearTimeout(timer);
  }, [userId, localReady, changingDraft, uploads, messages, campaignDetails, detailsSaved, finalApproval, demoPublished, view, activeRecent, previewTab, activeUploadId, draft]);

  useEffect(() => () => { uploadsRef.current.forEach(({ url }) => URL.revokeObjectURL(url)); }, []);
  useEffect(() => {
    if (!mobilePanelOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') setMobilePanelOpen(false); };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [mobilePanelOpen]);

  const latestExtraction = [...messages].reverse().find((message) => message.products !== undefined);
  const previewProducts = latestExtraction?.products ?? [];
  const previewSourceNames = latestExtraction?.files ?? [];
  const pendingUploads = uploads.filter((upload) => !upload.processed);

  function updateUploads(next: SourceAsset[]) {
    uploadsRef.current = next;
    setUploads(next);
  }

  function clearUploads() {
    uploadsRef.current.forEach(({ url }) => URL.revokeObjectURL(url));
    updateUploads([]);
    setActiveUploadId(null);
  }

  function currentSnapshot(): LocalWorkspaceSnapshot {
    return { userId, uploads: uploadsRef.current.map(({ id, file, processed }) => ({ id, file, processed })), messages, campaignDetails, detailsSaved, finalApproval, demoPublished, view, activeRecent, previewTab, activeUploadId, draft };
  }

  function hasCurrentDraft() {
    return uploadsRef.current.length > 0 || messages.length > 0 || draft.trim().length > 0;
  }

  function restoreSnapshot(snapshot: LocalWorkspaceSnapshot) {
    uploadsRef.current.forEach(({ url }) => URL.revokeObjectURL(url));
    const restoredUploads = snapshot.uploads.map(({ id, file, processed }) => ({ id, file, processed, url: URL.createObjectURL(file) }));
    updateUploads(restoredUploads);
    setMessages(snapshot.messages.map((message) => message.state === 'processing' ? { ...message, state: 'error', text: 'Extraction was interrupted. Your selected files are still available so you can retry.' } : message));
    setCampaignDetails(snapshot.campaignDetails);
    setDetailsSaved(snapshot.detailsSaved);
    setFinalApproval(snapshot.finalApproval);
    setDemoPublished(snapshot.demoPublished);
    setView(snapshot.view);
    setActiveRecent(snapshot.activeRecent);
    setPreviewTab(snapshot.previewTab);
    setActiveUploadId(snapshot.activeUploadId);
    setDraft(snapshot.draft);
  }

  function resetPublishFlow() {
    setCampaignDetails({ startsOn: '', endsOn: '', contactName: '', contactPhone: '' });
    setDetailsSaved(false);
    setFinalApproval(false);
    setDemoPublished(false);
  }

  function updateCampaignDetails(patch: Partial<CampaignDetails>) {
    setCampaignDetails((current) => ({ ...current, ...patch }));
    setDetailsSaved(false);
    setFinalApproval(false);
    setDemoPublished(false);
  }

  function removeUpload(id: string) {
    const removed = uploadsRef.current.find((upload) => upload.id === id);
    if (removed) URL.revokeObjectURL(removed.url);
    const next = uploadsRef.current.filter((upload) => upload.id !== id);
    updateUploads(next);
    if (activeUploadId === id) setActiveUploadId(next[0]?.id ?? null);
  }

  function addFiles(files: File[]) {
    if (!files.length) return;
    const next = [...uploadsRef.current];
    const initialCount = next.length;
    const problems: string[] = [];
    for (const file of files) {
      if (!acceptedFileTypes.has(file.type)) { problems.push(`${file.name}: choose a PDF, JPG or PNG.`); continue; }
      if (file.size > MAX_FILE_BYTES) { problems.push(`${file.name}: maximum size is 15 MB.`); continue; }
      if (next.some((item) => item.file.name === file.name && item.file.size === file.size && item.file.lastModified === file.lastModified)) continue;
      if (next.length >= MAX_FILES) { problems.push(`You can add up to ${MAX_FILES} files at a time.`); break; }
      if (next.reduce((total, item) => total + item.file.size, file.size) > MAX_TOTAL_BYTES) { problems.push('Combined file size must be 30 MB or less.'); continue; }
      next.push({ id: createId(), file, url: URL.createObjectURL(file) });
    }
    updateUploads(next);
    if (!activeUploadId && next.length) setActiveUploadId(next[0].id);
    setUploadNotice(problems.join(' '));
    if (next.length > initialCount) {
      resetPublishFlow();
      setPreviewTab('source');
    }
  }

  async function startNewChat() {
    if (!localReady || changingDraft || sending) return;
    setChangingDraft(true);
    try {
      if (hasCurrentDraft()) {
        const recent = await archiveLocalWorkspace(currentSnapshot());
        setRecentDrafts((current) => [recent, ...current]);
      }
    } catch (error) {
      setLocalSaveStatus('error');
      setLocalSaveError(error instanceof Error ? error.message : 'Could not save the current draft.');
      setChangingDraft(false);
      return;
    }
    setActiveRecent(false);
    setMessages([]);
    setDraft('');
    setUploadNotice('');
    clearUploads();
    resetPublishFlow();
    setView('chat');
    setMobileMenuOpen(false);
    setChangingDraft(false);
  }

  function openCampaignChat() {
    setActiveRecent(true);
    setView('chat');
    setMobileMenuOpen(false);
  }

  async function openRecentDraft(id: string) {
    if (!localReady || changingDraft || sending) return;
    setChangingDraft(true);
    try {
      const selected = await loadArchivedWorkspace(userId, id);
      if (hasCurrentDraft()) await archiveLocalWorkspace(currentSnapshot());
      restoreSnapshot({ ...selected, view: 'chat', activeRecent: true });
      await removeArchivedWorkspace(id);
      setRecentDrafts(await listRecentDrafts(userId));
      setMobileMenuOpen(false);
      setLocalSaveError('');
    } catch (error) {
      setLocalSaveStatus('error');
      setLocalSaveError(error instanceof Error ? error.message : 'Could not open the recent draft.');
    } finally { setChangingDraft(false); }
  }

  async function send(text = draft) {
    const content = text.trim();
    const selected = uploadsRef.current.filter((upload) => !upload.processed);
    if ((!content && !selected.length) || sending) return;
    const userMessage: WorkspaceMessage = { id: createId(), role: 'user', text: content, files: selected.map(({ file }) => file.name) };
    if (!selected.length) {
      const products = latestExtraction?.products ?? [];
      const allConfirmed = products.length > 0 && products.every((product) => product.reviewStatus === 'confirmed');
      const response = products.length === 0 && latestExtraction
        ? 'No items were extracted. Try a clearer scan or add another brochure page.'
        : allConfirmed
          ? 'All items confirmed. The campaign preview is ready.'
          : latestExtraction
            ? 'Review each item against the brochure and confirm it to continue.'
            : 'Add a brochure to start extraction.';
      setMessages([...messages, userMessage, { id: createId(), role: 'assistant', text: response }]);
      setDraft('');
      setView('chat');
      setMobileMenuOpen(false);
      if (allConfirmed) openCampaignPreview();
      return;
    }
    const replyId = createId();
    const reply: WorkspaceMessage = {
      id: replyId,
      role: 'assistant',
      text: 'Reading brochure…',
      files: selected.map(({ file }) => file.name),
      state: 'processing',
    };
    setMessages([...messages, userMessage, reply]);
    setDraft('');
    setView('chat');
    setMobileMenuOpen(false);
    setSending(true);
    try {
      const result = await requestExtraction(selected.map(({ file }) => file), content);
      const products: ProductDraft[] = Array.isArray(result.draft?.products) ? result.draft.products.map((product) => ({
        ...product,
        originalValues: { ...product },
        reviewStatus: 'unverified',
      })) : [];
      setMessages((current) => current.map((message) => message.id === replyId ? {
        ...message,
        text: `Draft ready · ${products.length} ${products.length === 1 ? 'item' : 'items'}. Review against the brochure.`,
        products,
        origin: 'extraction',
        state: undefined,
      } : message));
      setPreviewTab('campaign');
      const processedIds = new Set(selected.map(({ id }) => id));
      updateUploads(uploadsRef.current.map((upload) => processedIds.has(upload.id) ? { ...upload, processed: true } : upload));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Extraction failed. Try again.';
      setMessages((current) => current.map((item) => item.id === replyId ? { ...item, text: `${message} Your selected files are still available so you can retry.`, state: 'error' } : item));
    } finally {
      setSending(false);
    }
  }

  function updateProduct(messageId: string, index: number, patch: Partial<ProductDraft>) {
    resetPublishFlow();
    setMessages((current) => {
      const next = [...current];
      const messageIndex = next.findIndex((message) => message.id === messageId && message.products !== undefined);
      if (messageIndex < 0 || !next[messageIndex].products?.[index]) return current;
      const updatedProducts = next[messageIndex].products!.map((product, productIndex) => productIndex === index ? {
        ...product,
        ...patch,
        originalValues: product.originalValues ?? { ...product },
      } : product);
      const allConfirmed = updatedProducts.length > 0 && updatedProducts.every((product) => product.reviewStatus === 'confirmed');
      next[messageIndex] = {
        ...next[messageIndex],
        products: updatedProducts,
        text: allConfirmed ? `All ${updatedProducts.length} items confirmed. Continue to the campaign preview.` : `Draft ready · ${updatedProducts.length} ${updatedProducts.length === 1 ? 'item' : 'items'}. Review against the brochure.`,
      };
      return next;
    });
  }

  function openCampaignPreview() {
    setPreviewTab('campaign');
    setRightCollapsed(false);
    if (window.matchMedia('(max-width: 1279px)').matches) setMobilePanelOpen(true);
  }

  function openPanel(tab: PreviewTab) {
    setPreviewTab(tab);
    setRightCollapsed(false);
    setMobileMenuOpen(false);
    if (window.matchMedia('(max-width: 1279px)').matches) setMobilePanelOpen(true);
  }

  function saveCampaignDetails() {
    const products = [...messages].reverse().find((message) => message.products !== undefined)?.products ?? [];
    const allConfirmed = products.length > 0 && products.every((product) => product.reviewStatus === 'confirmed');
    const validDates = campaignDetails.startsOn && campaignDetails.endsOn && campaignDetails.endsOn > campaignDetails.startsOn;
    const validPhone = /^\+?[\d\s().-]{7,20}$/.test(campaignDetails.contactPhone.trim());
    if (allConfirmed && validDates && campaignDetails.contactName.trim() && validPhone) setDetailsSaved(true);
  }

  function updateFinalApproval(approved: boolean) {
    setFinalApproval(approved);
    if (!approved) setDemoPublished(false);
  }

  function simulatePublish() {
    const products = [...messages].reverse().find((message) => message.products !== undefined)?.products ?? [];
    const allConfirmed = products.length > 0 && products.every((product) => product.reviewStatus === 'confirmed');
    if (detailsSaved && finalApproval && allConfirmed) {
      setDemoPublished(true);
      setPreviewTab('campaign');
    }
  }

  function loadLocalDemoData() {
    if (process.env.NODE_ENV === 'production') return;
    clearUploads();
    resetPublishFlow();
    setMessages([
      { id: createId(), role: 'assistant', text: 'Synthetic local test data · not extracted from a brochure.', products: localDemoProducts.map((product) => ({ ...product, originalValues: { ...product }, reviewStatus: 'unverified' })), origin: 'local-demo' },
    ]);
    setView('chat');
    setActiveRecent(true);
    setPreviewTab('campaign');
  }

  return {
    view, setView, leftCollapsed, setLeftCollapsed, rightCollapsed, setRightCollapsed,
    mobileMenuOpen, setMobileMenuOpen, mobilePanelOpen, setMobilePanelOpen,
    activeRecent, draft, setDraft, uploads, pendingUploads, activeUploadId, setActiveUploadId,
    previewTab, setPreviewTab, uploadNotice, sending, messages, previewProducts, previewSourceNames,
    campaignDetails, detailsSaved, finalApproval, demoPublished,
    localSaveStatus, localSaveError, recentDrafts, changingDraft, loadLocalDemoData,
    addFiles, removeUpload, startNewChat, openCampaignChat, openRecentDraft, send, updateProduct, openCampaignPreview, openPanel,
    updateCampaignDetails, saveCampaignDetails, updateFinalApproval, simulatePublish,
  };
}
