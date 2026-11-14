import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CheckCircle2 } from 'lucide-react';
import { type ProductDraft } from '@/features/campaign/domain';

export function ProductDraftList({ products, files, onProductUpdate, onViewPreview }: { products: ProductDraft[]; files: string[]; onProductUpdate: (index: number, patch: Partial<ProductDraft>) => void; onViewPreview: () => void }) {
  if (!products.length) return <p className="mt-3 rounded-lg bg-muted p-3 text-xs text-muted-foreground">No products found.</p>;
  const allConfirmed = products.every((product) => product.reviewStatus === 'confirmed');

  return <details id="draft-items" open className="mt-3 rounded-xl border border-border bg-surface">
    <summary className="cursor-pointer px-3 py-2.5 text-xs font-medium text-brand">Review {products.length} items</summary>
    <div className="max-h-[460px] space-y-2 overflow-y-auto border-t border-border p-2">
      {products.map((product, index) => {
        const sourceFile = typeof product.source_file_index === 'number' ? files[product.source_file_index - 1] : undefined;
        const title = product.name?.trim() || product.brand?.trim() || `Unnamed item ${index + 1}`;
        const edits = (['name', 'category', 'price', 'offer'] as const)
          .filter((field) => product.originalValues?.[field] !== product[field] && product.originalValues?.[field] != null)
          .map((field) => `${field}: ${product.originalValues?.[field]}`);
        return <article key={`${index}-${title}`} className="rounded-lg border border-border p-3">
          <div className="flex items-start justify-between gap-2"><h3 className="text-sm font-medium text-foreground">{title}</h3><Badge variant={product.reviewStatus === 'confirmed' ? 'primary' : 'danger'}>{product.reviewStatus === 'confirmed' ? 'Confirmed' : 'Unverified'}</Badge></div>
          {(product.brand || product.model) && <p className="mt-1 text-xs text-muted-foreground">{[product.brand, product.model].filter(Boolean).join(' · ')}</p>}
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <label className="space-y-1 text-xs text-muted-foreground">Product<Input aria-label={`Product name for item ${index + 1}`} value={product.name ?? ''} onChange={(event) => onProductUpdate(index, { name: event.target.value, reviewStatus: 'unverified' })} /></label>
            <label className="space-y-1 text-xs text-muted-foreground">Category<Input aria-label={`Category for item ${index + 1}`} value={product.category ?? ''} onChange={(event) => onProductUpdate(index, { category: event.target.value, reviewStatus: 'unverified' })} /></label>
            <label className="space-y-1 text-xs text-muted-foreground">Price<Input aria-label={`Price for item ${index + 1}`} value={product.price == null ? '' : String(product.price)} onChange={(event) => onProductUpdate(index, { price: event.target.value || null, reviewStatus: 'unverified' })} /></label>
            <label className="space-y-1 text-xs text-muted-foreground">Offer<Input aria-label={`Offer for item ${index + 1}`} value={product.offer ?? ''} onChange={(event) => onProductUpdate(index, { offer: event.target.value || null, reviewStatus: 'unverified' })} /></label>
          </div>
          <div className="mt-3 flex items-center justify-between gap-3">
            <p className="min-w-0 truncate text-[11px] text-subtle" title={sourceFile}>{sourceFile ?? 'Source unavailable'}{product.source_page ? ` · p.${product.source_page}` : ''}</p>
            <Button size="sm" variant={product.reviewStatus === 'confirmed' ? 'secondary' : 'primary'} onClick={() => onProductUpdate(index, { reviewStatus: product.reviewStatus === 'confirmed' ? 'unverified' : 'confirmed' })}>{product.reviewStatus === 'confirmed' ? 'Undo' : 'Confirm'}</Button>
          </div>
          {edits.length > 0 && <p className="mt-2 text-[11px] text-subtle">Extracted: {edits.join(' · ')}</p>}
          {product.source_text && <blockquote className="mt-1 border-l-2 border-border pl-2 text-xs leading-5 text-muted-foreground">{product.source_text}</blockquote>}
          {product.uncertainties?.length ? <p className="mt-1 text-xs text-danger">Check: {product.uncertainties.join('; ')}</p> : null}
        </article>;
      })}
    </div>
    {allConfirmed && <div role="status" className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-3 py-3">
      <p className="flex items-center gap-2 text-xs font-medium text-foreground"><CheckCircle2 size={16} className="text-primary" />All {products.length} items confirmed</p>
      <Button size="sm" onClick={onViewPreview}>View campaign preview</Button>
    </div>}
  </details>;
}
