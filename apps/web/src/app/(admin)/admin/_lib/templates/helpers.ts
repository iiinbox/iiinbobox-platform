import type { PageComponent } from "../../_components/PageEditor";

export interface TemplateZoneState { components: PageComponent[]; height: number }
export interface TemplateConfig {
  name: string;
  header: { desktop: TemplateZoneState; mobile: TemplateZoneState };
  template: { desktop: TemplateZoneState; mobile: TemplateZoneState };
  footer: { desktop: TemplateZoneState; mobile: TemplateZoneState };
}
export interface PageTemplate {
  id: string;
  pageTypeId: string;
  name: string;
  config: TemplateConfig;
}

export const DESKTOP_W = 1920;
export const MOBILE_W = 375;

// Templates only populate the `template` zone — header/footer are shared
// branding elements the user sets up separately (same reasoning a blank page
// starts with empty header/footer too). Keeps 39 templates' worth of content
// focused on what actually differentiates one layout from another.
const EMPTY_ZONE = (height: number): TemplateZoneState => ({ components: [], height });

export function buildTemplateConfig(
  name: string,
  desktop: { components: PageComponent[]; height: number },
  mobile: { components: PageComponent[]; height: number },
): TemplateConfig {
  return {
    name,
    header: { desktop: EMPTY_ZONE(200), mobile: EMPTY_ZONE(150) },
    template: { desktop, mobile },
    footer: { desktop: EMPTY_ZONE(300), mobile: EMPTY_ZONE(220) },
  };
}

// Stable-enough-for-authoring placeholder ids — regenerated with a real uid()
// the moment a template is actually applied to a page (see NewPageDialog),
// so collisions across templates are never a concern.
let counter = 0;
export function nid(): string {
  counter += 1;
  return `tpl${counter}`;
}

export function heading(x: number, y: number, w: number, h: number, content: string, patch: Partial<PageComponent> = {}): PageComponent {
  return {
    id: nid(), type: "text", x, y, width: w, height: h, content,
    fontSize: 40, fontWeight: 700, lineHeight: 1.2, fontColor: "#0f172a",
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
    textAlign: "left", opacity: 100, rotation: 0,
    ...patch,
  };
}

export function subheading(x: number, y: number, w: number, h: number, content: string, patch: Partial<PageComponent> = {}): PageComponent {
  return {
    id: nid(), type: "text", x, y, width: w, height: h, content,
    fontSize: 22, fontWeight: 600, lineHeight: 1.3, fontColor: "#334155",
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
    textAlign: "left", opacity: 100, rotation: 0,
    ...patch,
  };
}

export function body(x: number, y: number, w: number, h: number, content: string, patch: Partial<PageComponent> = {}): PageComponent {
  return {
    id: nid(), type: "text", x, y, width: w, height: h, content,
    fontSize: 16, fontWeight: 400, lineHeight: 1.5, fontColor: "#475569",
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
    textAlign: "left", opacity: 100, rotation: 0,
    ...patch,
  };
}

export function label(x: number, y: number, w: number, h: number, content: string, patch: Partial<PageComponent> = {}): PageComponent {
  return {
    id: nid(), type: "text", x, y, width: w, height: h, content,
    fontSize: 12, fontWeight: 600, lineHeight: 1.2, fontColor: "#64748b",
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
    textAlign: "left", textTransform: "uppercase", letterSpacing: 0.6,
    opacity: 100, rotation: 0,
    ...patch,
  };
}

// A "url" buttonAction targeting another page's canonical slug — the actual
// mechanism behind "pre-linked" templates (same as a human typing the same
// value into the editor's own Link to page field).
export function linkTo(pageTypeId: string): { type: "url"; value: string } {
  return { type: "url", value: `/${pageTypeId}` };
}

export function button(x: number, y: number, w: number, h: number, content: string, action: { type: "url" | "buy" | "search" | "custom"; value: string }, patch: Partial<PageComponent> = {}): PageComponent {
  return {
    id: nid(), type: "button", x, y, width: w, height: h, content,
    buttonStyle: "solid", bgColor: "#111827", fontColor: "#ffffff",
    hoverBgColor: "#1f2937", hoverFontColor: "#ffffff",
    borderRadius: 8, fontSize: 16, fontWeight: 600,
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
    buttonAction: action, opacity: 100, rotation: 0,
    ...patch,
  };
}

// Gray placeholder block standing in for a photo/banner the user will
// replace — a filled shape (not an empty `image` component) so it still
// reads as an intentional layout block on the live site before real images
// are added, not blank space (see PageRenderer.tsx: image components with no
// imageUrl render nothing live, only a placeholder in the editor).
export function photo(x: number, y: number, w: number, h: number, patch: Partial<PageComponent> = {}): PageComponent {
  return {
    id: nid(), type: "shape", x, y, width: w, height: h,
    shapeType: "rectangle", bgColor: "#e2e8f0", borderRadius: 8,
    opacity: 100, rotation: 0,
    ...patch,
  };
}

export function shape(x: number, y: number, w: number, h: number, patch: Partial<PageComponent> = {}): PageComponent {
  return {
    id: nid(), type: "shape", x, y, width: w, height: h,
    shapeType: "rectangle", bgColor: "#f8fafc", borderRadius: 0,
    opacity: 100, rotation: 0,
    ...patch,
  };
}

export function icon(x: number, y: number, w: number, h: number, iconName: string, patch: Partial<PageComponent> = {}): PageComponent {
  return {
    id: nid(), type: "icon", x, y, width: w, height: h, iconName,
    fontColor: "#111827", opacity: 100, rotation: 0,
    ...patch,
  };
}

export function heroCarousel(
  x: number, y: number, w: number, h: number,
  slides: { headline: string; subtext?: string; buttonLabel?: string; buttonLink?: string }[],
  patch: Partial<PageComponent> = {},
): PageComponent {
  return {
    id: nid(), type: "hero-carousel", x, y, width: w, height: h,
    heroSlides: slides.map((s) => ({ id: nid(), ...s })),
    heroAutoplay: true, heroAutoplaySeconds: 5, heroShowArrows: true, heroShowDots: true,
    heroPeekPercent: 6, heroOverlayOpacity: 35, opacity: 100, rotation: 0,
    ...patch,
  };
}

export function categoryCarousel(
  x: number, y: number, w: number, h: number,
  title: string,
  items: { name: string; descriptor?: string; link?: string }[],
  patch: Partial<PageComponent> = {},
): PageComponent {
  return {
    id: nid(), type: "category-carousel", x, y, width: w, height: h,
    catCarouselTitle: title,
    catCarouselItems: items.map((it) => ({ id: nid(), ...it })),
    catCarouselCardStyle: "image-first", catCarouselAspectRatio: "1:1", catCarouselCornerRadius: 12,
    catCarouselDesktopCards: 4, catCarouselGapDesktop: 16, catCarouselGapMobile: 12,
    opacity: 100, rotation: 0,
    ...patch,
  };
}
