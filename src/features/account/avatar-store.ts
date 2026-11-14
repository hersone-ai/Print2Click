const databaseName = 'brochure2campaign-account';
const storeName = 'avatars';

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('Photo storage is unavailable in this browser.'));
      return;
    }
    const request = indexedDB.open(databaseName, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(storeName)) request.result.createObjectStore(storeName);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(new Error('Could not open photo storage.'));
    request.onblocked = () => reject(new Error('Photo storage is busy in another tab.'));
  });
}

export async function loadAvatar(userId: string): Promise<Blob | null> {
  const database = await openDatabase();
  try {
    return await new Promise((resolve, reject) => {
      const request = database.transaction(storeName, 'readonly').objectStore(storeName).get(userId);
      request.onsuccess = () => resolve(request.result instanceof Blob ? request.result : null);
      request.onerror = () => reject(new Error('Could not load your photo.'));
    });
  } finally { database.close(); }
}

async function writeAvatar(userId: string, blob: Blob | null): Promise<void> {
  const database = await openDatabase();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(storeName, 'readwrite');
      if (blob) transaction.objectStore(storeName).put(blob, userId);
      else transaction.objectStore(storeName).delete(userId);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(new Error('Could not save your photo.'));
      transaction.onabort = () => reject(new Error('Saving your photo was interrupted.'));
    });
  } finally { database.close(); }
}

export function saveAvatar(userId: string, blob: Blob) { return writeAvatar(userId, blob); }
export function removeAvatar(userId: string) { return writeAvatar(userId, null); }

export async function validateAvatar(file: File): Promise<string | null> {
  if (file.size === 0 || file.size > 2 * 1024 * 1024) return 'Choose an image smaller than 2 MB.';
  const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  const jpeg = file.type === 'image/jpeg' && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  const png = file.type === 'image/png' && [137, 80, 78, 71, 13, 10, 26, 10].every((byte, index) => bytes[index] === byte);
  const webp = file.type === 'image/webp' && String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF' && String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP';
  if (!jpeg && !png && !webp) return 'Choose a JPG, PNG, or WebP image.';
  if (typeof createImageBitmap === 'function') {
    try {
      const image = await createImageBitmap(file);
      const tooLarge = image.width > 4096 || image.height > 4096;
      image.close();
      if (tooLarge) return 'Choose an image no larger than 4096 pixels per side.';
    } catch { return 'This image could not be opened. Choose another file.'; }
  }
  return null;
}
