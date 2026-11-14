'use client';

import { ChevronLeft, PanelRight, X } from 'lucide-react';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CampaignComposer } from '@/features/campaign/components/campaign-composer';
import { CampaignConversation } from '@/features/campaign/components/campaign-conversation';
import { CampaignHome } from '@/features/campaign/components/campaign-home';
import { CampaignPreviewPanel } from '@/features/campaign/components/campaign-preview-panel';
import { useCampaignController } from '@/features/campaign/use-campaign-controller';

export function CampaignWorkspace({ userEmail, userId, signOutError = false }: { userEmail: string; userId: string; signOutError?: boolean }) {
  const workspace = useCampaignController(userId);

  return <main className="flex h-screen min-h-screen overflow-hidden bg-background text-foreground">
    <AppSidebar
      userEmail={userEmail}
      collapsed={workspace.leftCollapsed}
      mobileOpen={workspace.mobileMenuOpen}
      view={workspace.view}
      activeRecent={workspace.activeRecent}
      fileCount={workspace.uploads.length}
      productCount={workspace.previewProducts.length}
      currentTitle={workspace.uploads[0]?.file.name || workspace.messages.find((message) => message.role === 'user')?.text.slice(0, 48) || 'Campaign draft'}
      hasCurrentDraft={workspace.uploads.length > 0 || workspace.messages.length > 0 || Boolean(workspace.draft.trim())}
      recentDrafts={workspace.recentDrafts}
      changingDraft={workspace.changingDraft || workspace.sending || workspace.localSaveStatus === 'loading'}
      onCollapse={() => workspace.setLeftCollapsed(true)}
      onExpand={() => workspace.setLeftCollapsed(false)}
      onMobileClose={() => workspace.setMobileMenuOpen(false)}
      onMobileOpen={() => workspace.setMobileMenuOpen(true)}
      onHome={() => { workspace.setView('home'); workspace.setMobileMenuOpen(false); }}
      onNewChat={workspace.startNewChat}
      onOpenCampaign={workspace.openCampaignChat}
      onOpenRecent={(id) => void workspace.openRecentDraft(id)}
      onPanelOpen={workspace.openPanel}
    />

    <section className="flex min-h-0 min-w-0 flex-1 flex-col">
      {signOutError && <div role="alert" className="border-b border-danger/30 bg-danger-soft px-4 py-2 text-sm text-danger md:px-6">Sign out did not complete. Check your connection and try again.</div>}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-border px-4 md:px-6 xl:hidden">
        <span className="truncate text-sm text-muted-foreground">{workspace.view === 'chat' ? 'Campaign draft' : ''}</span>
        <Button onClick={() => workspace.openPanel('campaign')} variant="outline" size="sm" className="shrink-0"><PanelRight size={15} />Preview &amp; status{workspace.uploads.length > 0 && <Badge variant="primary">{workspace.uploads.length}</Badge>}</Button>
      </header>

      <div className="flex min-h-0 flex-1">
        <section className="flex min-h-0 min-w-0 flex-1 flex-col">
          <div role="status" aria-live="polite" className="border-b border-border px-4 py-1.5 text-right text-[11px] text-subtle md:px-8">
            {workspace.localSaveStatus === 'saved' ? 'Print data saved on this device' : workspace.localSaveStatus === 'saving' ? 'Saving print data locally…' : workspace.localSaveStatus === 'error' ? `Local save unavailable${workspace.localSaveError ? `: ${workspace.localSaveError}` : ''}` : 'Restoring local print data…'}
          </div>
          {workspace.view === 'home' ? <CampaignHome
            draft={workspace.draft}
            uploads={workspace.pendingUploads}
            sending={workspace.sending}
            uploadNotice={workspace.uploadNotice}
            onDraftChange={workspace.setDraft}
            onSend={() => void workspace.send()}
            onFiles={workspace.addFiles}
            onRemove={workspace.removeUpload}
            onLoadLocalDemo={workspace.loadLocalDemoData}
            showLocalDemo={process.env.NODE_ENV !== 'production'}
          /> : <>
            <CampaignConversation messages={workspace.messages} uploads={workspace.uploads} sending={workspace.sending} onRetry={() => void workspace.send('')} onProductUpdate={workspace.updateProduct} onViewPreview={workspace.openCampaignPreview} />
            <div className="w-full px-4 pb-4 pt-3 md:px-8"><div className="mx-auto max-w-[780px]">
              <CampaignComposer draft={workspace.draft} uploads={workspace.pendingUploads} disabled={workspace.sending} onDraftChange={workspace.setDraft} onSend={() => void workspace.send()} onFiles={workspace.addFiles} onRemove={workspace.removeUpload} />
              {workspace.uploadNotice && <p role="status" className="mt-2 text-xs text-danger">{workspace.uploadNotice}</p>}
            </div></div>
          </>}
        </section>

        {workspace.rightCollapsed ? <aside className="hidden w-12 shrink-0 flex-col items-center border-l border-border bg-surface pt-4 xl:flex"><Button onClick={() => workspace.setRightCollapsed(false)} variant="ghost" size="icon" aria-label="Expand right panel" aria-expanded="false" title="Expand campaign preview"><ChevronLeft size={17} /></Button></aside> : <CampaignPreviewPanel
          uploads={workspace.uploads}
          activeId={workspace.activeUploadId}
          products={workspace.previewProducts}
          campaignDetails={workspace.campaignDetails}
          detailsSaved={workspace.detailsSaved}
          finalApproval={workspace.finalApproval}
          demoPublished={workspace.demoPublished}
          activeTab={workspace.previewTab}
          onSelect={workspace.setActiveUploadId}
          onRemove={workspace.removeUpload}
          onTabChange={workspace.setPreviewTab}
          onDetailsChange={workspace.updateCampaignDetails}
          onSaveDetails={workspace.saveCampaignDetails}
          onApprovalChange={workspace.updateFinalApproval}
          onDemoPublish={workspace.simulatePublish}
          onCollapse={() => workspace.setRightCollapsed(true)}
          className="hidden w-[360px] shrink-0 xl:flex 2xl:w-[400px]"
        />}
      </div>
    </section>

    {workspace.mobilePanelOpen && <div className="fixed inset-0 z-40 xl:hidden">
      <button aria-label="Close preview and status panel" onClick={() => workspace.setMobilePanelOpen(false)} className="absolute inset-0 bg-foreground/25" />
      <CampaignPreviewPanel
        uploads={workspace.uploads}
        activeId={workspace.activeUploadId}
        products={workspace.previewProducts}
        campaignDetails={workspace.campaignDetails}
        detailsSaved={workspace.detailsSaved}
        finalApproval={workspace.finalApproval}
        demoPublished={workspace.demoPublished}
        activeTab={workspace.previewTab}
        onSelect={workspace.setActiveUploadId}
        onRemove={workspace.removeUpload}
        onTabChange={workspace.setPreviewTab}
        onDetailsChange={workspace.updateCampaignDetails}
        onSaveDetails={workspace.saveCampaignDetails}
        onApprovalChange={workspace.updateFinalApproval}
        onDemoPublish={workspace.simulatePublish}
        mobileDrawer
        className="absolute inset-y-0 right-0 w-[min(92vw,400px)] shadow-2xl"
      />
      <Button onClick={() => workspace.setMobilePanelOpen(false)} variant="outline" size="icon" aria-label="Close preview and status" className="absolute right-[min(92vw,400px)] top-3 rounded-full"><X size={16} /></Button>
    </div>}
  </main>;
}
