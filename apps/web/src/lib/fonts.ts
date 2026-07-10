export interface FontAsset {
  key: string;
  url: string;
  name: string;
  family: string;
  format: string;
  size?: number;
  lastModified?: string | null;
}

const API = process.env.API_INTERNAL_URL ?? "http://localhost:4000";

// Custom uploaded fonts (Text component's "IBOX FONT" system) — public list,
// same trust tier/shape as getPublishedPageConfig in PageRenderer.tsx. Fonts
// change far less often than page content, so this gets a longer ISR window;
// StorageService.upload() still purges its own cache immediately on upload,
// this is purely the frontend layer on top.
export async function getPublishedFonts(): Promise<FontAsset[]> {
  try {
    const res = await fetch(`${API}/page-config/fonts`, { next: { revalidate: 300 } });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

// One @font-face rule per uploaded font — rendered once in the root layout's
// <head> so both the live site and the admin editor (which shares the same
// root layout) can reference `family` directly in a component's fontFamily.
export function fontFaceCss(fonts: FontAsset[]): string {
  return fonts
    .map((f) => `@font-face { font-family: "${f.family}"; src: url("${f.url}") format("${f.format}"); font-weight: normal; font-style: normal; font-display: swap; }`)
    .join("\n");
}
