'use client';

import { FileImage, FileText, Send, ArrowUp, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FilePicker } from '@/components/ui/file-picker';
import { Textarea } from '@/components/ui/textarea';
import { formatBytes, type SourceAsset } from '@/features/campaign/domain';

type Props = {
  home?: boolean;
  draft: string;
  uploads: SourceAsset[];
  disabled?: boolean;
  onDraftChange: (value: string) => void;
  onSend: () => void;
  onFiles: (files: File[]) => void;
  onRemove: (id: string) => void;
};

export function CampaignComposer({ home = false, draft, uploads, disabled, onDraftChange, onSend, onFiles, onRemove }: Props) {
  return (
    <div
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => { event.preventDefault(); onFiles(Array.from(event.dataTransfer.files)); }}
      className={`rounded-card border border-border bg-surface p-3 shadow-sm transition-colors focus-within:border-focus ${home ? 'p-4 sm:p-5' : ''}`}
    >
      {uploads.length > 0 && <div className="mb-2 flex flex-wrap gap-2" aria-label="Files ready to upload">
        {uploads.map(({ id, file }) => <span key={id} className="inline-flex max-w-full items-center gap-1.5 rounded-lg bg-muted px-2.5 py-1.5 text-xs text-muted-foreground">
          {file.type === 'application/pdf' ? <FileText size={13} /> : <FileImage size={13} />}
          <span className="max-w-[180px] truncate">{file.name}</span><span className="text-subtle">{formatBytes(file.size)}</span>
          <Button variant="ghost" size="icon" onClick={() => onRemove(id)} aria-label={`Remove ${file.name}`} className="h-6 w-6"><X size={13} /></Button>
        </span>)}
      </div>}
      <Textarea
        value={draft}
        onChange={(event) => onDraftChange(event.target.value)}
        onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); onSend(); } }}
        rows={home ? 2 : 1}
        placeholder={home ? 'Optional: “Focus on festive offers and keep product names as printed.”' : 'Add a note or ask for a change'}
        aria-label={home ? "Optional instructions for your campaign draft" : "Message the campaign assistant"}
        className="min-h-10 resize-none border-0 bg-transparent px-2 shadow-none focus-visible:ring-0"
      />
      <div className={`flex flex-wrap items-center justify-between gap-3 px-1 pt-2 ${home ? 'mt-2 border-t border-border' : ''}`}>
        <div className="flex flex-wrap items-center gap-2"><FilePicker onFiles={onFiles} label={home ? 'Add brochure' : 'Add files'} /><span className="text-xs text-subtle">PDF, JPG or PNG · up to 4 files</span></div>
        <Button variant="primary" size={home ? "md" : "icon"} onClick={onSend} disabled={disabled || (home ? uploads.length === 0 : !draft.trim() && uploads.length === 0)} aria-busy={disabled} aria-label={uploads.length ? 'Extract brochure' : home ? 'Add a brochure to create a campaign draft' : 'Send message'}>
          {disabled ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden="true" /> : home ? <>Create draft <ArrowUp size={16} /></> : <Send size={15} />}
        </Button>
      </div>
      <p className="sr-only" aria-live="polite">Drop PDF, JPG or PNG files here to add them to the draft.</p>
    </div>
  );
}
