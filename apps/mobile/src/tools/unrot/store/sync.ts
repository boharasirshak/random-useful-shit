// Unrot's own server calls: new cards without an app release, and related cards. (Likes, saves and taste sync
// through the shared engine like every tool's data.) Both are best effort: offline, nothing happens.
import { API, api } from '@/shared/api';
import { DATA_URL } from '@/shared/data';
import { catalogVersion, getCards, useCatalog } from '@/tools/unrot/data/catalog';
import type { Catalog } from '@/tools/unrot/lib/types';

export const UNROT_DATA = DATA_URL;

// The published cards (packages/unrot-content/upload.mjs puts cards.json on UploadThing). Fetched whole: it's a few
// hundred KB and has no version endpoint. Returns the catalog if it's newer than what we have, else null.
export async function fetchPublished(): Promise<Catalog | null> {
  if (!UNROT_DATA) return null;
  const r = await fetch(`${UNROT_DATA}/unrot-cards.json`, { cache: 'no-store' });
  if (!r.ok) throw new Error(`Download failed (${r.status})`);
  const catalog: Catalog = await r.json();
  if (!Array.isArray(catalog.cards) || !catalog.cards.length || catalog.version === catalogVersion()) return null;
  return catalog;
}

// On launch: if there are new published cards and you haven't said no to this version, offer them.
export async function offerPublished(ask: (count: number, kb: number) => Promise<boolean>) {
  const st = useCatalog.getState();
  if (!st.askOnLaunch) return;
  const fresh = await fetchPublished();
  if (!fresh || fresh.version === st.declined) return;
  const have = new Set(getCards().map(c => c.id));
  const added = fresh.cards.filter(c => !have.has(c.id)).length;
  if (await ask(added, Math.round(JSON.stringify(fresh).length / 1024))) st.set(fresh);
  else st.decline(fresh.version);
}

// Downloads the catalog from the server only when its version changed.
export async function refreshCatalog() {
  if (!API) return;
  const { version } = await api<{ version: string }>('/unrot/catalog/version', { auth: false });
  if (version === catalogVersion()) return;
  const catalog = await api<Catalog>('/unrot/catalog', { auth: false });
  if (Array.isArray(catalog.cards) && catalog.cards.length) useCatalog.getState().set(catalog);
}

// Cards about the same idea, by meaning rather than tags (the server's embeddings). Empty when offline.
export async function related(id: string): Promise<string[]> {
  if (!API) return [];
  try {
    return (await api<{ id: string; score: number }[]>(`/unrot/related/${id}?k=3`, { auth: false })).map(r => r.id);
  } catch {
    return [];
  }
}
