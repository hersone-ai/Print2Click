'use client';

import type { ReactNode } from 'react';
import { Paperclip } from 'lucide-react';

export function FilePicker({ onFiles, label = 'Add files', accept = 'application/pdf,image/jpeg,image/png,.pdf,.jpg,.jpeg,.png', multiple = true, disabled = false, icon, className = '' }: {
  onFiles: (files: File[]) => void; label?: string; accept?: string; multiple?: boolean; disabled?: boolean; icon?: ReactNode; className?: string;
}) {
  return (
    <label className={`inline-flex min-h-8 items-center gap-2 rounded-control border border-border bg-surface px-3 text-xs font-medium text-foreground transition-colors focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-focus ${disabled ? 'cursor-not-allowed bg-disabled text-disabled-foreground' : 'cursor-pointer hover:bg-muted'} ${className}`}>
      {icon ?? <Paperclip size={15} aria-hidden="true" />}{label}
      <input
        type="file"
        multiple={multiple}
        accept={accept}
        disabled={disabled}
        className="sr-only"
        onChange={(event) => {
          onFiles(Array.from(event.currentTarget.files ?? []));
          event.currentTarget.value = '';
        }}
      />
    </label>
  );
}
