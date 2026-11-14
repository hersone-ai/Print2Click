import { FileText, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProductDraftList } from '@/features/campaign/components/product-draft-list';
import { type ProductDraft, type SourceAsset, type WorkspaceMessage } from '@/features/campaign/domain';

export function CampaignConversation({ messages, uploads, sending, onRetry, onProductUpdate, onViewPreview }: { messages: WorkspaceMessage[]; uploads: SourceAsset[]; sending: boolean; onRetry: () => void; onProductUpdate: (messageId: string, index: number, patch: Partial<ProductDraft>) => void; onViewPreview: () => void }) {
  if (!messages.length) return <div className="flex flex-1 flex-col items-center justify-center px-5 pb-10 text-center"><div className="mb-5 flex h-11 w-11 items-center justify-center rounded-full bg-muted text-muted-foreground"><Sparkles size={20} /></div><h1 className="text-2xl font-semibold tracking-tight text-foreground">Where should we start?</h1><p className="mt-2 max-w-[420px] text-sm leading-6 text-subtle">Tell me what campaign you have in mind, or attach brochure pages and we’ll work through them together.</p></div>;

  const latestProducts = [...messages].reverse().find((message) => message.products !== undefined)?.products;
  const latestProductMessageId = [...messages].reverse().find((message) => message.products !== undefined)?.id;
  const allConfirmed = Boolean(latestProducts?.length && latestProducts.every((product) => product.reviewStatus === 'confirmed'));
  const genericReply = 'I can help shape the campaign. Share the brochure or tell me what you want to change, and I’ll keep any unverified details clearly marked for review.';
  const contextualReply = allConfirmed
    ? 'All items confirmed. Continue to the campaign preview.'
    : latestProducts?.length
      ? 'Review each item against the brochure and confirm it to continue.'
      : 'Add a brochure to start extraction.';

  return <div className="scrollbar flex-1 overflow-y-auto px-5 py-7 md:px-8"><div className="mx-auto max-w-[760px] space-y-6">
    {messages.map((message) => <div key={message.id} className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : ''}`}>
      {message.role === 'assistant' && <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground"><Sparkles size={14} /></span>}
      <div className={`max-w-[92%] rounded-2xl px-4 py-3 text-sm leading-6 ${message.role === 'user' ? 'bg-muted text-foreground' : 'text-foreground'}`}>
        {message.role === 'user' && message.files?.length ? <div className="mb-2 space-y-1">{message.files.map((name) => <div key={name} className="flex items-center gap-2 text-xs text-muted-foreground"><FileText size={13} />{name}</div>)}</div> : null}
        {message.state === 'processing' && <span className="mr-2 inline-block h-3 w-3 animate-spin rounded-full border-2 border-border border-t-primary align-[-2px]" aria-hidden="true" />}
        <span>{message.text === genericReply ? contextualReply : message.text}</span>
        {message.origin === 'local-demo' && <p className="mt-2 text-xs font-medium text-warning">Synthetic local test data · not extracted</p>}
        {message.products && message.id === latestProductMessageId && <ProductDraftList products={message.products} files={message.files ?? []} onProductUpdate={(index, patch) => onProductUpdate(message.id, index, patch)} onViewPreview={onViewPreview} />}
        {message.products && message.id !== latestProductMessageId && <p className="mt-2 text-xs text-subtle">Earlier extraction · the latest draft is below.</p>}
        {message.state === 'error' && uploads.some((upload) => !upload.processed) && <div className="mt-2"><Button onClick={onRetry} variant="outline" size="sm" disabled={sending}>Retry extraction</Button></div>}
      </div>
    </div>)}
  </div></div>;
}
