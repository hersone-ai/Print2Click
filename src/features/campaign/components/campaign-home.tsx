import { FileImage, ShieldCheck, Sparkles } from 'lucide-react';
import { CampaignComposer } from '@/features/campaign/components/campaign-composer';
import { Button } from '@/components/ui/button';
import type { SourceAsset } from '@/features/campaign/domain';

type Props = {
  draft: string; uploads: SourceAsset[]; sending: boolean; uploadNotice: string;
  onDraftChange: (value: string) => void; onSend: () => void;
  onFiles: (files: File[]) => void; onRemove: (id: string) => void;
  onLoadLocalDemo: () => void; showLocalDemo: boolean;
};

export function CampaignHome({ draft, uploads, sending, uploadNotice, onDraftChange, onSend, onFiles, onRemove, onLoadLocalDemo, showLocalDemo }: Props) {
  return <div className="scrollbar flex-1 overflow-y-auto px-5 pb-12 pt-10 md:px-8 md:pt-16">
    <div className="mx-auto w-full max-w-[680px]">
      <div className="mb-8">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary-soft px-3 py-1.5 text-xs font-medium text-primary-strong"><Sparkles size={14} /> From print to digital</div>
        <h1 className="text-[29px] font-semibold leading-tight tracking-[-.035em] text-foreground">Turn your brochure into a campaign</h1>
        <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">Add your brochure and, if you like, tell us what to focus on. We’ll prepare a draft for you to review.</p>
      </div>
      <CampaignComposer home draft={draft} uploads={uploads} onDraftChange={onDraftChange} onSend={onSend} onFiles={onFiles} onRemove={onRemove} disabled={sending} />
      {uploadNotice && <p role="status" className="mt-2 text-sm leading-5 text-danger">{uploadNotice}</p>}
      {showLocalDemo && <div className="mt-3 text-right"><Button type="button" onClick={onLoadLocalDemo} variant="ghost" size="sm" className="text-xs text-muted-foreground">Load synthetic local test data</Button></div>}
      <div className="mt-5 grid gap-3 rounded-xl border border-border bg-surface p-4 sm:grid-cols-3">
        <div className="flex items-start gap-2.5"><FileImage size={17} className="mt-0.5 shrink-0 text-primary"/><p className="text-xs leading-5 text-muted-foreground"><span className="font-medium text-foreground">1. Add</span><br/>PDF or image brochure</p></div>
        <div className="flex items-start gap-2.5"><Sparkles size={17} className="mt-0.5 shrink-0 text-primary"/><p className="text-xs leading-5 text-muted-foreground"><span className="font-medium text-foreground">2. Prepare</span><br/>We organize visible details</p></div>
        <div className="flex items-start gap-2.5"><ShieldCheck size={17} className="mt-0.5 shrink-0 text-primary"/><p className="text-xs leading-5 text-muted-foreground"><span className="font-medium text-foreground">3. Review</span><br/>Nothing goes live without you</p></div>
      </div>
      <p className="mt-4 text-center text-xs leading-5 text-subtle">Details stay unverified until you check them.</p>
    </div>
  </div>;
}
