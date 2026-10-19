import type { Category, Recipe } from './types';

export const CATEGORY_LABEL: Record<Category, string> = { doce: 'Doce', salgada: 'Salgada' };

export const messageOf = (e: unknown) => (e instanceof Error ? e.message : String(e));

const fold = (s: string) => s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();

export function matchesQuery(r: Recipe, query: string): boolean {
  const q = fold(query.trim());
  return !q || fold(r.title).includes(q) || r.ingredients.some((i) => fold(i).includes(q));
}

export const byTitle = (a: Recipe, b: Recipe) => a.title.localeCompare(b.title, 'pt-BR', { sensitivity: 'base' });

export const photoUrl = (name: string) => `recivo://foto/${name}`;

export function formatMinutes(m: number): string {
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const rest = m % 60;
  return rest ? `${h} h ${rest} min` : `${h} h`;
}

export const servingsLabel = (n: number) => `${n} ${n === 1 ? 'porção' : 'porções'}`;

/** One entry per non-empty line; strips pasted list markers ("- ", "1. ", "2) "). */
export const toLines = (text: string): string[] =>
  text
    .split(/\r?\n/)
    .map((l) => l.replace(/^\s*(?:[-*•]|\d+[.)])\s+/, '').trim())
    .filter(Boolean);

export const toInt = (s: string): number | null => {
  const n = Number.parseInt(s, 10);
  return Number.isFinite(n) && n > 0 ? n : null;
};

/** Downscales to at most `max` px on the long side and re-encodes as JPEG (also bakes in EXIF rotation). */
export async function resizeToJpeg(file: File, max = 1600): Promise<Uint8Array> {
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  const canvas = new OffscreenCanvas(w, h);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Não foi possível processar a imagem.');
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();
  const blob = await canvas.convertToBlob({ type: 'image/jpeg', quality: 0.86 });
  return new Uint8Array(await blob.arrayBuffer());
}
