// Unrot's own server calls: new cards without an app release, and related cards. (Likes, saves and taste sync
// through the shared engine like every tool's data.) Both are best effort: offline, nothing happens.
import { API, api } from '@/shared/api';
import { catalogVersion, useCatalog } from '@/tools/unrot/data/catalog';
import type { Catalog } from '@/tools/unrot/lib/types';

// Downloads the catalog only when its version changed.
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
