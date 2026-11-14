'use client';

import { BadgeCheck, ChevronRight, FileImage, FileText, ShieldAlert, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { MAX_FILES, formatBytes, type CampaignDetails, type PreviewTab, type ProductDraft, type SourceAsset } from '@/features/campaign/domain';

type Props = {
  uploads: SourceAsset[];
  activeId: string | null;
  products: ProductDraft[];
  campaignDetails: CampaignDetails;
  detailsSaved: boolean;
  finalApproval: boolean;
  demoPublished: boolean;
  activeTab: PreviewTab;
  mobileDrawer?: boolean;
  className?: string;
  onSelect: (id: string) => void;
  onRemove: (id: string) => void;
  onTabChange: (tab: PreviewTab) => void;
  onDetailsChange: (patch: Partial<CampaignDetails>) => void;
  onSaveDetails: () => void;
  onApprovalChange: (approved: boolean) => void;
  onDemoPublish: () => void;
  onCollapse?: () => void;
};

export function CampaignPreviewPanel({ uploads, activeId, products, campaignDetails, detailsSaved, finalApproval, demoPublished, activeTab, mobileDrawer = false, className = '', onSelect, onRemove, onTabChange, onDetailsChange, onSaveDetails, onApprovalChange, onDemoPublish, onCollapse }: Props) {
  const active = uploads.find((upload) => upload.id === activeId) ?? uploads[0];
  const confirmedProducts = products.filter((product) => product.reviewStatus === 'confirmed');
  const headingId = mobileDrawer ? 'campaign-preview-panel-mobile' : 'campaign-preview-panel';

  return <aside role={mobileDrawer ? 'dialog' : undefined} aria-modal={mobileDrawer || undefined} aria-labelledby={headingId} className={`flex min-h-0 flex-col border-l border-border bg-surface ${className}`}>
    <div className="flex items-start justify-between border-b border-border px-5 py-4">
      <div><h2 id={headingId} className="text-sm font-semibold text-foreground">Preview</h2></div>
      <div className="flex items-center gap-1.5"><Badge variant={demoPublished ? 'primary' : 'neutral'}>{demoPublished ? 'Demo only' : 'Draft'}</Badge>{onCollapse && <Button onClick={onCollapse} variant="ghost" size="icon" aria-label="Collapse right panel" aria-expanded="true"><ChevronRight size={17} /></Button>}</div>
    </div>
    <div role="tablist" aria-label="Preview panels" className="grid grid-cols-2 border-b border-border p-2">
      <Button role="tab" aria-selected={activeTab === 'campaign'} onClick={() => onTabChange('campaign')} variant={activeTab === 'campaign' ? 'secondary' : 'ghost'} size="sm">Shopper page</Button>
      <Button role="tab" aria-selected={activeTab === 'source'} onClick={() => onTabChange('source')} variant={activeTab === 'source' ? 'secondary' : 'ghost'} size="sm">Brochure {uploads.length ? `(${uploads.length})` : ''}</Button>
    </div>
    <div className="scrollbar min-h-0 flex-1 space-y-4 overflow-y-auto bg-muted p-4">
      {activeTab === 'campaign' ? <ShopperPagePreview products={confirmedProducts} reviewCount={products.length - confirmedProducts.length} details={campaignDetails} demoPublished={demoPublished} /> : <BrochurePreview uploads={uploads} active={active} onSelect={onSelect} onRemove={onRemove} />}
      {(uploads.length > 0 || products.length > 0) && <ReadinessCard
        uploads={uploads}
        productCount={products.length}
        confirmedCount={confirmedProducts.length}
        details={campaignDetails}
        detailsSaved={detailsSaved}
        finalApproval={finalApproval}
        demoPublished={demoPublished}
        onDetailsChange={onDetailsChange}
        onSaveDetails={onSaveDetails}
        onApprovalChange={onApprovalChange}
        onDemoPublish={onDemoPublish}
      />}
    </div>
  </aside>;
}

function ShopperPagePreview({ products, reviewCount, details, demoPublished }: { products: ProductDraft[]; reviewCount: number; details: CampaignDetails; demoPublished: boolean }) {
  return <Card className="mx-auto max-w-[330px] overflow-hidden rounded-3xl shadow-sm">
    <div className="flex items-center justify-between border-b border-border px-4 py-3"><span className="text-xs font-semibold text-muted-foreground">CAMPAIGN PREVIEW</span><Badge variant={demoPublished ? 'primary' : 'danger'}>{demoPublished ? 'Demo only' : 'Unpublished'}</Badge></div>
    <div className="border-b border-border bg-brand-soft px-5 py-6"><p className="text-xs font-medium text-brand">Your digital campaign</p><h3 className="mt-2 text-xl font-semibold leading-tight tracking-[-.025em] text-foreground">{products.length ? 'Offers from your brochure' : 'Your campaign preview'}</h3><p className="mt-2 text-xs leading-5 text-muted-foreground">{products.length ? 'Confirmed items appear here.' : reviewCount ? `${reviewCount} items need review.` : 'Add a brochure to get started.'}</p></div>
    <div className="p-3"><div className="mb-3"><h4 className="text-sm font-semibold text-foreground">Products</h4></div>
      {products.length ? <div className="space-y-2">{products.slice(0, 4).map((product, index) => <article key={`${product.name ?? 'item'}-${index}`} className="rounded-xl border border-border p-3"><p className="text-sm font-medium text-foreground">{product.name || product.brand || product.model || `Product ${index + 1}`}</p>{(product.brand || product.model || product.category) && <p className="mt-1 text-xs text-muted-foreground">{[product.brand, product.model, product.category].filter(Boolean).join(' · ')}</p>}{(product.price != null || product.mrp != null) && <p className="mt-2 text-sm text-foreground">{product.price != null ? `Price: ${product.price}` : ''}{product.price != null && product.mrp != null ? ' · ' : ''}{product.mrp != null ? `MRP: ${product.mrp}` : ''}</p>}{product.offer && <p className="mt-1 text-xs leading-5 text-muted-foreground">{product.offer}</p>}</article>)}</div> : <div className="rounded-xl border border-dashed border-border px-3 py-5 text-center"><p className="text-sm font-medium text-foreground">No confirmed items</p></div>}
      {details.startsOn && details.endsOn && <p className="mt-3 text-xs text-muted-foreground">{details.startsOn} — {details.endsOn}</p>}
      {details.contactName && details.contactPhone && <p className="mt-1 text-xs text-muted-foreground">{details.contactName} · {details.contactPhone}</p>}
    </div>
    <p className="border-t border-border px-4 py-3 text-xs leading-5 text-subtle">{demoPublished ? 'Local demo only · not public' : 'Preview only · verify all details before approval'}</p>
  </Card>;
}

function BrochurePreview({ uploads, active, onSelect, onRemove }: { uploads: SourceAsset[]; active?: SourceAsset; onSelect: (id: string) => void; onRemove: (id: string) => void }) {
  return <section aria-label="Brochure source preview">
    <div className="mb-2 flex items-center justify-between"><h3 className="text-xs font-semibold text-muted-foreground">Files</h3><span className="text-xs text-subtle">{uploads.length}/{MAX_FILES}</span></div>
    {active ? <>
      <div className="flex h-[260px] items-center justify-center overflow-hidden rounded-xl border border-border bg-surface">{active.file.type === 'application/pdf' ? <iframe title={`PDF preview: ${active.file.name}`} src={active.url} className="h-full w-full" /> : (
        // Blob URLs are created locally and revoked when their source file is removed.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={active.url} alt={`Preview of ${active.file.name}`} className="max-h-full max-w-full object-contain" />
      )}</div>
      <p className="mt-2 truncate text-xs font-medium text-foreground" title={active.file.name}>{active.file.name}</p>
      <ul className="mt-3 space-y-1.5">{uploads.map((upload) => <li key={upload.id} className={`flex items-center gap-2 rounded-lg border bg-surface px-2 py-2 ${active.id === upload.id ? 'border-primary/50' : 'border-border'}`}>
        <button onClick={() => onSelect(upload.id)} className="flex min-w-0 flex-1 items-center gap-2 text-left" aria-label={`Preview ${upload.file.name}`}>{upload.file.type === 'application/pdf' ? <FileText size={14} className="shrink-0 text-muted-foreground" /> : <FileImage size={14} className="shrink-0 text-muted-foreground" />}<span className="min-w-0 flex-1 truncate text-xs text-foreground">{upload.file.name}</span><span className="shrink-0 text-[10px] text-subtle">{formatBytes(upload.file.size)}</span></button>
        {upload.processed && <span className="shrink-0 text-[10px] text-subtle">Draft</span>}
        <Button onClick={() => onRemove(upload.id)} variant="ghost" size="icon" className="h-7 w-7" aria-label={`Remove ${upload.file.name}`}><X size={13} /></Button>
      </li>)}</ul>
    </> : <div className="flex h-[240px] flex-col items-center justify-center rounded-xl border border-dashed border-border bg-surface px-5 text-center"><FileText size={22} className="text-subtle" /><p className="mt-3 text-sm font-medium text-foreground">No source pages yet</p><p className="mt-1 text-xs leading-5 text-subtle">Choose or drop up to four PDF, JPG or PNG files.</p></div>}
  </section>;
}

function ReadinessCard({ uploads, productCount, confirmedCount, details, detailsSaved, finalApproval, demoPublished, onDetailsChange, onSaveDetails, onApprovalChange, onDemoPublish }: {
  uploads: SourceAsset[];
  productCount: number;
  confirmedCount: number;
  details: CampaignDetails;
  detailsSaved: boolean;
  finalApproval: boolean;
  demoPublished: boolean;
  onDetailsChange: (patch: Partial<CampaignDetails>) => void;
  onSaveDetails: () => void;
  onApprovalChange: (approved: boolean) => void;
  onDemoPublish: () => void;
}) {
  const allConfirmed = productCount > 0 && confirmedCount === productCount;
  const phoneValid = /^\+?[\d\s().-]{7,20}$/.test(details.contactPhone.trim());
  const datesValid = Boolean(details.startsOn && details.endsOn && details.endsOn > details.startsOn);
  const detailsValid = datesValid && Boolean(details.contactName.trim()) && phoneValid;
  const readiness = demoPublished ? 'Demo complete' : !allConfirmed ? 'Review items' : !detailsSaved ? 'Add details' : !finalApproval ? 'Final approval' : 'Ready for demo';

  return <Card className="p-3">
    <div className="flex items-center justify-between"><h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Readiness</h3><Badge variant={demoPublished ? 'primary' : allConfirmed ? 'outline' : 'danger'}>{readiness}</Badge></div>
    <ul className="mt-3 space-y-2 text-xs text-muted-foreground">
      <li className="flex items-start gap-2"><BadgeCheck size={14} className="mt-0.5 shrink-0 text-subtle" /><span>{uploads.length ? `${uploads.length} files added` : 'Add brochure files'}</span></li>
      <li className="flex items-start gap-2">{allConfirmed ? <BadgeCheck size={14} className="mt-0.5 shrink-0 text-primary" /> : <ShieldAlert size={14} className="mt-0.5 shrink-0 text-danger" />}<span>{productCount ? `${confirmedCount}/${productCount} items confirmed` : 'Product details to review'}</span></li>
    </ul>
    {allConfirmed && !detailsSaved && <div className="mt-3 space-y-2 border-t border-border pt-3">
      <h4 className="text-xs font-semibold text-foreground">Campaign dates & contact</h4>
      <label className="block space-y-1 text-xs text-muted-foreground">Start date<Input type="date" value={details.startsOn} onChange={(event) => onDetailsChange({ startsOn: event.target.value })} /></label>
      <label className="block space-y-1 text-xs text-muted-foreground">End date<Input type="date" min={details.startsOn || undefined} value={details.endsOn} onChange={(event) => onDetailsChange({ endsOn: event.target.value })} /></label>
      {details.startsOn && details.endsOn && !datesValid && <p className="text-xs text-danger">End date must be after start date.</p>}
      <label className="block space-y-1 text-xs text-muted-foreground">Contact name<Input value={details.contactName} onChange={(event) => onDetailsChange({ contactName: event.target.value })} /></label>
      <label className="block space-y-1 text-xs text-muted-foreground">Contact phone<Input type="tel" value={details.contactPhone} onChange={(event) => onDetailsChange({ contactPhone: event.target.value })} /></label>
      <Button size="sm" className="w-full" disabled={!detailsValid} onClick={onSaveDetails}>Save campaign details</Button>
    </div>}
    {detailsSaved && !demoPublished && <div className="mt-3 space-y-3 border-t border-border pt-3">
      <div className="flex items-center justify-between gap-2"><p className="text-xs text-muted-foreground">Dates and contact saved.</p><Button variant="ghost" size="sm" onClick={() => onDetailsChange({})}>Edit details</Button></div>
      <label className="flex items-start gap-2 text-xs leading-5 text-muted-foreground"><input type="checkbox" checked={finalApproval} onChange={(event) => onApprovalChange(event.target.checked)} className="mt-1 accent-primary" />I reviewed the brochure, products, offers, dates and contact.</label>
      {finalApproval && <Button size="sm" className="w-full" onClick={onDemoPublish}>Simulate campaign publish</Button>}
    </div>}
    {demoPublished && <p role="status" className="mt-3 border-t border-border pt-3 text-xs text-muted-foreground">Demo complete · local only · nothing is public</p>}
    {!allConfirmed && <p className="mt-3 border-t border-border pt-3 text-xs text-subtle">Confirm each item to continue.</p>}
  </Card>;
}
