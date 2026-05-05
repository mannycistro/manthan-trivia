// IndexedDB-backed storage for uploaded media (audio/video/image).
// Large data URLs would otherwise blow the localStorage quota and silently
// vanish on reload. We keep media bytes in IDB and store only a small
// reference string (e.g. "idb-media:<id>") inside the board JSON.

const DB_NAME = "jeopardy-media";
const STORE = "media";
const DB_VERSION = 1;

export const MEDIA_REF_PREFIX = "idb-media:";

let dbPromise: Promise<IDBDatabase> | null = null;

function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

export async function putMedia(id: string, dataUrl: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(dataUrl, id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getMedia(id: string): Promise<string | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).get(id);
    req.onsuccess = () => resolve((req.result as string) ?? null);
    req.onerror = () => reject(req.error);
  });
}

export async function deleteMedia(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export function isMediaRef(value: string | undefined): boolean {
  return !!value && value.startsWith(MEDIA_REF_PREFIX);
}

export function refToId(ref: string): string {
  return ref.slice(MEDIA_REF_PREFIX.length);
}

export function idToRef(id: string): string {
  return `${MEDIA_REF_PREFIX}${id}`;
}

let counter = 0;
export function newMediaId(): string {
  counter += 1;
  return `m-${Date.now().toString(36)}-${counter.toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}
