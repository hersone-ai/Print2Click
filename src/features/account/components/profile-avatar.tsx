'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FilePicker } from '@/components/ui/file-picker';
import { loadAvatar, removeAvatar, saveAvatar, validateAvatar } from '@/features/account/avatar-store';
import { profileInitials } from '@/features/account/domain';

export function ProfileAvatar({ userId, displayName }: { userId: string; displayName: string }) {
  const [src, setSrc] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const urlRef = useRef<string | null>(null);
  const changedRef = useRef(false);

  const showPhoto = useCallback((blob: Blob | null) => {
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    const next = blob ? URL.createObjectURL(blob) : null;
    urlRef.current = next;
    setSrc(next);
  }, []);

  useEffect(() => {
    let active = true;
    changedRef.current = false;
    showPhoto(null);
    loadAvatar(userId).then((blob) => { if (active && !changedRef.current) showPhoto(blob); }).catch(() => {
      if (active) setError('Your photo could not be loaded on this device.');
    });
    return () => {
      active = false;
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
      urlRef.current = null;
    };
  }, [userId, showPhoto]);

  async function upload(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setError(null);
    setStatus('');
    try {
      const invalid = await validateAvatar(file);
      if (invalid) { setError(invalid); return; }
      await saveAvatar(userId, file);
      changedRef.current = true;
      showPhoto(file);
      setStatus('Photo saved.');
    } catch { setError('Could not save your photo. Try again.'); }
    finally { setBusy(false); }
  }

  async function remove() {
    setBusy(true);
    setError(null);
    setStatus('');
    try {
      await removeAvatar(userId);
      changedRef.current = true;
      showPhoto(null);
      setStatus('Photo removed.');
    } catch { setError('Could not remove your photo. Try again.'); }
    finally { setBusy(false); }
  }

  return <div className="flex flex-col items-start gap-2">
    <div className="relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-brand text-3xl font-semibold text-background" role={src ? undefined : 'img'} aria-label={src ? undefined : `Profile initials ${profileInitials(displayName)}`}>
      {src ? <Image src={src} alt={`Profile photo for ${displayName}`} fill sizes="96px" unoptimized className="object-cover" /> : profileInitials(displayName)}
    </div>
    <FilePicker onFiles={(files) => void upload(files[0])} label={src ? 'Change photo' : 'Upload photo'} icon={<Camera size={15} aria-hidden="true" />} accept="image/jpeg,image/png,image/webp" multiple={false} disabled={busy} />
    {src && <Button variant="ghost" size="sm" onClick={() => void remove()} disabled={busy} className="px-0 text-xs">Remove photo</Button>}
    <p className="text-xs text-muted-foreground">Photo stays on this device.</p>
    {error && <p role="alert" className="text-xs text-danger">{error}</p>}
    {status && <p role="status" className="text-xs text-success">{status}</p>}
  </div>;
}
