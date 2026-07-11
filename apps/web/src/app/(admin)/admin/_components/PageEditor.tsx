"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Trash2, Image as ImageIcon, Images, Type, Check, Copy,
  Monitor, Smartphone, Eye, Pencil, RotateCcw, MousePointerClick, Move, ChevronDown, ChevronUp, Square,
  Group as GroupIcon, Ungroup as UngroupIcon, Link2,
  ChevronLeft, ChevronRight, Infinity as InfinityIcon, Timer,
  GalleryHorizontal, Tag, Component as ComponentIcon, GripVertical, Layers,
  BarChart3, Users, Activity, Cloud, Rocket, Palette, Radio, History, RotateCw,
  Lock, Unlock, EyeOff, AlignLeft, AlignCenter, AlignRight,
  AlignVerticalJustifyStart, AlignVerticalJustifyCenter, AlignVerticalJustifyEnd,
  AlignHorizontalDistributeCenter, AlignVerticalDistributeCenter,
  ArrowUpToLine, ArrowDownToLine, Undo2, Redo2, Minus, Plus, Maximize,
  FileText, X, LogOut,
  MapPin, Map as MapIcon, CalendarClock, CarFront, BadgeCheck, Receipt, Calendar, Clock, Navigation, Star,
  MoreVertical, GalleryHorizontalEnd, Paintbrush, ClipboardPaste, ClipboardCopy, Search, LayoutGrid,
  List, Settings,
  Folder as FolderIcon, FolderPlus,
} from "lucide-react";
import { HOME_ICONS, HOME_ICON_CATEGORIES, getHomeIcon } from "@/lib/homepage-icons";
import { usePagesList } from "../_lib/usePagesList";
import { useProjectsTree, type ProjectFolder } from "../_lib/useProjectsTree";
import { NewPageDialog } from "./NewPageDialog";
import { PreviewOverlay, type PreviewPageData } from "./PreviewOverlay";
import { extractZonesFromTemplate, buildTemplateZone, type Dock, type HeaderFooterBlock } from "@/lib/page-template-zones";

export type ComponentType = "text" | "header" | "shape" | "image" | "button" | "carousel" | "icon"
  | "location-input" | "map" | "datetime-picker" | "vehicle-selector" | "driver-badge" | "fare-display"
  | "hero-carousel" | "category-carousel" | "header-block" | "footer-block";
type CardStyle = "image-first" | "icon-text" | "split";
type CardAspectRatio = "1:1" | "3:4";
type SnapMode = "single" | "double";
type ViewMode = "desktop" | "mobile";
// The three fixed Layers-tab zones. Header/Footer are shared/global (same
// canvas mechanics as Template, stored under reserved page-config slugs);
// Template is this page's own unique content. Not to be confused with the
// unrelated PageComponent `type: "header"` (a heading/text component type).
type Zone = "header" | "template" | "footer";
// One header or footer block's metadata — mirrors lib/page-template-zones.ts's
// HeaderFooterBlock exactly (same fields), but with real PageComponent
// children (richer than the shared ZoneComponent shape) since this is what
// actually flows through addComponent/updateComp/etc. Multiple blocks of each
// kind can exist per page per viewport; ALL of them render simultaneously and
// are simultaneously interactive on the one canvas — there's no more "active"
// block concept.
interface BlockMeta {
  id: string;
  kind: "header" | "footer";
  dock: Dock;
  size: number;
  rotation: 0 | 90 | 180 | 270;
  bgColor: string;
  hideOnScrollUpPx: number | null;
  hideOnScrollDownPx: number | null;
  components: PageComponent[];
}
type ButtonStyle = "solid" | "outline" | "ghost" | "link";
type ButtonActionType = "url" | "buy" | "search" | "custom";
type TextStyle = "heading" | "subheading" | "body";
type TextEffect = "none" | "glow" | "outline" | "background" | "hollow" | "neon" | "glitch";
type ShapeType = "square" | "rectangle" | "circle" | "ellipse" | "triangle" | "diamond" | "hexagon" | "star";
// "t"/"b"/"l"/"r" are mid-edge handles (Text/Header only) — resize just one
// axis (width-only for l/r, height-only for t/b) by dragging the box border
// itself rather than a corner, matching a conventional text-box resize UX.
type ResizeCorner = "tl" | "tr" | "bl" | "br" | "t" | "b" | "l" | "r";
type ImageMode = "single" | "slideshow";
type ImageSizePreset = "square" | "portrait" | "landscape" | "wide";
type SyncStatus = "idle" | "dirty" | "syncing" | "synced" | "error";
type PropertySection = "layout" | "appearance" | "typography" | "responsive" | "effects" | "advanced";
interface UndoSnapshot { components: PageComponent[]; height: number }

export interface CarouselItem {
  id: string;
  imageUrl?: string;
  label?: string;
  link?: string;
}

interface CategoryOption {
  id: string;
  name: string;
  slug: string;
  imageUrl?: string | null;
}

export interface MapMarker { id: string; lat: number; lng: number; label?: string }
export interface VehicleOption { id: string; label: string; iconId?: string; fareText?: string }
type DateOption = "today" | "tomorrow" | "custom";
export interface HeroSlide {
  id: string;
  imageUrl?: string;
  headline?: string;
  subtext?: string;
  buttonLabel?: string;
  buttonLink?: string;
}
export interface CategoryCarouselItem {
  id: string;
  imageUrl?: string;
  name?: string;
  descriptor?: string;
  badge?: string;
  link?: string;
}

export interface PageComponent {
  id: string;
  type: ComponentType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  // header-block/footer-block only — see lib/page-template-zones.ts. `rotation`
  // above spins just the block's own outer bar; `children` render in a
  // counter-rotated inner wrapper so they stay upright regardless.
  children?: PageComponent[];
  hideOnScrollUpPx?: number | null;
  hideOnScrollDownPx?: number | null;
  content?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: number;
  lineHeight?: number;
  fontColor?: string;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  textAlign?: "left" | "center" | "right" | "justify";
  bold?: boolean;
  textStyle?: TextStyle;
  letterSpacing?: number;
  textTransform?: "none" | "uppercase" | "capitalize";
  listType?: "none" | "bullet" | "number";
  listIndent?: number;
  maxLines?: number;
  linkNewTab?: boolean;
  textEffect?: TextEffect;
  effectStrength?: number;
  bgColor?: string;
  borderRadius?: number;
  opacity?: number;
  // Shadow/blur — shape/image/button/icon/carousel only (text keeps its own textEffect system).
  shadowX?: number;
  shadowY?: number;
  shadowBlur?: number;
  shadowSpread?: number;
  shadowColor?: string;
  blurAmount?: number;
  shapeType?: ShapeType;
  imageUrl?: string;
  imageMode?: ImageMode;
  images?: string[];
  slideshowMax?: number;
  slideshowDuration?: number;
  buttonStyle?: ButtonStyle;
  borderColor?: string;
  hoverBgColor?: string;
  hoverFontColor?: string;
  buttonAction?: { type: ButtonActionType; value: string };
  name?: string;
  link?: string;
  groupId?: string;
  groupName?: string;
  groupLink?: string;
  carouselItems?: CarouselItem[];
  carouselItemWidth?: number;
  carouselZoom?: number;
  carouselStyle?: "zoom" | "row";
  carouselGap?: number;
  carouselItemBg?: string;
  iconName?: string;
  // Location Input (taxi/ride-hailing)
  locationPlaceholder?: string;
  locationLabel?: string;
  // Map — static/decorative pins + service-radius circle, not real-time
  // driver tracking (no such backend exists — see PageEditor plan notes).
  mapCenterLat?: number;
  mapCenterLng?: number;
  mapZoom?: number;
  mapMarkers?: MapMarker[];
  mapServiceRadiusKm?: number;
  // Date & Time Picker
  dtDefaultOption?: DateOption;
  dtCustomDate?: string;
  dtTime?: string;
  // Vehicle Selector
  vehicleOptions?: VehicleOption[];
  selectedVehicleId?: string;
  // Driver Rating Badge — static, admin-entered content, not a real driver assignment.
  driverName?: string;
  driverRating?: number;
  driverVehicle?: string;
  driverPhotoUrl?: string;
  // Fare Display — arithmetic on admin-entered numbers, not a real fare engine.
  fareCurrency?: string;
  fareBase?: number;
  fareDistanceKm?: number;
  fareRatePerKm?: number;
  fareSurgeMultiplier?: number;
  // Hero Carousel — full-width banner slides. Editor shows a static per-slide
  // preview (prev/next buttons work, but no autoplay/swipe-physics while
  // editing); the live page gets real swipe/drag + autoplay (see HeroCarousel.tsx).
  heroSlides?: HeroSlide[];
  heroAutoplay?: boolean;
  heroAutoplaySeconds?: number;
  heroShowArrows?: boolean;
  heroShowDots?: boolean;
  heroPeekPercent?: number;
  heroHeadlineColor?: string;
  heroSubtextColor?: string;
  heroOverlayOpacity?: number;
  heroCtaBgColor?: string;
  heroCtaFontColor?: string;
  // Category Carousel — separate from the existing Carousel component (never
  // shares code/fields with it). Snap-scrolling row of category cards with an
  // optional section header; no autoplay, unlike Hero Carousel.
  catCarouselItems?: CategoryCarouselItem[];
  catCarouselTitle?: string;
  catCarouselSubtitle?: string;
  catCarouselCardStyle?: CardStyle;
  catCarouselAspectRatio?: CardAspectRatio;
  catCarouselCornerRadius?: number;
  catCarouselShowDescriptor?: boolean;
  catCarouselShowBadge?: boolean;
  catCarouselSnapMode?: SnapMode;
  catCarouselDesktopCards?: number;
  catCarouselGapDesktop?: number;
  catCarouselGapMobile?: number;
  catCarouselTitleColor?: string;
  catCarouselSubtitleColor?: string;
  // Editor-only convenience toggles from the Layers panel — do not affect the
  // published page (there's no draft/live distinction in the data model; a
  // component still publishes normally while hidden/locked in the editor).
  hidden?: boolean;
  locked?: boolean;
  // Reusable Components library (opt-in, not automatic): set via the
  // right-click "Save as Reusable Component" action. reusableName is the
  // display name shown in the sidebar list — round-trips through save/load
  // like any other field, no special persistence path.
  reusable?: boolean;
  reusableName?: string;
  // Text Templates (Canva-style groups) — editor-only constraint, doesn't need
  // to be mirrored into the live page since by publish time the text already
  // has concrete font values baked in like any other text component. When
  // lockedTypography is set, the Text/Header properties panel hides font
  // size/weight/family/letter+line-spacing/bold-italic controls (content,
  // alignment, and color stay editable) — see renderTypographyFields.
  textToken?: TextToken;
  lockedTypography?: boolean;
}

// Mirrors ReusableComponentEntry on the backend
// (apps/api/src/modules/page-config/page-config.service.ts) — one entry per
// component flagged `reusable: true` anywhere in the project.
interface ReusableComponentEntry {
  id: string;
  sourcePage: string;
  zone: Zone;
  viewport: ViewMode;
  name: string;
  type: ComponentType;
  component: PageComponent;
}

interface VersionSnapshot {
  id: string;
  label: string;
  createdAt: string;
  desktop: { components: PageComponent[]; height: number };
  mobile: { components: PageComponent[]; height: number };
}

const DESKTOP_W = 1920;
const MOBILE_W = 375;
const DEFAULT_DESKTOP_H = 900;
const DEFAULT_MOBILE_H = 812;
// Header/Footer share Template's canvas width (DESKTOP_W/MOBILE_W) but start
// much shorter — just starting sizes, freely resizable like any other canvas.
const DEFAULT_HEADER_DESKTOP_H = 200;
const DEFAULT_HEADER_MOBILE_H = 150;
const DEFAULT_FOOTER_DESKTOP_H = 300;
const DEFAULT_FOOTER_MOBILE_H = 220;

function uid() { return Math.random().toString(36).slice(2); }

// Keep a component's box fully inside the canvas — shrink oversized boxes, then pin x/y to the
// nearest valid edge. Rotation happens around the box's own center and swings its corners out
// past the unrotated width/height, so a rotated box is clamped by its rotated bounding box
// (computed around that same center) instead of its raw width/height — otherwise a rotated
// text/shape can visually stick out past the canvas edge while its unrotated x/y still look "in bounds".
function clampToCanvas(x: number, y: number, width: number, height: number, canvasW: number, canvasH: number, rotation = 0) {
  const w = Math.min(Math.max(1, width), canvasW);
  const h = Math.min(Math.max(1, height), canvasH);

  if (!rotation) {
    return {
      width: w,
      height: h,
      x: Math.max(0, Math.min(canvasW - w, x)),
      y: Math.max(0, Math.min(canvasH - h, y)),
    };
  }

  const rad = (rotation * Math.PI) / 180;
  const cos = Math.abs(Math.cos(rad));
  const sin = Math.abs(Math.sin(rad));
  const boundW = Math.min(canvasW, w * cos + h * sin);
  const boundH = Math.min(canvasH, w * sin + h * cos);
  const centerX = Math.max(boundW / 2, Math.min(canvasW - boundW / 2, x + w / 2));
  const centerY = Math.max(boundH / 2, Math.min(canvasH - boundH / 2, y + h / 2));
  return { width: w, height: h, x: centerX - w / 2, y: centerY - h / 2 };
}

const FONT_FAMILIES = [
  { label: "Default", value: "system-ui, -apple-system, sans-serif" },
  ...[
    "Inter", "Roboto", "Open Sans", "Lato", "Montserrat", "Poppins", "Raleway", "Nunito", "Work Sans", "Source Sans 3",
    "DM Sans", "Manrope", "Urbanist", "Plus Jakarta Sans", "Outfit", "Sora", "Space Grotesk", "Lexend", "Cabin", "Karla",
    "Rubik", "Mulish", "Barlow", "Heebo", "Hind", "Figtree", "Public Sans", "Archivo", "Assistant", "Anek Latin",
    "IBM Plex Sans", "Noto Sans", "Red Hat Display", "Red Hat Text", "Titillium Web", "Exo 2", "Questrial", "Signika",
    "Ubuntu", "Maven Pro", "Quicksand", "Josefin Sans", "Jost", "Prompt", "Overpass", "Asap", "Catamaran", "Chivo",
    "Varela Round", "M PLUS Rounded 1c", "Comfortaa", "Sen", "Readex Pro", "Albert Sans", "Onest", "Geist", "Aptos",
    "Avenir Next", "Avenir", "Helvetica Neue", "Helvetica", "Arial", "Verdana", "Tahoma", "Trebuchet MS", "Gill Sans",
    "Futura", "Century Gothic", "Franklin Gothic Medium", "Segoe UI", "SF Pro Display", "SF Pro Text", "Arial Nova",
    "Neue Haas Grotesk Text", "Proxima Nova", "Circular Std", "Graphik", "Maison Neue", "Aktiv Grotesk", "Satoshi",
    "Switzer", "General Sans", "Clash Display", "Bricolage Grotesque", "Bebas Neue", "Oswald", "Anton", "Archivo Black",
    "League Spartan", "Teko", "Rajdhani", "Orbitron", "Audiowide", "Michroma", "Russo One", "Syncopate", "Cinzel",
    "Playfair Display", "Cormorant Garamond", "Libre Baskerville", "Merriweather", "Lora", "Source Serif 4", "Georgia",
    "Times New Roman", "Palatino", "Bodoni 72", "Didot", "Courier New", "JetBrains Mono", "Fira Code", "IBM Plex Mono",
    "Roboto Mono", "Space Mono", "Source Code Pro", "Menlo", "Monaco", "Consolas",
  ].map((font) => ({ label: font, value: `'${font}', system-ui, -apple-system, sans-serif` })),
];

const BUTTON_ACTIONS: { label: string; value: ButtonActionType }[] = [
  { label: "Link to URL", value: "url" },
  { label: "Buy (product slug)", value: "buy" },
  { label: "Search query", value: "search" },
  { label: "Custom", value: "custom" },
];

const SHAPES: { type: ShapeType; label: string }[] = [
  { type: "square", label: "Square" },
  { type: "rectangle", label: "Rectangle" },
  { type: "circle", label: "Circle" },
  { type: "ellipse", label: "Ellipse" },
  { type: "triangle", label: "Triangle" },
  { type: "diamond", label: "Diamond" },
  { type: "hexagon", label: "Hexagon" },
  { type: "star", label: "Star" },
];

// ── Typography tokens ─────────────────────────────────────────────────────
// Single source of truth for all text sizing in the editor: 12 tokens, each
// baking in fontFamily/fontSize/fontWeight/lineHeight/letterSpacing/
// textTransform. Sizes sit on a 1.25 ratio scale off a 16px body base
// (12/14/16/20/25/31); heading-xl is rounded to 40 (from a strict 39) to land
// on a clean number, matching the spec's own 40/32 desktop/mobile example.
// Every token also carries an explicit mobile variant (not a blanket scale
// factor) — headings shrink ~0.8-0.9x on mobile, body/label/caption/legal
// stay constant since shrinking already-small text hurts legibility.
type TextToken =
  | "heading-xl" | "heading-l" | "heading-m" | "heading-s"
  | "body-l" | "body-m" | "body-s"
  | "button-l" | "button-m"
  | "label" | "caption" | "legal";
interface TextTokenSpec {
  fontFamily: string;
  fontSizeDesktop: number;
  fontSizeMobile: number;
  fontWeight: number;
  lineHeight: number;
  letterSpacing: number;
  textTransform: "none" | "uppercase";
}
const TOKEN_FONT_FAMILY = "'Inter', system-ui, -apple-system, sans-serif";
const TEXT_TOKENS: Record<TextToken, TextTokenSpec> = {
  "heading-xl": { fontFamily: TOKEN_FONT_FAMILY, fontSizeDesktop: 40, fontSizeMobile: 32, fontWeight: 700, lineHeight: 1.2,  letterSpacing: -0.8,  textTransform: "none" },
  "heading-l":  { fontFamily: TOKEN_FONT_FAMILY, fontSizeDesktop: 31, fontSizeMobile: 26, fontWeight: 700, lineHeight: 1.2,  letterSpacing: -0.6,  textTransform: "none" },
  "heading-m":  { fontFamily: TOKEN_FONT_FAMILY, fontSizeDesktop: 25, fontSizeMobile: 21, fontWeight: 700, lineHeight: 1.25, letterSpacing: -0.25, textTransform: "none" },
  "heading-s":  { fontFamily: TOKEN_FONT_FAMILY, fontSizeDesktop: 20, fontSizeMobile: 18, fontWeight: 700, lineHeight: 1.3,  letterSpacing: 0,     textTransform: "none" },
  "body-l":     { fontFamily: TOKEN_FONT_FAMILY, fontSizeDesktop: 20, fontSizeMobile: 18, fontWeight: 400, lineHeight: 1.5,  letterSpacing: 0,     textTransform: "none" },
  "body-m":     { fontFamily: TOKEN_FONT_FAMILY, fontSizeDesktop: 16, fontSizeMobile: 16, fontWeight: 400, lineHeight: 1.5,  letterSpacing: 0,     textTransform: "none" },
  "body-s":     { fontFamily: TOKEN_FONT_FAMILY, fontSizeDesktop: 14, fontSizeMobile: 14, fontWeight: 400, lineHeight: 1.5,  letterSpacing: 0,     textTransform: "none" },
  "button-l":   { fontFamily: TOKEN_FONT_FAMILY, fontSizeDesktop: 20, fontSizeMobile: 18, fontWeight: 600, lineHeight: 1.2,  letterSpacing: 0,     textTransform: "none" },
  "button-m":   { fontFamily: TOKEN_FONT_FAMILY, fontSizeDesktop: 16, fontSizeMobile: 16, fontWeight: 600, lineHeight: 1.2,  letterSpacing: 0,     textTransform: "none" },
  label:        { fontFamily: TOKEN_FONT_FAMILY, fontSizeDesktop: 12, fontSizeMobile: 12, fontWeight: 600, lineHeight: 1.2,  letterSpacing: 0.24,  textTransform: "uppercase" },
  caption:      { fontFamily: TOKEN_FONT_FAMILY, fontSizeDesktop: 12, fontSizeMobile: 12, fontWeight: 500, lineHeight: 1.4,  letterSpacing: 0.2,   textTransform: "none" },
  legal:        { fontFamily: TOKEN_FONT_FAMILY, fontSizeDesktop: 12, fontSizeMobile: 12, fontWeight: 400, lineHeight: 1.4,  letterSpacing: 0,     textTransform: "none" },
};
const TEXT_TOKEN_ORDER: TextToken[] = [
  "heading-xl", "heading-l", "heading-m", "heading-s",
  "body-l", "body-m", "body-s",
  "button-l", "button-m",
  "label", "caption", "legal",
];
const TEXT_TOKEN_LABELS: Record<TextToken, string> = {
  "heading-xl": "Heading 1", "heading-l": "Heading 2", "heading-m": "Heading 3", "heading-s": "Heading 4",
  "body-l": "Body L", "body-m": "Body M", "body-s": "Body S",
  "button-l": "Button L", "button-m": "Button M",
  label: "Label", caption: "Caption", legal: "Legal",
};
function tokenFontSize(token: TextToken, canvasW: number): number {
  const spec = TEXT_TOKENS[token];
  return canvasW <= MOBILE_W ? spec.fontSizeMobile : spec.fontSizeDesktop;
}

// Migration for pre-token saved pages (item 7): existing text/header components
// have concrete fontSize/fontWeight but no textToken. Rather than mutating
// stored data on load — which would risk a visual diff on someone else's saved
// page — the nearest token is computed on demand purely for the Style
// dropdown's displayed value. Actual rendering always reads the component's
// own concrete fontSize/fontWeight/etc (never overwritten here), so this can
// never change how an existing page looks; it only makes the dropdown show a
// sensible pre-selection until the user actively picks a style.
function nearestTextToken(comp: PageComponent): TextToken {
  const size = comp.fontSize ?? 16;
  const isBold = (comp.fontWeight ?? (comp.bold ? 700 : 400)) >= 700;
  const pool = TEXT_TOKEN_ORDER.filter((t) => (t.startsWith("heading") ? isBold : !t.startsWith("heading")));
  const candidates = pool.length ? pool : TEXT_TOKEN_ORDER;
  return candidates.reduce((best, t) =>
    Math.abs(TEXT_TOKENS[t].fontSizeDesktop - size) < Math.abs(TEXT_TOKENS[best].fontSizeDesktop - size) ? t : best,
    candidates[0]);
}
function effectiveTextToken(comp: PageComponent): TextToken {
  return comp.textToken ?? nearestTextToken(comp);
}


function textDecorationLine(comp: PageComponent): string {
  const parts: string[] = [];
  if (comp.underline) parts.push("underline");
  if (comp.strikethrough) parts.push("line-through");
  return parts.length ? parts.join(" ") : "none";
}

// Shared list/plain-text body renderer for Text/Header components (item 1's
// bulleted/numbered lists + item 2's max-lines truncation) — used by both the
// main canvas and PreviewCanvas render passes below (the live (home)/page.tsx
// keeps its own mirrored copy, per this file's established convention of
// duplicating render logic rather than sharing it across the editor/live
// boundary).
function renderTextBody(comp: PageComponent) {
  if (comp.listType === "bullet" || comp.listType === "number") {
    const items = (comp.content ?? "").split("\n").filter((l) => l.trim().length > 0);
    const style: React.CSSProperties = { margin: 0, paddingLeft: 20 + (comp.listIndent ?? 0) * 16, ...textEffectStyle(comp) };
    return comp.listType === "number"
      ? <ol style={style}>{items.map((line, i) => <li key={i}>{line}</li>)}</ol>
      : <ul style={style}>{items.map((line, i) => <li key={i}>{line}</li>)}</ul>;
  }
  const clamp = comp.maxLines && comp.maxLines > 0;
  // The outer flex container positions the span via justifyContent (not real
  // text-align, since the span is inline/shrink-to-fit) — that trick can't
  // produce a "justify" look, so justify needs the span to actually be a
  // full-width block with its own text-align instead.
  return (
    <span style={{
      whiteSpace: "pre-wrap", wordBreak: "break-word",
      ...(comp.textAlign === "justify" ? { display: "block", width: "100%", textAlign: "justify" as const } : {}),
      ...(clamp ? { display: "-webkit-box", WebkitLineClamp: comp.maxLines, WebkitBoxOrient: "vertical" as const, overflow: "hidden" } : {}),
      ...textEffectStyle(comp),
    }}>
      {comp.content}
    </span>
  );
}

interface ButtonPreset { id: string; label: string; patch: Partial<PageComponent> }

const BUTTON_PRESETS: ButtonPreset[] = [
  { id: "add-to-cart", label: "Add to Cart", patch: { content: "Add to Cart", buttonStyle: "solid",  bgColor: "#111827", fontColor: "#ffffff", hoverBgColor: "#1f2937", hoverFontColor: "#ffffff", borderRadius: 8,   fontWeight: 600 } },
  { id: "buy-now",     label: "Buy Now",     patch: { content: "Buy Now",     buttonStyle: "solid",  bgColor: "#16a34a", fontColor: "#ffffff", hoverBgColor: "#15803d", hoverFontColor: "#ffffff", borderRadius: 999, fontWeight: 700 } },
  { id: "sign-in",     label: "Sign In",     patch: { content: "Sign In",     buttonStyle: "outline", bgColor: "#111827", borderColor: "#111827", fontColor: "#111827", hoverBgColor: "#111827", hoverFontColor: "#ffffff", borderRadius: 6, fontWeight: 500 } },
  { id: "subscribe",   label: "Subscribe",   patch: { content: "Subscribe",   buttonStyle: "solid",  bgColor: "#4f46e5", fontColor: "#ffffff", hoverBgColor: "#4338ca", hoverFontColor: "#ffffff", borderRadius: 8,   fontWeight: 600 } },
  { id: "learn-more",  label: "Learn More",  patch: { content: "Learn More",  buttonStyle: "ghost",  bgColor: "#111827", fontColor: "#111827", hoverBgColor: "#f3f4f6", hoverFontColor: "#111827", borderRadius: 6,   fontWeight: 500 } },
  { id: "contact-us",  label: "Contact Us",  patch: { content: "Contact Us",  buttonStyle: "link",   fontColor: "#2563eb", hoverFontColor: "#1d4ed8", borderRadius: 0, fontWeight: 600 } },
  { id: "book-now",    label: "Book Now",    patch: { content: "Book Now",    buttonStyle: "solid",  bgColor: "#eab308", fontColor: "#111827", hoverBgColor: "#ca8a04", hoverFontColor: "#111827", borderRadius: 999, fontWeight: 700 } },
  { id: "request-ride", label: "Request Ride", patch: { content: "Request Ride", buttonStyle: "solid", bgColor: "#111827", fontColor: "#ffffff", hoverBgColor: "#000000", hoverFontColor: "#ffffff", borderRadius: 8, fontWeight: 700 } },
];

const IMAGE_SIZES: { id: ImageSizePreset; label: string; ratio: number }[] = [
  { id: "square",    label: "Square",    ratio: 1 },
  { id: "portrait",  label: "Portrait",  ratio: 4 / 5 },
  { id: "landscape", label: "Landscape", ratio: 16 / 9 },
  { id: "wide",      label: "Wide",      ratio: 21 / 9 },
];

// Quick Style Copy/Paste: an allowlist (not a blocklist) of genuinely visual
// properties — deliberately excludes layout (x/y/width/height/rotation),
// identity (id/type/name/link), and per-item content (text content, image
// URLs, embedded item lists) so "paste style" can never silently move/resize/
// retext the target component, only restyle it.
const STYLE_KEYS: (keyof PageComponent)[] = [
  "fontSize", "fontFamily", "fontWeight", "lineHeight", "fontColor", "italic", "textAlign", "bold",
  "textStyle", "letterSpacing", "textTransform", "textToken", "textEffect", "effectStrength",
  "bgColor", "borderRadius", "opacity",
  "shadowX", "shadowY", "shadowBlur", "shadowSpread", "shadowColor", "blurAmount",
  "buttonStyle", "borderColor", "hoverBgColor", "hoverFontColor",
  "carouselItemWidth", "carouselZoom", "carouselStyle", "carouselGap", "carouselItemBg",
  "heroAutoplay", "heroAutoplaySeconds", "heroShowArrows", "heroShowDots", "heroPeekPercent",
  "heroHeadlineColor", "heroSubtextColor", "heroOverlayOpacity", "heroCtaBgColor", "heroCtaFontColor",
];

const ZONE_META: { zone: Zone; label: string }[] = [
  { zone: "header", label: "Header" },
  { zone: "template", label: "Template" },
  { zone: "footer", label: "Footer" },
];

const MARKET_WIDGETS = [
  { id: "trend-radar", label: "Trend Radar", icon: Activity, hint: "Realtime signals" },
  { id: "growth-chart", label: "Growth Chart", icon: BarChart3, hint: "KPI + bars" },
  { id: "live-feed", label: "Live Feed", icon: Radio, hint: "Dynamic updates" },
  { id: "user-command", label: "User Console", icon: Users, hint: "Roles + status" },
  { id: "brand-kit", label: "Brand Kit", icon: Palette, hint: "Visual tokens" },
  { id: "deploy-flow", label: "Deploy Flow", icon: Rocket, hint: "Workflow status" },
] as const;

type MarketWidgetId = (typeof MARKET_WIDGETS)[number]["id"];

function shapeSize(shapeType: ShapeType, canvasW: number): { width: number; height: number } {
  const base = Math.round(canvasW * 0.12);
  const wide = Math.round(base * 1.6);
  switch (shapeType) {
    case "rectangle":
    case "ellipse":
      return { width: wide, height: base };
    case "hexagon":
      return { width: Math.round(base * 1.3), height: base };
    default:
      return { width: base, height: base };
  }
}

function shapeClipPath(shapeType?: ShapeType): string | undefined {
  switch (shapeType) {
    case "triangle": return "polygon(50% 0%, 0% 100%, 100% 100%)";
    case "diamond":  return "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)";
    case "hexagon":  return "polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)";
    case "star":     return "polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)";
    default:         return undefined;
  }
}

function shapeHasRadius(shapeType?: ShapeType): boolean {
  return !shapeType || shapeType === "square" || shapeType === "rectangle";
}

function shapeBorderRadius(comp: PageComponent): number | string {
  const st = comp.shapeType ?? "rectangle";
  if (st === "circle" || st === "ellipse") return "50%";
  if (st === "square" || st === "rectangle") return comp.borderRadius ?? 0;
  return 0;
}

// Shadow/blur — shape/image/button/icon/carousel only; undefined (no style override)
// when nothing's been set, so components without any shadow/blur configured render
// exactly as before this feature existed.
function buildBoxShadow(comp: PageComponent): string | undefined {
  const { shadowX, shadowY, shadowBlur, shadowSpread, shadowColor } = comp;
  if (shadowX == null && shadowY == null && shadowBlur == null && shadowSpread == null && !shadowColor) return undefined;
  return `${shadowX ?? 0}px ${shadowY ?? 0}px ${Math.max(0, shadowBlur ?? 0)}px ${shadowSpread ?? 0}px ${shadowColor ?? "rgba(0,0,0,0.35)"}`;
}
function buildBlurFilter(comp: PageComponent): string | undefined {
  return comp.blurAmount ? `blur(${comp.blurAmount}px)` : undefined;
}

function ShapeSwatch({ type, size = 16 }: { type: ShapeType; size?: number }) {
  const isWide = type === "rectangle" || type === "ellipse";
  return (
    <span
      className="shrink-0 bg-current text-muted-foreground"
      style={{
        width: isWide ? size * 1.5 : size,
        height: size,
        borderRadius: type === "circle" || type === "ellipse" ? "50%" : type === "square" || type === "rectangle" ? 3 : 0,
        clipPath: shapeClipPath(type),
      }}
    />
  );
}

function ImageBody({ comp, placeholderClass }: { comp: PageComponent; placeholderClass: string }) {
  const radius = comp.borderRadius ?? 4;
  const images = comp.images ?? [];
  const isSlideshow = comp.imageMode === "slideshow";
  const duration = Math.max(1, comp.slideshowDuration ?? 3.5);
  const [activeIndex, setActiveIndex] = useState(0);

  // Animate in the editor canvas + preview too, so what you see while editing
  // matches the published homepage exactly instead of only animating live.
  useEffect(() => {
    if (!isSlideshow || images.length < 2) return;
    setActiveIndex(0);
    const timer = setInterval(() => {
      setActiveIndex((i) => (i + 1) % images.length);
    }, duration * 1000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSlideshow, images.length, duration, comp.id]);

  if (isSlideshow) {
    if (images.length === 0) {
      return <div className={`w-full h-full flex items-center justify-center text-xs gap-1 ${placeholderClass}`}><Images className="h-4 w-4" /> Slideshow</div>;
    }
    return (
      <div className="relative w-full h-full overflow-hidden" style={{ borderRadius: radius }}>
        {images.map((url, i) => (
          <img key={i} src={url} alt="" className="absolute inset-0 w-full h-full object-cover"
            style={{ opacity: i === activeIndex ? 1 : 0, transition: "opacity 0.6s ease-in-out" }} />
        ))}
        {images.length > 1 && (
          <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
            {images.map((_, i) => (
              <span key={i} className={`h-1 w-1 rounded-full transition-colors ${i === activeIndex ? "bg-white" : "bg-white/50"}`} />
            ))}
          </div>
        )}
      </div>
    );
  }
  return comp.imageUrl
    ? <img src={comp.imageUrl} alt="" className="w-full h-full object-cover" style={{ borderRadius: radius }} />
    : <div className={`w-full h-full flex items-center justify-center text-xs gap-1 ${placeholderClass}`}><ImageIcon className="h-4 w-4" /> Image</div>;
}

// ── Carousel: horizontally-scrolling items with the centered item zoomed ────
// Shared between the editor canvas, the admin preview overlay, and (in spirit,
// mirrored) the published homepage — same scroll/zoom/drag math everywhere.

function CarouselBody({ comp, editable }: { comp: PageComponent; editable: boolean }) {
  const items = comp.carouselItems ?? [];
  const itemWidth = comp.carouselItemWidth ?? 160;
  const zoom = comp.carouselZoom ?? 1.25;
  const gap = comp.carouselGap ?? 12;
  const radius = comp.borderRadius ?? 12;
  // "row" = flat category-row style (Swiggy/Instamart-like): uniform item size,
  // no scroll-position zoom, items start flush at the edge instead of centered.
  // "zoom" (default, preserves pre-existing carousels) keeps the center-item zoom.
  const isRow = comp.carouselStyle === "row";
  const trackRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const dragRef = useRef<{ startX: number; startScroll: number; dragged: boolean } | null>(null);
  const [scales, setScales] = useState<number[]>([]);
  const [pad, setPad] = useState(0);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const recompute = useCallback(() => {
    if (isRow) return; // uniform size in row mode — no per-scroll recompute needed
    const track = trackRef.current;
    if (!track) return;
    const trackRect = track.getBoundingClientRect();
    const centerX = trackRect.left + trackRect.width / 2;
    const cards = Array.from(track.querySelectorAll<HTMLElement>("[data-carousel-item]"));
    setScales(cards.map((card) => {
      const r = card.getBoundingClientRect();
      const dist = Math.abs(r.left + r.width / 2 - centerX);
      const maxDist = trackRect.width / 2 + r.width / 2;
      const t = Math.max(0, 1 - dist / Math.max(1, maxDist));
      return 1 + t * (zoom - 1);
    }));
  }, [zoom, isRow]);

  const onScroll = useCallback(() => {
    if (isRow || rafRef.current) return;
    rafRef.current = requestAnimationFrame(() => { rafRef.current = null; recompute(); });
  }, [recompute, isRow]);

  useEffect(() => {
    function updatePad() {
      // Row style: items start flush at the left edge (no centering pad) so the
      // next item is naturally partially visible at the right edge, hinting more.
      if (trackRef.current) setPad(isRow ? 0 : Math.max(0, trackRef.current.clientWidth / 2 - itemWidth / 2));
    }
    updatePad();
    recompute();
    window.addEventListener("resize", updatePad);
    return () => window.removeEventListener("resize", updatePad);
  }, [itemWidth, items.length, recompute, isRow]);

  useEffect(() => {
    function onMove(e: MouseEvent) {
      const d = dragRef.current;
      const track = trackRef.current;
      if (!d || !track) return;
      if (Math.abs(e.clientX - d.startX) > 3) d.dragged = true;
      track.scrollLeft = d.startScroll - (e.clientX - d.startX);
      onScroll();
    }
    function onUp() {
      dragRef.current = null;
      // Re-enable smooth scrolling now that the direct 1:1 drag tracking is done.
      if (trackRef.current) trackRef.current.style.scrollBehavior = "smooth";
    }
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
  }, [onScroll]);

  // React attaches its synthetic onWheel as a passive listener, so preventDefault()
  // there silently no-ops — attach a real non-passive listener so converting a plain
  // vertical mouse wheel into horizontal scroll doesn't also scroll the page behind it.
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    function onWheelNative(e: WheelEvent) {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX) && track) {
        e.preventDefault();
        track.scrollBy({ left: e.deltaY, behavior: "smooth" });
      }
    }
    track.addEventListener("wheel", onWheelNative, { passive: false });
    return () => track.removeEventListener("wheel", onWheelNative);
  }, [items.length === 0]); // re-attach once the track element actually mounts (empty -> non-empty)

  if (items.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center text-xs gap-1 text-muted-foreground border border-dashed rounded-lg" style={{ borderRadius: radius }}>
        <GalleryHorizontal className="h-4 w-4" /> Carousel — add items
      </div>
    );
  }

  return (
    <div
      ref={trackRef}
      onScroll={onScroll}
      onMouseDown={(e) => {
        e.stopPropagation();
        if (!trackRef.current) return;
        trackRef.current.style.scrollBehavior = "auto"; // instant 1:1 tracking while dragging
        dragRef.current = { startX: e.clientX, startScroll: trackRef.current.scrollLeft, dragged: false };
      }}
      // No JS is needed for touch — overflow-x-auto scrolls natively on touch devices
      // (unlike mouse-drag, which browsers don't support natively, hence the handlers
      // above); -webkit-overflow-scrolling adds momentum on older iOS Safari specifically.
      // The [&::-webkit-scrollbar] variant hides the bar on Chrome/Safari/Edge; scrollbarWidth
      // covers Firefox — between the two, no visible scrollbar on any engine.
      className="w-full h-full flex items-center overflow-x-auto overflow-y-hidden cursor-grab active:cursor-grabbing [&::-webkit-scrollbar]:hidden"
      style={{
        borderRadius: radius, paddingLeft: pad, paddingRight: pad, gap,
        scrollSnapType: "x proximity", scrollBehavior: "smooth", scrollbarWidth: "none",
        WebkitOverflowScrolling: "touch",
      }}
    >
      {items.map((item, i) => {
        const baseScale = isRow ? 1 : (scales[i] ?? 1);
        const scale = hoverIndex === i ? baseScale + 0.08 : baseScale;
        // Row style: a Swiggy/Instamart-style "chip" — icon sits with visible padding
        // inside a light colored square, and the label lives OUTSIDE/below that square
        // as plain text (not sharing its background), rather than the zoom style's
        // full-bleed photo card with the label captioned inside the same white card.
        const card = isRow ? (
          <div
            data-carousel-item
            onMouseEnter={() => setHoverIndex(i)}
            onMouseLeave={() => setHoverIndex((h) => (h === i ? null : h))}
            className="shrink-0 flex flex-col items-center select-none"
            style={{ width: itemWidth, transform: `scale(${scale})`, transition: "transform 0.2s ease-out", scrollSnapAlign: "start", zIndex: hoverIndex === i ? 999 : 1 }}
          >
            <div className="w-full aspect-square flex items-center justify-center overflow-hidden p-2.5"
              style={{ backgroundColor: comp.carouselItemBg ?? "#eef2f6", borderRadius: radius }}>
              {item.imageUrl
                ? <img src={item.imageUrl} alt="" draggable={false} className="w-full h-full object-contain pointer-events-none" />
                : <ImageIcon className="h-5 w-5 text-gray-400" />}
            </div>
            {item.label && <span className="mt-1.5 text-xs font-medium text-center px-1 truncate w-full">{item.label}</span>}
          </div>
        ) : (
          <div
            data-carousel-item
            onMouseEnter={() => setHoverIndex(i)}
            onMouseLeave={() => setHoverIndex((h) => (h === i ? null : h))}
            className="shrink-0 flex flex-col items-center gap-1 overflow-hidden bg-white select-none"
            style={{ width: itemWidth, transform: `scale(${scale})`, transition: "transform 0.2s ease-out", scrollSnapAlign: "center", zIndex: hoverIndex === i ? 999 : Math.round(baseScale * 10), boxShadow: "0 1px 3px rgba(0,0,0,0.15)", borderRadius: radius }}
          >
            {item.imageUrl
              ? <img src={item.imageUrl} alt="" draggable={false} className="w-full aspect-square object-cover pointer-events-none" style={{ borderRadius: radius }} />
              : <div className="w-full aspect-square bg-gray-200 flex items-center justify-center" style={{ borderRadius: radius }}><ImageIcon className="h-5 w-5 text-gray-400" /></div>}
            {item.label && <span className="text-xs font-medium text-center px-1 pb-1 truncate w-full">{item.label}</span>}
          </div>
        );
        return item.link ? (
          <a
            key={item.id}
            href={editable ? undefined : item.link}
            onClick={(e) => { if (editable || dragRef.current?.dragged) e.preventDefault(); }}
            className="shrink-0"
          >
            {card}
          </a>
        ) : (
          <div key={item.id}>{card}</div>
        );
      })}
    </div>
  );
}

// ── Hero Carousel: full-width banner slides ─────────────────────────────────
// Editor preview is intentionally inert (prev/next/dots just cycle a local
// index — no autoplay, no swipe physics) so it never fights the canvas's own
// drag handling and no timers fire unexpectedly while editing — same
// editor-inert/live-interactive split already used for Map/Location Input/
// Vehicle Selector. The published homepage's HeroCarousel.tsx client island
// has the real swipe/drag + autoplay + edge-bounce behavior.
function HeroCarouselBody({ comp }: { comp: PageComponent }) {
  const slides = comp.heroSlides ?? [];
  const [index, setIndex] = useState(0);
  const radius = comp.borderRadius ?? 0;
  const overlay = (comp.heroOverlayOpacity ?? 35) / 100;

  if (slides.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center text-xs gap-1 text-muted-foreground border border-dashed rounded-lg" style={{ borderRadius: radius }}>
        <GalleryHorizontalEnd className="h-4 w-4" /> Hero Carousel — add slides
      </div>
    );
  }
  const i = Math.min(index, slides.length - 1);
  const slide = slides[i];

  return (
    <div className="relative w-full h-full overflow-hidden select-none" style={{ borderRadius: radius, backgroundColor: comp.bgColor ?? "#111827" }}>
      {slide.imageUrl ? (
        <img src={slide.imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover" draggable={false} />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-white/30"><ImageIcon className="h-8 w-8" /></div>
      )}
      <div className="absolute inset-0" style={{ backgroundColor: `rgba(0,0,0,${overlay})` }} />
      <div className="relative z-10 w-full h-full flex flex-col justify-center gap-2 px-6 md:px-10 max-w-full md:max-w-[55%]">
        {slide.headline && <h3 className="text-xl md:text-3xl font-bold truncate" style={{ color: comp.heroHeadlineColor ?? "#ffffff" }}>{slide.headline}</h3>}
        {slide.subtext && <p className="text-sm md:text-base line-clamp-2" style={{ color: comp.heroSubtextColor ?? "#f3f4f6" }}>{slide.subtext}</p>}
        {slide.buttonLabel && (
          <div className="mt-1">
            <span className="inline-block px-4 py-2 rounded-md text-sm font-semibold" style={{ backgroundColor: comp.heroCtaBgColor ?? "#ffffff", color: comp.heroCtaFontColor ?? "#111111" }}>
              {slide.buttonLabel}
            </span>
          </div>
        )}
      </div>
      {(comp.heroShowArrows ?? true) && slides.length > 1 && (
        <>
          <button type="button" onMouseDown={(e) => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); setIndex((v) => (v - 1 + slides.length) % slides.length); }}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-20 h-8 w-8 rounded-full bg-white/80 hover:bg-white flex items-center justify-center shadow">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button type="button" onMouseDown={(e) => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); setIndex((v) => (v + 1) % slides.length); }}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-20 h-8 w-8 rounded-full bg-white/80 hover:bg-white flex items-center justify-center shadow">
            <ChevronRight className="h-4 w-4" />
          </button>
        </>
      )}
      {(comp.heroShowDots ?? true) && slides.length > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5">
          {slides.map((_, si) => (
            <button key={si} type="button" onMouseDown={(e) => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); setIndex(si); }}
              className={`h-1.5 rounded-full transition-all ${si === i ? "w-4 bg-white" : "w-1.5 bg-white/50"}`} />
          ))}
        </div>
      )}
      <div className="absolute top-2 right-2 z-20 text-[10px] px-1.5 py-0.5 rounded bg-black/40 text-white">{i + 1}/{slides.length}</div>
    </div>
  );
}

// ── Category Carousel: snap-scrolling row of category cards ─────────────────
// A separate component from Carousel (no shared code/fields) — unlike Hero
// Carousel, this has no autoplay/edge-bounce physics, so — same as the
// existing Carousel — native CSS scroll-snap works directly in the editor
// canvas without fighting the canvas's own drag handling; no separate
// editor-inert mode is needed here. Mirrored (not shared) into the live
// homepage's CategoryCarousel.tsx client island for the clickable arrows.
function categoryCardWidthStyle(comp: PageComponent, canvasW: number, index: number): React.CSSProperties {
  const isMobile = canvasW <= 500;
  const gap = (isMobile ? comp.catCarouselGapMobile ?? 12 : comp.catCarouselGapDesktop ?? 16);
  // "double" snap mode only marks every other card as a snap stop, so the
  // track settles two-at-a-time instead of on every single card.
  const snapAlign = (comp.catCarouselSnapMode ?? "single") === "double" && index % 2 === 1 ? undefined : "start";
  if (isMobile) return { flex: "0 0 88%", scrollSnapAlign: snapAlign };
  const n = comp.catCarouselDesktopCards ?? 4;
  return { flex: `0 0 calc((100% - ${(n - 1) * gap}px) / ${n})`, scrollSnapAlign: snapAlign };
}

function CategoryCarouselCard({ comp, item }: { comp: PageComponent; item: CategoryCarouselItem }) {
  const style = comp.catCarouselCardStyle ?? "image-first";
  const radius = comp.catCarouselCornerRadius ?? 12;
  const aspect = (comp.catCarouselAspectRatio ?? "1:1") === "1:1" ? "aspect-square" : "aspect-[3/4]";
  const showDescriptor = comp.catCarouselShowDescriptor ?? false;
  const showBadge = comp.catCarouselShowBadge ?? false;

  const image = (
    <div className={`relative w-full ${style === "split" ? "h-full" : aspect} overflow-hidden bg-gray-100 shrink-0`} style={{ borderRadius: style === "split" ? 0 : radius }}>
      {item.imageUrl ? (
        <img src={item.imageUrl} alt="" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.04]" draggable={false} />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-gray-300"><ImageIcon className="h-6 w-6" /></div>
      )}
      {showBadge && item.badge && (
        <span className="absolute top-1.5 left-1.5 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-black/70 text-white">{item.badge}</span>
      )}
      {style === "image-first" && (
        <span className="absolute inset-0 flex items-end justify-center pb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-white/90 text-black">Shop</span>
        </span>
      )}
    </div>
  );

  const label = (
    <div className={style === "icon-text" ? "text-center" : "px-0.5"}>
      <p className="text-[13px] font-semibold truncate" style={{ color: comp.catCarouselTitleColor ?? "#111111" }}>{item.name || "Category"}</p>
      {showDescriptor && item.descriptor && <p className="text-[11px] text-muted-foreground truncate">{item.descriptor}</p>}
    </div>
  );

  const inner = style === "icon-text" ? (
    <div className="group flex flex-col items-center gap-1.5 w-16">
      <div className="w-14 h-14 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center shrink-0">
        {item.imageUrl ? <img src={item.imageUrl} alt="" className="w-full h-full object-cover" draggable={false} /> : <ImageIcon className="h-5 w-5 text-gray-300" />}
      </div>
      {label}
    </div>
  ) : style === "split" ? (
    <div className="group flex h-full w-full overflow-hidden border border-gray-200" style={{ borderRadius: radius }}>
      <div className="w-1/2 h-full">{image}</div>
      <div className="w-1/2 h-full flex flex-col justify-center gap-1 p-2">{label}</div>
    </div>
  ) : (
    <div className="group flex flex-col gap-1.5">
      {image}
      {label}
    </div>
  );

  return item.link ? <div className="cursor-pointer">{inner}</div> : inner;
}

function CategoryCarouselBody({ comp, canvasW }: { comp: PageComponent; canvasW: number }) {
  const items = comp.catCarouselItems ?? [];
  const trackRef = useRef<HTMLDivElement>(null);
  const gap = (canvasW <= 500 ? comp.catCarouselGapMobile ?? 12 : comp.catCarouselGapDesktop ?? 16);
  const isIconText = (comp.catCarouselCardStyle ?? "image-first") === "icon-text";

  return (
    <div className="group/carousel w-full h-full flex flex-col gap-2">
      {(comp.catCarouselTitle || comp.catCarouselSubtitle) && (
        <div className="flex flex-col gap-0.5 px-0.5">
          {comp.catCarouselTitle && <h3 className="text-xl font-bold" style={{ color: comp.catCarouselTitleColor ?? "#111111" }}>{comp.catCarouselTitle}</h3>}
          {comp.catCarouselSubtitle && <p className="text-sm" style={{ color: comp.catCarouselSubtitleColor ?? "#6b7280" }}>{comp.catCarouselSubtitle}</p>}
        </div>
      )}
      <div className="relative flex-1 min-h-0">
        {items.length === 0 ? (
          <div className="w-full h-full flex items-center justify-center text-xs gap-1 text-muted-foreground border border-dashed rounded-lg">
            <LayoutGrid className="h-4 w-4" /> Category Carousel — add items
          </div>
        ) : (
          <>
            <div
              ref={trackRef}
              // Stop mousedown from bubbling to the canvas wrapper's onDragStart —
              // otherwise scrolling/clicking inside the track would also start
              // dragging the whole component (same fix CarouselBody already uses).
              onMouseDown={(e) => e.stopPropagation()}
              className="w-full h-full flex overflow-x-auto overflow-y-hidden [&::-webkit-scrollbar]:hidden"
              style={{ gap, scrollSnapType: "x mandatory", scrollbarWidth: "none", alignItems: isIconText ? "flex-start" : "stretch" }}
            >
              {items.map((item, idx) => (
                <div key={item.id} style={categoryCardWidthStyle(comp, canvasW, idx)}>
                  <CategoryCarouselCard comp={comp} item={item} />
                </div>
              ))}
            </div>
            <button type="button"
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => { e.stopPropagation(); trackRef.current?.scrollBy({ left: -240, behavior: "smooth" }); }}
              className="hidden md:flex absolute left-1 top-1/2 -translate-y-1/2 z-20 h-7 w-7 rounded-full bg-white shadow border items-center justify-center opacity-0 group-hover/carousel:opacity-100 transition-opacity">
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <button type="button"
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => { e.stopPropagation(); trackRef.current?.scrollBy({ left: 240, behavior: "smooth" }); }}
              className="hidden md:flex absolute right-1 top-1/2 -translate-y-1/2 z-20 h-7 w-7 rounded-full bg-white shadow border items-center justify-center opacity-0 group-hover/carousel:opacity-100 transition-opacity">
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ── Icon: a single glyph from the shared homepage icon registry ─────────────

function IconGlyph({ comp }: { comp: PageComponent }) {
  const def = getHomeIcon(comp.iconName);
  const size = comp.fontSize ?? 32;
  const Ico = def?.Icon;
  return (
    <div className="w-full h-full flex items-center justify-center" style={{ opacity: (comp.opacity ?? 100) / 100 }}>
      {Ico
        ? <Ico style={{ width: size, height: size, color: comp.fontColor ?? "#111111" }} />
        : <Square className="text-muted-foreground" style={{ width: size, height: size }} />}
    </div>
  );
}

// ── Taxi/ride-hailing components ────────────────────────────────────────────
// Editor renders a static/inert preview for all of these (matching how Button
// and Carousel links are already inert in the editor) — only the live
// published page (apps/web/src/app/(home)/page.tsx, a separate mirrored
// implementation) wires up real interactivity/APIs. See the component plan
// for why: Map's live pan/zoom would otherwise fight the canvas's own drag
// handling, exactly like Carousel already has to work around.

function LocationInputBody({ comp }: { comp: PageComponent }) {
  return (
    <div className="w-full h-full flex items-center gap-2 px-3 select-none"
      style={{ backgroundColor: comp.bgColor ?? "#ffffff", border: `1px solid ${comp.borderColor ?? "#e5e7eb"}`, borderRadius: comp.borderRadius ?? 8 }}>
      <MapPin className="h-4 w-4 shrink-0" style={{ color: comp.fontColor ?? "#111111" }} />
      <span className="text-sm truncate" style={{ color: comp.fontColor ?? "#111111", opacity: 0.6 }}>
        {comp.locationPlaceholder || "Enter location"}
      </span>
    </div>
  );
}

// Static Maps API image — no JS SDK, no pan/zoom, so it never conflicts with
// dragging/resizing the component itself on the canvas (live page uses the
// real interactive Maps JavaScript API instead — see HomeCarousel-style
// mirrored implementation in apps/web/src/app/(home)/page.tsx).
function MapBody({ comp }: { comp: PageComponent }) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const lat = comp.mapCenterLat ?? 12.9716;
  const lng = comp.mapCenterLng ?? 77.5946;
  const zoom = comp.mapZoom ?? 13;
  const markers = comp.mapMarkers ?? [];
  const radius = comp.borderRadius ?? 12;

  if (!apiKey) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center gap-1 text-center px-3 bg-gray-100 text-muted-foreground text-xs" style={{ borderRadius: radius }}>
        <MapIcon className="h-5 w-5" />
        Google Maps API key required
        <span className="text-[10px]">Set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</span>
      </div>
    );
  }
  const markerParams = markers.map((m) => `markers=color:red%7C${m.lat},${m.lng}`).join("&");
  const size = "640x400"; // Static Maps API max free size per dimension
  const src = `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=${zoom}&size=${size}&scale=2&${markerParams}&key=${apiKey}`;
  return (
    <div className="w-full h-full overflow-hidden" style={{ borderRadius: radius }}>
      <img src={src} alt="Map preview" className="w-full h-full object-cover pointer-events-none select-none" draggable={false} />
    </div>
  );
}

function DateTimePickerBody({ comp }: { comp: PageComponent }) {
  const opt = comp.dtDefaultOption ?? "today";
  const dateLabel = opt === "today" ? "Today" : opt === "tomorrow" ? "Tomorrow" : (comp.dtCustomDate || "Pick a date");
  return (
    <div className="w-full h-full flex flex-col justify-center gap-1.5 px-3 select-none"
      style={{ backgroundColor: comp.bgColor ?? "#ffffff", border: `1px solid ${comp.borderColor ?? "#e5e7eb"}`, borderRadius: comp.borderRadius ?? 8 }}>
      <div className="flex items-center gap-2 text-sm" style={{ color: comp.fontColor ?? "#111111" }}>
        <Calendar className="h-4 w-4 shrink-0" /> <span className="truncate">{dateLabel}</span>
      </div>
      <div className="flex items-center gap-2 text-sm" style={{ color: comp.fontColor ?? "#111111" }}>
        <Clock className="h-4 w-4 shrink-0" /> <span>{comp.dtTime || "09:00"}</span>
      </div>
    </div>
  );
}

function VehicleSelectorBody({ comp }: { comp: PageComponent }) {
  const options = comp.vehicleOptions ?? [];
  if (options.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground border border-dashed rounded-lg gap-1">
        <CarFront className="h-4 w-4" /> Vehicle Selector — add options
      </div>
    );
  }
  return (
    <div className="w-full h-full flex items-center gap-2 overflow-hidden select-none">
      {options.map((opt) => {
        const def = getHomeIcon(opt.iconId);
        const Ico = def?.Icon ?? CarFront;
        const isSelected = (comp.selectedVehicleId ?? options[0]?.id) === opt.id;
        return (
          <div key={opt.id} className={`flex-1 flex flex-col items-center gap-0.5 py-2 px-1 rounded-lg border min-w-0 ${isSelected ? "border-black bg-muted" : "border-gray-200"}`}>
            <Ico className="h-5 w-5 text-muted-foreground" />
            <span className="text-[11px] font-medium truncate w-full text-center">{opt.label}</span>
            {opt.fareText && <span className="text-[10px] text-muted-foreground truncate w-full text-center">{opt.fareText}</span>}
          </div>
        );
      })}
    </div>
  );
}

function DriverBadgeBody({ comp }: { comp: PageComponent }) {
  const rating = Math.max(0, Math.min(5, comp.driverRating ?? 4.8));
  return (
    <div className="w-full h-full flex items-center gap-2.5 px-3 select-none"
      style={{ backgroundColor: comp.bgColor ?? "#ffffff", borderRadius: comp.borderRadius ?? 12 }}>
      <div className="h-10 w-10 rounded-full bg-gray-200 shrink-0 overflow-hidden flex items-center justify-center">
        {comp.driverPhotoUrl
          ? <img src={comp.driverPhotoUrl} alt="" className="w-full h-full object-cover" />
          : <BadgeCheck className="h-5 w-5 text-gray-400" />}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold truncate" style={{ color: comp.fontColor ?? "#111111" }}>{comp.driverName || "Driver Name"}</p>
        <div className="flex items-center gap-0.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} className="h-3 w-3" fill={i < Math.round(rating) ? "#f59e0b" : "none"} stroke="#f59e0b" />
          ))}
          <span className="text-[10px] text-muted-foreground ml-1">{rating.toFixed(1)}</span>
        </div>
        {comp.driverVehicle && <p className="text-[11px] text-muted-foreground truncate">{comp.driverVehicle}</p>}
      </div>
    </div>
  );
}

function FareDisplayBody({ comp }: { comp: PageComponent }) {
  const currency = comp.fareCurrency ?? "₹";
  const base = comp.fareBase ?? 50;
  const km = comp.fareDistanceKm ?? 5;
  const rate = comp.fareRatePerKm ?? 12;
  const surge = comp.fareSurgeMultiplier ?? 1;
  const distanceFare = km * rate;
  const total = Math.round((base + distanceFare) * surge);
  return (
    <div className="w-full h-full flex flex-col justify-center gap-1 px-3 py-2 select-none"
      style={{ backgroundColor: comp.bgColor ?? "#ffffff", borderRadius: comp.borderRadius ?? 12 }}>
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><Receipt className="h-3.5 w-3.5" /> Fare estimate</div>
      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
        <span>Base fare</span><span>{currency}{base}</span>
      </div>
      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
        <span>Distance ({km}km × {currency}{rate})</span><span>{currency}{distanceFare}</span>
      </div>
      {surge !== 1 && (
        <div className="flex items-center justify-between text-[11px] text-amber-600">
          <span>Surge ×{surge}</span><span></span>
        </div>
      )}
      <div className="flex items-center justify-between text-sm font-semibold pt-1 border-t" style={{ color: comp.fontColor ?? "#111111" }}>
        <span>Total</span><span>{currency}{total}</span>
      </div>
    </div>
  );
}

// ── Spacing guides — shown only while actively dragging a single component ──
// Finds, in each of the 4 directions, the nearest other component whose box
// overlaps the dragged component on the perpendicular axis (i.e. an actual
// "next door" neighbor, not just anything elsewhere on the canvas), and
// reports the gap between their facing edges so it can be labeled in px —
// the same "smart guide" spacing hint most design tools show while dragging.
interface SpacingGuide { orientation: "horizontal" | "vertical"; x1: number; y1: number; x2: number; y2: number; gap: number; labelX: number; labelY: number }

function computeSpacingGuides(dragged: PageComponent, others: PageComponent[]): SpacingGuide[] {
  const dTop = dragged.y, dBottom = dragged.y + dragged.height, dLeft = dragged.x, dRight = dragged.x + dragged.width;
  let rightNeighbor: PageComponent | null = null, rightGap = Infinity;
  let leftNeighbor: PageComponent | null = null, leftGap = Infinity;
  let bottomNeighbor: PageComponent | null = null, bottomGap = Infinity;
  let topNeighbor: PageComponent | null = null, topGap = Infinity;

  for (const c of others) {
    const cTop = c.y, cBottom = c.y + c.height, cLeft = c.x, cRight = c.x + c.width;
    const vOverlap = Math.min(dBottom, cBottom) - Math.max(dTop, cTop) > 0;
    const hOverlap = Math.min(dRight, cRight) - Math.max(dLeft, cLeft) > 0;
    if (vOverlap) {
      if (cLeft >= dRight && cLeft - dRight < rightGap) { rightGap = cLeft - dRight; rightNeighbor = c; }
      if (cRight <= dLeft && dLeft - cRight < leftGap) { leftGap = dLeft - cRight; leftNeighbor = c; }
    }
    if (hOverlap) {
      if (cTop >= dBottom && cTop - dBottom < bottomGap) { bottomGap = cTop - dBottom; bottomNeighbor = c; }
      if (cBottom <= dTop && dTop - cBottom < topGap) { topGap = dTop - cBottom; topNeighbor = c; }
    }
  }

  const guides: SpacingGuide[] = [];
  if (rightNeighbor) {
    const midY = (Math.max(dTop, rightNeighbor.y) + Math.min(dBottom, rightNeighbor.y + rightNeighbor.height)) / 2;
    guides.push({ orientation: "horizontal", x1: dRight, y1: midY, x2: rightNeighbor.x, y2: midY, gap: rightGap, labelX: (dRight + rightNeighbor.x) / 2, labelY: midY });
  }
  if (leftNeighbor) {
    const midY = (Math.max(dTop, leftNeighbor.y) + Math.min(dBottom, leftNeighbor.y + leftNeighbor.height)) / 2;
    const edgeX = leftNeighbor.x + leftNeighbor.width;
    guides.push({ orientation: "horizontal", x1: edgeX, y1: midY, x2: dLeft, y2: midY, gap: leftGap, labelX: (edgeX + dLeft) / 2, labelY: midY });
  }
  if (bottomNeighbor) {
    const midX = (Math.max(dLeft, bottomNeighbor.x) + Math.min(dRight, bottomNeighbor.x + bottomNeighbor.width)) / 2;
    guides.push({ orientation: "vertical", x1: midX, y1: dBottom, x2: midX, y2: bottomNeighbor.y, gap: bottomGap, labelX: midX, labelY: (dBottom + bottomNeighbor.y) / 2 });
  }
  if (topNeighbor) {
    const midX = (Math.max(dLeft, topNeighbor.x) + Math.min(dRight, topNeighbor.x + topNeighbor.width)) / 2;
    const edgeY = topNeighbor.y + topNeighbor.height;
    guides.push({ orientation: "vertical", x1: midX, y1: edgeY, x2: midX, y2: dTop, gap: topGap, labelX: midX, labelY: (edgeY + dTop) / 2 });
  }
  return guides;
}

function SpacingGuides({ guides, canvasW, canvasH }: { guides: SpacingGuide[]; canvasW: number; canvasH: number }) {
  const pct = (v: number, total: number) => `${(v / total) * 100}%`;
  return (
    <div className="absolute inset-0 pointer-events-none select-none z-40">
      {guides.map((g, i) => (
        <div key={i}>
          {g.orientation === "horizontal" ? (
            <div className="absolute border-t border-dashed border-pink-500"
              style={{ left: pct(Math.min(g.x1, g.x2), canvasW), top: pct(g.y1, canvasH), width: pct(Math.abs(g.x2 - g.x1), canvasW) }} />
          ) : (
            <div className="absolute border-l border-dashed border-pink-500"
              style={{ left: pct(g.x1, canvasW), top: pct(Math.min(g.y1, g.y2), canvasH), height: pct(Math.abs(g.y2 - g.y1), canvasH) }} />
          )}
          <div className="absolute -translate-x-1/2 -translate-y-1/2 rounded bg-pink-500 text-white text-[10px] leading-none px-1 py-0.5 whitespace-nowrap"
            style={{ left: pct(g.labelX, canvasW), top: pct(g.labelY, canvasH) }}>
            {Math.round(g.gap)}px
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Alignment guides — canvas-center + component edge/center snapping while
// dragging a single component. A distinct visual system from SpacingGuides
// above (which shows gap *distance*, not alignment) — rendered together but
// styled differently (solid blue/violet vs. dashed pink) so they read as two
// different kinds of information at a glance.
interface AlignmentGuideLine { orientation: "vertical" | "horizontal"; pos: number; from: number; to: number }

function computeAlignmentGuides(dragged: { x: number; y: number; width: number; height: number }, others: PageComponent[], canvasW: number, canvasH: number, tolerance = 6): AlignmentGuideLine[] {
  const left = dragged.x, right = dragged.x + dragged.width, centerX = dragged.x + dragged.width / 2;
  const top = dragged.y, bottom = dragged.y + dragged.height, centerY = dragged.y + dragged.height / 2;

  let bestXDist = tolerance, bestXPos: number | null = null;
  let bestYDist = tolerance, bestYPos: number | null = null;

  function tryX(pos: number, current: number) {
    const dist = Math.abs(current - pos);
    if (dist <= bestXDist) { bestXDist = dist; bestXPos = pos; }
  }
  function tryY(pos: number, current: number) {
    const dist = Math.abs(current - pos);
    if (dist <= bestYDist) { bestYDist = dist; bestYPos = pos; }
  }

  tryX(canvasW / 2, centerX);
  tryY(canvasH / 2, centerY);
  for (const c of others) {
    tryX(c.x, left); tryX(c.x + c.width, right); tryX(c.x + c.width / 2, centerX);
    tryY(c.y, top); tryY(c.y + c.height, bottom); tryY(c.y + c.height / 2, centerY);
  }

  const guides: AlignmentGuideLine[] = [];
  if (bestXPos !== null) guides.push({ orientation: "vertical", pos: bestXPos, from: 0, to: canvasH });
  if (bestYPos !== null) guides.push({ orientation: "horizontal", pos: bestYPos, from: 0, to: canvasW });
  return guides;
}

// Snaps a proposed drag position to the nearest alignment match per axis (if
// any is within tolerance), returning both the (possibly adjusted) position
// and the guide lines to render — one pass computes both.
function snapPosition(rawX: number, rawY: number, width: number, height: number, others: PageComponent[], canvasW: number, canvasH: number, tolerance = 6) {
  const guides = computeAlignmentGuides({ x: rawX, y: rawY, width, height }, others, canvasW, canvasH, tolerance);
  let x = rawX, y = rawY;
  for (const g of guides) {
    if (g.orientation === "vertical") {
      // Snap whichever of left/center/right is closest to this line to sit exactly on it.
      const left = rawX, right = rawX + width, centerX = rawX + width / 2;
      const dLeft = Math.abs(left - g.pos), dRight = Math.abs(right - g.pos), dCenter = Math.abs(centerX - g.pos);
      const min = Math.min(dLeft, dRight, dCenter);
      x = min === dCenter ? g.pos - width / 2 : min === dLeft ? g.pos : g.pos - width;
    } else {
      const top = rawY, bottom = rawY + height, centerY = rawY + height / 2;
      const dTop = Math.abs(top - g.pos), dBottom = Math.abs(bottom - g.pos), dCenter = Math.abs(centerY - g.pos);
      const min = Math.min(dTop, dBottom, dCenter);
      y = min === dCenter ? g.pos - height / 2 : min === dTop ? g.pos : g.pos - height;
    }
  }
  return { x, y, guides };
}

function AlignmentGuides({ guides, canvasW, canvasH }: { guides: AlignmentGuideLine[]; canvasW: number; canvasH: number }) {
  const pct = (v: number, total: number) => `${(v / total) * 100}%`;
  return (
    <div className="absolute inset-0 pointer-events-none select-none z-40">
      {guides.map((g, i) => g.orientation === "vertical" ? (
        <div key={i} className="absolute bg-blue-500" style={{ left: pct(g.pos, canvasW), top: pct(g.from, canvasH), height: pct(g.to - g.from, canvasH), width: 1 }} />
      ) : (
        <div key={i} className="absolute bg-blue-500" style={{ top: pct(g.pos, canvasH), left: pct(g.from, canvasW), width: pct(g.to - g.from, canvasW), height: 1 }} />
      ))}
    </div>
  );
}

// ── Floating contextual toolbar — shown above the selected component (single
// mode) or above the multi-select bounding box (multi mode). One shared
// component for both so button styling/spacing never drifts between them.

type AlignEdge = "left" | "right" | "centerH" | "top" | "bottom" | "centerV";

function ToolbarBtn({ title, onClick, destructive, disabled, children }: { title: string; onClick?: () => void; destructive?: boolean; disabled?: boolean; children: React.ReactNode }) {
  return (
    <button type="button" title={title} disabled={disabled}
      className={`flex h-6 w-6 items-center justify-center rounded hover:bg-muted hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent ${destructive ? "text-destructive hover:bg-destructive/10" : ""}`}
      onClick={(e) => { e.stopPropagation(); onClick?.(); }}
    >
      {children}
    </button>
  );
}

function ToolbarDivider() {
  return <div className="w-px h-4 bg-border mx-0.5 shrink-0" />;
}

interface FloatingToolbarProps {
  mode: "single" | "multi";
  locked?: boolean;
  hidden?: boolean;
  canGroup?: boolean;
  canUngroup?: boolean;
  canDistribute?: boolean;
  onDuplicate?: () => void;
  onDelete: () => void;
  onToggleLock?: () => void;
  onToggleHide?: () => void;
  onBringForward?: () => void;
  onSendBackward?: () => void;
  onBringToFront?: () => void;
  onSendToBack?: () => void;
  onGroup?: () => void;
  onUngroup?: () => void;
  onAlign?: (edge: AlignEdge) => void;
  onDistribute?: (axis: "horizontal" | "vertical") => void;
}

function FloatingToolbar(props: FloatingToolbarProps) {
  return (
    <div className="absolute z-30 flex items-center gap-0.5 rounded-md border bg-white px-1 py-1 shadow-sm"
      // -64 (not -38) so this never overlaps the purple rotate-dot handle non-text
      // components render just above their own box (which occupies roughly y:[-20,0]) —
      // an earlier version at -38 visually covered the dot, silently swallowing its clicks.
      style={{ top: -64, left: "50%", transform: "translateX(-50%)", pointerEvents: "auto" }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {props.mode === "single" && (
        <>
          <ToolbarBtn title="Duplicate" onClick={props.onDuplicate}><Copy className="h-3.5 w-3.5" /></ToolbarBtn>
          <ToolbarBtn title="Delete" destructive onClick={props.onDelete}><Trash2 className="h-3.5 w-3.5" /></ToolbarBtn>
          <ToolbarDivider />
          <ToolbarBtn title={props.locked ? "Unlock" : "Lock"} onClick={props.onToggleLock}>
            {props.locked ? <Unlock className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
          </ToolbarBtn>
          <ToolbarBtn title={props.hidden ? "Show" : "Hide"} onClick={props.onToggleHide}>
            {props.hidden ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
          </ToolbarBtn>
          <ToolbarDivider />
          <ToolbarBtn title="Bring forward" onClick={props.onBringForward}><ChevronUp className="h-3.5 w-3.5" /></ToolbarBtn>
          <ToolbarBtn title="Send backward" onClick={props.onSendBackward}><ChevronDown className="h-3.5 w-3.5" /></ToolbarBtn>
          <ToolbarBtn title="Bring to front" onClick={props.onBringToFront}><ArrowUpToLine className="h-3.5 w-3.5" /></ToolbarBtn>
          <ToolbarBtn title="Send to back" onClick={props.onSendToBack}><ArrowDownToLine className="h-3.5 w-3.5" /></ToolbarBtn>
        </>
      )}
      {props.mode === "multi" && (
        <>
          {props.canGroup && <ToolbarBtn title="Group" onClick={props.onGroup}><GroupIcon className="h-3.5 w-3.5" /></ToolbarBtn>}
          {props.canUngroup && <ToolbarBtn title="Ungroup" onClick={props.onUngroup}><UngroupIcon className="h-3.5 w-3.5" /></ToolbarBtn>}
          {(props.canGroup || props.canUngroup) && <ToolbarDivider />}
          <ToolbarBtn title="Align left" onClick={() => props.onAlign?.("left")}><AlignLeft className="h-3.5 w-3.5" /></ToolbarBtn>
          <ToolbarBtn title="Align center" onClick={() => props.onAlign?.("centerH")}><AlignCenter className="h-3.5 w-3.5" /></ToolbarBtn>
          <ToolbarBtn title="Align right" onClick={() => props.onAlign?.("right")}><AlignRight className="h-3.5 w-3.5" /></ToolbarBtn>
          <ToolbarBtn title="Align top" onClick={() => props.onAlign?.("top")}><AlignVerticalJustifyStart className="h-3.5 w-3.5" /></ToolbarBtn>
          <ToolbarBtn title="Align middle" onClick={() => props.onAlign?.("centerV")}><AlignVerticalJustifyCenter className="h-3.5 w-3.5" /></ToolbarBtn>
          <ToolbarBtn title="Align bottom" onClick={() => props.onAlign?.("bottom")}><AlignVerticalJustifyEnd className="h-3.5 w-3.5" /></ToolbarBtn>
          <ToolbarDivider />
          <ToolbarBtn title={props.locked ? "Unlock all" : "Lock all"} onClick={props.onToggleLock}>
            {props.locked ? <Unlock className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
          </ToolbarBtn>
          <ToolbarDivider />
          <ToolbarBtn title="Distribute horizontally" disabled={!props.canDistribute} onClick={() => props.onDistribute?.("horizontal")}><AlignHorizontalDistributeCenter className="h-3.5 w-3.5" /></ToolbarBtn>
          <ToolbarBtn title="Distribute vertically" disabled={!props.canDistribute} onClick={() => props.onDistribute?.("vertical")}><AlignVerticalDistributeCenter className="h-3.5 w-3.5" /></ToolbarBtn>
          <ToolbarDivider />
          <ToolbarBtn title="Delete all" destructive onClick={props.onDelete}><Trash2 className="h-3.5 w-3.5" /></ToolbarBtn>
        </>
      )}
    </div>
  );
}

// Which Add Component accordion a given component type's settings live in.
function toolForType(type: ComponentType): ComponentType {
  return type === "header" ? "text" : type;
}

function componentTypeLabel(type: ComponentType): string {
  switch (type) {
    case "header": return "Heading";
    case "text": return "Text";
    case "shape": return "Shape";
    case "image": return "Image";
    case "carousel": return "Carousel";
    case "icon": return "Icon";
    case "location-input": return "Location Input";
    case "map": return "Map";
    case "datetime-picker": return "Date & Time";
    case "vehicle-selector": return "Vehicle Selector";
    case "driver-badge": return "Driver Badge";
    case "fare-display": return "Fare Display";
    case "hero-carousel": return "Hero Carousel";
    case "category-carousel": return "Category Carousel";
    case "header-block": return "Header";
    case "footer-block": return "Footer";
    default: return "Button";
  }
}

// Small type glyph shown in the Layers panel row for quick scanning.
function layerIcon(comp: PageComponent) {
  if (comp.type === "text" || comp.type === "header") return <Type className="h-3 w-3 text-muted-foreground shrink-0" />;
  if (comp.type === "shape") return <ShapeSwatch type={comp.shapeType ?? "rectangle"} size={10} />;
  if (comp.type === "image") return <ImageIcon className="h-3 w-3 text-muted-foreground shrink-0" />;
  if (comp.type === "carousel") return <GalleryHorizontal className="h-3 w-3 text-muted-foreground shrink-0" />;
  if (comp.type === "icon") return <Square className="h-3 w-3 text-muted-foreground shrink-0" />;
  if (comp.type === "location-input") return <MapPin className="h-3 w-3 text-muted-foreground shrink-0" />;
  if (comp.type === "map") return <MapIcon className="h-3 w-3 text-muted-foreground shrink-0" />;
  if (comp.type === "datetime-picker") return <CalendarClock className="h-3 w-3 text-muted-foreground shrink-0" />;
  if (comp.type === "vehicle-selector") return <CarFront className="h-3 w-3 text-muted-foreground shrink-0" />;
  if (comp.type === "driver-badge") return <BadgeCheck className="h-3 w-3 text-muted-foreground shrink-0" />;
  if (comp.type === "fare-display") return <Receipt className="h-3 w-3 text-muted-foreground shrink-0" />;
  if (comp.type === "hero-carousel") return <GalleryHorizontalEnd className="h-3 w-3 text-muted-foreground shrink-0" />;
  if (comp.type === "category-carousel") return <LayoutGrid className="h-3 w-3 text-muted-foreground shrink-0" />;
  return <ComponentIcon className="h-3 w-3 text-muted-foreground shrink-0" />;
}

function defaults(type: ComponentType, canvasW: number): Partial<PageComponent> {
  switch (type) {
    // Text/Header rebuild: fontFamily is deliberately left unset here — there
    // is no default/system font anymore, only admin-uploaded custom fonts
    // (see FontAssetItem/loadFonts). addComponent()'s "+ Add Text"/"+ Add
    // Heading" callers patch in the first uploaded font's family when one
    // exists; until then it falls back to the browser default at render time.
    case "header": return { width: Math.round(canvasW * 0.35), height: 70, content: "Heading", fontSize: 32, fontColor: "#111111", bgColor: "transparent", textAlign: "center", letterSpacing: 0, lineHeight: 1.2, opacity: 100, rotation: 0 };
    case "text":   return { width: Math.round(canvasW * 0.28), height: 96, content: "Edit text", fontSize: 16, fontColor: "#111111", bgColor: "transparent", textAlign: "left", letterSpacing: 0, lineHeight: 1.4, opacity: 100, rotation: 0 };
    case "shape":  return { width: Math.round(canvasW * 0.12), height: 120, bgColor: "#3b82f6", borderRadius: 8, opacity: 100, shapeType: "rectangle", rotation: 0 };
    case "image":  return { width: Math.round(canvasW * 0.18), height: 180, bgColor: "#e5e7eb", borderRadius: 4, rotation: 0 };
    case "button": return { width: Math.round(canvasW * 0.1), height: 56, content: "Click me", fontSize: 16, fontFamily: "system-ui, -apple-system, sans-serif", fontWeight: 600, fontColor: "#ffffff", bgColor: "#3b82f6", borderRadius: 8, buttonStyle: "solid", borderColor: "#3b82f6", hoverBgColor: "#2563eb", hoverFontColor: "#ffffff", buttonAction: { type: "url", value: "" }, rotation: 0 };
    case "carousel": return { width: Math.round(canvasW * 0.6), height: 220, bgColor: "transparent", borderRadius: 12, opacity: 100, rotation: 0, carouselItems: [], carouselItemWidth: 160, carouselZoom: 1.25 };
    case "icon": return { width: 64, height: 64, fontColor: "#111111", fontSize: 32, opacity: 100, rotation: 0, iconName: "cart" };
    case "location-input": return { width: Math.round(canvasW * 0.3), height: 52, bgColor: "#ffffff", borderColor: "#e5e7eb", fontColor: "#111111", borderRadius: 8, locationPlaceholder: "Enter pickup location", locationLabel: "Pickup", rotation: 0 };
    case "map": return { width: Math.round(canvasW * 0.5), height: 320, borderRadius: 12, mapCenterLat: 12.9716, mapCenterLng: 77.5946, mapZoom: 13, mapMarkers: [], mapServiceRadiusKm: 5, rotation: 0 };
    case "datetime-picker": return { width: Math.round(canvasW * 0.3), height: 100, bgColor: "#ffffff", borderColor: "#e5e7eb", fontColor: "#111111", borderRadius: 8, dtDefaultOption: "today", dtTime: "09:00", rotation: 0 };
    case "vehicle-selector": return { width: Math.round(canvasW * 0.4), height: 120, bgColor: "transparent", borderRadius: 12, vehicleOptions: [
        { id: uid(), label: "Economy", iconId: "car", fareText: "₹99" },
        { id: uid(), label: "Premium", iconId: "car-side", fareText: "₹149" },
        { id: uid(), label: "SUV", iconId: "van-shuttle", fareText: "₹249" },
      ], rotation: 0 };
    case "driver-badge": return { width: Math.round(canvasW * 0.22), height: 90, bgColor: "#ffffff", borderRadius: 12, fontColor: "#111111", driverName: "Rajesh Kumar", driverRating: 4.8, driverVehicle: "Swift Dzire · KA-01-AB-1234", rotation: 0 };
    case "fare-display": return { width: Math.round(canvasW * 0.2), height: 140, bgColor: "#ffffff", borderRadius: 12, fontColor: "#111111", fareCurrency: "₹", fareBase: 50, fareDistanceKm: 5, fareRatePerKm: 12, fareSurgeMultiplier: 1, rotation: 0 };
    case "hero-carousel": return {
      // Narrow (mobile) canvases stack image-over-text, which needs proportionally
      // more height than the side-by-side desktop layout to avoid feeling cramped.
      width: canvasW, height: canvasW <= 500 ? Math.round(canvasW * 1.2) : Math.round(canvasW * 0.42), bgColor: "#111827", borderRadius: 0, opacity: 100, rotation: 0,
      heroSlides: [
        { id: uid(), headline: "Big Summer Sale", subtext: "Up to 50% off selected items, this week only.", buttonLabel: "Shop Now", buttonLink: "/products" },
        { id: uid(), headline: "New Arrivals", subtext: "Check out the latest additions to the collection.", buttonLabel: "Explore", buttonLink: "/products" },
        { id: uid(), headline: "Free Shipping", subtext: "On all orders over ₹999, for a limited time.", buttonLabel: "Learn More", buttonLink: "/products" },
      ],
      heroAutoplay: true, heroAutoplaySeconds: 5, heroShowArrows: true, heroShowDots: true, heroPeekPercent: 6,
      heroHeadlineColor: "#ffffff", heroSubtextColor: "#f3f4f6", heroOverlayOpacity: 35,
      heroCtaBgColor: "#ffffff", heroCtaFontColor: "#111111",
    };
    case "category-carousel": return {
      width: Math.round(canvasW * 0.9), height: 380, bgColor: "transparent", borderRadius: 0, opacity: 100, rotation: 0,
      catCarouselTitle: "Shop by Category", catCarouselSubtitle: "Find what you're looking for",
      catCarouselItems: [
        { id: uid(), name: "Electronics", link: "/category/electronics" },
        { id: uid(), name: "Fashion", link: "/category/fashion" },
        { id: uid(), name: "Home & Living", link: "/category/home-living" },
        { id: uid(), name: "Beauty", link: "/category/beauty" },
        { id: uid(), name: "Sports", link: "/category/sports" },
      ],
      catCarouselCardStyle: "image-first", catCarouselAspectRatio: "1:1", catCarouselCornerRadius: 12,
      catCarouselShowDescriptor: false, catCarouselShowBadge: false,
      catCarouselSnapMode: "single", catCarouselDesktopCards: 4,
      catCarouselGapDesktop: 16, catCarouselGapMobile: 12,
      catCarouselTitleColor: "#111111", catCarouselSubtitleColor: "#6b7280",
    };
    // header-block/footer-block are never created through this generic
    // addComponent(type) factory — they're created via addBlock() (the
    // "+ Add Header"/"+ Add Footer" buttons), which builds the BlockMeta
    // directly (see buildTemplateZone). This case only exists to keep the
    // switch exhaustive.
    case "header-block":
    case "footer-block":
      return { width: canvasW, height: 60, rotation: 0 };
  }
}

function makeWidgetText(
  groupId: string,
  x: number,
  y: number,
  width: number,
  height: number,
  content: string,
  patch: Partial<PageComponent> = {},
): PageComponent {
  return {
    id: uid(),
    type: "text",
    groupId,
    groupName: patch.groupName,
    x, y, width, height, content,
    fontSize: 18,
    fontFamily: "system-ui, -apple-system, sans-serif",
    fontWeight: 600,
    lineHeight: 1.2,
    fontColor: "#111827",
    bgColor: "transparent",
    textAlign: "left",
    opacity: 100,
    rotation: 0,
    ...patch,
  };
}

function makeWidgetShape(
  groupId: string,
  x: number,
  y: number,
  width: number,
  height: number,
  patch: Partial<PageComponent> = {},
): PageComponent {
  return {
    id: uid(),
    type: "shape",
    groupId,
    groupName: patch.groupName,
    x, y, width, height,
    bgColor: "#f8fafc",
    borderRadius: 8,
    opacity: 100,
    shapeType: "rectangle",
    rotation: 0,
    ...patch,
  };
}

function buildMarketWidget(id: MarketWidgetId, center: { x: number; y: number }, canvasW: number, canvasH: number): PageComponent[] {
  const scale = canvasW <= MOBILE_W ? 0.42 : 1;
  const w = Math.min(canvasW * 0.86, 520 * scale);
  const h = Math.min(canvasH * 0.55, 300 * scale);
  const x = center.x - w / 2;
  const y = center.y - h / 2;
  const gid = uid();
  const name = MARKET_WIDGETS.find((wgt) => wgt.id === id)?.label ?? "Market Widget";
  const card = (rx: number, ry: number, rw: number, rh: number, color = "#ffffff") =>
    makeWidgetShape(gid, x + rx * scale, y + ry * scale, rw * scale, rh * scale, { groupName: name, bgColor: color, borderRadius: 8 });
  const text = (rx: number, ry: number, rw: number, rh: number, content: string, patch: Partial<PageComponent> = {}) =>
    makeWidgetText(gid, x + rx * scale, y + ry * scale, rw * scale, rh * scale, content, { groupName: name, ...patch });

  if (id === "growth-chart") {
    return [
      card(0, 0, 520, 300, "#ffffff"),
      text(24, 22, 220, 30, "Revenue Pulse", { fontSize: 26, fontWeight: 800 }),
      text(24, 58, 190, 24, "+24.8% MoM", { fontSize: 18, fontWeight: 700, fontColor: "#047857" }),
      card(24, 106, 38, 150, "#dbeafe"), card(82, 74, 38, 182, "#bfdbfe"), card(140, 126, 38, 130, "#93c5fd"),
      card(198, 50, 38, 206, "#60a5fa"), card(256, 92, 38, 164, "#3b82f6"), card(314, 32, 38, 224, "#2563eb"),
      card(388, 46, 94, 54, "#ecfeff"), text(404, 58, 70, 20, "Live", { fontSize: 14, fontWeight: 800, fontColor: "#0e7490", textAlign: "center" }),
      text(386, 210, 110, 28, "Direct feed", { fontSize: 15, fontWeight: 700, fontColor: "#475569", textAlign: "center" }),
    ];
  }

  if (id === "live-feed") {
    return [
      card(0, 0, 520, 300, "#0f172a"),
      text(24, 24, 230, 32, "Live Market Feed", { fontSize: 26, fontWeight: 800, fontColor: "#ffffff" }),
      text(350, 26, 120, 24, "SERVER SYNC", { fontSize: 13, fontWeight: 800, fontColor: "#67e8f9", textAlign: "center" }),
      ...["Flash sale velocity +18%", "Category intent rising", "Inventory risk: low", "Creator traffic spike"].flatMap((label, i) => [
        card(24, 82 + i * 46, 472, 34, i % 2 ? "#1e293b" : "#172033"),
        text(42, 90 + i * 46, 300, 18, label, { fontSize: 15, fontWeight: 600, fontColor: "#e2e8f0" }),
        text(380, 90 + i * 46, 80, 18, i === 2 ? "Review" : "Auto", { fontSize: 13, fontWeight: 800, fontColor: i === 2 ? "#facc15" : "#86efac", textAlign: "center" }),
      ]),
    ];
  }

  if (id === "user-command") {
    return [
      card(0, 0, 520, 300, "#ffffff"),
      text(24, 22, 250, 30, "User Management", { fontSize: 26, fontWeight: 800 }),
      ...["Admin", "Publisher", "Analyst"].flatMap((role, i) => [
        card(24, 76 + i * 58, 472, 42, "#f8fafc"),
        makeWidgetShape(gid, x + 42 * scale, y + (86 + i * 58) * scale, 22 * scale, 22 * scale, { groupName: name, bgColor: ["#2563eb", "#059669", "#7c3aed"][i], shapeType: "circle", borderRadius: 999 }),
        text(80, 86 + i * 58, 140, 20, role, { fontSize: 16, fontWeight: 800 }),
        text(250, 86 + i * 58, 100, 20, i === 0 ? "Full access" : "Scoped", { fontSize: 13, fontWeight: 600, fontColor: "#64748b" }),
        text(388, 86 + i * 58, 72, 20, "Active", { fontSize: 13, fontWeight: 800, fontColor: "#047857", textAlign: "center" }),
      ]),
      card(24, 252, 128, 28, "#111827"), text(48, 258, 80, 16, "Invite User", { fontSize: 13, fontWeight: 800, fontColor: "#ffffff", textAlign: "center" }),
    ];
  }

  if (id === "brand-kit") {
    return [
      card(0, 0, 520, 300, "#ffffff"),
      text(24, 22, 230, 30, "Brand Kit", { fontSize: 26, fontWeight: 800 }),
      ...["#111827", "#2563eb", "#16a34a", "#f97316", "#f8fafc"].flatMap((color, i) => [
        makeWidgetShape(gid, x + (28 + i * 88) * scale, y + 78 * scale, 58 * scale, 58 * scale, { groupName: name, bgColor: color, borderRadius: 8 }),
        text(22 + i * 88, 150, 70, 18, color, { fontSize: 11, fontWeight: 700, fontColor: "#475569", textAlign: "center" }),
      ]),
      text(28, 196, 205, 28, "Heading / 800 / 32", { fontSize: 24, fontWeight: 800 }),
      text(28, 232, 260, 24, "Body / accessible contrast / reusable tokens", { fontSize: 16, fontWeight: 500, fontColor: "#475569" }),
      card(366, 200, 118, 44, "#111827"), text(394, 212, 62, 18, "CTA", { fontSize: 14, fontWeight: 800, fontColor: "#ffffff", textAlign: "center" }),
    ];
  }

  if (id === "deploy-flow") {
    return [
      card(0, 0, 520, 300, "#ffffff"),
      text(24, 22, 260, 30, "Publish Workflow", { fontSize: 26, fontWeight: 800 }),
      ...["Draft", "Review", "Version", "Deploy"].flatMap((step, i) => [
        makeWidgetShape(gid, x + (36 + i * 116) * scale, y + 104 * scale, 58 * scale, 58 * scale, { groupName: name, bgColor: i < 3 ? "#dcfce7" : "#dbeafe", shapeType: "circle", borderRadius: 999 }),
        text(24 + i * 116, 178, 82, 20, step, { fontSize: 14, fontWeight: 800, fontColor: "#334155", textAlign: "center" }),
      ]),
      card(42, 246, 436, 18, "#e2e8f0"),
      card(42, 246, 318, 18, "#2563eb"),
      text(328, 24, 150, 24, "Instant deploy", { fontSize: 14, fontWeight: 800, fontColor: "#2563eb", textAlign: "center" }),
    ];
  }

  return [
    card(0, 0, 520, 300, "#ffffff"),
    text(24, 22, 230, 30, "Trend Radar", { fontSize: 26, fontWeight: 800 }),
    text(24, 58, 300, 22, "Market-ready content modules", { fontSize: 15, fontWeight: 600, fontColor: "#64748b" }),
    ...["Trending now", "Demand spike", "Audience fit"].flatMap((label, i) => [
      card(24 + i * 160, 108, 136, 112, ["#eff6ff", "#ecfdf5", "#fff7ed"][i]),
      text(38 + i * 160, 130, 108, 22, label, { fontSize: 16, fontWeight: 800, textAlign: "center" }),
      text(42 + i * 160, 164, 100, 24, [`+42%`, `High`, `91/100`][i], { fontSize: 22, fontWeight: 900, fontColor: ["#2563eb", "#059669", "#ea580c"][i], textAlign: "center" }),
    ]),
    card(30, 250, 452, 18, "#e2e8f0"),
    card(30, 250, 336, 18, "#111827"),
  ];
}

// Applies a complete typography token to a component — the one function
// behind both the Text component's "Style" dropdown (general, stays editable
// afterward) and the Text Templates / Canva-groups feature (which additionally
// passes `lockedTypography: true` via `extra` to keep its pieces locked).
function textTokenPatch(token: TextToken, canvasW: number, extra: Partial<PageComponent> = {}): Partial<PageComponent> {
  const spec = TEXT_TOKENS[token];
  return {
    fontFamily: spec.fontFamily,
    fontSize: tokenFontSize(token, canvasW),
    fontWeight: spec.fontWeight,
    bold: spec.fontWeight >= 700,
    lineHeight: spec.lineHeight,
    letterSpacing: spec.letterSpacing,
    textTransform: spec.textTransform,
    textToken: token,
    ...extra,
  };
}

function resolveButtonStyles(comp: PageComponent, hovered: boolean) {
  const isSolid = !comp.buttonStyle || comp.buttonStyle === "solid";
  const isOutline = comp.buttonStyle === "outline";
  const isGhost = comp.buttonStyle === "ghost";
  const isLink = comp.buttonStyle === "link";
  const bg = hovered && comp.hoverBgColor ? comp.hoverBgColor : isSolid ? (comp.bgColor ?? "#3b82f6") : "transparent";
  const color = hovered && comp.hoverFontColor ? comp.hoverFontColor : (comp.fontColor ?? (isSolid ? "#ffffff" : (comp.bgColor ?? "#3b82f6")));
  const border = isOutline || isGhost ? `2px solid ${comp.borderColor ?? comp.bgColor ?? "#3b82f6"}` : "none";
  return { bg, color, border, isLink };
}

function hexToRgba(hex: string, alpha: number) {
  const clean = hex.replace("#", "");
  if (!/^[0-9a-fA-F]{6}$/.test(clean)) return `rgba(0, 0, 0, ${alpha})`;
  const value = Number.parseInt(clean, 16);
  const r = (value >> 16) & 255;
  const g = (value >> 8) & 255;
  const b = value & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function textEffectStyle(comp: PageComponent): React.CSSProperties {
  const effect = comp.textEffect ?? "none";
  const strength = Math.max(0, Math.min(100, comp.effectStrength ?? 30));
  const color = comp.fontColor ?? "#111111";
  const blur = Math.max(2, strength / 5);
  const spread = Math.max(1, strength / 16);

  if (effect === "glow") {
    return { textShadow: `0 0 ${blur}px ${hexToRgba(color, 0.75)}, 0 0 ${blur * 1.8}px ${hexToRgba(color, 0.45)}` };
  }
  if (effect === "outline") {
    return { WebkitTextStroke: `${Math.max(1, Math.round(strength / 25))}px ${color}`, color: "#ffffff" } as React.CSSProperties;
  }
  if (effect === "background") {
    return { backgroundColor: hexToRgba(color, Math.max(0.12, strength / 160)), boxShadow: `0 0 0 ${spread * 2}px ${hexToRgba(color, Math.max(0.08, strength / 260))}` };
  }
  if (effect === "hollow") {
    return { WebkitTextStroke: `${Math.max(1, Math.round(strength / 20))}px ${color}`, color: "transparent" } as React.CSSProperties;
  }
  if (effect === "neon") {
    return { textShadow: `0 0 ${blur}px ${hexToRgba(color, 0.95)}, 0 0 ${blur * 2.2}px ${hexToRgba(color, 0.7)}, 0 0 ${blur * 3}px ${hexToRgba("#00f5ff", 0.55)}` };
  }
  if (effect === "glitch") {
    const offset = Math.max(1, Math.round(strength / 18));
    return { textShadow: `${offset}px 0 ${hexToRgba("#ff005c", 0.9)}, -${offset}px 0 ${hexToRgba("#00f5ff", 0.9)}, 0 ${offset}px ${hexToRgba(color, 0.35)}` };
  }
  return {};
}

// ── Color picker with hex input ───────────────────────────────────────────────

function ColorPicker({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const [hex, setHex] = useState(value);
  useEffect(() => { setHex(value); }, [value]);

  function commit(raw: string) {
    const normalized = raw.startsWith("#") ? raw : `#${raw}`;
    if (/^#[0-9a-fA-F]{6}$/.test(normalized)) { onChange(normalized); setHex(normalized); }
    else setHex(value);
  }

  return (
    <div>
      <label className="text-[10px] text-muted-foreground block mb-0.5 uppercase tracking-wide">{label}</label>
      <div className="flex items-center gap-1">
        <input type="color" value={value} onChange={(e) => { onChange(e.target.value); setHex(e.target.value); }} className="h-6 w-7 rounded cursor-pointer border border-gray-700 bg-gray-900 p-0.5 shrink-0" />
        <input type="text" value={hex} onChange={(e) => setHex(e.target.value)} onBlur={(e) => commit(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") commit((e.target as HTMLInputElement).value); }} className="flex-1 h-6 text-[11px] border border-gray-700 bg-gray-900 text-gray-100 rounded px-1.5 font-mono min-w-0" maxLength={7} placeholder="#000000" />
      </div>
    </div>
  );
}

// ── Number input + stepper (Text size / letter spacing / line height) ─────────
function renderStepperInput(value: number, step: number, min: number, max: number, onChange: (v: number) => void) {
  const clamp = (v: number) => Math.min(max, Math.max(min, v));
  const round = (v: number) => Math.round(v / step) * step;
  return (
    <div className="flex items-center gap-1">
      <button type="button" onClick={() => onChange(clamp(round(value - step)))} className="h-6 w-6 shrink-0 flex items-center justify-center rounded border border-gray-700">
        <Minus className="h-3 w-3" />
      </button>
      <Input type="number" step={step} min={min} max={max} value={value}
        onChange={(e) => { const v = +e.target.value; if (Number.isFinite(v)) onChange(clamp(v)); }}
        className="h-6 text-xs px-1 text-center" />
      <button type="button" onClick={() => onChange(clamp(round(value + step)))} className="h-6 w-6 shrink-0 flex items-center justify-center rounded border border-gray-700">
        <Plus className="h-3 w-3" />
      </button>
    </div>
  );
}

// ── Font picker with real per-font preview (native <select> can't render this reliably) ──

function FontSelect({ value, onChange, options = FONT_FAMILIES }: { value: string; onChange: (v: string) => void; options?: typeof FONT_FAMILIES }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDocDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocDown);
    return () => document.removeEventListener("mousedown", onDocDown);
  }, []);

  const current = options.find((f) => f.value === value) ?? options[0];

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full h-6 flex items-center justify-between gap-1 text-xs border rounded px-1.5 bg-background text-left"
        style={{ fontFamily: current.value }}
      >
        <span className="truncate">{current.label}</span>
        <ChevronDown className="h-3 w-3 shrink-0 text-muted-foreground" />
      </button>
      {open && (
        <div className="absolute z-40 mt-1 left-0 right-0 max-h-52 overflow-y-auto rounded-md border border-gray-700 bg-gray-800 shadow-lg">
          {options.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => { onChange(f.value); setOpen(false); }}
              className={`block w-full text-left px-2 py-1 text-[13px] text-gray-100 ${f.value === value ? "bg-gray-700" : ""}`}
              style={{ fontFamily: f.value }}
            >
              {f.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Image picker: assets-first upload flow ─────────────────────────────────────
// Every image entry point in the editor (Image component, slideshow photos,
// carousel/hero slides, driver photo, etc.) goes through this one component so
// the workflow is identical everywhere: pick an existing asset, or upload a new
// one — which uploads straight to the asset library first and then drops you
// into the asset grid to explicitly select it, rather than silently attaching
// the just-uploaded file. A real upload progress bar (not just "Uploading…"
// text) is shown while the request is in flight.
interface AssetItem { key: string; url: string; name: string | null; size: number; lastModified: string | null }

// Custom uploaded font (see apps/web/src/lib/fonts.ts) — `family` is the CSS
// font-family value a Text/Header component's `fontFamily` field stores;
// `format` feeds the @font-face src's format() hint, injected globally by
// the root layout so this value just works wherever it's used.
export interface FontAssetItem { key: string; url: string; name: string; family: string; format: string; size?: number; lastModified?: string | null }

function ImagePickerButton({
  label, uploading, uploadProgress, assetItems, assetsLoading, loadAssets,
  onUpload, onSelect, buttonClassName, icon: Icon, children,
}: {
  label: string;
  uploading: boolean;
  uploadProgress: number;
  assetItems: AssetItem[] | null;
  assetsLoading: boolean;
  loadAssets: () => void;
  onUpload: (file: File) => Promise<string | null>;
  onSelect: (url: string) => void;
  buttonClassName?: string;
  icon?: React.ComponentType<{ className?: string }>;
  // Overrides the default icon+label trigger content — used by compact
  // thumbnail-style triggers (carousel/hero slide items) that show the
  // current image itself rather than a text button.
  children?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<"choose" | "assets">("choose");
  const ref = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function onDocDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocDown);
    return () => document.removeEventListener("mousedown", onDocDown);
  }, []);

  async function handleFile(file: File) {
    await onUpload(file);
    // After upload, show the asset grid (now including the new file, prepended
    // by the caller) so the user explicitly picks it — never auto-applied.
    setView("assets");
    loadAssets();
  }

  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => { setOpen((o) => !o); setView("choose"); }}
        className={buttonClassName ?? "flex items-center gap-1.5 cursor-pointer px-2 py-1 rounded border text-xs hover:bg-muted hover:text-gray-900 w-full"}>
        {children ?? (
          <>
            {Icon && <Icon className="h-3 w-3" />}
            {uploading ? `Uploading… ${uploadProgress}%` : label}
          </>
        )}
      </button>
      {open && (
        <div className="absolute z-50 mt-1 left-0 right-0 min-w-[220px] rounded-md border border-gray-700 bg-gray-800 shadow-lg p-2 flex flex-col gap-2 text-gray-100">
          {uploading ? (
            <div className="flex flex-col gap-1.5 p-1.5">
              <p className="text-[11px] text-gray-400">Uploading to assets…</p>
              <div className="h-1.5 w-full rounded-full bg-gray-700 overflow-hidden">
                <div className="h-full bg-blue-500 transition-all" style={{ width: `${uploadProgress}%` }} />
              </div>
            </div>
          ) : view === "choose" ? (
            <>
              <button type="button" onClick={() => { setView("assets"); loadAssets(); }}
                className="flex items-center gap-1.5 text-xs px-2 py-1.5 rounded text-left">
                <ImageIcon className="h-3 w-3" /> Select from Asset
              </button>
              <button type="button" onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 text-xs px-2 py-1.5 rounded text-left">
                <Plus className="h-3 w-3" /> Upload New Image
              </button>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between px-0.5">
                <button type="button" onClick={() => setView("choose")} className="text-[10px] text-gray-400">&larr; Back</button>
                <button type="button" onClick={() => fileInputRef.current?.click()} className="text-[10px] text-blue-400">Upload new</button>
              </div>
              {assetsLoading ? (
                <p className="text-[11px] text-gray-400 text-center py-3">Loading…</p>
              ) : (assetItems ?? []).length === 0 ? (
                <p className="text-[11px] text-gray-400 text-center py-3">No assets yet</p>
              ) : (
                <div className="grid grid-cols-3 gap-1 max-h-56 overflow-y-auto">
                  {(assetItems ?? []).map((a) => (
                    <button key={a.key} type="button" onClick={() => { onSelect(a.url); setOpen(false); }}
                      className="aspect-square rounded border overflow-hidden hover:ring-2 hover:ring-blue-400" title={a.url}>
                      <img src={a.url} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }} />
        </div>
      )}
    </div>
  );
}

// ── Preview canvas ─────────────────────────────────────────────────────────────

export function PreviewCanvas({ components, canvasW, canvasH }: { components: PageComponent[]; canvasW: number; canvasH: number }) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const pct = (v: number, total: number) => `${(v / total) * 100}%`;

  return (
    <div ref={ref} className="relative bg-white shadow-sm mx-auto" style={{ width: "100%", maxWidth: canvasW, aspectRatio: `${canvasW} / ${canvasH}` }}>
      {components.map((comp) => {
        const isHovered = hoveredId === comp.id;
        const isBtn = comp.type === "button";
        const isShape = comp.type === "shape";
        const isCarousel = comp.type === "carousel";
        const isIcon = comp.type === "icon";
        const isTaxi = comp.type === "location-input" || comp.type === "map" || comp.type === "datetime-picker" || comp.type === "vehicle-selector" || comp.type === "driver-badge" || comp.type === "fare-display";
        const isHero = comp.type === "hero-carousel";
        const isCatCarousel = comp.type === "category-carousel";
        const btn = isBtn ? resolveButtonStyles(comp, isHovered) : null;
        return (
          <div key={comp.id} className="absolute"
            style={{ left: pct(comp.x, canvasW), top: pct(comp.y, canvasH), width: pct(comp.width, canvasW), height: pct(comp.height, canvasH), borderRadius: isBtn || isShape || isCarousel || isIcon || isTaxi || isHero || isCatCarousel ? 0 : (comp.borderRadius ?? 0), backgroundColor: isBtn || isShape || isCarousel || isIcon || isTaxi || isHero || isCatCarousel ? "transparent" : (comp.bgColor === "transparent" ? "transparent" : (comp.bgColor ?? "transparent")), transform: `rotate(${comp.rotation ?? 0}deg)`, transformOrigin: "center", boxShadow: buildBoxShadow(comp), filter: buildBlurFilter(comp) }}
            onMouseEnter={() => isBtn && setHoveredId(comp.id)} onMouseLeave={() => isBtn && setHoveredId(null)}
          >
            {(comp.type === "text" || comp.type === "header") && (
              <div className="w-full h-full flex items-center overflow-hidden px-1"
                style={{ fontSize: `calc(${comp.fontSize ?? 16}px * (${ref.current?.clientWidth ?? canvasW} / ${canvasW}))`, fontFamily: comp.fontFamily ?? "system-ui, -apple-system, sans-serif", fontWeight: comp.fontWeight ?? (comp.bold ? 700 : 400), fontStyle: comp.italic ? "italic" : "normal", lineHeight: comp.lineHeight ?? 1.4, letterSpacing: `${comp.letterSpacing ?? 0}px`, color: comp.fontColor ?? "#111", opacity: (comp.opacity ?? 100) / 100, textAlign: comp.textAlign ?? "left", textTransform: comp.textTransform ?? "none", textDecoration: textDecorationLine(comp), justifyContent: comp.textAlign === "center" ? "center" : comp.textAlign === "right" ? "flex-end" : "flex-start" }}>
                {renderTextBody(comp)}
              </div>
            )}
            {isShape && (
              <div className="w-full h-full" style={{ backgroundColor: comp.bgColor ?? "#3b82f6", borderRadius: shapeBorderRadius(comp), clipPath: shapeClipPath(comp.shapeType), opacity: (comp.opacity ?? 100) / 100 }} />
            )}
            {isCarousel && (
              <div className="w-full h-full" style={{ backgroundColor: comp.bgColor === "transparent" ? "transparent" : (comp.bgColor ?? "transparent"), opacity: (comp.opacity ?? 100) / 100 }}>
                <CarouselBody comp={comp} editable />
              </div>
            )}
            {isIcon && <IconGlyph comp={comp} />}
            {comp.type === "location-input" && <LocationInputBody comp={comp} />}
            {comp.type === "map" && <MapBody comp={comp} />}
            {comp.type === "datetime-picker" && <DateTimePickerBody comp={comp} />}
            {comp.type === "vehicle-selector" && <VehicleSelectorBody comp={comp} />}
            {comp.type === "driver-badge" && <DriverBadgeBody comp={comp} />}
            {comp.type === "fare-display" && <FareDisplayBody comp={comp} />}
            {isHero && <HeroCarouselBody comp={comp} />}
            {isCatCarousel && <CategoryCarouselBody comp={comp} canvasW={canvasW} />}
            {comp.type === "image" && <ImageBody comp={comp} placeholderClass="text-gray-300" />}
            {isBtn && btn && (
              <div className="w-full h-full flex items-center justify-center overflow-hidden cursor-pointer transition-colors duration-150"
                style={{ borderRadius: comp.borderRadius ?? 8, backgroundColor: btn.bg, color: btn.color, border: btn.border, textDecoration: btn.isLink ? "underline" : "none", fontSize: `calc(${comp.fontSize ?? 16}px * (${ref.current?.clientWidth ?? canvasW} / ${canvasW}))`, fontFamily: comp.fontFamily ?? "system-ui, -apple-system, sans-serif", fontWeight: comp.fontWeight ?? 600 }}>
                {comp.content ?? "Button"}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Main editor ───────────────────────────────────────────────────────────────

interface PageEditorProps { slug: string; label?: string }

const VIEW_STORAGE_KEY = "iiinbox-editor-view";
const LEFT_SIDEBAR_HIDDEN_KEY = "iiinbox-editor-left-hidden";
const RIGHT_SIDEBAR_HIDDEN_KEY = "iiinbox-editor-right-hidden";

export function PageEditor({ slug, label }: PageEditorProps) {
  const router = useRouter();
  // Persisted across refreshes (localStorage) so switching to Mobile and
  // reloading — e.g. mid-edit — doesn't silently bounce back to Desktop.
  // Always starts at "desktop" and restores from localStorage in an effect
  // (not a lazy useState initializer) — this component is server-rendered
  // before hydration, where `window`/localStorage don't exist yet, so reading
  // it during initial render would make the client's first render disagree
  // with the server's HTML and trigger a hydration mismatch.
  const [view, setView] = useState<ViewMode>("desktop");
  useEffect(() => {
    const stored = window.localStorage.getItem(VIEW_STORAGE_KEY);
    if (stored === "mobile") setView("mobile");
  }, []);
  useEffect(() => {
    window.localStorage.setItem(VIEW_STORAGE_KEY, view);
  }, [view]);
  const [templateDesktopComponents, setTemplateDesktopComponents] = useState<PageComponent[]>([]);
  const [templateMobileComponents, setTemplateMobileComponents] = useState<PageComponent[]>([]);
  const [templateDesktopHeight, setTemplateDesktopHeight] = useState(DEFAULT_DESKTOP_H);
  const [templateMobileHeight, setTemplateMobileHeight] = useState(DEFAULT_MOBILE_H);
  // Header/Footer are page-independent — each page's own config embeds its own
  // header/template/footer (see the single combined PUT in save() below); editing
  // Header on one page never touches another page's Header. Same free-form canvas
  // mechanics as Template either way. `activeZone` selects which zone's arrays the
  // rest of this component (canvas, mutators, undo/redo) currently operates on.
  const [activeZone, setActiveZone] = useState<Zone>("template");
  const [headerDesktopComponents, setHeaderDesktopComponents] = useState<PageComponent[]>([]);
  const [headerMobileComponents, setHeaderMobileComponents] = useState<PageComponent[]>([]);
  // Multiple headers/footers, any of 4 sides (see lib/page-template-zones.ts
  // and the BlockMeta type above). blocksDesktop/blocksMobile hold every
  // block's metadata (dock/size/rotation/colour/scroll thresholds) — but only
  // the ACTIVE header block's and ACTIVE footer block's own components are
  // "live" in header/footerDesktop/MobileComponents; everything else's
  // components sit dormant in its own BlockMeta.components until selected.
  // Switching which block is active (setActiveBlock below) saves the outgoing
  // block's live components back into its BlockMeta entry and loads the
  // incoming one — the same "save current, load new" pattern already used
  // for view/page switching elsewhere in this file.
  const [blocksDesktop, setBlocksDesktop] = useState<BlockMeta[]>([]);
  const [blocksMobile, setBlocksMobile] = useState<BlockMeta[]>([]);
  const [activeHeaderId, setActiveHeaderId] = useState<{ desktop: string | null; mobile: string | null }>({ desktop: null, mobile: null });
  const [activeFooterId, setActiveFooterId] = useState<{ desktop: string | null; mobile: string | null }>({ desktop: null, mobile: null });
  const [blockHideUpPxDraft, setBlockHideUpPxDraft] = useState<string | null>(null);
  const [blockHideDownPxDraft, setBlockHideDownPxDraft] = useState<string | null>(null);
  // Canvas Background — page-level (not per-zone), stored alongside name/header/
  // template/footer in the same config row, so it's naturally per-page and
  // round-trips through the existing save/load path with no schema change.
  const [canvasBgColor, setCanvasBgColor] = useState("#ffffff");
  // Logo & Favicon — genuinely global (not per-page, unlike everything else
  // in this component): one row in the new SiteSettings table, shared across
  // every page's header. Fetched once on mount, independent of `slug`.
  const [siteSettings, setSiteSettings] = useState<{
    logoUrl: string | null; logoWidth: number; logoAlign: "left" | "center" | "right"; logoLink: string;
    faviconUrl: string | null; faviconContentType: string;
  }>({ logoUrl: null, logoWidth: 120, logoAlign: "left", logoLink: "/", faviconUrl: null, faviconContentType: "image/png" });
  const [logoUploading, setLogoUploading] = useState(false);
  const [faviconUploading, setFaviconUploading] = useState(false);
  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => {
        if (!d || typeof d !== "object") return;
        setSiteSettings({
          logoUrl: d.logoUrl ?? null,
          logoWidth: typeof d.logoWidth === "number" ? d.logoWidth : 120,
          logoAlign: d.logoAlign === "center" || d.logoAlign === "right" ? d.logoAlign : "left",
          logoLink: typeof d.logoLink === "string" ? d.logoLink : "/",
          faviconUrl: d.faviconUrl ?? null,
          faviconContentType: typeof d.faviconContentType === "string" ? d.faviconContentType : "image/png",
        });
      })
      .catch(() => {});
  }, []);
  // Deliberate vs. inferred edits are both immediate PUTs, unlike per-component
  // canvas edits — these are rare, deliberate actions (upload/toggle), not
  // continuous drags, so the existing 4s autosave debounce isn't needed here.
  function updateSiteSettings(patch: Partial<typeof siteSettings>) {
    const next = { ...siteSettings, ...patch };
    setSiteSettings(next);
    fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(next),
    }).catch(() => {});
  }
  function uploadSettingsImage(file: File, onProgress: (pct: number) => void): Promise<{ url: string; contentType: string } | null> {
    // No compression here (unlike uploadImageWithProgress above) — logo/
    // favicon files are typically small brand assets already, and
    // compressImageForUpload's JPEG re-encode would strip transparency,
    // which matters a lot more for a logo/favicon than a content photo.
    return new Promise((resolve) => {
      const fd = new FormData(); fd.append("file", file);
      const xhr = new XMLHttpRequest();
      xhr.open("POST", "/api/settings/upload");
      xhr.upload.onprogress = (e) => { if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100)); };
      xhr.onload = () => {
        if (xhr.status < 200 || xhr.status >= 300) { resolve(null); return; }
        try {
          const data = JSON.parse(xhr.responseText);
          resolve(data.url ? { url: data.url, contentType: data.contentType ?? file.type } : null);
        } catch { resolve(null); }
      };
      xhr.onerror = () => resolve(null);
      xhr.send(fd);
    });
  }
  async function handleLogoUpload(file: File) {
    setLogoUploading(true);
    try {
      const result = await uploadSettingsImage(file, () => {});
      if (result) updateSiteSettings({ logoUrl: result.url });
    } finally { setLogoUploading(false); }
  }
  async function handleFaviconUpload(file: File) {
    setFaviconUploading(true);
    try {
      const result = await uploadSettingsImage(file, () => {});
      if (result) updateSiteSettings({ faviconUrl: result.url, faviconContentType: result.contentType });
    } finally { setFaviconUploading(false); }
  }
  const [footerDesktopComponents, setFooterDesktopComponents] = useState<PageComponent[]>([]);
  const [footerMobileComponents, setFooterMobileComponents] = useState<PageComponent[]>([]);
  const [pageLabel, setPageLabel] = useState(label ?? "");
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(label ?? "");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [marquee, setMarquee] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  // Double-click-to-edit-inline for Text/Header — content editing now lives
  // entirely on the canvas (see new Typography panel, which dropped its old
  // "Edit text" textarea). Only one component can be in inline-edit mode at
  // a time; entering it deliberately doesn't touch selection/drag state.
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("idle");
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const [changeCount, setChangeCount] = useState(0);
  const [versions, setVersions] = useState<VersionSnapshot[]>([]);
  const savingRef = useRef(false);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  // Preview is now folder-level only (see openFolderPreview/previewFolder
  // above) — no more in-editor "preview the page I'm currently on" toggle.
  const [openTool, setOpenTool] = useState<ComponentType | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [alignmentGuides, setAlignmentGuides] = useState<AlignmentGuideLine[]>([]);
  const [dragLayerId, setDragLayerId] = useState<string | null>(null);
  const [dragOverLayerId, setDragOverLayerId] = useState<string | null>(null);
  const [layersOpen, setLayersOpen] = useState(false);
  const [imageSizePreset, setImageSizePreset] = useState<ImageSizePreset>("landscape");
  const [categoryOptions, setCategoryOptions] = useState<CategoryOption[] | null>(null);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  // ── Design-tool redesign: additive UI state (inert until wired into JSX) ──
  const [zoom, setZoom] = useState(100);
  const [activeLeftTab, setActiveLeftTab] = useState<"project" | "assets" | "history">("project");
  // Manual-only sidebar toggle — no hover-reveal. Visible/hidden is purely
  // the persisted `collapsed` flag; the only way to change it is clicking
  // the arrow button (see hideLeftSidebar/hideRightSidebar and the "Show
  // panel" buttons in the JSX below).
  const [leftSidebarCollapsed, setLeftSidebarCollapsed] = useState(false);
  const [rightSidebarCollapsed, setRightSidebarCollapsed] = useState(false);
  useEffect(() => {
    try {
      setLeftSidebarCollapsed(localStorage.getItem(LEFT_SIDEBAR_HIDDEN_KEY) === "1");
      setRightSidebarCollapsed(localStorage.getItem(RIGHT_SIDEBAR_HIDDEN_KEY) === "1");
    } catch {}
  }, []);
  // Skip each persist-effect's very first invocation — on mount it runs
  // with the stale `false` default (this same commit's restore-effect above
  // has already scheduled the real value via setState, but that update
  // hasn't landed yet when this effect's closure captured its value), so
  // writing here would silently clobber whatever was actually in
  // localStorage before the restore ever gets to apply it. Skipping the
  // first run just means "don't write during mount" — every write after
  // that (whether it's the restore's own re-render or a real user toggle)
  // reflects the current, correct value.
  const leftPersistSkipFirst = useRef(true);
  const rightPersistSkipFirst = useRef(true);
  useEffect(() => {
    if (leftPersistSkipFirst.current) { leftPersistSkipFirst.current = false; return; }
    try { localStorage.setItem(LEFT_SIDEBAR_HIDDEN_KEY, leftSidebarCollapsed ? "1" : "0"); } catch {}
  }, [leftSidebarCollapsed]);
  useEffect(() => {
    if (rightPersistSkipFirst.current) { rightPersistSkipFirst.current = false; return; }
    try { localStorage.setItem(RIGHT_SIDEBAR_HIDDEN_KEY, rightSidebarCollapsed ? "1" : "0"); } catch {}
  }, [rightSidebarCollapsed]);
  function hideLeftSidebar() { setLeftSidebarCollapsed(true); }
  function hideRightSidebar() { setRightSidebarCollapsed(true); }
  const leftSidebarVisible = !leftSidebarCollapsed;
  const rightSidebarVisible = !rightSidebarCollapsed;
  const [openPropertySections, setOpenPropertySections] = useState<Record<PropertySection, boolean>>({
    layout: true, appearance: true, typography: true, responsive: true, effects: true, advanced: false,
  });
  const pagesList = usePagesList();
  const projectsTree = useProjectsTree();
  // pagesList.createPage assigns folderId (when set) via a direct fetch
  // inside usePagesList itself — that hook has no knowledge of projectsTree,
  // so its own tree state would otherwise miss the newly-created page until
  // an unrelated action happened to refetch it. Wrap it here instead.
  async function createPageAndSync(opts: Parameters<typeof pagesList.createPage>[0], onDone?: () => void) {
    await pagesList.createPage(opts, onDone);
    await projectsTree.fetchProjects();
  }
  // Folder-level Preview overlay — fetches the target folder's root page draft
  // fresh (GET /api/pages/:slug, same uncached route the editor itself loads
  // from) rather than reusing PageEditor's own live state, since Preview can
  // now be opened for any folder's root page, not just the one being edited.
  const [previewFolder, setPreviewFolder] = useState<ProjectFolder | null>(null);
  const [previewPageData, setPreviewPageData] = useState<PreviewPageData | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  async function openFolderPreview(folder: ProjectFolder) {
    const rootSlug = folder.rootPage?.page;
    if (!rootSlug) return;
    setPreviewFolder(folder);
    setPreviewPageData(null);
    setPreviewLoading(true);
    try {
      const res = await fetch(`/api/pages/${encodeURIComponent(rootSlug)}`, { cache: "no-store" });
      const d = await res.json();
      const desktopZones = extractZonesFromTemplate(d?.template?.desktop, DEFAULT_DESKTOP_H);
      const mobileZones = extractZonesFromTemplate(d?.template?.mobile, DEFAULT_MOBILE_H);
      setPreviewPageData({
        blocks: { desktop: desktopZones.blocks, mobile: mobileZones.blocks },
        template: { desktop: desktopZones.template, mobile: mobileZones.template },
      } as PreviewPageData);
    } finally {
      setPreviewLoading(false);
    }
  }
  const [publishingFromPreview, setPublishingFromPreview] = useState(false);
  async function handlePublishFolder(folder: ProjectFolder) {
    const ok = await projectsTree.publishFolder(folder.id);
    if (ok) await projectsTree.fetchProjects();
    return ok;
  }
  async function handlePublishProject(projectId: string) {
    const ok = await projectsTree.publishProject(projectId);
    if (ok) await projectsTree.fetchProjects();
    return ok;
  }
  // Cross-folder drag/drop (existing drag/dragOver/drop state, generalized
  // from the old flat pinned-then-custom Pages list to the new tree) — same
  // pattern as the Layers tree's drag state above.
  const [dragPageSlug, setDragPageSlug] = useState<string | null>(null);
  const [dragOverBucketId, setDragOverBucketId] = useState<string | null>(null);
  const [dragOverPageSlug, setDragOverPageSlug] = useState<string | null>(null);
  async function reorderBucket(bucketSlugs: string[]) {
    try {
      await fetch("/api/pages/reorder", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slugs: bucketSlugs }),
      });
    } finally {
      pagesList.fetchPages();
      projectsTree.fetchProjects();
    }
  }
  const [newPageOpen, setNewPageOpen] = useState(false);
  // Set when "+" is clicked on a folder row (vs. the Unassigned bucket's own
  // "+") — the new page is assigned straight into that folder. Null means
  // "land in Unassigned", the existing default.
  const [newPageFolderId, setNewPageFolderId] = useState<string | null>(null);
  // Tree "..." menu (project or folder row) — id of whichever row's menu is
  // open, or null. Same single-open-at-a-time pattern as openRowMenu in the
  // Layers tree above.
  const [openTreeMenu, setOpenTreeMenu] = useState<string | null>(null);
  // Folder "Connect to" box (item 6) — which folder's domain/subdomain
  // dropdown is open, plus the draft text for creating a brand-new subdomain
  // from within it.
  const [connectMenuFolderId, setConnectMenuFolderId] = useState<string | null>(null);
  const [newSubdomainInput, setNewSubdomainInput] = useState("");
  const [connectError, setConnectError] = useState<string | null>(null);
  const [confirmDeleteFolderId, setConfirmDeleteFolderId] = useState<string | null>(null);
  const [confirmDeleteProjectId, setConfirmDeleteProjectId] = useState<string | null>(null);
  const [newFolderProjectId, setNewFolderProjectId] = useState<string | null>(null);
  const [newFolderNameInput, setNewFolderNameInput] = useState("");
  // Project drag-reorder — separate from the page drag state above since a
  // project row and a page row are never valid drop targets for each other.
  const [dragProjectId, setDragProjectId] = useState<string | null>(null);
  const [dragOverProjectId, setDragOverProjectId] = useState<string | null>(null);
  const [assetItems, setAssetItems] = useState<AssetItem[] | null>(null);
  const [assetsLoading, setAssetsLoading] = useState(false);
  const [renamingAssetKey, setRenamingAssetKey] = useState<string | null>(null);
  const [renameAssetInput, setRenameAssetInput] = useState("");
  // Custom fonts (Text component's font-upload system) — loaded eagerly on
  // mount (unlike assetItems, which loads lazily when the Upload tab opens)
  // since the Text properties panel's font dropdown can be opened before the
  // Upload tab ever has been.
  const [fontItems, setFontItems] = useState<FontAssetItem[] | null>(null);
  const [fontsLoading, setFontsLoading] = useState(false);
  const [uploadingFont, setUploadingFont] = useState(false);
  const [fontUploadProgress, setFontUploadProgress] = useState(0);
  // Metadata-only rename (see StorageService.rename) — the key/URL never
  // changes, so this can't break any page that already placed this image.
  async function commitAssetRename(key: string) {
    const name = renameAssetInput.trim();
    setRenamingAssetKey(null);
    if (!name) return;
    setAssetItems((prev) => (prev ? prev.map((a) => (a.key === key ? { ...a, name } : a)) : prev));
    try {
      await fetch("/api/page-config/assets", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, name }),
      });
    } catch {}
  }
  // Reusable Components sidebar (opt-in — see "Save as Reusable Component" in
  // the right-click menu). Fetched once on mount since it's a persistent drag
  // source, not a lazily-opened accordion like Image's asset picker above.
  const [reusableComponents, setReusableComponents] = useState<ReusableComponentEntry[]>([]);
  const [reusablePrompt, setReusablePrompt] = useState<{ id: string; name: string; x: number; y: number } | null>(null);
  const refreshReusableComponents = useCallback(() => {
    fetch("/api/page-config/reusable-components")
      .then((r) => r.json())
      .then((data) => setReusableComponents(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);
  useEffect(() => { refreshReusableComponents(); }, [refreshReusableComponents]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadFonts(); }, []);
  // Marking a component reusable only updates local editor state immediately —
  // the actual PUT that persists it happens on the debounced autosave (~4s
  // later, see the syncStatus effect below). Refetching the sidebar list right
  // away would race that and miss the just-added component, so instead flag
  // that a refresh is owed and fire it once syncStatus confirms the save
  // actually landed.
  const [reusableRefreshPending, setReusableRefreshPending] = useState(false);
  // syncStatus is very likely already "synced" (steady state) at the moment
  // reusableRefreshPending is set, and the sibling effect that flips it to
  // "dirty" hasn't run yet in this same commit — so "synced" alone isn't a
  // reliable trigger. Wait for an actual dirty/syncing → synced transition.
  const sawDirtySinceReusableFlag = useRef(false);
  useEffect(() => {
    if (!reusableRefreshPending) return;
    if (syncStatus === "dirty" || syncStatus === "syncing") {
      sawDirtySinceReusableFlag.current = true;
    } else if (syncStatus === "synced" && sawDirtySinceReusableFlag.current) {
      refreshReusableComponents();
      setReusableRefreshPending(false);
      sawDirtySinceReusableFlag.current = false;
    }
  }, [reusableRefreshPending, syncStatus, refreshReusableComponents]);
  // ── Layers tree state (Header/Template/Footer zones) ──────────────────────
  const [expandedZones, setExpandedZones] = useState<Record<Zone, boolean>>({ header: true, template: true, footer: true });
  const [zoneAddMenuOpen, setZoneAddMenuOpen] = useState<Zone | null>(null);
  const [openRowMenu, setOpenRowMenu] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameInput, setRenameInput] = useState("");
  const [expandedContainers, setExpandedContainers] = useState<Record<string, boolean>>({});
  const [layerSearch, setLayerSearch] = useState("");
  const nameInputRef = useRef<HTMLInputElement>(null);
  // Pinned pages never get a delete button — any folder's root page across
  // any project, not just the default project's literal home/seller-dashboard/
  // rider-dashboard slugs (custom projects get their own root pages with
  // generated slugs — see createProject in page-config.service.ts). The
  // backend also rejects re-parenting a root page out of its own folder
  // (movePageToFolder) for the same "a folder must always keep its root
  // page" reason.
  const isPinnedPage = projectsTree.projects.some((p) => p.folders.some((f) => f.rootPage?.page === slug));

  // Block helpers — header/footer "height" is now the ACTIVE block's own
  // `size` field inside blocksDesktop/blocksMobile (dock-relative thickness:
  // height for top/bottom, width for left/right), not standalone state.
  function activeBlockSize(kind: "header" | "footer", vp: ViewMode): number {
    const blocks = vp === "desktop" ? blocksDesktop : blocksMobile;
    const activeId = (kind === "header" ? activeHeaderId : activeFooterId)[vp];
    const found = blocks.find((b) => b.id === activeId);
    if (found) return found.size;
    return kind === "header"
      ? (vp === "desktop" ? DEFAULT_HEADER_DESKTOP_H : DEFAULT_HEADER_MOBILE_H)
      : (vp === "desktop" ? DEFAULT_FOOTER_DESKTOP_H : DEFAULT_FOOTER_MOBILE_H);
  }
  function setActiveBlockSize(kind: "header" | "footer", vp: ViewMode, v: React.SetStateAction<number>) {
    const setBlocks = vp === "desktop" ? setBlocksDesktop : setBlocksMobile;
    const activeId = (kind === "header" ? activeHeaderId : activeFooterId)[vp];
    setBlocks((prev) => prev.map((b) => (b.id === activeId ? { ...b, size: typeof v === "function" ? (v as (p: number) => number)(b.size) : v } : b)));
  }
  // Switches which block (of the given kind) is "active" — i.e. which one's
  // components are loaded into the header/footer zone-canvas for editing.
  // Saves the outgoing block's live components back into its own BlockMeta
  // entry first, then loads the incoming block's saved components — the same
  // "save current, load new" pattern view/page switching already uses
  // elsewhere in this file, just applied to a header/footer slot instead.
  function setActiveBlock(kind: "header" | "footer", vp: ViewMode, blockId: string | null) {
    const blocks = vp === "desktop" ? blocksDesktop : blocksMobile;
    const setBlocks = vp === "desktop" ? setBlocksDesktop : setBlocksMobile;
    const liveComponents = kind === "header"
      ? (vp === "desktop" ? headerDesktopComponents : headerMobileComponents)
      : (vp === "desktop" ? footerDesktopComponents : footerMobileComponents);
    const outgoingId = (kind === "header" ? activeHeaderId : activeFooterId)[vp];
    setBlocks((prev) => prev.map((b) => (b.id === outgoingId ? { ...b, components: liveComponents } : b)));
    const incoming = blocks.find((b) => b.id === blockId);
    const setLive = kind === "header"
      ? (vp === "desktop" ? setHeaderDesktopComponents : setHeaderMobileComponents)
      : (vp === "desktop" ? setFooterDesktopComponents : setFooterMobileComponents);
    setLive(incoming ? incoming.components : []);
    (kind === "header" ? setActiveHeaderId : setActiveFooterId)((prev) => ({ ...prev, [vp]: blockId }));
  }
  // Reads/patches the block currently active for `kind` on the CURRENT view
  // — used by the settings panel (dock/size/rotation/colour/hideOnScroll).
  function activeBlock(kind: "header" | "footer"): BlockMeta | undefined {
    const blocks = view === "desktop" ? blocksDesktop : blocksMobile;
    const activeId = (kind === "header" ? activeHeaderId : activeFooterId)[view];
    return blocks.find((b) => b.id === activeId);
  }
  function updateActiveBlock(kind: "header" | "footer", patch: Partial<BlockMeta>) {
    const setBlocks = view === "desktop" ? setBlocksDesktop : setBlocksMobile;
    const activeId = (kind === "header" ? activeHeaderId : activeFooterId)[view];
    setBlocks((prev) => prev.map((b) => (b.id === activeId ? { ...b, ...patch } : b)));
  }
  function addBlock(kind: "header" | "footer") {
    const id = uid();
    const block: BlockMeta = {
      id, kind, dock: kind === "header" ? "top" : "bottom",
      size: kind === "header" ? (view === "desktop" ? DEFAULT_HEADER_DESKTOP_H : DEFAULT_HEADER_MOBILE_H) : (view === "desktop" ? DEFAULT_FOOTER_DESKTOP_H : DEFAULT_FOOTER_MOBILE_H),
      rotation: 0, bgColor: "#ffffff",
      hideOnScrollUpPx: null, hideOnScrollDownPx: kind === "header" ? 1400 : null,
      components: [],
    };
    // Deliberately viewport-scoped (not mirrored to the other view) — see
    // item 5, Desktop/Mobile are fully independent, and adding a block while
    // looking at one should never silently create one on the other.
    const setBlocks = view === "desktop" ? setBlocksDesktop : setBlocksMobile;
    setBlocks((prev) => [...prev, block]);
    setActiveBlock(kind, view, id);
  }
  function removeBlock(kind: "header" | "footer", blockId: string) {
    const blocks = view === "desktop" ? blocksDesktop : blocksMobile;
    const setBlocks = view === "desktop" ? setBlocksDesktop : setBlocksMobile;
    const remaining = blocks.filter((b) => b.id !== blockId);
    setBlocks(remaining);
    const isActive = (kind === "header" ? activeHeaderId : activeFooterId)[view] === blockId;
    if (isActive) {
      const next = remaining.find((b) => b.kind === kind) ?? null;
      const setLive = kind === "header"
        ? (view === "desktop" ? setHeaderDesktopComponents : setHeaderMobileComponents)
        : (view === "desktop" ? setFooterDesktopComponents : setFooterMobileComponents);
      setLive(next ? next.components : []);
      (kind === "header" ? setActiveHeaderId : setActiveFooterId)((prev) => ({ ...prev, [view]: next?.id ?? null }));
    }
  }

  // Zone lookup — the single place that resolves "which zone's arrays are we
  // editing right now" for the rest of this component. Kept as three flat
  // per-zone-per-view array pairs (not a `zone` field on PageComponent) so
  // every existing mutator below keeps operating on one complete flat array.
  // "header"/"footer" here mean "whichever header/footer block is currently
  // active" (see activeHeaderId/activeFooterId) — a page can have many more
  // blocks than that, but only one of each kind is ever the live edit target.
  const zoneComponents: Record<Zone, Record<ViewMode, PageComponent[]>> = {
    header:   { desktop: headerDesktopComponents,   mobile: headerMobileComponents },
    template: { desktop: templateDesktopComponents, mobile: templateMobileComponents },
    footer:   { desktop: footerDesktopComponents,   mobile: footerMobileComponents },
  };
  const zoneHeights: Record<Zone, Record<ViewMode, number>> = {
    header:   { desktop: activeBlockSize("header", "desktop"), mobile: activeBlockSize("header", "mobile") },
    template: { desktop: templateDesktopHeight, mobile: templateMobileHeight },
    footer:   { desktop: activeBlockSize("footer", "desktop"), mobile: activeBlockSize("footer", "mobile") },
  };
  const zoneSetters: Record<Zone, {
    setDesktop: (v: React.SetStateAction<PageComponent[]>) => void;
    setMobile: (v: React.SetStateAction<PageComponent[]>) => void;
    setDesktopHeight: (v: React.SetStateAction<number>) => void;
    setMobileHeight: (v: React.SetStateAction<number>) => void;
  }> = {
    header:   { setDesktop: setHeaderDesktopComponents,   setMobile: setHeaderMobileComponents,   setDesktopHeight: (v) => setActiveBlockSize("header", "desktop", v), setMobileHeight: (v) => setActiveBlockSize("header", "mobile", v) },
    template: { setDesktop: setTemplateDesktopComponents, setMobile: setTemplateMobileComponents, setDesktopHeight: setTemplateDesktopHeight, setMobileHeight: setTemplateMobileHeight },
    footer:   { setDesktop: setFooterDesktopComponents,   setMobile: setFooterMobileComponents,   setDesktopHeight: (v) => setActiveBlockSize("footer", "desktop", v), setMobileHeight: (v) => setActiveBlockSize("footer", "mobile", v) },
  };

  const canvasW = view === "desktop" ? DESKTOP_W : MOBILE_W;
  const canvasH = zoneHeights[activeZone][view];
  const components = zoneComponents[activeZone][view];
  const setComponents = view === "desktop" ? zoneSetters[activeZone].setDesktop : zoneSetters[activeZone].setMobile;
  const setCanvasHeight = view === "desktop" ? zoneSetters[activeZone].setDesktopHeight : zoneSetters[activeZone].setMobileHeight;

  // Mouse drag refs
  const dragRef        = useRef<{ ids: string[]; startX: number; startY: number; origins: Map<string, { x: number; y: number; width: number; height: number }> } | null>(null);
  const resizeRef      = useRef<{ ids: string[]; corner: ResizeCorner; startX: number; startY: number; bbox: { x: number; y: number; width: number; height: number }; origins: Map<string, { x: number; y: number; width: number; height: number }> } | null>(null);
  const rotateRef      = useRef<{ id: string; centerX: number; centerY: number; startAngle: number; startRotation: number } | null>(null);
  const heightDragRef  = useRef<{ startY: number; origH: number; zone: Zone } | null>(null);
  const marqueeStartRef = useRef<{ x: number; y: number } | null>(null);
  // Item 2: header/template/footer render as one seamless, simultaneously-
  // interactive canvas rather than separate switchable zone views. Each zone
  // keeps its own DOM element (for accurate getBoundingClientRect/scale math
  // during drag/resize/rotate) — canvasElRefs holds all three, and
  // getActiveCanvasEl() resolves whichever one the interaction in progress
  // actually targets (set at the start of that interaction, see onDragStart
  // etc. below).
  const canvasElRefs   = useRef<Record<Zone, HTMLDivElement | null>>({ header: null, template: null, footer: null });
  function getActiveCanvasEl(): HTMLDivElement | null { return canvasElRefs.current[activeZoneRef.current]; }
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const faviconInputRef = useRef<HTMLInputElement>(null);

  // Always-current refs
  const updateCompRef   = useRef<(id: string, patch: Partial<PageComponent>, targetZone?: Zone) => void>(() => {});
  const deleteCompRef   = useRef<(ids: string[], targetZone?: Zone) => void>(() => {});
  const pasteCompRef    = useRef<(comps: PageComponent[]) => void>(() => {});
  const canvasWRef      = useRef(canvasW);
  const canvasHRef      = useRef(canvasH);
  const setHeightRef    = useRef<(h: number) => void>(() => {});
  // Always-current mirror of the render-scoped `zoneSetters` object below —
  // needed so the height-drag mousemove handler (a mount-once effect, see
  // "Global mouse events") can resolve whichever zone's height-drag handle
  // was actually grabbed (heightDragRef.current.zone), not just whatever was
  // "active" back when that effect first ran.
  const zoneSettersRef  = useRef<Record<Zone, { setDesktopHeight: (v: React.SetStateAction<number>) => void; setMobileHeight: (v: React.SetStateAction<number>) => void }>>({
    header: { setDesktopHeight: () => {}, setMobileHeight: () => {} },
    template: { setDesktopHeight: () => {}, setMobileHeight: () => {} },
    footer: { setDesktopHeight: () => {}, setMobileHeight: () => {} },
  });
  const selectedIdsRef  = useRef<string[]>([]);
  const viewRef         = useRef<ViewMode>("desktop");
  const activeZoneRef   = useRef<Zone>("template");
  const compsRef        = useRef<Record<Zone, Record<ViewMode, PageComponent[]>>>({
    header: { desktop: [], mobile: [] }, template: { desktop: [], mobile: [] }, footer: { desktop: [], mobile: [] },
  });
  const clipboardRef    = useRef<PageComponent[] | null>(null);
  const copiedStyleRef  = useRef<Partial<PageComponent> | null>(null);
  const syncedSignatureRef = useRef("");
  const versionSignatureRef = useRef("");

  // ── Undo/redo — per-zone-per-view snapshot stacks (keyed "zone:view"),
  // separate from Version Control. (Version Control is a manual/timed
  // restore-point system scoped to Template only; this is a fine-grained
  // step-undo for every discrete edit in whichever zone is active, and the
  // two never share state.)
  const undoStackRef = useRef<Record<string, UndoSnapshot[]>>({});
  const redoStackRef = useRef<Record<string, UndoSnapshot[]>>({});
  function zoneViewKey(zone: Zone, v: ViewMode) { return `${zone}:${v}`; }
  const updateCommitPendingRef = useRef(false);
  const updateCommitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const undoRef = useRef<() => void>(() => {});
  const redoRef = useRef<() => void>(() => {});

  updateCompRef.current = (id, patch, targetZone) => {
    const zone = targetZone ?? activeZone;
    const setter = zone === activeZone ? setComponents : (view === "desktop" ? zoneSetters[zone].setDesktop : zoneSetters[zone].setMobile);
    const zh = zoneHeights[zone][view];
    setter((prev) => prev.map((c) => {
      if (c.id !== id) return c;
      const merged = { ...c, ...patch };
      const bounds = clampToCanvas(merged.x, merged.y, merged.width, merged.height, canvasWRef.current, zh, merged.rotation ?? 0);
      return { ...merged, ...bounds };
    }));
  };
  deleteCompRef.current = (ids, targetZone) => {
    const zone = targetZone ?? activeZone;
    // Locked components are protected from accidental deletion (Delete key,
    // "Delete all" in the multi-select toolbar) — explicit unlock is required first.
    const list = compsRef.current[zone][view];
    const deletableIds = ids.filter((id) => !list.find((c) => c.id === id)?.locked);
    if (deletableIds.length === 0) return;
    commitUndoSnapshot(zone);
    const setter = zone === activeZone ? setComponents : (view === "desktop" ? zoneSetters[zone].setDesktop : zoneSetters[zone].setMobile);
    setter((prev) => prev.filter((c) => !deletableIds.includes(c.id)));
    setSelectedIds((prev) => prev.filter((id) => !deletableIds.includes(id)));
  };
  pasteCompRef.current = (comps) => {
    commitUndoSnapshot();
    const groupIdMap = new Map<string, string>();
    const newComps = comps.map((c) => {
      let newGroupId: string | undefined;
      if (c.groupId) {
        if (!groupIdMap.has(c.groupId)) groupIdMap.set(c.groupId, uid());
        newGroupId = groupIdMap.get(c.groupId);
      }
      const bounds = clampToCanvas(c.x + 24, c.y + 24, c.width, c.height, canvasWRef.current, canvasHRef.current, c.rotation ?? 0);
      return { ...c, id: uid(), groupId: newGroupId, ...bounds };
    });
    setComponents((prev) => [...prev, ...newComps]);
    setSelectedIds(newComps.map((c) => c.id));
  };
  canvasWRef.current      = canvasW;
  canvasHRef.current      = canvasH;
  setHeightRef.current    = (h) => setCanvasHeight(h);
  zoneSettersRef.current  = zoneSetters;
  selectedIdsRef.current  = selectedIds;
  viewRef.current         = view;
  activeZoneRef.current   = activeZone;
  compsRef.current        = {
    header: { desktop: headerDesktopComponents, mobile: headerMobileComponents },
    template: { desktop: templateDesktopComponents, mobile: templateMobileComponents },
    footer: { desktop: footerDesktopComponents, mobile: footerMobileComponents },
  };

  const selectedComps = components.filter((c) => selectedIds.includes(c.id));
  const selectedComp = selectedComps.length === 1 ? selectedComps[0] : null;
  const selectionGroupId = selectedComps.length > 0 && selectedComps.every((c) => c.groupId && c.groupId === selectedComps[0].groupId)
    ? selectedComps[0].groupId!
    : null;

  // Selecting a single, ungrouped component opens its matching Add Component
  // accordion so its settings appear right there; deselecting closes it again.
  useEffect(() => {
    if (selectedComp && !selectedComp.groupId) setOpenTool(toolForType(selectedComp.type));
    else if (selectedIds.length === 0) setOpenTool(null);
  }, [selectedComp?.id, selectedComp?.groupId, selectedIds.length]);

  // Aspect-ratio lock is a transient per-selection toggle, not a persisted component
  // field — reset it whenever the selection changes so it never silently carries over.
  const [aspectLocked, setAspectLocked] = useState(false);
  const aspectLockedRef = useRef(false);
  aspectLockedRef.current = aspectLocked;
  useEffect(() => { setAspectLocked(false); }, [selectedIds.join(",")]);

  // Auto-fit zoom to the viewport on mount, whenever the Desktop/Mobile view changes
  // (each has a very different natural width), and whenever either sidebar is
  // collapsed/expanded — otherwise collapsing a sidebar frees up empty gray space
  // around the canvas without the canvas itself actually growing into it, which
  // defeats the point of collapsing. Preserves the pre-zoom-feature default of
  // "always shrink to fit, never require scrolling just to see the whole canvas,"
  // while still leaving `zoom` as a real, user-adjustable level via the zoom controls.
  useEffect(() => {
    // Switching Desktop/Mobile is an instant layout change (rAF is enough to
    // measure after the browser commits it), but collapsing/expanding a
    // sidebar now animates its width over ~300ms (see the auto-hide wrapper
    // divs below) — measuring via rAF here would read the pre-transition
    // width and fit to the WRONG size. Wait out the transition instead.
    const timer = window.setTimeout(() => {
      const containerW = scrollContainerRef.current?.clientWidth;
      if (!containerW) return;
      setZoom(Math.max(25, Math.min(100, Math.floor((containerW - 24) / canvasW * 100))));
    }, 320);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, leftSidebarCollapsed, rightSidebarCollapsed]);

  // Keyed by `zone:view` (see zoneViewKey) — missing keys read as false via `?? false`.
  const [undoAvailable, setUndoAvailable] = useState<Record<string, boolean>>({});
  const [redoAvailable, setRedoAvailable] = useState<Record<string, boolean>>({});
  const UNDO_STACK_LIMIT = 50;

  // Called at the start of every discrete, one-shot mutation (add/delete/duplicate/
  // paste/group/ungroup/toggle/arrange/align/distribute) to capture the state right
  // before that action, so Ctrl+Z reverts exactly that one action. Drag/resize/rotate
  // commit once on mouseup instead (see the global mouseup handler) rather than here,
  // since those stream many intermediate updates per gesture. Stacks are per-zone-per-
  // view so an undo in Template never touches a Header/Footer edit or vice versa.
  function commitUndoSnapshot(targetZone?: Zone, targetView?: ViewMode) {
    const zone = targetZone ?? activeZoneRef.current;
    const v = targetView ?? viewRef.current;
    const key = zoneViewKey(zone, v);
    const snap: UndoSnapshot = { components: compsRef.current[zone][v], height: zoneHeights[zone][v] };
    const stack = undoStackRef.current[key] ?? [];
    undoStackRef.current[key] = [...stack.slice(-(UNDO_STACK_LIMIT - 1)), snap];
    redoStackRef.current[key] = [];
    setUndoAvailable((prev) => ({ ...prev, [key]: true }));
    setRedoAvailable((prev) => ({ ...prev, [key]: false }));
  }
  function undo() {
    const zone = activeZoneRef.current;
    const v = viewRef.current;
    const key = zoneViewKey(zone, v);
    const stack = undoStackRef.current[key] ?? [];
    if (stack.length === 0) return;
    const prevSnap = stack[stack.length - 1];
    undoStackRef.current[key] = stack.slice(0, -1);
    const redoStack = redoStackRef.current[key] ?? [];
    redoStackRef.current[key] = [...redoStack, { components: compsRef.current[zone][v], height: canvasHRef.current }];
    if (v === "desktop") { zoneSetters[zone].setDesktop(prevSnap.components); zoneSetters[zone].setDesktopHeight(prevSnap.height); }
    else { zoneSetters[zone].setMobile(prevSnap.components); zoneSetters[zone].setMobileHeight(prevSnap.height); }
    setUndoAvailable((prev) => ({ ...prev, [key]: (undoStackRef.current[key] ?? []).length > 0 }));
    setRedoAvailable((prev) => ({ ...prev, [key]: true }));
  }
  function redo() {
    const zone = activeZoneRef.current;
    const v = viewRef.current;
    const key = zoneViewKey(zone, v);
    const stack = redoStackRef.current[key] ?? [];
    if (stack.length === 0) return;
    const nextSnap = stack[stack.length - 1];
    redoStackRef.current[key] = stack.slice(0, -1);
    const undoStack = undoStackRef.current[key] ?? [];
    undoStackRef.current[key] = [...undoStack, { components: compsRef.current[zone][v], height: canvasHRef.current }];
    if (v === "desktop") { zoneSetters[zone].setDesktop(nextSnap.components); zoneSetters[zone].setDesktopHeight(nextSnap.height); }
    else { zoneSetters[zone].setMobile(nextSnap.components); zoneSetters[zone].setMobileHeight(nextSnap.height); }
    setRedoAvailable((prev) => ({ ...prev, [key]: (redoStackRef.current[key] ?? []).length > 0 }));
    setUndoAvailable((prev) => ({ ...prev, [key]: true }));
  }
  undoRef.current = undo;
  redoRef.current = redo;

  // ── Load ────────────────────────────────────────────────────────────────────

  useEffect(() => {
    let cancelled = false;
    setLoading(true); setSelectedIds([]);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10_000); // 10s timeout

    // One page = one row: {name, template, canvasBgColor}. Header/Footer no
    // longer have their own top-level fields — they're optional blocks
    // living inside template.components (see lib/page-template-zones.ts).
    // Legacy rows saved before that change are either the old flat
    // {components:[]} shape or the older {header,template,footer} shape;
    // `d?.template ?? d` covers the flat-shape fallback the same way it
    // always did, and a legacy `d.header`/`d.footer` (pre-migration rows
    // this session's data migration should already have converted, but kept
    // here as a defensive fallback) is treated as "no header/footer block".
    fetch(`/api/pages/${encodeURIComponent(slug)}`, { signal: controller.signal })
      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then((d) => {
        if (cancelled) return;
        const rawDesktop = d?.template?.desktop ?? (Array.isArray(d?.components) ? { components: d.components, height: DEFAULT_DESKTOP_H } : undefined);
        const rawMobile = d?.template?.mobile;
        const desktopZones = extractZonesFromTemplate(rawDesktop, DEFAULT_DESKTOP_H);
        const mobileZones = extractZonesFromTemplate(rawMobile, DEFAULT_MOBILE_H);

        setTemplateDesktopComponents(desktopZones.template.components.map((c) => ({ ...c, ...clampToCanvas(c.x, c.y, c.width, c.height, DESKTOP_W, desktopZones.template.height, c.rotation ?? 0) })) as PageComponent[]);
        setTemplateDesktopHeight(desktopZones.template.height);
        setTemplateMobileComponents(mobileZones.template.components.map((c) => ({ ...c, ...clampToCanvas(c.x, c.y, c.width, c.height, MOBILE_W, mobileZones.template.height, c.rotation ?? 0) })) as PageComponent[]);
        setTemplateMobileHeight(mobileZones.template.height);

        const toBlockMeta = (b: HeaderFooterBlock): BlockMeta => ({
          id: b.id, kind: b.kind, dock: b.dock, size: b.size, rotation: b.rotation as 0 | 90 | 180 | 270,
          bgColor: b.bgColor, hideOnScrollUpPx: b.hideOnScrollUpPx, hideOnScrollDownPx: b.hideOnScrollDownPx,
          components: b.components as PageComponent[],
        });
        const newBlocksDesktop = desktopZones.blocks.map(toBlockMeta);
        const newBlocksMobile = mobileZones.blocks.map(toBlockMeta);
        setBlocksDesktop(newBlocksDesktop);
        setBlocksMobile(newBlocksMobile);
        const firstHeaderD = newBlocksDesktop.find((b) => b.kind === "header") ?? null;
        const firstFooterD = newBlocksDesktop.find((b) => b.kind === "footer") ?? null;
        const firstHeaderM = newBlocksMobile.find((b) => b.kind === "header") ?? null;
        const firstFooterM = newBlocksMobile.find((b) => b.kind === "footer") ?? null;
        setActiveHeaderId({ desktop: firstHeaderD?.id ?? null, mobile: firstHeaderM?.id ?? null });
        setActiveFooterId({ desktop: firstFooterD?.id ?? null, mobile: firstFooterM?.id ?? null });
        setHeaderDesktopComponents(firstHeaderD?.components ?? []);
        setHeaderMobileComponents(firstHeaderM?.components ?? []);
        setFooterDesktopComponents(firstFooterD?.components ?? []);
        setFooterMobileComponents(firstFooterM?.components ?? []);

        setCanvasBgColor(typeof d?.canvasBgColor === "string" ? d.canvasBgColor : "#ffffff");
        if (d?.name) setPageLabel(d.name);
      })
      .catch(() => {
        // Load failed — leave canvas empty so user can still add components
      })
      .finally(() => {
        clearTimeout(timer);
        if (!cancelled) {
          setLoading(false);
          setSyncStatus("synced");
          setLastSyncedAt(new Date());
          setChangeCount(0);
        }
      });
    return () => { cancelled = true; controller.abort(); clearTimeout(timer); };
  }, [slug]);

  // ── Keyboard shortcuts ──────────────────────────────────────────────────────
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      const inInput = target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT";
      if (e.key === "Escape") { setContextMenu(null); return; }
      if ((e.key === "Delete" || e.key === "Backspace") && !inInput && selectedIdsRef.current.length) {
        e.preventDefault(); deleteCompRef.current(selectedIdsRef.current); return;
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "c" && selectedIdsRef.current.length) {
        const list = compsRef.current[activeZoneRef.current][viewRef.current === "desktop" ? "desktop" : "mobile"];
        clipboardRef.current = list.filter((c) => selectedIdsRef.current.includes(c.id));
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "v" && clipboardRef.current) {
        pasteCompRef.current(clipboardRef.current);
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "d" && selectedIdsRef.current.length) {
        e.preventDefault();
        const list = compsRef.current[activeZoneRef.current][viewRef.current === "desktop" ? "desktop" : "mobile"];
        const comps = list.filter((c) => selectedIdsRef.current.includes(c.id));
        if (comps.length) pasteCompRef.current(comps);
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "a" && !inInput) {
        e.preventDefault();
        const list = compsRef.current[activeZoneRef.current][viewRef.current === "desktop" ? "desktop" : "mobile"];
        selectedIdsRef.current = list.filter((c) => !c.hidden).map((c) => c.id);
        setSelectedIds(selectedIdsRef.current);
        return;
      }
      if (e.key.startsWith("Arrow") && !inInput && selectedIdsRef.current.length) {
        e.preventDefault();
        const step = e.shiftKey ? 10 : 1;
        const dx = e.key === "ArrowLeft" ? -step : e.key === "ArrowRight" ? step : 0;
        const dy = e.key === "ArrowUp" ? -step : e.key === "ArrowDown" ? step : 0;
        if (dx === 0 && dy === 0) return;
        const list = compsRef.current[activeZoneRef.current][viewRef.current === "desktop" ? "desktop" : "mobile"];
        const zone = activeZoneRef.current;
        selectedIdsRef.current.forEach((id) => {
          const c = list.find((comp) => comp.id === id);
          if (!c || c.locked) return;
          const bounds = clampToCanvas(c.x + dx, c.y + dy, c.width, c.height, canvasWRef.current, canvasHRef.current, c.rotation ?? 0);
          updateComp(id, { x: bounds.x, y: bounds.y }, zone);
        });
        return;
      }
      // Deliberately NOT excluded for inInput — browser-native undo inside a focused
      // text field is expected to keep working independently of this app-level undo.
      if ((e.metaKey || e.ctrlKey) && !e.shiftKey && e.key.toLowerCase() === "z") {
        e.preventDefault(); undoRef.current(); return;
      }
      if ((e.metaKey || e.ctrlKey) && ((e.shiftKey && e.key.toLowerCase() === "z") || e.key.toLowerCase() === "y")) {
        e.preventDefault(); redoRef.current(); return;
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // ── Close context menu on outside click ─────────────────────────────────────
  useEffect(() => {
    if (!contextMenu) return;
    const onDocDown = () => setContextMenu(null);
    window.addEventListener("mousedown", onDocDown);
    return () => window.removeEventListener("mousedown", onDocDown);
  }, [contextMenu]);

  // ── Component actions ───────────────────────────────────────────────────────
  // Where new components should land: the center of whatever's currently visible
  // in the scrollable canvas viewport, in canvas-space units — so adding a
  // component while scrolled down drops it in view instead of off-screen at (80,80).
  function getVisibleCenter(): { x: number; y: number } {
    const container = scrollContainerRef.current;
    const canvas = getActiveCanvasEl();
    if (!container || !canvas || canvas.getBoundingClientRect().width === 0) {
      return { x: canvasW / 2, y: canvasH / 2 };
    }
    const containerRect = container.getBoundingClientRect();
    const canvasRect = canvas.getBoundingClientRect();
    const scale = canvasRect.width / canvasW;
    const visibleTop = Math.max(0, containerRect.top - canvasRect.top);
    const visibleBottom = Math.min(canvasRect.height, containerRect.bottom - canvasRect.top);
    const visibleLeft = Math.max(0, containerRect.left - canvasRect.left);
    const visibleRight = Math.min(canvasRect.width, containerRect.right - canvasRect.left);
    return {
      x: ((visibleLeft + visibleRight) / 2) / scale,
      y: ((visibleTop + visibleBottom) / 2) / scale,
    };
  }

  // Item 2: mirror newly-added component(s) into the OTHER view, same id(s),
  // Shared by every add*() below. Placement uses getVisibleCenter() (DOM-measured,
  // scroll-aware) only when adding into the currently-visible zone; a zone switched
  // to via a non-active zone's "+" button hasn't necessarily painted its canvas yet,
  // so those just center in that zone's own canvas instead. Mutates via zoneSetters
  // directly (not the activeZone-derived setComponents) so this is correct regardless
  // of whether `setActiveZone` from this same call has been applied yet — useState
  // setters are stable references, so zoneSetters[zone] is never stale.
  function placeAndAddComponent(base: PageComponent, targetZone?: Zone) {
    const zone = targetZone ?? activeZone;
    commitUndoSnapshot(zone);
    const zh = zoneHeights[zone][view];
    const center = zone === activeZone ? getVisibleCenter() : { x: canvasW / 2, y: zh / 2 };
    const comp = { ...base, ...clampToCanvas(center.x - base.width / 2, center.y - base.height / 2, base.width, base.height, canvasW, zh, base.rotation ?? 0) };
    const setter = zone === activeZone ? setComponents : (view === "desktop" ? zoneSetters[zone].setDesktop : zoneSetters[zone].setMobile);
    setter((prev) => [...prev, comp]);
    setSelectedIds([comp.id]);
    if (zone !== activeZone) setActiveZone(zone);
    return comp;
  }
  function addComponent(type: ComponentType, patch?: Partial<PageComponent>, targetZone?: Zone) {
    const base: PageComponent = { id: uid(), type, x: 0, y: 0, ...defaults(type, canvasW), ...(patch ?? {}) } as PageComponent;
    placeAndAddComponent(base, targetZone);
  }
  function addShape(shapeType: ShapeType, targetZone?: Zone) {
    const size = shapeSize(shapeType, canvasW);
    const base: PageComponent = {
      id: uid(), type: "shape", x: 0, y: 0, ...size,
      bgColor: "#3b82f6", borderRadius: shapeHasRadius(shapeType) ? 8 : 0,
      opacity: 100, rotation: 0, shapeType,
    };
    placeAndAddComponent(base, targetZone);
  }
  function addImage(mode: ImageMode, targetZone?: Zone) {
    const preset = IMAGE_SIZES.find((s) => s.id === imageSizePreset) ?? IMAGE_SIZES[2];
    const width = Math.round(canvasW * 0.22);
    const height = Math.max(40, Math.round(width / preset.ratio));
    const base: PageComponent = {
      id: uid(), type: "image", x: 0, y: 0, width, height,
      bgColor: "#e5e7eb", borderRadius: 8, opacity: 100, rotation: 0,
      imageMode: mode, images: mode === "slideshow" ? [] : undefined,
    };
    placeAndAddComponent(base, targetZone);
  }
  function addCarousel(targetZone?: Zone) {
    const base: PageComponent = { id: uid(), type: "carousel", x: 0, y: 0, ...defaults("carousel", canvasW) } as PageComponent;
    placeAndAddComponent(base, targetZone);
  }
  function addIcon(iconName: string, targetZone?: Zone) {
    const base: PageComponent = { id: uid(), type: "icon", x: 0, y: 0, ...defaults("icon", canvasW), iconName } as PageComponent;
    placeAndAddComponent(base, targetZone);
  }
  function addLocationInput(targetZone?: Zone) {
    const base: PageComponent = { id: uid(), type: "location-input", x: 0, y: 0, ...defaults("location-input", canvasW) } as PageComponent;
    placeAndAddComponent(base, targetZone);
  }
  function addMap(targetZone?: Zone) {
    const base: PageComponent = { id: uid(), type: "map", x: 0, y: 0, ...defaults("map", canvasW) } as PageComponent;
    placeAndAddComponent(base, targetZone);
  }
  function addDateTimePicker(targetZone?: Zone) {
    const base: PageComponent = { id: uid(), type: "datetime-picker", x: 0, y: 0, ...defaults("datetime-picker", canvasW) } as PageComponent;
    placeAndAddComponent(base, targetZone);
  }
  function addVehicleSelector(targetZone?: Zone) {
    const base: PageComponent = { id: uid(), type: "vehicle-selector", x: 0, y: 0, ...defaults("vehicle-selector", canvasW) } as PageComponent;
    placeAndAddComponent(base, targetZone);
  }
  function addDriverBadge(targetZone?: Zone) {
    const base: PageComponent = { id: uid(), type: "driver-badge", x: 0, y: 0, ...defaults("driver-badge", canvasW) } as PageComponent;
    placeAndAddComponent(base, targetZone);
  }
  function addFareDisplay(targetZone?: Zone) {
    const base: PageComponent = { id: uid(), type: "fare-display", x: 0, y: 0, ...defaults("fare-display", canvasW) } as PageComponent;
    placeAndAddComponent(base, targetZone);
  }
  function addHeroCarousel(targetZone?: Zone) {
    const base: PageComponent = { id: uid(), type: "hero-carousel", x: 0, y: 0, ...defaults("hero-carousel", canvasW) } as PageComponent;
    placeAndAddComponent(base, targetZone);
  }
  function addCategoryCarousel(targetZone?: Zone) {
    const base: PageComponent = { id: uid(), type: "category-carousel", x: 0, y: 0, ...defaults("category-carousel", canvasW) } as PageComponent;
    placeAndAddComponent(base, targetZone);
  }
  // Insert an already-uploaded asset (from the Assets tab) as a new single-image component.
  function addImageFromUrl(url: string, targetZone?: Zone) {
    const preset = IMAGE_SIZES.find((s) => s.id === imageSizePreset) ?? IMAGE_SIZES[2];
    const width = Math.round(canvasW * 0.22);
    const height = Math.max(40, Math.round(width / preset.ratio));
    const base: PageComponent = { id: uid(), type: "image", x: 0, y: 0, width, height, bgColor: "#e5e7eb", borderRadius: 8, opacity: 100, rotation: 0, imageMode: "single", imageUrl: url };
    placeAndAddComponent(base, targetZone);
  }
  function addMarketWidget(id: MarketWidgetId, targetZone?: Zone) {
    const zone = targetZone ?? activeZone;
    commitUndoSnapshot(zone);
    const zh = zoneHeights[zone][view];
    const center = zone === activeZone ? getVisibleCenter() : { x: canvasW / 2, y: zh / 2 };
    const widget = buildMarketWidget(id, center, canvasW, zh).map((c) => ({
      ...c,
      ...clampToCanvas(c.x, c.y, c.width, c.height, canvasW, zh, c.rotation ?? 0),
    }));
    const setter = zone === activeZone ? setComponents : (view === "desktop" ? zoneSetters[zone].setDesktop : zoneSetters[zone].setMobile);
    setter((prev) => [...prev, ...widget]);
    setSelectedIds(widget.map((c) => c.id));
    if (zone !== activeZone) setActiveZone(zone);
  }
  // Property-panel field edits (text/number/color/etc.) share this one entry point —
  // unlike the drag/resize/rotate stream (which calls updateCompRef.current directly
  // and commits once on mouseup), a burst of rapid calls here (e.g. typing a sentence)
  // should collapse into a single undo step, not one per keystroke. Debounce: commit
  // once at the start of a burst, then suppress further commits until 800ms of quiet.
  function updateComp(id: string, patch: Partial<PageComponent>, targetZone?: Zone) {
    if (!updateCommitPendingRef.current) {
      commitUndoSnapshot(targetZone);
      updateCommitPendingRef.current = true;
    }
    if (updateCommitTimerRef.current) clearTimeout(updateCommitTimerRef.current);
    updateCommitTimerRef.current = setTimeout(() => { updateCommitPendingRef.current = false; }, 800);
    updateCompRef.current(id, patch, targetZone);
  }
  function deleteComp(ids: string[], targetZone?: Zone) { deleteCompRef.current(ids, targetZone); }
  // Editor-only convenience toggles (see PageComponent.hidden/locked) — do not
  // touch save()/publish, so toggling one never changes what's live.
  function toggleHidden(ids: string[], targetZone?: Zone) {
    const zone = targetZone ?? activeZone;
    commitUndoSnapshot(zone);
    const setter = zone === activeZone ? setComponents : (view === "desktop" ? zoneSetters[zone].setDesktop : zoneSetters[zone].setMobile);
    setter((prev) => prev.map((c) => (ids.includes(c.id) ? { ...c, hidden: !c.hidden } : c)));
  }
  function toggleLocked(ids: string[], targetZone?: Zone) {
    const zone = targetZone ?? activeZone;
    commitUndoSnapshot(zone);
    const setter = zone === activeZone ? setComponents : (view === "desktop" ? zoneSetters[zone].setDesktop : zoneSetters[zone].setMobile);
    setter((prev) => prev.map((c) => (ids.includes(c.id) ? { ...c, locked: !c.locked } : c)));
  }
  // Uniform set (not per-item toggle) — used by the multi-select "Lock/Unlock all"
  // button so a mixed-lock selection always ends up fully locked or fully unlocked,
  // rather than each component flipping its own individual state.
  function setLockedForAll(ids: string[], locked: boolean, targetZone?: Zone) {
    const zone = targetZone ?? activeZone;
    commitUndoSnapshot(zone);
    const setter = zone === activeZone ? setComponents : (view === "desktop" ? zoneSetters[zone].setDesktop : zoneSetters[zone].setMobile);
    setter((prev) => prev.map((c) => (ids.includes(c.id) ? { ...c, locked } : c)));
  }
  function moveSlideshowImage(id: string, images: string[], index: number, dir: -1 | 1) {
    const j = index + dir;
    if (j < 0 || j >= images.length) return;
    const next = [...images];
    [next[index], next[j]] = [next[j], next[index]];
    updateComp(id, { images: next });
  }
  function updateCarouselItem(id: string, items: CarouselItem[], itemId: string, patch: Partial<CarouselItem>) {
    updateComp(id, { carouselItems: items.map((it) => (it.id === itemId ? { ...it, ...patch } : it)) });
  }
  function removeCarouselItem(id: string, items: CarouselItem[], itemId: string) {
    updateComp(id, { carouselItems: items.filter((it) => it.id !== itemId) });
  }
  function moveCarouselItem(id: string, items: CarouselItem[], index: number, dir: -1 | 1) {
    const j = index + dir;
    if (j < 0 || j >= items.length) return;
    const next = [...items];
    [next[index], next[j]] = [next[j], next[index]];
    updateComp(id, { carouselItems: next });
  }
  function addCategoryItem(id: string, items: CarouselItem[], cat: CategoryOption) {
    updateComp(id, { carouselItems: [...items, { id: uid(), imageUrl: cat.imageUrl ?? undefined, label: cat.name, link: `/products?category=${cat.slug}` }] });
  }
  function addMapMarker(id: string, markers: MapMarker[]) {
    updateComp(id, { mapMarkers: [...markers, { id: uid(), lat: 12.9716, lng: 77.5946, label: "Pickup" }] });
  }
  function updateMapMarker(id: string, markers: MapMarker[], markerId: string, patch: Partial<MapMarker>) {
    updateComp(id, { mapMarkers: markers.map((m) => (m.id === markerId ? { ...m, ...patch } : m)) });
  }
  function removeMapMarker(id: string, markers: MapMarker[], markerId: string) {
    updateComp(id, { mapMarkers: markers.filter((m) => m.id !== markerId) });
  }
  function addVehicleOption(id: string, options: VehicleOption[]) {
    updateComp(id, { vehicleOptions: [...options, { id: uid(), label: "New option", iconId: "car", fareText: "₹99" }] });
  }
  function updateVehicleOption(id: string, options: VehicleOption[], optId: string, patch: Partial<VehicleOption>) {
    updateComp(id, { vehicleOptions: options.map((o) => (o.id === optId ? { ...o, ...patch } : o)) });
  }
  function removeVehicleOption(id: string, options: VehicleOption[], optId: string) {
    updateComp(id, { vehicleOptions: options.filter((o) => o.id !== optId) });
  }
  function addHeroSlide(id: string, slides: HeroSlide[]) {
    updateComp(id, { heroSlides: [...slides, { id: uid(), headline: "New Slide", subtext: "", buttonLabel: "", buttonLink: "" }] });
  }
  function updateHeroSlide(id: string, slides: HeroSlide[], slideId: string, patch: Partial<HeroSlide>) {
    updateComp(id, { heroSlides: slides.map((s) => (s.id === slideId ? { ...s, ...patch } : s)) });
  }
  function removeHeroSlide(id: string, slides: HeroSlide[], slideId: string) {
    updateComp(id, { heroSlides: slides.filter((s) => s.id !== slideId) });
  }
  function moveHeroSlide(id: string, slides: HeroSlide[], index: number, dir: -1 | 1) {
    const j = index + dir;
    if (j < 0 || j >= slides.length) return;
    const next = [...slides];
    [next[index], next[j]] = [next[j], next[index]];
    updateComp(id, { heroSlides: next });
  }
  function addCatCarouselItem(id: string, items: CategoryCarouselItem[]) {
    updateComp(id, { catCarouselItems: [...items, { id: uid(), name: "New Category" }] });
  }
  function updateCatCarouselItem(id: string, items: CategoryCarouselItem[], itemId: string, patch: Partial<CategoryCarouselItem>) {
    updateComp(id, { catCarouselItems: items.map((c) => (c.id === itemId ? { ...c, ...patch } : c)) });
  }
  function removeCatCarouselItem(id: string, items: CategoryCarouselItem[], itemId: string) {
    updateComp(id, { catCarouselItems: items.filter((c) => c.id !== itemId) });
  }
  function moveCatCarouselItem(id: string, items: CategoryCarouselItem[], index: number, dir: -1 | 1) {
    const j = index + dir;
    if (j < 0 || j >= items.length) return;
    const next = [...items];
    [next[index], next[j]] = [next[j], next[index]];
    updateComp(id, { catCarouselItems: next });
  }

  // ── Layers-tree nested child rows (Carousel slides / Vehicle Selector options / Hero Carousel slides) ──
  function childItemsOf(comp: PageComponent): { id: string; label: string }[] {
    if (comp.type === "carousel") return (comp.carouselItems ?? []).map((i) => ({ id: i.id, label: i.label?.trim() || "Slide" }));
    if (comp.type === "vehicle-selector") return (comp.vehicleOptions ?? []).map((o) => ({ id: o.id, label: o.label?.trim() || "Option" }));
    if (comp.type === "hero-carousel") return (comp.heroSlides ?? []).map((s) => ({ id: s.id, label: s.headline?.trim() || "Slide" }));
    if (comp.type === "category-carousel") return (comp.catCarouselItems ?? []).map((c) => ({ id: c.id, label: c.name?.trim() || "Category" }));
    return [];
  }
  function addChildItem(comp: PageComponent, targetZone?: Zone) {
    if (comp.type === "carousel") updateComp(comp.id, { carouselItems: [...(comp.carouselItems ?? []), { id: uid(), label: "New Slide" }] }, targetZone);
    else if (comp.type === "vehicle-selector") updateComp(comp.id, { vehicleOptions: [...(comp.vehicleOptions ?? []), { id: uid(), label: "New option", iconId: "car", fareText: "₹99" }] }, targetZone);
    else if (comp.type === "hero-carousel") updateComp(comp.id, { heroSlides: [...(comp.heroSlides ?? []), { id: uid(), headline: "New Slide", subtext: "", buttonLabel: "", buttonLink: "" }] }, targetZone);
    else if (comp.type === "category-carousel") updateComp(comp.id, { catCarouselItems: [...(comp.catCarouselItems ?? []), { id: uid(), name: "New Category" }] }, targetZone);
  }
  function removeChildItem(comp: PageComponent, itemId: string, targetZone?: Zone) {
    if (comp.type === "carousel") updateComp(comp.id, { carouselItems: (comp.carouselItems ?? []).filter((i) => i.id !== itemId) }, targetZone);
    else if (comp.type === "vehicle-selector") updateComp(comp.id, { vehicleOptions: (comp.vehicleOptions ?? []).filter((o) => o.id !== itemId) }, targetZone);
    else if (comp.type === "hero-carousel") updateComp(comp.id, { heroSlides: (comp.heroSlides ?? []).filter((s) => s.id !== itemId) }, targetZone);
    else if (comp.type === "category-carousel") updateComp(comp.id, { catCarouselItems: (comp.catCarouselItems ?? []).filter((c) => c.id !== itemId) }, targetZone);
  }
  function duplicateChildItem(comp: PageComponent, itemId: string, targetZone?: Zone) {
    if (comp.type === "carousel") {
      const items = comp.carouselItems ?? [];
      const item = items.find((i) => i.id === itemId);
      if (item) updateComp(comp.id, { carouselItems: [...items, { ...item, id: uid() }] }, targetZone);
    } else if (comp.type === "vehicle-selector") {
      const options = comp.vehicleOptions ?? [];
      const opt = options.find((o) => o.id === itemId);
      if (opt) updateComp(comp.id, { vehicleOptions: [...options, { ...opt, id: uid() }] }, targetZone);
    } else if (comp.type === "hero-carousel") {
      const slides = comp.heroSlides ?? [];
      const slide = slides.find((s) => s.id === itemId);
      if (slide) updateComp(comp.id, { heroSlides: [...slides, { ...slide, id: uid() }] }, targetZone);
    } else if (comp.type === "category-carousel") {
      const items = comp.catCarouselItems ?? [];
      const item = items.find((c) => c.id === itemId);
      if (item) updateComp(comp.id, { catCarouselItems: [...items, { ...item, id: uid() }] }, targetZone);
    }
  }
  function childAddLabel(comp: PageComponent): string {
    if (comp.type === "vehicle-selector") return "Add Option";
    if (comp.type === "category-carousel") return "Add Category";
    return "Add Slide";
  }
  async function loadCategoryOptions() {
    if (categoryOptions) return;
    setLoadingCategories(true);
    try {
      const res = await fetch("/api/admin/categories");
      const tree = await res.json();
      const flat: CategoryOption[] = [];
      function walk(nodes: any[]) {
        for (const n of nodes ?? []) {
          flat.push({ id: n.id, name: n.name, slug: n.slug, imageUrl: n.imageUrl });
          if (Array.isArray(n.children)) walk(n.children);
        }
      }
      walk(Array.isArray(tree) ? tree : []);
      setCategoryOptions(flat);
    } catch {
      setCategoryOptions([]);
    } finally {
      setLoadingCategories(false);
    }
  }
  async function loadAssets() {
    if (assetItems) return;
    setAssetsLoading(true);
    try {
      const res = await fetch("/api/page-config/assets");
      const data = await res.json();
      setAssetItems(Array.isArray(data) ? data : []);
    } catch {
      setAssetItems([]);
    } finally {
      setAssetsLoading(false);
    }
  }
  async function loadFonts() {
    setFontsLoading(true);
    try {
      const res = await fetch("/api/page-config/fonts");
      const data = await res.json();
      setFontItems(Array.isArray(data) ? data : []);
    } catch {
      setFontItems([]);
    } finally {
      setFontsLoading(false);
    }
  }
  function uploadFontWithProgress(file: File, onProgress: (pct: number) => void): Promise<FontAssetItem | null> {
    return new Promise((resolve) => {
      const fd = new FormData(); fd.append("file", file);
      const xhr = new XMLHttpRequest();
      xhr.open("POST", "/api/page-config/upload-font");
      xhr.upload.onprogress = (e) => { if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100)); };
      xhr.onload = () => {
        if (xhr.status < 200 || xhr.status >= 300) { resolve(null); return; }
        try { resolve(JSON.parse(xhr.responseText)); } catch { resolve(null); }
      };
      xhr.onerror = () => resolve(null);
      xhr.send(fd);
    });
  }
  async function uploadFont(file: File) {
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!ext || !["ttf", "otf", "woff", "woff2"].includes(ext)) {
      alert("Only .ttf, .otf, .woff, .woff2 font files are allowed.");
      return;
    }
    setUploadingFont(true); setFontUploadProgress(0);
    try {
      const result = await uploadFontWithProgress(file, setFontUploadProgress);
      if (result) setFontItems((prev) => [result, ...(prev ?? [])]);
    } finally { setUploadingFont(false); setFontUploadProgress(0); }
  }
  async function deleteFont(key: string) {
    setFontItems((prev) => (prev ? prev.filter((f) => f.key !== key) : prev));
    try {
      await fetch("/api/page-config/fonts", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key }),
      });
    } catch {}
  }
  function duplicateComp(comp: PageComponent) {
    pasteCompRef.current([comp]);
  }
  function duplicateInPlace(comp: PageComponent, targetZone?: Zone) {
    const zone = targetZone ?? activeZone;
    commitUndoSnapshot(zone);
    const copy: PageComponent = { ...comp, id: uid(), groupId: undefined, groupName: undefined, groupLink: undefined };
    const setter = zone === activeZone ? setComponents : (view === "desktop" ? zoneSetters[zone].setDesktop : zoneSetters[zone].setMobile);
    setter((prev) => [...prev, copy]);
    setSelectedIds([copy.id]);
    setContextMenu(null);
  }
  // Stacking order == array order (later elements render on top, no explicit z-index).
  // "Forward" nudges a component one slot later in the array (toward the top of the
  // stack); "backward" nudges it one slot earlier — mirrors typical design-tool controls.
  function moveComponentOrder(id: string, direction: "forward" | "backward") {
    commitUndoSnapshot();
    const setter = setComponents;
    setter((prev) => {
      const idx = prev.findIndex((c) => c.id === id);
      const swapIdx = direction === "forward" ? idx + 1 : idx - 1;
      if (idx === -1 || swapIdx < 0 || swapIdx >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[swapIdx]] = [next[swapIdx], next[idx]];
      return next;
    });
  }
  // Drag-reorder in the Layers panel: move `fromId` to sit at whatever array slot
  // `toId` currently occupies (displacing it), regardless of which is dragged over which.
  function reorderComponents(fromId: string, toId: string, targetZone?: Zone) {
    const zone = targetZone ?? activeZone;
    commitUndoSnapshot(zone);
    const setter = zone === activeZone ? setComponents : (view === "desktop" ? zoneSetters[zone].setDesktop : zoneSetters[zone].setMobile);
    setter((prev) => {
      const fromIdx = prev.findIndex((c) => c.id === fromId);
      let toIdx = prev.findIndex((c) => c.id === toId);
      if (fromIdx === -1 || toIdx === -1 || fromIdx === toIdx) return prev;
      const next = [...prev];
      const [moved] = next.splice(fromIdx, 1);
      if (fromIdx < toIdx) toIdx -= 1;
      next.splice(toIdx, 0, moved);
      return next;
    });
  }
  function bringToFront(id: string) {
    commitUndoSnapshot();
    const setter = setComponents;
    setter((prev) => {
      const idx = prev.findIndex((c) => c.id === id);
      if (idx === -1 || idx === prev.length - 1) return prev;
      const next = [...prev];
      const [moved] = next.splice(idx, 1);
      next.push(moved);
      return next;
    });
  }
  function sendToBack(id: string) {
    commitUndoSnapshot();
    const setter = setComponents;
    setter((prev) => {
      const idx = prev.findIndex((c) => c.id === id);
      if (idx <= 0) return prev;
      const next = [...prev];
      const [moved] = next.splice(idx, 1);
      next.unshift(moved);
      return next;
    });
  }
  // Align/distribute operate on the shared bounding box of 2+ selected components —
  // a single selection has nothing to align to, so these are only ever called with
  // selectedComps.length >= 2 (align) / >= 3 (distribute); clampToCanvas re-clamps
  // each result automatically via the existing updateComp path.
  function alignSelected(edge: "left" | "right" | "centerH" | "top" | "bottom" | "centerV") {
    if (selectedComps.length < 2) return;
    const minX = Math.min(...selectedComps.map((c) => c.x));
    const minY = Math.min(...selectedComps.map((c) => c.y));
    const maxX = Math.max(...selectedComps.map((c) => c.x + c.width));
    const maxY = Math.max(...selectedComps.map((c) => c.y + c.height));
    selectedComps.forEach((c) => {
      if (edge === "left") updateComp(c.id, { x: minX });
      else if (edge === "right") updateComp(c.id, { x: maxX - c.width });
      else if (edge === "centerH") updateComp(c.id, { x: (minX + maxX) / 2 - c.width / 2 });
      else if (edge === "top") updateComp(c.id, { y: minY });
      else if (edge === "bottom") updateComp(c.id, { y: maxY - c.height });
      else updateComp(c.id, { y: (minY + maxY) / 2 - c.height / 2 });
    });
  }
  function distributeSelected(axis: "horizontal" | "vertical") {
    if (selectedComps.length < 3) return;
    if (axis === "horizontal") {
      const sorted = [...selectedComps].sort((a, b) => a.x - b.x);
      const first = sorted[0], last = sorted[sorted.length - 1];
      const span = (last.x + last.width) - first.x;
      const totalWidth = sorted.reduce((sum, c) => sum + c.width, 0);
      const gap = (span - totalWidth) / (sorted.length - 1);
      let cursor = first.x + first.width;
      for (let i = 1; i < sorted.length - 1; i++) {
        cursor += gap;
        updateComp(sorted[i].id, { x: cursor });
        cursor += sorted[i].width;
      }
    } else {
      const sorted = [...selectedComps].sort((a, b) => a.y - b.y);
      const first = sorted[0], last = sorted[sorted.length - 1];
      const span = (last.y + last.height) - first.y;
      const totalHeight = sorted.reduce((sum, c) => sum + c.height, 0);
      const gap = (span - totalHeight) / (sorted.length - 1);
      let cursor = first.y + first.height;
      for (let i = 1; i < sorted.length - 1; i++) {
        cursor += gap;
        updateComp(sorted[i].id, { y: cursor });
        cursor += sorted[i].height;
      }
    }
  }
  function updateGroup(groupId: string, patch: { groupName?: string; groupLink?: string }) {
    const setter = setComponents;
    setter((prev) => prev.map((c) => (c.groupId === groupId ? { ...c, ...patch } : c)));
  }
  // Batch property edit — only ever called when 2+ selected components share the
  // same type (gated in the UI below). Loops updateComp() per id rather than one
  // shared setter call: updateComp's existing debounce logic already collapses a
  // same-tick burst of calls into a single undo step, so this stays consistent
  // with every other edit path without needing new undo/clamping logic here.
  function updateSelectedBatch(patch: Partial<PageComponent>) {
    if (selectedComps.length < 2) return;
    const targetType = selectedComps[0].type;
    if (!selectedComps.every((c) => c.type === targetType)) return;
    selectedComps.forEach((c) => updateComp(c.id, patch));
  }
  // Copies the current selection to the same clipboardRef the Ctrl/Cmd+C
  // keyboard shortcut already writes to — the context menu's "Copy" is just
  // a discoverable entry point onto existing paste machinery (Ctrl/Cmd+V).
  function copySelection() {
    const list = compsRef.current[activeZoneRef.current][viewRef.current === "desktop" ? "desktop" : "mobile"];
    clipboardRef.current = list.filter((c) => selectedIdsRef.current.includes(c.id));
    setContextMenu(null);
  }
  function copyStyle(comp: PageComponent) {
    const style: Partial<PageComponent> = {};
    STYLE_KEYS.forEach((k) => {
      const v = comp[k];
      if (v !== undefined) (style as Record<string, unknown>)[k] = v;
    });
    copiedStyleRef.current = style;
    setContextMenu(null);
  }
  function pasteStyle(comp: PageComponent) {
    if (!copiedStyleRef.current) return;
    updateComp(comp.id, copiedStyleRef.current);
    setContextMenu(null);
  }
  function groupSelected() {
    commitUndoSnapshot();
    const gid = uid();
    const setter = setComponents;
    setter((prev) => prev.map((c) => (selectedIds.includes(c.id) ? { ...c, groupId: gid } : c)));
    setContextMenu(null);
  }
  function ungroupSelected() {
    commitUndoSnapshot();
    const setter = setComponents;
    setter((prev) => prev.map((c) => (selectedIds.includes(c.id) ? { ...c, groupId: undefined, groupName: undefined, groupLink: undefined } : c)));
    setContextMenu(null);
  }
  function handleContextMenu(e: React.MouseEvent, comp: PageComponent, zone: Zone) {
    e.preventDefault(); e.stopPropagation();
    if (zone !== activeZoneRef.current) { activeZoneRef.current = zone; setActiveZone(zone); }
    setSelectedIds((prev) => {
      if (prev.includes(comp.id)) return prev;
      const list = compsRef.current[zone][viewRef.current === "desktop" ? "desktop" : "mobile"];
      return comp.groupId ? list.filter((c) => c.groupId === comp.groupId).map((c) => c.id) : [comp.id];
    });
    setContextMenu({ x: e.clientX, y: e.clientY });
  }

  // ── Drag / resize / rotate start ───────────────────────────────────────────
  // Every one of these takes an explicit `zone` (which canvas — header/
  // template/footer — the pointer actually came down on) and switches
  // activeZone to it immediately, so clicking/dragging a component in a
  // zone that wasn't "active" a moment ago just works in the same gesture —
  // no separate "click to activate this zone, then click again to select"
  // step, which is what made the old zone-strip UI feel like 3 disconnected
  // canvases instead of 1 (item 2).
  const onDragStart = useCallback((e: React.MouseEvent, id: string, zone: Zone) => {
    e.preventDefault(); e.stopPropagation();
    if (zone !== activeZoneRef.current) { activeZoneRef.current = zone; setActiveZone(zone); }
    const list = compsRef.current[zone][viewRef.current === "desktop" ? "desktop" : "mobile"];
    const comp = list.find((c) => c.id === id);
    if (!comp) return;
    const groupIds = comp.groupId ? list.filter((c) => c.groupId === comp.groupId).map((c) => c.id) : [id];

    if (e.shiftKey) {
      setSelectedIds((prev) => {
        const has = groupIds.every((gid) => prev.includes(gid));
        return has ? prev.filter((pid) => !groupIds.includes(pid)) : Array.from(new Set([...prev, ...groupIds]));
      });
      return;
    }

    const keepMulti = selectedIdsRef.current.includes(id) && selectedIdsRef.current.length > 1;
    const idsToMove = keepMulti ? selectedIdsRef.current : groupIds;
    if (!keepMulti) setSelectedIds(groupIds);
    // Selection still updates above even for a locked component (so it can be
    // unlocked from the toolbar) — only starting an actual drag is blocked.
    if (comp.locked) return;
    // Captured here (drag start, pre-mutation) rather than on mouseup — by mouseup
    // compsRef would already reflect the *new* dragged-to position, which would make
    // "undo" a no-op.
    commitUndoSnapshot();
    // Spacing guides only make sense against a single moving box, not a multi/group drag.
    setDraggingId(idsToMove.length === 1 ? idsToMove[0] : null);

    const origins = new Map(idsToMove.map((mid) => {
      const c = list.find((cc) => cc.id === mid)!;
      return [mid, { x: c.x, y: c.y, width: c.width, height: c.height }];
    }));
    dragRef.current = { ids: idsToMove, startX: e.clientX, startY: e.clientY, origins };
  }, []);

  const onResizeStart = useCallback((e: React.MouseEvent, ids: string[], zone: Zone, corner: ResizeCorner = "br") => {
    e.preventDefault(); e.stopPropagation();
    if (zone !== activeZoneRef.current) { activeZoneRef.current = zone; setActiveZone(zone); }
    const list = compsRef.current[zone][viewRef.current === "desktop" ? "desktop" : "mobile"];
    const comps = ids.map((id) => list.find((c) => c.id === id)).filter((c): c is PageComponent => !!c);
    if (comps.length === 0 || comps.some((c) => c.locked)) return;
    commitUndoSnapshot();
    const minX = Math.min(...comps.map((c) => c.x));
    const minY = Math.min(...comps.map((c) => c.y));
    const maxX = Math.max(...comps.map((c) => c.x + c.width));
    const maxY = Math.max(...comps.map((c) => c.y + c.height));
    const bbox = { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
    const origins = new Map(comps.map((c) => [c.id, { x: c.x, y: c.y, width: c.width, height: c.height }]));
    resizeRef.current = { ids, corner, startX: e.clientX, startY: e.clientY, bbox, origins };
  }, []);

  const onRotateStart = useCallback((e: React.MouseEvent, id: string, zone: Zone) => {
    e.preventDefault(); e.stopPropagation();
    if (zone !== activeZoneRef.current) { activeZoneRef.current = zone; setActiveZone(zone); }
    const canvas = canvasElRefs.current[zone]; if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const comp = compsRef.current[zone][viewRef.current === "desktop" ? "desktop" : "mobile"].find((c) => c.id === id);
    if (!comp || comp.locked) return;
    commitUndoSnapshot();
    const scale = rect.width / canvasWRef.current;
    const centerX = rect.left + (comp.x + comp.width / 2) * scale;
    const centerY = rect.top + (comp.y + comp.height / 2) * scale;
    // Track rotation as a delta from the drag's starting angle, not an absolute
    // angle-to-cursor snap — a handle that rotates along with the object would
    // otherwise flip to the opposite side on every click, toggling between two
    // angles (e.g. 0/180) instead of allowing a smooth full 360° drag.
    const startAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX) * (180 / Math.PI);
    rotateRef.current = { id, centerX, centerY, startAngle, startRotation: comp.rotation ?? 0 };
  }, []);

  // Plain function, not useCallback — needs the latest `zoneHeights` (a
  // render-scoped const, not a ref) for whichever zone's handle was grabbed,
  // and re-creating this on every render costs nothing (it's just an
  // onMouseDown prop).
  function onHeightDragStart(e: React.MouseEvent, zone: Zone) {
    e.preventDefault();
    if (zone !== activeZoneRef.current) { activeZoneRef.current = zone; setActiveZone(zone); }
    heightDragRef.current = { startY: e.clientY, origH: zoneHeights[zone][view], zone };
  }

  const onCanvasMouseDown = useCallback((e: React.MouseEvent, zone: Zone) => {
    if (zone !== activeZoneRef.current) { activeZoneRef.current = zone; setActiveZone(zone); }
    const rect = canvasElRefs.current[zone]?.getBoundingClientRect();
    if (!rect) return;
    const scale = rect.width / canvasWRef.current;
    const x = (e.clientX - rect.left) / scale;
    const y = (e.clientY - rect.top) / scale;
    marqueeStartRef.current = { x, y };
    setMarquee({ x, y, w: 0, h: 0 });
    setContextMenu(null);
  }, []);

  // ── Global mouse events ─────────────────────────────────────────────────────
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const activeCanvasEl = canvasElRefs.current[activeZoneRef.current];
      const scale = activeCanvasEl ? activeCanvasEl.clientWidth / canvasWRef.current : 1;
      if (dragRef.current) {
        // Boundary clamping happens centrally in updateCompRef, so the raw delta is enough here.
        const { ids, startX, startY, origins } = dragRef.current;
        const dx = (e.clientX - startX) / scale;
        const dy = (e.clientY - startY) / scale;
        if (ids.length === 1) {
          // Snap-to-guide only applies to a single moving box — a rigid multi-select
          // group keeps its raw delta (bounding-box-level snapping is a fast-follow).
          const id = ids[0];
          const o = origins.get(id);
          if (o) {
            const rawX = o.x + dx, rawY = o.y + dy;
            const others = compsRef.current[activeZoneRef.current][viewRef.current === "desktop" ? "desktop" : "mobile"].filter((c) => c.id !== id && !c.hidden);
            const { x, y, guides } = snapPosition(rawX, rawY, o.width, o.height, others, canvasWRef.current, canvasHRef.current);
            updateCompRef.current(id, { x, y });
            setAlignmentGuides(guides);
          }
        } else {
          ids.forEach((id) => {
            const o = origins.get(id);
            if (!o) return;
            updateCompRef.current(id, { x: o.x + dx, y: o.y + dy });
          });
        }
      }
      if (resizeRef.current) {
        const { ids, corner, startX, startY, bbox, origins } = resizeRef.current;
        const dx = (e.clientX - startX) / scale;
        const dy = (e.clientY - startY) / scale;
        const { x: bx, y: by, width: bw, height: bh } = bbox;
        // Mid-edge handles (Text/Header) resize a single axis only — no aspect
        // lock applied to them, since locking aspect on a one-axis drag would
        // silently also move the other axis, defeating the point of an
        // edge-only handle.
        const isEdgeOnly = corner === "t" || corner === "b" || corner === "l" || corner === "r";
        let newBW = bw, newBH = bh;
        if (corner === "br") { newBW = bw + dx; newBH = bh + dy; }
        else if (corner === "bl") { newBW = bw - dx; newBH = bh + dy; }
        else if (corner === "tr") { newBW = bw + dx; newBH = bh - dy; }
        else if (corner === "tl") { newBW = bw - dx; newBH = bh - dy; }
        else if (corner === "r") { newBW = bw + dx; }
        else if (corner === "l") { newBW = bw - dx; }
        else if (corner === "b") { newBH = bh + dy; }
        else if (corner === "t") { newBH = bh - dy; }
        if (aspectLockedRef.current && ids.length === 1 && !isEdgeOnly) {
          const ratio = bw / bh;
          if (Math.abs(dx) > Math.abs(dy)) newBH = newBW / ratio;
          else newBW = newBH * ratio;
        }
        newBW = Math.max(20, newBW);
        newBH = Math.max(20, newBH);
        // Re-derive the box origin from whichever corner/edge is anchored
        // (opposite the one being dragged), so an aspect-lock override (which
        // can change width/height independent of the raw dx/dy) still keeps
        // the correct side pinned instead of drifting.
        let newBX = bx, newBY = by;
        if (corner === "bl" || corner === "tl" || corner === "l") newBX = bx + bw - newBW;
        if (corner === "tr" || corner === "tl" || corner === "t") newBY = by + bh - newBH;
        const sx = newBW / bw;
        const sy = newBH / bh;
        ids.forEach((id) => {
          const o = origins.get(id);
          if (!o) return;
          const relX = o.x - bx;
          const relY = o.y - by;
          updateCompRef.current(id, {
            width: Math.max(10, o.width * sx),
            height: Math.max(10, o.height * sy),
            x: newBX + relX * sx,
            y: newBY + relY * sy,
          });
        });
      }
      if (rotateRef.current) {
        const { id, centerX, centerY, startAngle, startRotation } = rotateRef.current;
        const currentAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX) * (180 / Math.PI);
        const rotation = startRotation + (currentAngle - startAngle);
        updateCompRef.current(id, { rotation: Math.round(((rotation % 360) + 360) % 360) });
      }
      if (heightDragRef.current) {
        const { startY, origH, zone } = heightDragRef.current;
        const setter = viewRef.current === "desktop" ? zoneSettersRef.current[zone].setDesktopHeight : zoneSettersRef.current[zone].setMobileHeight;
        const minH = zone === "template" ? 400 : 40;
        setter(Math.max(minH, origH + (e.clientY - startY) / scale));
      }
      if (marqueeStartRef.current) {
        const rect = canvasElRefs.current[activeZoneRef.current]?.getBoundingClientRect();
        if (rect) {
          const curX = (e.clientX - rect.left) / scale;
          const curY = (e.clientY - rect.top) / scale;
          const { x: sx, y: sy } = marqueeStartRef.current;
          setMarquee({ x: Math.min(sx, curX), y: Math.min(sy, curY), w: Math.abs(curX - sx), h: Math.abs(curY - sy) });
        }
      }
    };
    const onUp = () => {
      dragRef.current = null; resizeRef.current = null; rotateRef.current = null; heightDragRef.current = null;
      setDraggingId(null);
      setAlignmentGuides([]);
      if (marqueeStartRef.current) {
        setMarquee((box) => {
          if (box && (box.w > 3 || box.h > 3)) {
            const list = compsRef.current[activeZoneRef.current][viewRef.current === "desktop" ? "desktop" : "mobile"];
            const hits = list.filter((c) =>
              !c.hidden && c.x < box.x + box.w && c.x + c.width > box.x && c.y < box.y + box.h && c.y + c.height > box.y
            );
            const ids = new Set<string>();
            hits.forEach((c) => {
              if (c.groupId) list.filter((cc) => cc.groupId === c.groupId).forEach((cc) => ids.add(cc.id));
              else ids.add(c.id);
            });
            setSelectedIds(Array.from(ids));
          } else {
            setSelectedIds([]);
          }
          return null;
        });
        marqueeStartRef.current = null;
      }
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
  }, []);

  // ── Upload ──────────────────────────────────────────────────────────────────
  // Every uploaded image gets squeezed down to ~10-20KB — small enough that
  // upload time is dominated by request overhead, not payload, regardless of
  // network conditions or original file size (a phone photo straight off a
  // camera can be 3-8MB). Iteratively drops JPEG quality first, then physical
  // dimensions, until under the cap or a legibility floor is hit. Files that
  // aren't images (or fail to decode) upload as-is.
  async function compressImageForUpload(file: File): Promise<File> {
    const TARGET_MAX_BYTES = 20_000;
    const MIN_DIMENSION = 120;
    const MIN_QUALITY = 0.2;
    if (!file.type.startsWith("image/") || file.type === "image/svg+xml") return file;
    try {
      const bitmap = await createImageBitmap(file);
      let dimension = Math.max(bitmap.width, bitmap.height);
      let quality = 0.8;
      let blob: Blob | null = null;
      for (let attempt = 0; attempt < 16; attempt++) {
        const scale = Math.min(1, dimension / Math.max(bitmap.width, bitmap.height));
        const w = Math.max(1, Math.round(bitmap.width * scale));
        const h = Math.max(1, Math.round(bitmap.height * scale));
        const canvas = document.createElement("canvas");
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) return file;
        ctx.drawImage(bitmap, 0, 0, w, h);
        blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
        if (!blob) return file;
        if (blob.size <= TARGET_MAX_BYTES) break;
        // Cheapen quality first (cheaper visually than shrinking), then fall
        // back to shrinking dimensions once quality is already near the floor.
        if (quality > MIN_QUALITY) quality = Math.max(MIN_QUALITY, quality - 0.15);
        else dimension = Math.max(MIN_DIMENSION, Math.round(dimension * 0.75));
      }
      if (!blob || blob.size >= file.size) return file; // compression didn't actually help — keep original
      return new File([blob], file.name.replace(/\.\w+$/, ".jpg"), { type: "image/jpeg" });
    } catch {
      return file; // decode failed (corrupt file, unsupported format, etc.) — fall back to the original
    }
  }

  // XHR (not fetch) specifically because fetch has no upload-progress event —
  // needed for the visible progress bar in ImagePickerButton below.
  function uploadImageWithProgress(file: File, onProgress: (pct: number) => void): Promise<string | null> {
    return new Promise((resolve) => {
      compressImageForUpload(file).then((toSend) => {
        const fd = new FormData(); fd.append("file", toSend);
        const xhr = new XMLHttpRequest();
        xhr.open("POST", "/api/page-config/upload");
        xhr.upload.onprogress = (e) => { if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100)); };
        xhr.onload = () => {
          if (xhr.status < 200 || xhr.status >= 300) { resolve(null); return; }
          try { resolve(JSON.parse(xhr.responseText).url ?? null); } catch { resolve(null); }
        };
        xhr.onerror = () => resolve(null);
        xhr.send(fd);
      }).catch(() => resolve(null));
    });
  }

  async function uploadImage(file: File): Promise<string | null> {
    setUploading(true);
    setUploadProgress(0);
    try {
      const url = await uploadImageWithProgress(file, setUploadProgress);
      return url;
    } finally { setUploading(false); setUploadProgress(0); }
  }

  // Shared by every ImagePickerButton's onUpload prop: uploads and immediately
  // prepends the result to the local asset list (so it shows up in the "Select
  // from Asset" grid right away, no extra round-trip to re-list from MinIO).
  async function uploadToAssets(file: File): Promise<string | null> {
    const url = await uploadImage(file);
    if (url) setAssetItems((prev) => [{ key: url, url, name: null, size: file.size, lastModified: new Date().toISOString() }, ...(prev ?? [])]);
    return url;
  }

  // ── Rename ──────────────────────────────────────────────────────────────────
  function startRename() { setNameInput(pageLabel); setEditingName(true); setTimeout(() => nameInputRef.current?.select(), 0); }

  async function commitRename() {
    setEditingName(false);
    const name = nameInput.trim();
    if (!name || name === pageLabel) return;
    setPageLabel(name);
    // Pinned pages are a folder's root page — rename via renameFolder instead
    // of the plain page PUT below, so the Pages panel's folder label (which
    // is what's actually displayed for the root page row) stays in sync
    // rather than drifting from this page's own config.name. See
    // renameFolder in page-config.service.ts, which updates both together.
    if (isPinnedPage) {
      const folder = projectsTree.projects.flatMap((p) => p.folders).find((f) => f.rootPage?.page === slug);
      if (folder) {
        await fetch(`/api/page-config/folders/${encodeURIComponent(folder.id)}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name }),
        });
        syncedSignatureRef.current = JSON.stringify({ ...pageConfigPayload, name });
        projectsTree.fetchProjects();
        return;
      }
    }
    // Bug fix: this used to PUT a bare {name, desktop, mobile} payload — the old
    // pre-item-4 flat shape — which silently wiped out header/footer (and their
    // sticky/hideAfterPx settings) on every rename, since save() overwrites the
    // whole config rather than merging. Spread the current (correct, combined)
    // payload and only override name, exactly like the normal save() path.
    const renamedPayload = { ...pageConfigPayload, name };
    const res = await fetch(`/api/pages/${encodeURIComponent(slug)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ config: renamedPayload }),
    });
    if (res.ok) syncedSignatureRef.current = JSON.stringify(renamedPayload);
  }

  // ── Delete ──────────────────────────────────────────────────────────────────
  async function deletePage() {
    setDeleting(true);
    try {
      await fetch(`/api/pages/${encodeURIComponent(slug)}`, { method: "DELETE" });
      router.push("/admin/homepage");
    } catch {
      setDeleting(false);
      setConfirmDelete(false);
    }
  }

  async function logout() {
    setLoggingOut(true);
    try {
      await fetch("/api/logout", { method: "POST" });
    } catch {}
    window.location.href = "/admin-gate";
  }

  // Item 4: Header/Template/Footer are all embedded in this one page's own row —
  // no more shared reserved-slug routes, so editing Header on "Home" can never
  // touch Header on any other page. A single signature/PUT covers all three.
  const templateConfigPayload = {
    desktop: { components: templateDesktopComponents, height: templateDesktopHeight },
    mobile: { components: templateMobileComponents, height: templateMobileHeight },
  };
  // Kept separate from pageConfigSignature purely for version history, which is
  // scoped to Template only (see captureVersion below) — editing just the header
  // shouldn't create a new Template restore point.
  const templateConfigSignature = JSON.stringify(templateConfigPayload);
  // Reconstructs the single template.components array for saving — inverse of
  // the extractZonesFromTemplate call in the load effect above. blocksForSave
  // overlays the currently-ACTIVE header/footer block's live, being-edited
  // components (headerDesktopComponents/footerDesktopComponents etc.) onto
  // the otherwise-dormant blocksDesktop/blocksMobile metadata array, so every
  // block — active or not — is fully up to date at save time.
  function blocksForSave(vp: ViewMode): HeaderFooterBlock[] {
    const blocks = vp === "desktop" ? blocksDesktop : blocksMobile;
    const activeH = (vp === "desktop" ? activeHeaderId.desktop : activeHeaderId.mobile);
    const activeF = (vp === "desktop" ? activeFooterId.desktop : activeFooterId.mobile);
    const liveHeader = vp === "desktop" ? headerDesktopComponents : headerMobileComponents;
    const liveFooter = vp === "desktop" ? footerDesktopComponents : footerMobileComponents;
    return blocks.map((b) => {
      if (b.id === activeH) return { ...b, components: liveHeader };
      if (b.id === activeF) return { ...b, components: liveFooter };
      return b;
    });
  }
  const blocksDesktopForSave = blocksForSave("desktop");
  const blocksMobileForSave = blocksForSave("mobile");
  const builtDesktopTemplate = buildTemplateZone({
    blocks: blocksDesktopForSave,
    templateComponents: templateDesktopComponents,
    templateHeight: templateDesktopHeight,
    canvasWidth: DESKTOP_W,
    canvasHeightHint: templateDesktopHeight + blocksDesktopForSave.filter((b) => b.dock === "top" || b.dock === "bottom").reduce((s, b) => s + b.size, 0),
    newId: uid,
  });
  const builtMobileTemplate = buildTemplateZone({
    blocks: blocksMobileForSave,
    templateComponents: templateMobileComponents,
    templateHeight: templateMobileHeight,
    canvasWidth: MOBILE_W,
    canvasHeightHint: templateMobileHeight + blocksMobileForSave.filter((b) => b.dock === "top" || b.dock === "bottom").reduce((s, b) => s + b.size, 0),
    newId: uid,
  });
  const pageConfigPayload = {
    name: pageLabel || label || slug,
    template: { desktop: builtDesktopTemplate, mobile: builtMobileTemplate },
    canvasBgColor,
  };
  const pageConfigSignature = JSON.stringify(pageConfigPayload);

  // Version Control (manual/timed restore points) is scoped to Template only —
  // Header/Footer don't have their own version history.
  function captureVersion(reason = "Manual checkpoint") {
    if (versionSignatureRef.current === templateConfigSignature) return;
    versionSignatureRef.current = templateConfigSignature;
    setVersions((prev) => [{
      id: uid(),
      label: reason,
      createdAt: new Date().toISOString(),
      desktop: { components: templateDesktopComponents.map((c) => ({ ...c })), height: templateDesktopHeight },
      mobile: { components: templateMobileComponents.map((c) => ({ ...c })), height: templateMobileHeight },
    }, ...prev].slice(0, 6));
  }

  function restoreVersion(version: VersionSnapshot) {
    setTemplateDesktopComponents(version.desktop.components.map((c) => ({ ...c })));
    setTemplateDesktopHeight(version.desktop.height);
    setTemplateMobileComponents(version.mobile.components.map((c) => ({ ...c })));
    setTemplateMobileHeight(version.mobile.height);
    setSelectedIds([]);
    setSyncStatus("dirty");
    setChangeCount((n) => n + 1);
  }

  // ── Save ────────────────────────────────────────────────────────────────────
  // Ref-guarded (not just `disabled={saving}`) so a publish in flight can never be
  // re-triggered by a second click landing in the brief window before React re-renders.
  // One PUT for the whole page (header+template+footer together — item 4), and
  // critically: the response is actually checked. Fetch resolves on ANY HTTP
  // status, so without checking `res.ok` a 401 (e.g. the 15-minute access token
  // expiring mid-session — see authedFetch) would silently look like success and
  // the UI would report "Saved"/"Published" while nothing was written. That was
  // the root cause of item 1.
  async function save(): Promise<boolean> {
    if (savingRef.current) return false;
    savingRef.current = true;
    setSaving(true);
    setSyncStatus("syncing");
    try {
      if (syncedSignatureRef.current !== pageConfigSignature) {
        const res = await fetch(`/api/pages/${encodeURIComponent(slug)}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ config: pageConfigPayload }),
        });
        if (!res.ok) throw new Error(`Save failed: HTTP ${res.status}`);
        syncedSignatureRef.current = pageConfigSignature;
      }
      setSyncStatus("synced");
      setLastSyncedAt(new Date());
      setChangeCount(0);
      captureVersion("Published version");
      setSaved(true); setTimeout(() => setSaved(false), 2500);
      return true;
    } catch {
      setSyncStatus("error");
      return false;
    } finally {
      setSaving(false);
      savingRef.current = false;
    }
  }

  useEffect(() => {
    if (loading) return;
    if (!syncedSignatureRef.current) {
      syncedSignatureRef.current = pageConfigSignature;
      versionSignatureRef.current = templateConfigSignature;
      return;
    }
    if (syncedSignatureRef.current === pageConfigSignature) return;
    setSyncStatus("dirty");
    setChangeCount((n) => n + 1);
    const versionTimer = window.setTimeout(() => captureVersion("Auto checkpoint"), 1200);
    const syncTimer = window.setTimeout(() => { void save(); }, 4000);
    return () => {
      window.clearTimeout(versionTimer);
      window.clearTimeout(syncTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageConfigSignature, loading]);

  const sLabel = "text-[10px] text-muted-foreground block mb-0.5 uppercase tracking-wide";
  const displayLabel = pageLabel || label || slug;
  const syncLabel =
    syncStatus === "syncing" ? "Syncing to server" :
    syncStatus === "dirty" ? "Unsaved changes" :
    syncStatus === "error" ? "Sync failed" :
    syncStatus === "synced" ? "Server synced" :
    "Ready";

  const pageNameBySlug = new Map(pagesList.pages.map((p) => [p.slug, p.name]));

  // A single draggable page row inside a folder or the Unassigned bucket (the
  // Pages panel tree). Dropping onto a row within the SAME bucket reorders
  // (reuses the flat list's old filter-then-reindex pattern, generalized to
  // whatever bucket this row belongs to); dropping a row dragged from a
  // DIFFERENT bucket instead reassigns its folder via movePageToFolder — the
  // bucket-level onDrop handlers (see the Pages tab JSX below) cover dropping
  // into empty space, this one covers dropping directly onto a sibling row.
  function renderPageRow(pageSlug: string, bucketSlugs: string[], folderId: string | null) {
    const name = pageNameBySlug.get(pageSlug) ?? pageSlug;
    if (pagesList.editingSlug === pageSlug) {
      return (
        <input key={pageSlug} value={pagesList.editInput} onChange={(e) => pagesList.setEditInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") pagesList.commitEdit(pageSlug); if (e.key === "Escape") pagesList.setEditingSlug(null); }}
          onBlur={() => pagesList.commitEdit(pageSlug)} autoFocus
          className="text-xs border rounded px-1.5 py-1 mx-1 bg-background" />
      );
    }
    if (pagesList.confirmDeleteSlug === pageSlug) {
      return (
        <div key={pageSlug} className="flex items-center gap-1 px-2 py-1 text-xs">
          <span className="flex-1 truncate text-destructive">Delete "{name}"?</span>
          <button type="button" onClick={() => pagesList.deletePage(pageSlug)} className="text-[10px] px-1.5 py-0.5 rounded bg-red-600 text-white shrink-0">Yes</button>
          <button type="button" onClick={() => pagesList.setConfirmDeleteSlug(null)} className="text-[10px] px-1.5 py-0.5 rounded border shrink-0">No</button>
        </div>
      );
    }
    const isActive = slug === pageSlug;
    return (
      <div key={pageSlug} className="flex flex-col">
        <div
          draggable
          onDragStart={() => setDragPageSlug(pageSlug)}
          onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); if (dragOverPageSlug !== pageSlug) setDragOverPageSlug(pageSlug); }}
          onDragLeave={() => setDragOverPageSlug((s) => (s === pageSlug ? null : s))}
          onDrop={(e) => {
            e.preventDefault(); e.stopPropagation();
            if (dragPageSlug && dragPageSlug !== pageSlug) {
              if (bucketSlugs.includes(dragPageSlug)) {
                const from = bucketSlugs.indexOf(dragPageSlug);
                const to = bucketSlugs.indexOf(pageSlug);
                const reordered = [...bucketSlugs];
                const [moved] = reordered.splice(from, 1);
                reordered.splice(to, 0, moved);
                reorderBucket(reordered);
              } else {
                projectsTree.movePageToFolder(dragPageSlug, folderId);
              }
            }
            setDragPageSlug(null); setDragOverPageSlug(null); setDragOverBucketId(null);
          }}
          onDragEnd={() => { setDragPageSlug(null); setDragOverPageSlug(null); setDragOverBucketId(null); }}
          className={`group flex items-center rounded hover:bg-muted hover:text-gray-900 cursor-grab active:cursor-grabbing ${dragOverPageSlug === pageSlug && dragPageSlug !== pageSlug ? "border-t-2 border-blue-500" : ""}`}
        >
          <GripVertical className="h-3 w-3 text-muted-foreground/50 shrink-0 ml-1" />
          <button type="button" onClick={() => router.push(`/admin/pages/${encodeURIComponent(pageSlug)}`)}
            onDoubleClick={() => pagesList.startEdit(pageSlug, name)}
            className={`flex-1 min-w-0 flex items-center gap-2 text-xs px-2 py-1.5 text-left ${isActive ? "font-medium" : "text-muted-foreground"}`}>
            <FileText className="h-3.5 w-3.5 shrink-0" /> <span className="truncate">{name}</span>
          </button>
          <button type="button" title="Rename" onClick={() => pagesList.startEdit(pageSlug, name)} className="opacity-0 group-hover:opacity-100 p-1 shrink-0 hover:text-foreground text-muted-foreground">
            <Pencil className="h-3 w-3" />
          </button>
          <button type="button" title="Duplicate" onClick={() => projectsTree.duplicatePage(pageSlug)} className="opacity-0 group-hover:opacity-100 p-1 shrink-0 hover:text-foreground text-muted-foreground">
            <Copy className="h-3 w-3" />
          </button>
          <button type="button" title="Delete" onClick={() => pagesList.setConfirmDeleteSlug(pageSlug)} className="opacity-0 group-hover:opacity-100 p-1 pr-2 shrink-0 text-muted-foreground hover:text-destructive">
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
        {/* Layers nested under this page's row — only ever the currently-open
            page (see renderLayersPanel's comment: other pages' components
            aren't loaded into local state, so they can't expand). */}
        {isActive && <div className="ml-4 border-l pl-2">{renderLayersPanel()}</div>}
      </div>
    );
  }

  // Shared header (type label + Delete) + Name/Link + W/H/Rotation fields, reused inside
  // each Add Component accordion so a selected component's settings live right there.
  // Always-visible header (type label + Delete) shown above the 5 collapsible
  // property sections — not itself part of "Layout," just card chrome.
  function renderTypeHeader(comp: PageComponent) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold capitalize flex-1">
          {componentTypeLabel(comp.type)}
        </span>
        <Button variant="destructive" size="sm" className="h-6 px-2 gap-1 text-xs" onClick={() => deleteComp([comp.id])}>
          <Trash2 className="h-3 w-3" /> Delete
        </Button>
      </div>
    );
  }

  // Shared by the header and footer gear-icon settings panels. Operates on
  // whichever block of `kind` is currently active (see activeBlock/
  // updateActiveBlock) — dock side, size (thickness along the dock axis),
  // background colour, two independent hide-on-scroll thresholds, and
  // rotation of the bar itself (contents stay upright — see the
  // rotation-without-rotating-children handling in PreviewCanvas/
  // PreviewOverlay and the live PageRenderer).
  function renderBlockSettings(kind: "header" | "footer") {
    const block = activeBlock(kind);
    if (!block) return null;
    const patch = (p: Partial<BlockMeta>) => updateActiveBlock(kind, p);

    function renderPxField(label: string, value: number | null, draft: string | null, setDraft: (v: string | null) => void, setValue: (v: number | null) => void) {
      const enabled = value !== null;
      return (
        <div>
          <label className="flex items-center gap-1.5 text-[11px] mb-1">
            <input type="checkbox" checked={enabled} onChange={(e) => setValue(e.target.checked ? 400 : null)} className="h-3 w-3" />
            {label}
          </label>
          {enabled && (
            <Input type="number" min={0} step={50}
              value={draft ?? String(value)}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={() => {
                if (draft !== null) {
                  const parsed = parseInt(draft, 10);
                  setValue(Number.isFinite(parsed) ? Math.max(0, parsed) : value);
                }
                setDraft(null);
              }}
              onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
              className="h-6 text-xs px-1.5 ml-4 w-24" />
          )}
        </div>
      );
    }

    return (
      <div className="mx-1 mb-1 p-2 rounded-md border border-gray-700 bg-gray-900 text-gray-200 flex flex-col gap-2">
        <div>
          <label className="text-[10px] text-gray-400 block mb-1 uppercase tracking-wide">Position</label>
          <div className="grid grid-cols-4 gap-1">
            {(["top", "bottom", "left", "right"] as const).map((d) => (
              <button key={d} type="button" onClick={() => patch({ dock: d })}
                className={`h-6 text-[10px] rounded border capitalize ${block.dock === d ? "bg-black text-white border-black" : "border-gray-700"}`}>
                {d}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-[10px] text-gray-400 block mb-1 uppercase tracking-wide">
            Size ({block.dock === "left" || block.dock === "right" ? "width" : "height"})
          </label>
          {renderStepperInput(block.size, 10, 20, 2000, (v) => patch({ size: v }))}
        </div>
        <ColorPicker label="Background colour" value={block.bgColor} onChange={(v) => patch({ bgColor: v })} />
        {renderPxField("Hide on scroll down (px)", block.hideOnScrollDownPx, blockHideDownPxDraft, setBlockHideDownPxDraft, (v) => patch({ hideOnScrollDownPx: v }))}
        {renderPxField("Hide on scroll up (px)", block.hideOnScrollUpPx, blockHideUpPxDraft, setBlockHideUpPxDraft, (v) => patch({ hideOnScrollUpPx: v }))}
        <div>
          <label className="text-[10px] text-gray-400 block mb-1 uppercase tracking-wide">Rotation</label>
          <div className="flex items-center gap-1">
            {([0, 90, 180, 270] as const).map((deg) => (
              <button key={deg} type="button" onClick={() => patch({ rotation: deg })}
                className={`flex-1 h-6 text-[10px] rounded border ${block.rotation === deg ? "bg-black text-white border-black" : "border-gray-700"}`}>
                {deg}°
              </button>
            ))}
          </div>
          <p className="text-[9px] text-gray-400 mt-1">Only the bar rotates — its contents stay upright.</p>
        </div>
      </div>
    );
  }
  // Small pill row for switching which block (of a kind) is active when more
  // than one exists — "Header 1 · Header 2 · +". Hidden entirely (renders
  // null) when there's at most one, so single-header/footer pages look
  // exactly as before.
  function renderBlockSelector(kind: "header" | "footer") {
    const blocks = (view === "desktop" ? blocksDesktop : blocksMobile).filter((b) => b.kind === kind);
    if (blocks.length === 0) return null;
    const activeId = (kind === "header" ? activeHeaderId : activeFooterId)[view];
    return (
      <div className="flex items-center gap-1 px-1 pb-1 flex-wrap">
        {blocks.map((b, i) => (
          <button key={b.id} type="button" onClick={() => setActiveBlock(kind, view, b.id)}
            className={`text-[10px] px-1.5 py-0.5 rounded border ${b.id === activeId ? "bg-black text-white border-black" : "border-gray-200 hover:bg-muted hover:text-gray-900"}`}>
            {kind === "header" ? "Header" : "Footer"} {i + 1}
          </button>
        ))}
        <button type="button" title={`Add another ${kind}`} onClick={() => addBlock(kind)}
          className="flex items-center justify-center h-5 w-5 rounded border border-dashed border-gray-300 hover:bg-muted hover:text-gray-900 text-muted-foreground">
          <Plus className="h-3 w-3" />
        </button>
      </div>
    );
  }

  // Item 2: one zone's fully-interactive canvas (header, template, or
  // footer) — drag/resize/rotate/select/context-menu/drop all wired
  // directly to `zone`, so interacting with a zone that wasn't "active" a
  // moment ago just works in the same gesture (see onDragStart etc. above).
  // Called once per visible zone from the JSX below; stacked back-to-back
  // with no border/gap/label between them so header → template → footer
  // reads as one continuous canvas, not three separate views.
  function renderZoneCanvas(zone: Zone) {
    const comps = zoneComponents[zone][view];
    const zCanvasH = zoneHeights[zone][view];
    const isActiveZone = zone === activeZone;
    const pct = (v: number, total: number) => `${(v / total) * 100}%`;
    return (
      <div key={zone}>
        <div className="flex">
          <div
            ref={(el) => { canvasElRefs.current[zone] = el; }}
            className="relative select-none flex-1 min-w-0"
            style={{ aspectRatio: `${canvasW} / ${zCanvasH}`, backgroundColor: zone === "template" ? canvasBgColor : (activeBlock(zone as "header" | "footer")?.bgColor ?? "#ffffff") }}
            onMouseDown={(e) => onCanvasMouseDown(e, zone)}
            onDragOver={(e) => {
              if (e.dataTransfer.types.includes("application/x-reusable-component")) e.preventDefault();
            }}
            onDrop={(e) => {
              const raw = e.dataTransfer.getData("application/x-reusable-component");
              if (!raw) return;
              e.preventDefault();
              const entry: ReusableComponentEntry = JSON.parse(raw);
              const rect = canvasElRefs.current[zone]!.getBoundingClientRect();
              const scale = rect.width / canvasW;
              const dropX = (e.clientX - rect.left) / scale;
              const dropY = (e.clientY - rect.top) / scale;
              // Independent copy, not a live-synced instance — same pattern as
              // duplicateInPlace() (new id, group fields stripped so it doesn't
              // silently join a group it has nothing to do with on this page).
              // reusable/reusableName also stripped: only the original library
              // entry should be a "source" — a dropped copy staying flagged would
              // duplicate it in the sidebar with a second sourcePage.
              const copy: PageComponent = {
                ...(entry.component as PageComponent),
                id: uid(),
                x: dropX - entry.component.width / 2,
                y: dropY - entry.component.height / 2,
                groupId: undefined, groupName: undefined, groupLink: undefined,
                reusable: undefined, reusableName: undefined,
              };
              if (zone !== activeZoneRef.current) { activeZoneRef.current = zone; setActiveZone(zone); }
              commitUndoSnapshot(zone);
              const setter = view === "desktop" ? zoneSetters[zone].setDesktop : zoneSetters[zone].setMobile;
              setter((prev) => [...prev, copy]);
              setSelectedIds([copy.id]);
            }}
          >
        {zone === "template" && loading && <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">Loading…</div>}
        {isActiveZone && draggingId && (() => {
          const dragged = comps.find((c) => c.id === draggingId);
          if (!dragged) return null;
          const guides = computeSpacingGuides(dragged, comps.filter((c) => c.id !== draggingId));
          return guides.length > 0 ? <SpacingGuides guides={guides} canvasW={canvasW} canvasH={zCanvasH} /> : null;
        })()}
        {isActiveZone && draggingId && alignmentGuides.length > 0 && (
          <AlignmentGuides guides={alignmentGuides} canvasW={canvasW} canvasH={zCanvasH} />
        )}
        {comps.map((comp) => {
          const isSelected = selectedIds.includes(comp.id);
          const isSoleSelected = isSelected && selectedIds.length === 1;
          const isHovered = hoveredId === comp.id;
          const isBtn = comp.type === "button";
          const isShape = comp.type === "shape";
          const isCarousel = comp.type === "carousel";
          const isIcon = comp.type === "icon";
          const isTaxi = comp.type === "location-input" || comp.type === "map" || comp.type === "datetime-picker" || comp.type === "vehicle-selector" || comp.type === "driver-badge" || comp.type === "fare-display";
          const isHero = comp.type === "hero-carousel";
          const isCatCarousel = comp.type === "category-carousel";
          const isText = comp.type === "text" || comp.type === "header";
          const btn = isBtn ? resolveButtonStyles(comp, isHovered) : null;
          const rotation = comp.rotation ?? 0;

          return (
            <div key={comp.id}
              className={`absolute group ${isSoleSelected ? "ring-2 ring-blue-500" : isSelected ? "ring-1 ring-blue-400" : "hover:ring-1 hover:ring-blue-300"}`}
              style={{ left: pct(comp.x, canvasW), top: pct(comp.y, zCanvasH), width: pct(comp.width, canvasW), height: pct(comp.height, zCanvasH), borderRadius: isBtn || isShape || isCarousel || isIcon || isTaxi || isHero || isCatCarousel ? 0 : (comp.borderRadius ?? 0), backgroundColor: isBtn || isShape || isCarousel || isIcon || isTaxi || isHero || isCatCarousel ? "transparent" : (comp.bgColor === "transparent" ? "transparent" : (comp.bgColor ?? "transparent")), transform: `rotate(${rotation}deg)`, transformOrigin: "center", cursor: comp.locked ? "not-allowed" : "move",
                boxShadow: buildBoxShadow(comp), filter: buildBlurFilter(comp),
                // Editor-only convenience dimming — never affects the published page (see PageComponent.hidden).
                ...(comp.hidden ? { opacity: 0.35, pointerEvents: "none" } : {}) }}
              onMouseDown={(e) => onDragStart(e, comp.id, zone)}
              onContextMenu={(e) => handleContextMenu(e, comp, zone)}
              onMouseEnter={() => isBtn && setHoveredId(comp.id)}
              onMouseLeave={() => isBtn && setHoveredId(null)}
            >
              {comp.locked && (
                <div className="absolute -top-1.5 -left-1.5 z-10 h-4 w-4 rounded-full bg-amber-500 text-white flex items-center justify-center shadow pointer-events-none">
                  <Lock className="h-2.5 w-2.5" />
                </div>
              )}
              {(comp.type === "text" || comp.type === "header") && (
                editingTextId === comp.id ? (
                  <div
                    contentEditable
                    suppressContentEditableWarning
                    className="w-full h-full flex items-center overflow-auto px-1 outline-none ring-2 ring-blue-500 cursor-text"
                    style={{ fontSize: `calc(${comp.fontSize ?? 16}px * (${canvasElRefs.current[zone]?.clientWidth ?? canvasW} / ${canvasW}))`, fontFamily: comp.fontFamily ?? "system-ui, -apple-system, sans-serif", lineHeight: comp.lineHeight ?? 1.4, letterSpacing: `${comp.letterSpacing ?? 0}px`, color: comp.fontColor ?? "#111", textAlign: comp.textAlign ?? "left", whiteSpace: "pre-wrap", wordBreak: "break-word" }}
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
                    ref={(el) => {
                      if (!el || el.dataset.focused) return;
                      el.dataset.focused = "1";
                      el.focus();
                      const range = document.createRange();
                      range.selectNodeContents(el);
                      range.collapse(false);
                      const sel = window.getSelection();
                      sel?.removeAllRanges();
                      sel?.addRange(range);
                    }}
                    onBlur={(e) => { updateComp(comp.id, { content: e.currentTarget.textContent ?? "" }, zone); setEditingTextId(null); }}
                    onKeyDown={(e) => {
                      e.stopPropagation();
                      if (e.key === "Escape") { e.currentTarget.blur(); return; }
                      if (e.key === "Enter" && !e.shiftKey && comp.type === "header") { e.preventDefault(); e.currentTarget.blur(); }
                    }}
                  >
                    {comp.content}
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center overflow-hidden px-1"
                    style={{ fontSize: `calc(${comp.fontSize ?? 16}px * (${canvasElRefs.current[zone]?.clientWidth ?? canvasW} / ${canvasW}))`, fontFamily: comp.fontFamily ?? "system-ui, -apple-system, sans-serif", fontWeight: comp.fontWeight ?? (comp.bold ? 700 : 400), fontStyle: comp.italic ? "italic" : "normal", lineHeight: comp.lineHeight ?? 1.4, letterSpacing: `${comp.letterSpacing ?? 0}px`, color: comp.fontColor ?? "#111", opacity: (comp.opacity ?? 100) / 100, textAlign: comp.textAlign ?? "left", textTransform: comp.textTransform ?? "none", textDecoration: textDecorationLine(comp), justifyContent: comp.textAlign === "center" ? "center" : comp.textAlign === "right" ? "flex-end" : "flex-start" }}
                    onDoubleClick={(e) => { if (comp.locked) return; e.stopPropagation(); if (zone !== activeZoneRef.current) { activeZoneRef.current = zone; setActiveZone(zone); } setSelectedIds([comp.id]); setEditingTextId(comp.id); }}
                  >
                    {renderTextBody(comp)}
                  </div>
                )
              )}
              {isShape && (
                <div className="w-full h-full" style={{ backgroundColor: comp.bgColor ?? "#3b82f6", borderRadius: shapeBorderRadius(comp), clipPath: shapeClipPath(comp.shapeType), opacity: (comp.opacity ?? 100) / 100 }} />
              )}
              {isCarousel && (
                <div className="w-full h-full" style={{ backgroundColor: comp.bgColor === "transparent" ? "transparent" : (comp.bgColor ?? "transparent"), opacity: (comp.opacity ?? 100) / 100 }}>
                  <CarouselBody comp={comp} editable />
                </div>
              )}
              {isIcon && <IconGlyph comp={comp} />}
              {comp.type === "location-input" && <LocationInputBody comp={comp} />}
              {comp.type === "map" && <MapBody comp={comp} />}
              {comp.type === "datetime-picker" && <DateTimePickerBody comp={comp} />}
              {comp.type === "vehicle-selector" && <VehicleSelectorBody comp={comp} />}
              {comp.type === "driver-badge" && <DriverBadgeBody comp={comp} />}
              {comp.type === "fare-display" && <FareDisplayBody comp={comp} />}
              {isHero && <HeroCarouselBody comp={comp} />}
              {isCatCarousel && <CategoryCarouselBody comp={comp} canvasW={canvasW} />}
              {comp.type === "image" && <ImageBody comp={comp} placeholderClass="text-gray-400" />}
              {isBtn && btn && (
                <div className="w-full h-full flex items-center justify-center overflow-hidden"
                  style={{ borderRadius: comp.borderRadius ?? 8, backgroundColor: btn.bg, color: btn.color, border: btn.border, textDecoration: btn.isLink ? "underline" : "none", fontSize: `calc(${comp.fontSize ?? 16}px * (${canvasElRefs.current[zone]?.clientWidth ?? canvasW} / ${canvasW}))`, fontFamily: comp.fontFamily ?? "system-ui, -apple-system, sans-serif", fontWeight: comp.fontWeight ?? 600, transition: "background-color 0.15s, color 0.15s", pointerEvents: "none" }}>
                  {comp.content ?? "Button"}
                </div>
              )}
              {isSoleSelected && (
                <>
                  <FloatingToolbar
                    mode="single"
                    locked={comp.locked}
                    hidden={comp.hidden}
                    onDuplicate={() => duplicateComp(comp)}
                    onDelete={() => deleteComp([comp.id], zone)}
                    onToggleLock={() => toggleLocked([comp.id], zone)}
                    onToggleHide={() => toggleHidden([comp.id], zone)}
                    onBringForward={() => moveComponentOrder(comp.id, "forward")}
                    onSendBackward={() => moveComponentOrder(comp.id, "backward")}
                    onBringToFront={() => bringToFront(comp.id)}
                    onSendToBack={() => sendToBack(comp.id)}
                  />
                  {(comp.type === "text" || comp.type === "header") && (
                    <>
                      <div
                        className="absolute z-30 flex items-center gap-1 rounded-md border bg-white px-1 py-1 shadow-sm"
                        style={{ bottom: -38, left: "50%", transform: "translateX(-50%)" }}
                        onMouseDown={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          title="Rotate"
                          className="flex h-6 items-center gap-1 rounded px-1.5 text-[11px] hover:bg-muted hover:text-gray-900"
                          onMouseDown={(e) => onRotateStart(e, comp.id, zone)}
                        >
                          <RotateCcw className="h-3.5 w-3.5" /> Rotate
                        </button>
                        <button
                          type="button"
                          title="Drag"
                          className="flex h-6 items-center gap-1 rounded px-1.5 text-[11px] hover:bg-muted hover:text-gray-900"
                          onMouseDown={(e) => onDragStart(e, comp.id, zone)}
                        >
                          <Move className="h-3.5 w-3.5" /> Drag
                        </button>
                      </div>
                    </>
                  )}
                  {comp.type !== "text" && comp.type !== "header" && (
                    <div className="absolute cursor-grab z-20 flex flex-col items-center" style={{ top: 0, left: "50%", transform: "translateX(-50%) translateY(-100%)", paddingBottom: 2 }} onMouseDown={(e) => onRotateStart(e, comp.id, zone)}>
                      <div className="w-2.5 h-2.5 rounded-full bg-purple-500 border-2 border-white shadow" />
                      <div style={{ width: 1, height: 8, backgroundColor: "#a855f7", opacity: 0.7 }} />
                    </div>
                  )}
                  {/* Resize handles */}
                  {isShape || isCarousel || isText ? (
                    <>
                      <div className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-blue-500 rounded-full border-2 border-white shadow cursor-nwse-resize z-10" onMouseDown={(e) => onResizeStart(e, [comp.id], zone, "tl")} />
                      <div className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-blue-500 rounded-full border-2 border-white shadow cursor-nesw-resize z-10" onMouseDown={(e) => onResizeStart(e, [comp.id], zone, "tr")} />
                      <div className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-blue-500 rounded-full border-2 border-white shadow cursor-nesw-resize z-10" onMouseDown={(e) => onResizeStart(e, [comp.id], zone, "bl")} />
                      <div className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-blue-500 rounded-full border-2 border-white shadow cursor-nwse-resize z-10" onMouseDown={(e) => onResizeStart(e, [comp.id], zone, "br")} />
                      {isText && (
                        // Mid-edge (border) handles — "pull edges to change text box
                        // width/height" independent of the corner handles above.
                        <>
                          <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-4 h-2 bg-blue-500 rounded-sm border-2 border-white shadow cursor-ns-resize z-10" onMouseDown={(e) => onResizeStart(e, [comp.id], zone, "t")} />
                          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-2 bg-blue-500 rounded-sm border-2 border-white shadow cursor-ns-resize z-10" onMouseDown={(e) => onResizeStart(e, [comp.id], zone, "b")} />
                          <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-4 bg-blue-500 rounded-sm border-2 border-white shadow cursor-ew-resize z-10" onMouseDown={(e) => onResizeStart(e, [comp.id], zone, "l")} />
                          <div className="absolute -right-1 top-1/2 -translate-y-1/2 w-2 h-4 bg-blue-500 rounded-sm border-2 border-white shadow cursor-ew-resize z-10" onMouseDown={(e) => onResizeStart(e, [comp.id], zone, "r")} />
                        </>
                      )}
                    </>
                  ) : (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-blue-500 cursor-se-resize z-10" style={{ borderRadius: "2px 0 2px 0" }} onMouseDown={(e) => onResizeStart(e, [comp.id], zone)} />
                  )}
                </>
              )}
            </div>
          );
        })}

        {/* Multi/group selection bounding box + resize handles — only ever
            meaningful for whichever zone is currently active (selection
            never spans zones). */}
        {isActiveZone && selectedComps.length > 1 && (() => {
          const minX = Math.min(...selectedComps.map((c) => c.x));
          const minY = Math.min(...selectedComps.map((c) => c.y));
          const maxX = Math.max(...selectedComps.map((c) => c.x + c.width));
          const maxY = Math.max(...selectedComps.map((c) => c.y + c.height));
          const ids = selectedComps.map((c) => c.id);
          return (
            <div className="absolute border-2 border-blue-500 pointer-events-none z-20"
              style={{ left: pct(minX, canvasW), top: pct(minY, zCanvasH), width: pct(maxX - minX, canvasW), height: pct(maxY - minY, zCanvasH) }}>
              <div className="absolute -top-6 left-0 text-[10px] bg-blue-500 text-white px-1.5 py-0.5 rounded whitespace-nowrap">
                {selectionGroupId ? (selectedComps[0].groupName || "Group") : `${ids.length} selected`}
              </div>
              <div className="pointer-events-auto">
                <FloatingToolbar
                  mode="multi"
                  canGroup={!selectionGroupId}
                  canUngroup={!!selectionGroupId}
                  canDistribute={selectedComps.length >= 3}
                  locked={selectedComps.every((c) => c.locked)}
                  onDelete={() => deleteComp(ids)}
                  onGroup={groupSelected}
                  onUngroup={ungroupSelected}
                  onAlign={alignSelected}
                  onDistribute={distributeSelected}
                  onToggleLock={() => setLockedForAll(ids, !selectedComps.every((c) => c.locked))}
                />
              </div>
              <div className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-blue-500 rounded-full border-2 border-white shadow cursor-nwse-resize pointer-events-auto" onMouseDown={(e) => onResizeStart(e, ids, zone, "tl")} />
              <div className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-blue-500 rounded-full border-2 border-white shadow cursor-nesw-resize pointer-events-auto" onMouseDown={(e) => onResizeStart(e, ids, zone, "tr")} />
              <div className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-blue-500 rounded-full border-2 border-white shadow cursor-nesw-resize pointer-events-auto" onMouseDown={(e) => onResizeStart(e, ids, zone, "bl")} />
              <div className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-blue-500 rounded-full border-2 border-white shadow cursor-nwse-resize pointer-events-auto" onMouseDown={(e) => onResizeStart(e, ids, zone, "br")} />
            </div>
          );
        })()}

        {/* Rubber-band marquee */}
        {isActiveZone && marquee && (marquee.w > 1 || marquee.h > 1) && (
          <div className="absolute border border-blue-500 bg-blue-500/10 pointer-events-none z-30"
            style={{ left: `${(marquee.x / canvasW) * 100}%`, top: `${(marquee.y / zCanvasH) * 100}%`, width: `${(marquee.w / canvasW) * 100}%`, height: `${(marquee.h / zCanvasH) * 100}%` }} />
        )}
          </div>
        </div>

        {/* Height drag handle — every visible zone gets one now (header/
            footer used to only be resizable via a strip's numeric input;
            this is a straightforward upgrade since all three sit in the
            same interactive canvas already). */}
        <div className="mx-auto mt-0 flex items-center justify-center h-4 cursor-ns-resize group" style={{ width: "100%", maxWidth: canvasW }} onMouseDown={(e) => onHeightDragStart(e, zone)}>
          <div className="w-16 h-1 bg-gray-700 group-hover:bg-blue-400 rounded-full transition-colors" />
        </div>
      </div>
    );
  }

  // Collapsible wrapper shared by all 5 property sections (Layout/Appearance/
  // Typography/Responsive/Effects) — open/closed state is shared across every
  // selected component via `openPropertySections` (all default open).
  function renderPropertySection(id: PropertySection, label: string, content: React.ReactNode) {
    const isOpen = openPropertySections[id];
    return (
      <div className="border-t pt-1.5 mt-1.5 first:border-t-0 first:pt-0 first:mt-0">
        <button type="button" onClick={() => setOpenPropertySections((p) => ({ ...p, [id]: !p[id] }))}
          className="w-full flex items-center justify-between text-left mb-1.5">
          <span className={sLabel}>{label}</span>
          <ChevronDown className={`h-3 w-3 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`} />
        </button>
        {isOpen && <div className="flex flex-col gap-2">{content}</div>}
      </div>
    );
  }
  // Non-collapsible variant — just a label + content, no toggle button, no
  // way to hide it. Used by the Text panel (item 3): every option must be
  // visible at once, with nothing behind a click-to-expand affordance.
  function renderFlatSection(label: string, content: React.ReactNode) {
    return (
      <div className="border-t pt-1.5 mt-1.5 first:border-t-0 first:pt-0 first:mt-0">
        <span className={`${sLabel} block mb-1.5`}>{label}</span>
        <div className="flex flex-col gap-2">{content}</div>
      </div>
    );
  }

  // Responsive section content — desktop/mobile are fully separate component
  // arrays already (no per-component override system), so this is a simple
  // cross-link rather than a new responsive-override UI.
  function renderResponsiveHint() {
    const other = view === "desktop" ? "mobile" : "desktop";
    return (
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className="text-muted-foreground">Editing: <strong className="text-foreground capitalize">{view}</strong></span>
        <button type="button" onClick={() => { setSelectedIds([]); setView(other); }}
          className="flex items-center gap-1 text-[11px] px-1.5 py-0.5 rounded border border-gray-200 hover:bg-muted hover:text-gray-900">
          {other === "mobile" ? <Smartphone className="h-3 w-3" /> : <Monitor className="h-3 w-3" />} Check {other}
        </button>
      </div>
    );
  }

  function renderCommonFields(comp: PageComponent) {
    return (
      <>
        <div className="grid grid-cols-2 gap-1.5">
          <div>
            <label className={sLabel}>Name</label>
            <Input value={comp.name ?? ""} onChange={(e) => updateComp(comp.id, { name: e.target.value })} placeholder="e.g. Products Button" className="h-6 text-xs px-1.5" />
          </div>
          <div>
            <label className={sLabel + " flex items-center gap-0.5"}><Link2 className="h-2 w-2" /> Link to page</label>
            <Input value={comp.link ?? ""} onChange={(e) => updateComp(comp.id, { link: e.target.value })} placeholder="/products" className="h-6 text-xs px-1.5" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          <div>
            <label className={sLabel}>W</label>
            <Input type="number" value={Math.round(comp.width)} onChange={(e) => updateComp(comp.id, { width: +e.target.value })} className="h-6 text-xs px-1.5" />
          </div>
          <div>
            <label className={sLabel}>H</label>
            <Input type="number" value={Math.round(comp.height)} onChange={(e) => updateComp(comp.id, { height: +e.target.value })} className="h-6 text-xs px-1.5" />
          </div>
          <div>
            <label className={sLabel + " flex items-center gap-0.5"}><RotateCcw className="h-2 w-2" />°</label>
            <Input type="number" min="-360" max="360" step="1" value={Math.round(comp.rotation ?? 0)} onChange={(e) => updateComp(comp.id, { rotation: +e.target.value })} className="h-6 text-xs px-1.5" />
          </div>
        </div>
        <div className="flex items-center gap-1">
          {[0, 90, 180, 270].map((deg) => (
            <button key={deg} type="button" onClick={() => updateComp(comp.id, { rotation: deg })}
              className={`flex-1 h-6 text-[10px] rounded border ${Math.round(comp.rotation ?? 0) === deg ? "bg-black text-white border-black" : "border-gray-200 hover:bg-muted hover:text-gray-900"}`}>
              {deg}°
            </button>
          ))}
        </div>
        <button type="button" onClick={() => setAspectLocked((v) => !v)}
          className={`flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded border w-fit ${aspectLocked ? "border-black bg-muted" : "border-gray-200 text-muted-foreground hover:bg-muted hover:text-gray-900"}`}
        >
          {aspectLocked ? <Lock className="h-2.5 w-2.5" /> : <Unlock className="h-2.5 w-2.5" />} Lock aspect ratio while resizing
        </button>
      </>
    );
  }

  // Shadow/blur builder — shared across the shape/image/button/carousel/icon
  // accordions (not text, which keeps its own textEffect system). Ships solid-color
  // only per the "gradient support for future" deferral — reuses the existing
  // ColorPicker as-is rather than a new gradient editor.
  function renderShadowBlurFields(comp: PageComponent) {
    return (
      <div className="flex flex-col gap-2 pt-1.5 border-t">
        <p className={sLabel}>Shadow &amp; Blur</p>
        <div className="grid grid-cols-2 gap-1.5">
          <div>
            <label className={sLabel}>Shadow X</label>
            <div className="flex items-center gap-1">
              <input type="range" min="-40" max="40" value={comp.shadowX ?? 0} onChange={(e) => updateComp(comp.id, { shadowX: +e.target.value })} className="w-full" />
              <Input type="number" value={comp.shadowX ?? 0} onChange={(e) => updateComp(comp.id, { shadowX: +e.target.value })} className="h-6 w-12 text-xs px-1.5 shrink-0" />
            </div>
          </div>
          <div>
            <label className={sLabel}>Shadow Y</label>
            <div className="flex items-center gap-1">
              <input type="range" min="-40" max="40" value={comp.shadowY ?? 0} onChange={(e) => updateComp(comp.id, { shadowY: +e.target.value })} className="w-full" />
              <Input type="number" value={comp.shadowY ?? 0} onChange={(e) => updateComp(comp.id, { shadowY: +e.target.value })} className="h-6 w-12 text-xs px-1.5 shrink-0" />
            </div>
          </div>
          <div>
            <label className={sLabel}>Blur</label>
            <div className="flex items-center gap-1">
              <input type="range" min="0" max="80" value={comp.shadowBlur ?? 0} onChange={(e) => updateComp(comp.id, { shadowBlur: +e.target.value })} className="w-full" />
              <Input type="number" min="0" value={comp.shadowBlur ?? 0} onChange={(e) => updateComp(comp.id, { shadowBlur: +e.target.value })} className="h-6 w-12 text-xs px-1.5 shrink-0" />
            </div>
          </div>
          <div>
            <label className={sLabel}>Spread</label>
            <div className="flex items-center gap-1">
              <input type="range" min="-20" max="40" value={comp.shadowSpread ?? 0} onChange={(e) => updateComp(comp.id, { shadowSpread: +e.target.value })} className="w-full" />
              <Input type="number" value={comp.shadowSpread ?? 0} onChange={(e) => updateComp(comp.id, { shadowSpread: +e.target.value })} className="h-6 w-12 text-xs px-1.5 shrink-0" />
            </div>
          </div>
        </div>
        <ColorPicker label="Shadow color" value={comp.shadowColor ?? "#000000"} onChange={(v) => updateComp(comp.id, { shadowColor: v })} />
        <div>
          <label className={sLabel}>Blur amount (component itself)</label>
          <div className="flex items-center gap-1">
            <input type="range" min="0" max="20" value={comp.blurAmount ?? 0} onChange={(e) => updateComp(comp.id, { blurAmount: +e.target.value })} className="w-full" />
            <Input type="number" min="0" value={comp.blurAmount ?? 0} onChange={(e) => updateComp(comp.id, { blurAmount: +e.target.value })} className="h-6 w-12 text-xs px-1.5 shrink-0" />
          </div>
        </div>
      </div>
    );
  }

  // Categorized icon grid, reused for both "add a new icon" and "change the
  // selected icon" — clicking an entry calls onPick with its registry id.
  function renderIconPicker(onPick: (iconId: string) => void, activeId?: string) {
    return (
      <div className="max-h-56 overflow-y-auto flex flex-col gap-2 pr-0.5">
        {HOME_ICON_CATEGORIES.map((cat) => (
          <div key={cat}>
            <p className="text-[9px] uppercase tracking-wide text-muted-foreground mb-1">{cat}</p>
            <div className="grid grid-cols-6 gap-1">
              {HOME_ICONS.filter((i) => i.category === cat).map((icon) => (
                <button key={icon.id} type="button" title={icon.label} onClick={() => onPick(icon.id)}
                  className={`flex items-center justify-center h-8 rounded border transition-colors ${activeId === icon.id ? "bg-black text-white border-black" : "border-gray-200 bg-white hover:border-black text-gray-700"}`}>
                  <icon.Icon className="h-4 w-4" />
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Every subdomain currently claimed by ANY folder, project-wide — not just
  // the ones from the original Seller/Rider setup. Numbered by order of
  // first appearance across the tree so "Subdomain 1"/"Subdomain 2" stay
  // stable and new ones a folder connects to just keep counting up (item 6:
  // "When new subdomains are created, they appear in this list as subdomain
  // 3, 4, etc.").
  function connectableSubdomains(): { label: string; value: string }[] {
    const seen = new Set<string>();
    const list: { label: string; value: string }[] = [];
    let n = 0;
    for (const p of projectsTree.projects) {
      for (const f of p.folders) {
        if (f.subdomain && !seen.has(f.subdomain)) {
          seen.add(f.subdomain);
          n += 1;
          list.push({ label: `Subdomain ${n} (${f.subdomain}.iiinbox.com)`, value: f.subdomain });
        }
      }
    }
    return list;
  }

  // "Connect to" box (item 6) — a folder's domain/subdomain assignment.
  // Pages inside a folder connected to a subdomain become reachable at that
  // subdomain's root (see middleware.ts's dynamic subdomain resolution,
  // already fully general-purpose); "Domain (iiinbox.com)" just means "no
  // dedicated subdomain" (subdomain: null) — the folder's pages are still
  // reachable via their normal /slug route on the apex domain either way,
  // this only controls the extra subdomain-root shortcut.
  function renderConnectBox(folder: ProjectFolder) {
    const isOpen = connectMenuFolderId === folder.id;
    const current = folder.subdomain
      ? connectableSubdomains().find((s) => s.value === folder.subdomain)?.label ?? `${folder.subdomain}.iiinbox.com`
      : "Domain (iiinbox.com)";
    async function choose(subdomain: string | null) {
      setConnectError(null);
      const result = await projectsTree.setFolderSubdomain(folder.id, subdomain);
      if (!result.ok) setConnectError(result.error ?? "Failed to connect");
      else setConnectMenuFolderId(null);
    }
    return (
      <div className="relative mb-1">
        <button
          type="button"
          onClick={() => { setConnectMenuFolderId(isOpen ? null : folder.id); setConnectError(null); setNewSubdomainInput(""); }}
          className="w-full flex items-center justify-between gap-2 px-2 py-2 rounded-md border border-gray-700 bg-gray-800 transition-colors text-left"
        >
          <span className="min-w-0">
            <span className="block text-[9px] uppercase tracking-wide text-gray-400">Connect to</span>
            <span className="block text-xs font-medium truncate text-gray-100">{current}</span>
          </span>
          <ChevronDown className={`h-3.5 w-3.5 text-gray-400 shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`} />
        </button>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setConnectMenuFolderId(null)} />
            <div className="absolute left-0 right-0 top-full mt-1 z-50 rounded-md border border-gray-700 bg-gray-800 shadow-lg p-1.5 flex flex-col gap-0.5 text-gray-100">
              <button type="button" onClick={() => choose(null)}
                className={`text-left text-xs px-2 py-1.5 rounded ${!folder.subdomain ? "bg-gray-700 font-medium" : ""}`}>
                Domain (iiinbox.com)
              </button>
              {connectableSubdomains().map((s) => (
                <button key={s.value} type="button" onClick={() => choose(s.value)}
                  className={`text-left text-xs px-2 py-1.5 rounded ${folder.subdomain === s.value ? "bg-gray-700 font-medium" : ""}`}>
                  {s.label}
                </button>
              ))}
              <div className="h-px bg-gray-700 my-0.5" />
              <div className="flex items-center gap-1 px-1">
                <input
                  value={newSubdomainInput}
                  onChange={(e) => setNewSubdomainInput(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                  placeholder="new-subdomain"
                  className="flex-1 min-w-0 h-6 text-xs border border-gray-700 rounded px-1.5 bg-gray-900 text-gray-100 placeholder:text-gray-500"
                />
                <button type="button" disabled={!newSubdomainInput.trim()} onClick={() => choose(newSubdomainInput.trim())}
                  className="text-[11px] px-2 py-1 rounded bg-black text-white disabled:opacity-40 shrink-0">
                  Connect
                </button>
              </div>
              {connectError && <p className="text-[10px] text-destructive px-1">{connectError}</p>}
            </div>
          </>
        )}
      </div>
    );
  }

  // Layers tree for whichever page is currently open in the editor —
  // nested under that page's row in the Project tab (see the tree JSX
  // below), not a standalone tab anymore. Only the active page's
  // components are loaded into local state at all (zoneComponents etc.),
  // so other pages' rows can't expand their own layers without fetching
  // that page's config too — they stay click-to-navigate instead.
  function renderLayersPanel() {
    return (
                  <div className="flex flex-col gap-2.5">
                    <div className="relative px-1">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground pointer-events-none" />
                      <input
                        value={layerSearch}
                        onChange={(e) => setLayerSearch(e.target.value)}
                        placeholder="Search components…"
                        className="w-full h-7 text-xs border rounded-md pl-7 pr-2 bg-background"
                      />
                    </div>
                    {ZONE_META.map(({ zone, label: zoneLabel }) => {
                      const query = layerSearch.trim().toLowerCase();
                      const allZoneComps = zoneComponents[zone][view];
                      const zoneComps = query
                        ? allZoneComps.filter((c) => (c.name?.trim() || componentTypeLabel(c.type)).toLowerCase().includes(query))
                        : allZoneComps;
                      const zoneIsExpanded = query ? true : expandedZones[zone];
                      // Header/Footer are optional now, added via the ADD COMPONENT
                      // list (like any other component) rather than a dedicated
                      // link here — so this row simply doesn't render at all until
                      // one exists (Template always exists; it's the one mandatory
                      // zone every page has).
                      const zoneHasAnyBlock = zone === "header"
                        ? (view === "desktop" ? activeHeaderId.desktop : activeHeaderId.mobile) !== null
                        : zone === "footer"
                        ? (view === "desktop" ? activeFooterId.desktop : activeFooterId.mobile) !== null
                        : true;
                      if ((zone === "header" || zone === "footer") && !zoneHasAnyBlock) {
                        return null;
                      }
                      return (
                        <div key={zone} className="flex flex-col gap-0.5">
                          {/* Zone row (Header/Template/Footer) */}
                          <div className="flex items-center gap-1 px-1">
                            <button type="button" onClick={() => setExpandedZones((p) => ({ ...p, [zone]: !p[zone] }))}
                              className="p-0.5 rounded hover:bg-muted hover:text-gray-900 shrink-0">
                              <ChevronDown className={`h-3 w-3 text-muted-foreground transition-transform ${zoneIsExpanded ? "" : "-rotate-90"}`} />
                            </button>
                            <span className="text-[10px] uppercase tracking-wide font-semibold text-muted-foreground flex-1 truncate">
                              {zoneLabel} {zoneComps.length > 0 && `(${zoneComps.length})`}
                            </span>
                            <div className="relative shrink-0">
                              <button type="button" title={`Add to ${zoneLabel}`} onClick={() => setZoneAddMenuOpen((z) => (z === zone ? null : zone))} className="p-1 rounded hover:bg-muted hover:text-gray-900">
                                <Plus className="h-3.5 w-3.5" />
                              </button>
                              {zoneAddMenuOpen === zone && (
                                <>
                                  <div className="fixed inset-0 z-40" onClick={() => setZoneAddMenuOpen(null)} />
                                  <div className="absolute right-0 top-full mt-1 z-50 w-48 max-h-80 overflow-y-auto rounded-md border border-gray-700 bg-gray-800 shadow-lg p-1.5 flex flex-col gap-0.5 text-gray-100">
                                    <button type="button" onClick={() => { addComponent("text", undefined, zone); setZoneAddMenuOpen(null); }} className="flex items-center gap-1.5 text-xs px-2 py-1 rounded text-left"><Type className="h-3 w-3" /> Text</button>
                                    <button type="button" onClick={() => { addShape("rectangle", zone); setZoneAddMenuOpen(null); }} className="flex items-center gap-1.5 text-xs px-2 py-1 rounded text-left"><Square className="h-3 w-3" /> Shape</button>
                                    <button type="button" onClick={() => { addImage("single", zone); setZoneAddMenuOpen(null); }} className="flex items-center gap-1.5 text-xs px-2 py-1 rounded text-left"><ImageIcon className="h-3 w-3" /> Image</button>
                                    <button type="button" onClick={() => { addComponent("button", BUTTON_PRESETS[0].patch, zone); setZoneAddMenuOpen(null); }} className="flex items-center gap-1.5 text-xs px-2 py-1 rounded text-left"><ComponentIcon className="h-3 w-3" /> Button</button>
                                    <button type="button" onClick={() => { addCarousel(zone); setZoneAddMenuOpen(null); }} className="flex items-center gap-1.5 text-xs px-2 py-1 rounded text-left"><GalleryHorizontal className="h-3 w-3" /> Carousel</button>
                                    <button type="button" onClick={() => { addHeroCarousel(zone); setZoneAddMenuOpen(null); }} className="flex items-center gap-1.5 text-xs px-2 py-1 rounded text-left"><GalleryHorizontalEnd className="h-3 w-3" /> Hero Carousel</button>
                                    <button type="button" onClick={() => { addCategoryCarousel(zone); setZoneAddMenuOpen(null); }} className="flex items-center gap-1.5 text-xs px-2 py-1 rounded text-left"><LayoutGrid className="h-3 w-3" /> Category Carousel</button>
                                    <button type="button" onClick={() => { addIcon("cart", zone); setZoneAddMenuOpen(null); }} className="flex items-center gap-1.5 text-xs px-2 py-1 rounded text-left"><Square className="h-3 w-3" /> Icon</button>
                                    <div className="h-px bg-gray-700 my-0.5" />
                                    <p className="text-[9px] uppercase tracking-wide text-gray-400 px-2">Widgets</p>
                                    {MARKET_WIDGETS.map((w) => (
                                      <button key={w.id} type="button" onClick={() => { addMarketWidget(w.id, zone); setZoneAddMenuOpen(null); }} className="flex items-center gap-1.5 text-xs px-2 py-1 rounded text-left">
                                        <w.icon className="h-3 w-3" /> {w.label}
                                      </button>
                                    ))}
                                    <div className="h-px bg-gray-700 my-0.5" />
                                    <p className="text-[9px] uppercase tracking-wide text-gray-400 px-2">Ride-hailing</p>
                                    <button type="button" onClick={() => { addLocationInput(zone); setZoneAddMenuOpen(null); }} className="flex items-center gap-1.5 text-xs px-2 py-1 rounded text-left"><MapPin className="h-3 w-3" /> Location Input</button>
                                    <button type="button" onClick={() => { addMap(zone); setZoneAddMenuOpen(null); }} className="flex items-center gap-1.5 text-xs px-2 py-1 rounded text-left"><MapIcon className="h-3 w-3" /> Map</button>
                                    <button type="button" onClick={() => { addDateTimePicker(zone); setZoneAddMenuOpen(null); }} className="flex items-center gap-1.5 text-xs px-2 py-1 rounded text-left"><CalendarClock className="h-3 w-3" /> Date & Time Picker</button>
                                    <button type="button" onClick={() => { addVehicleSelector(zone); setZoneAddMenuOpen(null); }} className="flex items-center gap-1.5 text-xs px-2 py-1 rounded text-left"><CarFront className="h-3 w-3" /> Vehicle Selector</button>
                                    <button type="button" onClick={() => { addDriverBadge(zone); setZoneAddMenuOpen(null); }} className="flex items-center gap-1.5 text-xs px-2 py-1 rounded text-left"><BadgeCheck className="h-3 w-3" /> Driver Badge</button>
                                    <button type="button" onClick={() => { addFareDisplay(zone); setZoneAddMenuOpen(null); }} className="flex items-center gap-1.5 text-xs px-2 py-1 rounded text-left"><Receipt className="h-3 w-3" /> Fare Display</button>
                                    <button type="button" onClick={() => { addComponent("button", BUTTON_PRESETS.find((p) => p.label === "Book Now")?.patch ?? BUTTON_PRESETS[0].patch, zone); setZoneAddMenuOpen(null); }} className="flex items-center gap-1.5 text-xs px-2 py-1 rounded text-left"><ComponentIcon className="h-3 w-3" /> Book Now Button</button>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Section rows within this zone, with tree connector lines */}
                          {zoneIsExpanded && (
                            zoneComps.length === 0 ? (
                              <p className="text-[11px] text-muted-foreground text-center py-2 pl-5">{query ? "No matches" : "No sections yet"}</p>
                            ) : (
                              [...zoneComps].reverse().map((comp) => {
                                const isSelected = activeZone === zone && selectedIds.includes(comp.id);
                                const isContainer = comp.type === "carousel" || comp.type === "vehicle-selector" || comp.type === "hero-carousel" || comp.type === "category-carousel";
                                const children = isContainer ? childItemsOf(comp) : [];
                                const containerExpanded = expandedContainers[comp.id] ?? false;
                                const isRenaming = renamingId === comp.id;
                                return (
                                  <div key={comp.id} className="flex flex-col">
                                    <div className="flex items-stretch">
                                      <div className="w-3 shrink-0 flex justify-center"><div className="w-px bg-muted-foreground/20 my-1" /></div>
                                      <div
                                        draggable={!isRenaming}
                                        onDragStart={(e) => { setDragLayerId(comp.id); e.dataTransfer.effectAllowed = "move"; }}
                                        onDragOver={(e) => { e.preventDefault(); if (dragOverLayerId !== comp.id) setDragOverLayerId(comp.id); }}
                                        onDragLeave={() => setDragOverLayerId((id) => (id === comp.id ? null : id))}
                                        onDrop={(e) => {
                                          e.preventDefault();
                                          if (dragLayerId && dragLayerId !== comp.id) { setActiveZone(zone); reorderComponents(dragLayerId, comp.id, zone); }
                                          setDragLayerId(null); setDragOverLayerId(null);
                                        }}
                                        onDragEnd={() => { setDragLayerId(null); setDragOverLayerId(null); }}
                                        onClick={(e) => {
                                          // Shift-click toggles membership (add/remove), matching the canvas's
                                          // shift-click behavior — but only within the same zone, since selectedIds
                                          // only ever refers to one zone's array at a time (the canvas only ever
                                          // shows one zone). Shift-clicking a row from a different zone just
                                          // switches to it as a fresh single selection.
                                          if (e.shiftKey && zone === activeZone) {
                                            setSelectedIds((prev) => (prev.includes(comp.id) ? prev.filter((id) => id !== comp.id) : [...prev, comp.id]));
                                            return;
                                          }
                                          setActiveZone(zone);
                                          setSelectedIds([comp.id]);
                                        }}
                                        className={`group flex-1 min-w-0 flex items-center gap-1 rounded-md border px-1.5 py-1 text-xs cursor-pointer transition-colors bg-background ${
                                          isSelected ? "bg-blue-50 border-blue-400" : "border-transparent hover:bg-muted hover:text-gray-900"
                                        } ${dragOverLayerId === comp.id && dragLayerId !== comp.id ? "border-dashed border-blue-500" : ""}`}
                                      >
                                        <GripVertical className="h-3 w-3 text-muted-foreground shrink-0 cursor-grab" />
                                        {isContainer && (
                                          <button type="button" title={containerExpanded ? "Collapse" : "Expand"}
                                            onClick={(e) => { e.stopPropagation(); setExpandedContainers((p) => ({ ...p, [comp.id]: !containerExpanded })); }}
                                            className="p-0.5 rounded hover:bg-background hover:text-gray-900 shrink-0">
                                            <ChevronRight className={`h-3 w-3 transition-transform ${containerExpanded ? "rotate-90" : ""}`} />
                                          </button>
                                        )}
                                        {layerIcon(comp)}
                                        {isRenaming ? (
                                          <input
                                            autoFocus
                                            value={renameInput}
                                            onChange={(e) => setRenameInput(e.target.value)}
                                            onClick={(e) => e.stopPropagation()}
                                            onKeyDown={(e) => {
                                              if (e.key === "Enter") { updateComp(comp.id, { name: renameInput.trim() }, zone); setRenamingId(null); }
                                              if (e.key === "Escape") setRenamingId(null);
                                            }}
                                            onBlur={() => { updateComp(comp.id, { name: renameInput.trim() }, zone); setRenamingId(null); }}
                                            className="flex-1 min-w-0 text-xs border rounded px-1 py-0 bg-white"
                                          />
                                        ) : (
                                          <span className="truncate flex-1 min-w-0">{comp.name?.trim() || componentTypeLabel(comp.type)}</span>
                                        )}
                                        <div className="relative shrink-0">
                                          <button type="button" title="More options"
                                            onClick={(e) => { e.stopPropagation(); setOpenRowMenu((id) => (id === comp.id ? null : comp.id)); }}
                                            className={`flex h-5 w-5 items-center justify-center rounded hover:bg-background hover:text-gray-900 ${openRowMenu === comp.id ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}>
                                            <MoreVertical className="h-3 w-3" />
                                          </button>
                                          {openRowMenu === comp.id && (
                                            <>
                                              <div className="fixed inset-0 z-40" onClick={(e) => { e.stopPropagation(); setOpenRowMenu(null); }} />
                                              <div className="absolute right-0 top-full mt-1 z-50 min-w-[150px] rounded-md border border-gray-700 bg-gray-800 shadow-lg py-1 text-xs text-gray-100" onClick={(e) => e.stopPropagation()}>
                                                <button type="button" onClick={() => { setActiveZone(zone); duplicateInPlace(comp, zone); setOpenRowMenu(null); }} className="w-full flex items-center gap-2 text-left px-3 py-1.5"><Copy className="h-3 w-3" /> Duplicate</button>
                                                <button type="button" onClick={() => { setActiveZone(zone); toggleHidden([comp.id], zone); setOpenRowMenu(null); }} className="w-full flex items-center gap-2 text-left px-3 py-1.5">
                                                  {comp.hidden ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />} {comp.hidden ? "Show" : "Hide"}
                                                </button>
                                                <button type="button" onClick={() => { setActiveZone(zone); toggleLocked([comp.id], zone); setOpenRowMenu(null); }} className="w-full flex items-center gap-2 text-left px-3 py-1.5">
                                                  {comp.locked ? <Unlock className="h-3 w-3" /> : <Lock className="h-3 w-3" />} {comp.locked ? "Unlock" : "Lock"}
                                                </button>
                                                <button type="button" onClick={() => { setActiveZone(zone); setRenameInput(comp.name?.trim() || componentTypeLabel(comp.type)); setRenamingId(comp.id); setOpenRowMenu(null); }} className="w-full flex items-center gap-2 text-left px-3 py-1.5"><Pencil className="h-3 w-3" /> Rename</button>
                                                <button type="button" disabled={comp.locked} onClick={() => { setActiveZone(zone); deleteComp([comp.id], zone); setOpenRowMenu(null); }} className="w-full flex items-center gap-2 text-left px-3 py-1.5 text-red-400 disabled:opacity-40 disabled:cursor-not-allowed"><Trash2 className="h-3 w-3" /> Delete</button>
                                              </div>
                                            </>
                                          )}
                                        </div>
                                      </div>
                                    </div>

                                    {/* Nested child rows: Carousel slides / Vehicle Selector options */}
                                    {isContainer && containerExpanded && (
                                      <div className="flex flex-col">
                                        {children.map((item) => {
                                          const childKey = `child:${item.id}`;
                                          return (
                                            <div key={item.id} className="flex items-stretch">
                                              <div className="w-3 shrink-0" />
                                              <div className="w-3 shrink-0 flex justify-center"><div className="w-px bg-muted-foreground/20 my-1" /></div>
                                              <div className="flex-1 min-w-0 flex items-center gap-1 rounded-md px-1.5 py-1 text-xs hover:bg-muted hover:text-gray-900 group">
                                                <span className="truncate flex-1 min-w-0 text-muted-foreground">{item.label}</span>
                                                <div className="relative shrink-0">
                                                  <button type="button" title="More options" onClick={() => setOpenRowMenu((id) => (id === childKey ? null : childKey))}
                                                    className={`flex h-5 w-5 items-center justify-center rounded hover:bg-background hover:text-gray-900 ${openRowMenu === childKey ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}>
                                                    <MoreVertical className="h-3 w-3" />
                                                  </button>
                                                  {openRowMenu === childKey && (
                                                    <>
                                                      <div className="fixed inset-0 z-40" onClick={() => setOpenRowMenu(null)} />
                                                      <div className="absolute right-0 top-full mt-1 z-50 min-w-[130px] rounded-md border border-gray-700 bg-gray-800 shadow-lg py-1 text-xs text-gray-100">
                                                        <button type="button" onClick={() => { setActiveZone(zone); duplicateChildItem(comp, item.id, zone); setOpenRowMenu(null); }} className="w-full flex items-center gap-2 text-left px-3 py-1.5"><Copy className="h-3 w-3" /> Duplicate</button>
                                                        <button type="button" onClick={() => { setActiveZone(zone); removeChildItem(comp, item.id, zone); setOpenRowMenu(null); }} className="w-full flex items-center gap-2 text-left px-3 py-1.5 text-red-400"><Trash2 className="h-3 w-3" /> Delete</button>
                                                      </div>
                                                    </>
                                                  )}
                                                </div>
                                              </div>
                                            </div>
                                          );
                                        })}
                                        <div className="flex items-stretch">
                                          <div className="w-3 shrink-0" />
                                          <div className="w-3 shrink-0 flex justify-center"><div className="w-px bg-muted-foreground/20 h-1/2" /></div>
                                          <button type="button" onClick={() => { setActiveZone(zone); addChildItem(comp, zone); }}
                                            className="flex-1 min-w-0 flex items-center gap-1.5 px-1.5 py-1 text-xs text-blue-600 hover:bg-blue-50 rounded-md">
                                            <Plus className="h-3 w-3" /> {childAddLabel(comp)}
                                          </button>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                );
                              })
                            )
                          )}
                        </div>
                      );
                    })}
                  </div>
    );
  }

  // ── JSX ─────────────────────────────────────────────────────────────────────
  const hasHeaderBlock = (view === "desktop" ? activeHeaderId.desktop : activeHeaderId.mobile) !== null;
  const hasFooterBlock = (view === "desktop" ? activeFooterId.desktop : activeFooterId.mobile) !== null;

  // Full-viewport takeover (same fixed-inset-0 precedent as the Preview overlay
  // below, just one z-layer under it) — covers the shared AdminTopNav rather than
  // modifying it, so other admin routes (which still render through the normal
  // layout) are completely unaffected by this editor's own chrome.
  return (
    <div className="fixed inset-0 z-30 flex flex-col bg-gray-900 p-4">
      {/* Folder-level Preview overlay — opened from the Pages panel's [Preview]
          button (see openFolderPreview above), not from anything in this
          editor's own top bar. Publishing here promotes the WHOLE folder. */}
      {previewFolder && previewPageData && (
        <PreviewOverlay
          title={`Live Preview — ${previewFolder.name}`}
          pageData={previewPageData}
          siteSettings={siteSettings}
          onClose={() => { setPreviewFolder(null); setPreviewPageData(null); }}
          footerNote="Preview only — click “Publish Folder” to make every page in this folder live."
          actions={
            <Button
              size="sm"
              className="gap-1.5 text-white hover:opacity-90"
              style={{ backgroundColor: "#6366f1" }}
              disabled={publishingFromPreview}
              onClick={async () => {
                if (!previewFolder) return;
                setPublishingFromPreview(true);
                const ok = await handlePublishFolder(previewFolder);
                setPublishingFromPreview(false);
                if (ok) setTimeout(() => { setPreviewFolder(null); setPreviewPageData(null); }, 700);
              }}
            >
              {publishingFromPreview ? "Publishing…" : <><Rocket className="h-3.5 w-3.5" /> Publish Folder</>}
            </Button>
          }
        />
      )}
      {previewFolder && previewLoading && !previewPageData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
          <span className="text-sm text-muted-foreground">Loading preview…</span>
        </div>
      )}

      {/* Main editor */}
      <div className="flex flex-col h-full min-h-0">

        {/* Top bar — gray chrome (matches the left/right sidebars and bottom
            bar for one consistent "gray toolbar, white canvas" look). Desktop/
            Mobile sits in its own centered column regardless of how wide the
            left (name) / right (tools) columns are. No brand/logo — Logout
            moved to the bottom bar (see below); everything else here is
            unchanged, just restyled for a light background. */}
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 shrink-0 mb-3 rounded-lg px-3 py-2.5 bg-gray-800 border border-gray-700">

          {/* Left: page name + inline sync indicator */}
          <div className="flex items-center gap-2 min-w-0">
            {editingName ? (
              <input
                ref={nameInputRef}
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                onBlur={commitRename}
                onKeyDown={(e) => { if (e.key === "Enter") commitRename(); if (e.key === "Escape") setEditingName(false); }}
                className="text-xl font-semibold bg-transparent border-b border-gray-500 outline-none w-48 text-gray-100"
              />
            ) : (
              <button onClick={startRename} className="flex items-center gap-1.5 group min-w-0">
                <h1 className="text-lg sm:text-xl font-semibold text-gray-100 truncate">{displayLabel}</h1>
                <Pencil className="h-3.5 w-3.5 text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
              </button>
            )}

            {/* Autosave runs invisibly in the background (see the debounced save()
                effect above) — no Save/Preview/Publish buttons here. Publish
                lives on the folder (Pages panel) and on the project (next to
                the project name) — never here, so there's exactly one publish
                action per scope instead of a third page-scoped one that could
                disagree with either. */}
            <span className={`text-xs ml-1 hidden md:flex items-center gap-1 shrink-0 ${syncStatus === "error" ? "text-red-400" : syncStatus === "dirty" || syncStatus === "syncing" ? "text-gray-400" : "text-green-400"}`}>
              <Cloud className={`h-3.5 w-3.5 ${syncStatus === "syncing" ? "animate-pulse" : ""}`} /> {syncLabel}
            </span>
          </div>

          {/* Center: Desktop/Mobile toggle */}
          <div className="flex items-center rounded-lg border border-gray-600 bg-gray-700 overflow-hidden">
            <button onClick={() => { setSelectedIds([]); setView("desktop"); }}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-sm transition-colors ${view === "desktop" ? "text-white" : "text-gray-300 hover:bg-gray-600"}`}
              style={view === "desktop" ? { backgroundColor: "#6366f1" } : undefined}>
              <Monitor className="h-3.5 w-3.5" /><span className="hidden sm:inline">Desktop</span>
            </button>
            <button onClick={() => { setSelectedIds([]); setView("mobile"); }}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-sm transition-colors ${view === "mobile" ? "text-white" : "text-gray-300 hover:bg-gray-600"}`}
              style={view === "mobile" ? { backgroundColor: "#6366f1" } : undefined}>
              <Smartphone className="h-3.5 w-3.5" /><span className="hidden sm:inline">Mobile</span>
            </button>
          </div>

          {/* Right: undo/redo, delete page */}
          <div className="flex flex-wrap items-center gap-2 justify-end">
            {/* Undo/redo — per-zone-per-view snapshot stacks, independent of Version Control */}
            <div className="flex items-center rounded-lg border border-gray-600 bg-gray-700 overflow-hidden">
              <button type="button" title="Undo (⌘Z)" disabled={!undoAvailable[zoneViewKey(activeZone, view)]} onClick={undo}
                className="flex items-center justify-center h-8 w-8 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-600 text-gray-300">
                <Undo2 className="h-3.5 w-3.5" />
              </button>
              <button type="button" title="Redo (⌘⇧Z)" disabled={!redoAvailable[zoneViewKey(activeZone, view)]} onClick={redo}
                className="flex items-center justify-center h-8 w-8 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-600 text-gray-300 border-l border-gray-600">
                <Redo2 className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Delete page — not shown for pinned pages (Home/Seller/Rider Dashboard) */}
            {!isPinnedPage && !confirmDelete && (
              <Button variant="outline" size="sm" className="gap-1.5 bg-gray-700 text-red-400 hover:bg-red-950 border-red-800"
                onClick={() => setConfirmDelete(true)}>
                <Trash2 className="h-3.5 w-3.5" /> Delete Page
              </Button>
            )}
            {!isPinnedPage && confirmDelete && (
              <div className="flex items-center gap-2 rounded-lg border border-red-800 bg-red-950 px-3 py-1.5">
                <span className="text-xs text-red-300 font-medium">Delete "{displayLabel}"?</span>
                <button onClick={deletePage} disabled={deleting}
                  className="text-xs px-2 py-0.5 rounded bg-destructive text-white disabled:opacity-50">
                  {deleting ? "Deleting…" : "Yes, delete"}
                </button>
                <button onClick={() => setConfirmDelete(false)} className="text-xs px-2 py-0.5 rounded border border-gray-600 bg-gray-700 text-gray-300 hover:bg-gray-600">
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Canvas + right panel */}
        <div className="flex flex-col lg:flex-row flex-1 min-h-0 border rounded-lg overflow-hidden">

          {/* Left sidebar — Project / Upload / History tabs, gray chrome,
              auto-hide. Collapsed = pinned hidden (persisted, see
              LEFT_SIDEBAR_HIDDEN_KEY); hoverReveal = transient "peek" while
              the mouse is over the thin edge strip, cleared on mouse-leave so
              it re-hides automatically unless explicitly pinned open (click
              the arrow, not just hover). Width animates via CSS transition —
              see the auto-fit-zoom effect above, which now waits out this
              same 300ms before re-measuring the canvas. */}
          <div
            className={`shrink-0 border-r border-gray-700 bg-gray-800 flex flex-col overflow-hidden transition-[width] duration-300 ease-in-out ${leftSidebarVisible ? "w-full lg:w-60" : "w-7"}`}
          >
            {!leftSidebarVisible ? (
              <button type="button" title="Show panel" onClick={() => setLeftSidebarCollapsed(false)}
                className="flex-1 flex items-center justify-center hover:bg-gray-700 text-gray-400">
                <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <>
            <div className="flex items-center shrink-0 bg-gray-900">
                <div className="flex-1 flex items-center">
                  {([
                    { id: "project" as const, label: "Project", icon: FileText },
                    { id: "assets" as const, label: "Upload", icon: ImageIcon },
                    { id: "history" as const, label: "History", icon: History },
                  ]).map((tab) => (
                    <button key={tab.id} type="button" title={tab.label}
                      onClick={() => { setActiveLeftTab(tab.id); if (tab.id === "assets") loadAssets(); }}
                      className={`flex-1 flex flex-col items-center gap-0.5 py-1.5 text-[10px] border-b-2 transition-colors ${activeLeftTab === tab.id ? "text-gray-100 font-medium" : "border-transparent text-gray-500 hover:bg-gray-700/60"}`}
                      style={activeLeftTab === tab.id ? { borderBottomColor: "#6366f1" } : undefined}>
                      <tab.icon className="h-3.5 w-3.5" />
                      {tab.label}
                    </button>
                  ))}
                </div>
              <button type="button" title="Hide panel" onClick={hideLeftSidebar}
                className="shrink-0 p-2 hover:bg-gray-700 text-gray-400">
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
            </div>

              <div className="flex-1 overflow-y-auto p-2 text-gray-200">
                {/* Pages */}
                {activeLeftTab === "project" && (() => {
                  const assignedSlugs = new Set(
                    projectsTree.projects.flatMap((proj) => proj.folders.flatMap((f) => f.pages.map((p) => p.page))),
                  );
                  const unassigned = pagesList.pages.filter((p) => !assignedSlugs.has(p.slug));
                  const unassignedSlugs = unassigned.map((p) => p.slug);
                  const projectIds = projectsTree.projects.map((p) => p.id);
                  return (
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center justify-between px-1 mb-1">
                        <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Projects</p>
                        <button
                          type="button"
                          title="New project"
                          disabled={projectsTree.creatingProject}
                          onClick={async () => {
                            const id = await projectsTree.createProject(`Project ${projectsTree.projects.length + 1}`);
                            if (id) projectsTree.startEditProject(id, `Project ${projectsTree.projects.length + 1}`);
                          }}
                          className="p-1 rounded disabled:opacity-50"
                        >
                          <FolderPlus className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      {projectsTree.loading && <p className="text-[11px] text-muted-foreground px-2 py-1">Loading…</p>}

                      {projectsTree.projects.map((project) => {
                        const isCollapsed = projectsTree.collapsedProjectIds.has(project.id);
                        return (
                        <div
                          key={project.id}
                          draggable
                          onDragStart={() => setDragProjectId(project.id)}
                          onDragOver={(e) => { e.preventDefault(); if (dragOverProjectId !== project.id) setDragOverProjectId(project.id); }}
                          onDragLeave={() => setDragOverProjectId((id) => (id === project.id ? null : id))}
                          onDrop={(e) => {
                            e.preventDefault();
                            if (dragProjectId && dragProjectId !== project.id) {
                              const from = projectIds.indexOf(dragProjectId);
                              const to = projectIds.indexOf(project.id);
                              const reordered = [...projectIds];
                              const [moved] = reordered.splice(from, 1);
                              reordered.splice(to, 0, moved);
                              projectsTree.reorderProjects(reordered);
                            }
                            setDragProjectId(null); setDragOverProjectId(null);
                          }}
                          onDragEnd={() => { setDragProjectId(null); setDragOverProjectId(null); }}
                          className={`mb-2.5 ${dragOverProjectId === project.id && dragProjectId !== project.id ? "border-t-2 border-blue-500" : ""}`}
                        >
                          <div className="flex items-center gap-1 px-1 py-1 group cursor-grab active:cursor-grabbing">
                            <GripVertical className="h-3 w-3 text-muted-foreground/40 shrink-0" />
                            {projectsTree.editingProjectId === project.id ? (
                              <input
                                value={projectsTree.projectEditInput}
                                onChange={(e) => projectsTree.setProjectEditInput(e.target.value)}
                                onKeyDown={(e) => { if (e.key === "Enter") projectsTree.commitEditProject(project.id); if (e.key === "Escape") projectsTree.setEditingProjectId(null); }}
                                onBlur={() => projectsTree.commitEditProject(project.id)}
                                autoFocus
                                className="text-xs font-semibold border rounded px-1.5 py-0.5 flex-1 min-w-0 bg-background text-gray-900"
                              />
                            ) : (
                              <button
                                type="button"
                                onClick={() => projectsTree.toggleProjectCollapsed(project.id)}
                                onDoubleClick={() => projectsTree.startEditProject(project.id, project.name)}
                                className="flex items-center gap-1 flex-1 min-w-0 text-left"
                              >
                                <ChevronDown className={`h-3 w-3 text-muted-foreground shrink-0 transition-transform ${isCollapsed ? "-rotate-90" : ""}`} />
                                <span className="text-xs font-semibold uppercase tracking-wide truncate">{project.name}</span>
                              </button>
                            )}
                            <button
                              type="button"
                              title="Publish everything in this project — every folder, live instantly"
                              disabled={projectsTree.publishingProjectId === project.id}
                              onClick={() => handlePublishProject(project.id)}
                              className="p-1 rounded text-muted-foreground shrink-0 disabled:opacity-50"
                            >
                              <Rocket className="h-3 w-3" />
                            </button>
                            <button
                              type="button"
                              title="New folder in this project"
                              onClick={() => { setNewFolderProjectId(project.id); setNewFolderNameInput("New Folder"); }}
                              className="p-1 rounded text-muted-foreground shrink-0"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                            <div className="relative shrink-0">
                              <button type="button" title="More options" onClick={() => setOpenTreeMenu((id) => (id === project.id ? null : project.id))}
                                className={`p-1 rounded text-muted-foreground ${openTreeMenu === project.id ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}>
                                <MoreVertical className="h-3 w-3" />
                              </button>
                              {openTreeMenu === project.id && (
                                <>
                                  <div className="fixed inset-0 z-40" onClick={() => setOpenTreeMenu(null)} />
                                  <div className="absolute right-0 top-full mt-1 z-50 min-w-[150px] rounded-md border border-gray-700 bg-gray-800 shadow-lg py-1 text-xs text-gray-100">
                                    <button type="button" onClick={() => { projectsTree.startEditProject(project.id, project.name); setOpenTreeMenu(null); }} className="w-full flex items-center gap-2 text-left px-3 py-1.5"><Pencil className="h-3 w-3" /> Edit name</button>
                                    <button type="button" onClick={() => { projectsTree.toggleProjectCollapsed(project.id); setOpenTreeMenu(null); }} className="w-full flex items-center gap-2 text-left px-3 py-1.5"><ChevronDown className="h-3 w-3" /> {isCollapsed ? "Expand" : "Minimize"}</button>
                                    <button type="button" onClick={() => { projectsTree.duplicateProject(project.id); setOpenTreeMenu(null); }} className="w-full flex items-center gap-2 text-left px-3 py-1.5"><Copy className="h-3 w-3" /> Duplicate project</button>
                                    <button type="button" onClick={() => { setConfirmDeleteProjectId(project.id); setOpenTreeMenu(null); }} className="w-full flex items-center gap-2 text-left px-3 py-1.5 text-destructive"><Trash2 className="h-3 w-3" /> Delete</button>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>

                          {confirmDeleteProjectId === project.id && (
                            <div className="flex items-center gap-1 px-2 py-1 ml-4 text-xs">
                              <span className="flex-1 truncate text-destructive">Delete "{project.name}"?</span>
                              <button type="button" onClick={async () => { await projectsTree.deleteProject(project.id); setConfirmDeleteProjectId(null); }} className="text-[10px] px-1.5 py-0.5 rounded bg-red-600 text-white shrink-0">Yes</button>
                              <button type="button" onClick={() => setConfirmDeleteProjectId(null)} className="text-[10px] px-1.5 py-0.5 rounded border shrink-0">No</button>
                            </div>
                          )}

                          {newFolderProjectId === project.id && (
                            <div className="ml-4 px-1 py-1">
                              <input
                                autoFocus
                                value={newFolderNameInput}
                                onChange={(e) => setNewFolderNameInput(e.target.value)}
                                onKeyDown={async (e) => {
                                  if (e.key === "Enter") { const n = newFolderNameInput.trim(); setNewFolderProjectId(null); if (n) await projectsTree.createFolder(project.id, n); }
                                  if (e.key === "Escape") setNewFolderProjectId(null);
                                }}
                                onBlur={async () => { const n = newFolderNameInput.trim(); setNewFolderProjectId(null); if (n) await projectsTree.createFolder(project.id, n); }}
                                className="text-xs border rounded px-1.5 py-1 bg-background w-full text-gray-900"
                              />
                            </div>
                          )}

                          {!isCollapsed && project.folders.map((folder) => {
                            const otherSlugs = folder.pages.filter((p) => p.id !== folder.rootPageId).map((p) => p.page);
                            const isDropTarget = dragOverBucketId === folder.id;
                            const folderCollapsed = projectsTree.collapsedFolderIds.has(folder.id);
                            return (
                              <div
                                key={folder.id}
                                onDragOver={(e) => { e.preventDefault(); if (dragOverBucketId !== folder.id) setDragOverBucketId(folder.id); }}
                                onDragLeave={() => setDragOverBucketId((id) => (id === folder.id ? null : id))}
                                onDrop={(e) => {
                                  e.preventDefault();
                                  if (dragPageSlug && !otherSlugs.includes(dragPageSlug)) projectsTree.movePageToFolder(dragPageSlug, folder.id);
                                  setDragPageSlug(null); setDragOverBucketId(null); setDragOverPageSlug(null);
                                }}
                                className={`mb-1.5 ml-1 rounded ${isDropTarget ? "ring-2 ring-blue-400" : ""}`}
                              >
                                <div className="flex items-center gap-1 px-1 py-1 rounded group">
                                  <FolderIcon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                  {projectsTree.editingFolderId === folder.id ? (
                                    <input
                                      value={projectsTree.folderEditInput}
                                      onChange={(e) => projectsTree.setFolderEditInput(e.target.value)}
                                      onKeyDown={(e) => { if (e.key === "Enter") projectsTree.commitEditFolder(folder.id); if (e.key === "Escape") projectsTree.setEditingFolderId(null); }}
                                      onBlur={() => projectsTree.commitEditFolder(folder.id)}
                                      autoFocus
                                      className="text-xs border rounded px-1.5 py-0.5 flex-1 min-w-0 bg-background text-gray-900"
                                    />
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => projectsTree.toggleFolderCollapsed(folder.id)}
                                      onDoubleClick={() => projectsTree.startEditFolder(folder.id, folder.name)}
                                      className="flex-1 min-w-0 flex items-center gap-1 text-left"
                                    >
                                      <ChevronDown className={`h-3 w-3 text-muted-foreground shrink-0 transition-transform ${folderCollapsed ? "-rotate-90" : ""}`} />
                                      <span className="text-xs font-medium truncate">{folder.name}</span>
                                      {folder.subdomain && <span className="text-[9px] text-muted-foreground shrink-0">{folder.subdomain}</span>}
                                    </button>
                                  )}
                                  <button type="button" title="Preview this folder's live root page" onClick={() => openFolderPreview(folder)} className="p-1 rounded text-muted-foreground shrink-0">
                                    <Eye className="h-3 w-3" />
                                  </button>
                                  <button
                                    type="button"
                                    title="Publish every page in this folder — live instantly"
                                    disabled={projectsTree.publishingFolderId === folder.id}
                                    onClick={() => handlePublishFolder(folder)}
                                    className="p-1 rounded text-muted-foreground shrink-0 disabled:opacity-50"
                                  >
                                    <Rocket className="h-3 w-3" />
                                  </button>
                                  <button
                                    type="button"
                                    title="New page in this folder"
                                    onClick={() => { setNewPageFolderId(folder.id); setNewPageOpen(true); }}
                                    className="p-1 rounded text-muted-foreground shrink-0"
                                  >
                                    <Plus className="h-3 w-3" />
                                  </button>
                                  <div className="relative shrink-0">
                                    <button type="button" title="More options" onClick={() => setOpenTreeMenu((id) => (id === folder.id ? null : folder.id))}
                                      className={`p-1 rounded text-muted-foreground ${openTreeMenu === folder.id ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}>
                                      <MoreVertical className="h-3 w-3" />
                                    </button>
                                    {openTreeMenu === folder.id && (
                                      <>
                                        <div className="fixed inset-0 z-40" onClick={() => setOpenTreeMenu(null)} />
                                        <div className="absolute right-0 top-full mt-1 z-50 min-w-[150px] rounded-md border border-gray-700 bg-gray-800 shadow-lg py-1 text-xs text-gray-100">
                                          <button type="button" onClick={() => { projectsTree.startEditFolder(folder.id, folder.name); setOpenTreeMenu(null); }} className="w-full flex items-center gap-2 text-left px-3 py-1.5"><Pencil className="h-3 w-3" /> Edit name</button>
                                          <button type="button" onClick={() => { projectsTree.toggleFolderCollapsed(folder.id); setOpenTreeMenu(null); }} className="w-full flex items-center gap-2 text-left px-3 py-1.5"><ChevronDown className="h-3 w-3" /> {folderCollapsed ? "Expand" : "Minimize"}</button>
                                          <button type="button" onClick={() => { setConfirmDeleteFolderId(folder.id); setOpenTreeMenu(null); }} className="w-full flex items-center gap-2 text-left px-3 py-1.5 text-destructive"><Trash2 className="h-3 w-3" /> Delete</button>
                                        </div>
                                      </>
                                    )}
                                  </div>
                                </div>

                                {confirmDeleteFolderId === folder.id && (() => {
                                  const pageCount = otherSlugs.length + (folder.rootPage ? 1 : 0);
                                  return (
                                    <div className="flex flex-col gap-1 px-2 py-1.5 ml-4 text-xs rounded border border-destructive/40 bg-destructive/5">
                                      <span className="text-destructive font-medium">Delete "{folder.name}"?</span>
                                      {pageCount > 0 && (
                                        <span className="text-muted-foreground">{pageCount} page{pageCount === 1 ? "" : "s"} inside will move to Unassigned (draft-only, not deleted).</span>
                                      )}
                                      {folder.subdomain && (
                                        <span className="text-destructive">This folder is connected to {folder.subdomain}.iiinbox.com — deleting it disconnects that subdomain.</span>
                                      )}
                                      <div className="flex items-center gap-1.5 mt-0.5">
                                        <button type="button" onClick={async () => { await projectsTree.deleteFolder(folder.id); setConfirmDeleteFolderId(null); }} className="text-[10px] px-2 py-0.5 rounded bg-red-600 text-white shrink-0">Yes, delete</button>
                                        <button type="button" onClick={() => setConfirmDeleteFolderId(null)} className="text-[10px] px-2 py-0.5 rounded border shrink-0">Cancel</button>
                                      </div>
                                    </div>
                                  );
                                })()}

                                {!folderCollapsed && (
                                  <div className="ml-4 flex flex-col gap-0.5">
                                    {renderConnectBox(folder)}
                                    {folder.rootPage && (
                                      <>
                                        <button
                                          type="button"
                                          onClick={() => router.push(`/admin/pages/${encodeURIComponent(folder.rootPage!.page)}`)}
                                          onDoubleClick={() => projectsTree.startEditFolder(folder.id, folder.name)}
                                          className={`flex items-center gap-2 text-xs px-2 py-1.5 rounded text-left ${slug === folder.rootPage!.page ? "bg-muted font-medium" : " text-muted-foreground"}`}
                                        >
                                          <FileText className="h-3.5 w-3.5 shrink-0" /> <span className="truncate">{folder.name}</span>
                                        </button>
                                        {slug === folder.rootPage.page && <div className="ml-4 border-l pl-2">{renderLayersPanel()}</div>}
                                      </>
                                    )}
                                    {otherSlugs.map((s) => renderPageRow(s, otherSlugs, folder.id))}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                        );
                      })}

                      {/* Unassigned — draft-only. Never live no matter how many times
                          saved, until dragged into a folder and that folder is
                          published (see movePageToFolder / publishFolder). */}
                      <div
                        onDragOver={(e) => { e.preventDefault(); if (dragOverBucketId !== "unassigned") setDragOverBucketId("unassigned"); }}
                        onDragLeave={() => setDragOverBucketId((id) => (id === "unassigned" ? null : id))}
                        onDrop={(e) => {
                          e.preventDefault();
                          if (dragPageSlug && !unassignedSlugs.includes(dragPageSlug)) projectsTree.movePageToFolder(dragPageSlug, null);
                          setDragPageSlug(null); setDragOverBucketId(null); setDragOverPageSlug(null);
                        }}
                        className={`mt-1 ml-1 rounded ${dragOverBucketId === "unassigned" ? "ring-2 ring-blue-400" : ""}`}
                      >
                        <div className="flex items-center justify-between px-1 py-1 mb-0.5">
                          <p className="text-[10px] uppercase tracking-wide text-muted-foreground" title="Draft-only — drag into a folder, then publish that folder, to go live">
                            Unassigned
                          </p>
                          <button type="button" title="New page" onClick={() => { setNewPageFolderId(null); setNewPageOpen(true); }} className="p-1 rounded">
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <div className="flex flex-col gap-0.5">
                          {unassignedSlugs.map((s) => renderPageRow(s, unassignedSlugs, null))}
                          {unassigned.length === 0 && (
                            <p className="text-[10px] text-muted-foreground px-2 py-1.5">
                              Drag a page here to pull it out of a folder, or create a new one — it stays draft-only until moved into a folder and published.
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })()}

                <NewPageDialog open={newPageOpen} onOpenChange={setNewPageOpen} pages={pagesList.pages} createPage={createPageAndSync} folderId={newPageFolderId} />


                {/* Assets */}
                {activeLeftTab === "assets" && (
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between px-1">
                      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Fonts {fontItems && fontItems.length > 0 ? `(${fontItems.length})` : ""}</p>
                      <label className="p-1 rounded cursor-pointer flex items-center gap-1" title="Upload font (.ttf, .otf, .woff, .woff2)">
                        {uploadingFont ? <span className="text-[10px] text-muted-foreground">{fontUploadProgress}%</span> : <Plus className="h-3.5 w-3.5" />}
                        <input type="file" accept=".ttf,.otf,.woff,.woff2" className="hidden" onChange={async (e) => {
                          const file = e.target.files?.[0]; if (!file) return;
                          await uploadFont(file);
                          e.target.value = "";
                        }} />
                      </label>
                    </div>
                    {uploadingFont && (
                      <div className="h-1 w-full rounded-full bg-muted overflow-hidden">
                        <div className="h-full bg-blue-500 transition-all" style={{ width: `${fontUploadProgress}%` }} />
                      </div>
                    )}
                    {fontsLoading ? (
                      <p className="text-[11px] text-muted-foreground text-center py-3">Loading…</p>
                    ) : (fontItems ?? []).length === 0 ? (
                      <p className="text-[11px] text-muted-foreground text-center py-3">No fonts uploaded yet — upload from the IBOX FONT folder to use them on Text components.</p>
                    ) : (
                      <div className="flex flex-col gap-1">
                        {(fontItems ?? []).map((f) => (
                          <div key={f.key} className="group flex items-center justify-between gap-2 rounded border border-gray-700 px-2 py-1.5 transition-colors">
                            <span className="truncate text-xs" style={{ fontFamily: `"${f.family}"` }} title={f.name}>{f.name}</span>
                            <button type="button" title="Delete font" onClick={() => deleteFont(f.key)}
                              className="shrink-0 p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-destructive/10 text-destructive transition-opacity">
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    </div>
                    <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between px-1">
                      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Assets {assetItems && assetItems.length > 0 ? `(${assetItems.length})` : ""}</p>
                      {/* Uploads always land in the library first — never auto-placed on
                          canvas. Click a thumbnail below to place it (already worked). */}
                      <label className="p-1 rounded cursor-pointer flex items-center gap-1" title="Upload new">
                        {uploading ? <span className="text-[10px] text-muted-foreground">{uploadProgress}%</span> : <Plus className="h-3.5 w-3.5" />}
                        <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                          const file = e.target.files?.[0]; if (!file) return;
                          await uploadToAssets(file);
                        }} />
                      </label>
                    </div>
                    {uploading && (
                      <div className="h-1 w-full rounded-full bg-muted overflow-hidden">
                        <div className="h-full bg-blue-500 transition-all" style={{ width: `${uploadProgress}%` }} />
                      </div>
                    )}
                    {assetsLoading ? (
                      <p className="text-[11px] text-muted-foreground text-center py-4">Loading…</p>
                    ) : (assetItems ?? []).length === 0 ? (
                      <p className="text-[11px] text-muted-foreground text-center py-4">No uploads yet</p>
                    ) : (
                      <div className="grid grid-cols-2 gap-1.5">
                        {(assetItems ?? []).map((a) => (
                          <div key={a.key} className="group relative aspect-square rounded border border-gray-700 overflow-hidden transition-colors">
                            <button type="button" title="Insert as image" onClick={() => addImageFromUrl(a.url)} className="absolute inset-0">
                              <img src={a.url} alt="" className="w-full h-full object-cover" />
                            </button>
                            <button
                              type="button"
                              title="Rename"
                              onClick={(e) => { e.stopPropagation(); setRenamingAssetKey(a.key); setRenameAssetInput(a.name ?? ""); }}
                              className="absolute top-1 right-1 p-1 rounded bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Pencil className="h-3 w-3" />
                            </button>
                            {renamingAssetKey === a.key ? (
                              <input
                                autoFocus
                                value={renameAssetInput}
                                onChange={(e) => setRenameAssetInput(e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                                onKeyDown={(e) => { if (e.key === "Enter") commitAssetRename(a.key); if (e.key === "Escape") setRenamingAssetKey(null); }}
                                onBlur={() => commitAssetRename(a.key)}
                                className="absolute bottom-0 inset-x-0 text-[10px] px-1 py-0.5 bg-white border-t text-gray-900"
                              />
                            ) : a.name ? (
                              <p className="absolute bottom-0 inset-x-0 text-[10px] px-1 py-0.5 bg-black/60 text-white truncate pointer-events-none">{a.name}</p>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    )}
                    </div>
                  </div>
                )}

                {/* History — Live Workflow (sync status) + Version Control (checkpoint/restore) */}
                {activeLeftTab === "history" && (
                  <div className="flex flex-col gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Cloud className="h-3.5 w-3.5 text-muted-foreground" />
                        <p className="text-xs font-semibold flex-1">Live Workflow</p>
                        <span className={`text-[10px] font-semibold ${syncStatus === "error" ? "text-destructive" : syncStatus === "dirty" ? "text-amber-700" : "text-green-700"}`}>
                          {syncStatus === "syncing" ? "Syncing" : syncStatus === "dirty" ? "Draft" : syncStatus === "error" ? "Error" : "Live"}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-1.5">
                        {["Draft", "Preview", "Publish"].map((step, i) => (
                          <div key={step} className={`rounded-md border px-1.5 py-1 text-center text-gray-900 ${i === 0 && syncStatus === "dirty" ? "bg-amber-50 border-amber-200" : i === 2 && syncStatus === "synced" ? "bg-green-50 border-green-200" : "bg-background"}`}>
                            <p className="text-[10px] font-semibold">{step}</p>
                          </div>
                        ))}
                      </div>
                      <div className="mt-2 flex items-center gap-1.5">
                        <Button variant="outline" size="sm" className="h-7 flex-1 gap-1 text-xs" onClick={() => captureVersion("Manual checkpoint")}>
                          <History className="h-3 w-3" /> Checkpoint
                        </Button>
                        <Button size="sm" className="h-7 flex-1 gap-1 text-xs" disabled={saving} onClick={save}>
                          <Rocket className="h-3 w-3" /> Deploy
                        </Button>
                      </div>
                      <p className="mt-1.5 text-[10px] text-muted-foreground">
                        {lastSyncedAt ? `Last sync ${lastSyncedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : "Waiting for first sync"}
                      </p>
                    </div>
                    {versions.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <RotateCw className="h-3.5 w-3.5 text-muted-foreground" />
                          <p className="text-xs font-semibold">Version Control</p>
                        </div>
                        <div className="flex flex-col gap-1.5 max-h-56 overflow-y-auto pr-0.5">
                          {versions.map((version) => (
                            <button
                              key={version.id}
                              type="button"
                              onClick={() => restoreVersion(version)}
                              className="flex items-center gap-2 rounded-md border bg-background px-2 py-1.5 text-left text-gray-900"
                            >
                              <History className="h-3 w-3 text-muted-foreground shrink-0" />
                              <span className="min-w-0 flex-1">
                                <span className="block truncate text-[11px] font-semibold">{version.label}</span>
                                <span className="block text-[10px] text-muted-foreground">{new Date(version.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
              </>
            )}
          </div>

          {/* Canvas (scrollable) — wrapped in a positioning parent so ZoomControls can float
              fixed at its bottom-right corner regardless of internal scroll position. */}
          <div className="relative flex-1 min-w-0 min-h-[44vh]">
          <div ref={scrollContainerRef} className="absolute inset-0 overflow-auto bg-gray-900 p-3">
            <div className="mx-auto" style={{ width: canvasW * (zoom / 100) }}>
              {/* Header/template/footer render as ONE seamless canvas, stacked
                  with zero visual gap or border between them — no separate
                  "zone" boxes, no sticky/pinned split. */}
              {hasHeaderBlock && renderZoneCanvas("header")}
              {renderZoneCanvas("template")}
              {hasFooterBlock && renderZoneCanvas("footer")}
            </div>
          </div>

          </div>
          {/* Zoom controls moved to the bottom bar (see below) — kept out of
              the canvas corner so the canvas gets the full space freed up
              when both sidebars are hidden, per the layout redesign. */}

          {/* ── Right panel (fixed, locked alongside canvas) ── */}
          {/* Same gray, auto-hide treatment as the left sidebar — see its
              comment above for the collapsed/hoverReveal semantics. Mirrored
              arrow direction (chevrons point at the canvas when closed,
              away from it when open) since this panel sits on the right edge. */}
          <div
            className={`shrink-0 border-t lg:border-t-0 lg:border-l border-gray-700 bg-gray-800 flex flex-col overflow-hidden transition-[width] duration-300 ease-in-out ${rightSidebarVisible ? "w-full lg:w-72 lg:max-w-72 max-h-[48vh] lg:max-h-none" : "w-7"}`}
          >
            {!rightSidebarVisible ? (
              <button type="button" title="Show panel" onClick={() => setRightSidebarCollapsed(false)}
                className="flex-1 flex items-center justify-center hover:bg-gray-700 text-gray-400">
                <ChevronLeft className="h-4 w-4" />
              </button>
            ) : (
              <>
            <div className="flex items-center shrink-0 bg-gray-900">
                <p className="flex-1 px-3 py-1.5 text-[10px] uppercase tracking-wide text-gray-400">Properties</p>
              <button type="button" title="Hide panel" onClick={hideRightSidebar}
                className="shrink-0 p-2 hover:bg-gray-700 text-gray-400">
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Add Component — a selected component's editing settings appear inline,
                right inside its own type's section, instead of in a separate panel. */}
            <div className="flex-1 overflow-y-auto p-3">
              <p className={sLabel + " mb-2"}>Add Component</p>
              <div className="flex flex-col gap-1.5">

                {/* Text */}
                <div>
                  <button type="button" onClick={() => setOpenTool(openTool === "text" ? null : "text")}
                    className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md border text-xs transition-colors text-left text-gray-200 ${openTool === "text" ? "border-white bg-gray-700" : "border-gray-700 hover:bg-gray-700"}`}>
                    <Type className="h-3.5 w-3.5 text-muted-foreground shrink-0" /> Text
                    <ChevronDown className={`h-3 w-3 ml-auto text-muted-foreground transition-transform ${openTool === "text" ? "rotate-180" : ""}`} />
                  </button>
                  {openTool === "text" && (
                    <div className="mt-1 p-1.5 border rounded-md bg-gray-900 border-gray-700 text-gray-200">
                      {selectedComp && (selectedComp.type === "text" || selectedComp.type === "header") ? (
                        <div className="flex flex-col">
                          {renderTypeHeader(selectedComp)}
                          {renderFlatSection("Layout", renderCommonFields(selectedComp))}
                          {renderFlatSection("Typography", <>
                            {selectedComp.lockedTypography ? (
                              <>
                                <div className="flex items-start gap-1.5 p-1.5 rounded border border-amber-200 bg-amber-50">
                                  <Lock className="h-3 w-3 text-amber-600 shrink-0 mt-0.5" />
                                  <p className="text-[10px] text-amber-800 leading-tight">
                                    Typography locked to <span className="font-semibold">{selectedComp.textToken ? TEXT_TOKEN_LABELS[selectedComp.textToken] : "template"}</span> so this always matches its Text Template. Double-click on canvas to edit content; color and alignment still editable here.
                                  </p>
                                </div>
                                <div>
                                  <label className={sLabel}>Alignment</label>
                                  <div className="grid grid-cols-3 gap-1">
                                    {(["left", "center", "right"] as const).map((a) => (
                                      <button key={a} type="button" onClick={() => updateComp(selectedComp.id, { textAlign: a })} className={`text-[11px] py-0.5 rounded border ${selectedComp.textAlign === a ? "bg-black text-white" : "hover:bg-muted hover:text-gray-900"}`}>{a[0].toUpperCase() + a.slice(1)}</button>
                                    ))}
                                  </div>
                                </div>
                                <button type="button" onClick={() => updateComp(selectedComp.id, { lockedTypography: false })}
                                  className="flex items-center justify-center gap-1.5 text-[11px] py-1 rounded border border-gray-700 text-gray-200">
                                  <Unlock className="h-3 w-3" /> Detach from template (unlock typography)
                                </button>
                              </>
                            ) : (
                              <>
                                <div>
                                  <label className={sLabel}>Font</label>
                                  {(fontItems ?? []).length === 0 ? (
                                    <p className="text-[10px] text-muted-foreground border rounded px-2 py-1.5 leading-tight">
                                      No fonts uploaded yet — add one in the Upload tab to use it here.
                                    </p>
                                  ) : (
                                    <FontSelect
                                      value={selectedComp.fontFamily ?? (fontItems ?? [])[0].family}
                                      onChange={(v) => updateComp(selectedComp.id, { fontFamily: v })}
                                      options={(fontItems ?? []).map((f) => ({ label: f.name.replace(/\.\w+$/, ""), value: f.family }))}
                                    />
                                  )}
                                </div>
                                <div>
                                  <label className={sLabel}>Text size</label>
                                  {renderStepperInput(selectedComp.fontSize ?? 16, 1, 1, 400, (v) => updateComp(selectedComp.id, { fontSize: v }))}
                                </div>
                                <div className="grid grid-cols-2 gap-1.5">
                                  <ColorPicker key={`${selectedComp.id}-fc`} label="Text colour" value={selectedComp.fontColor ?? "#000000"} onChange={(v) => updateComp(selectedComp.id, { fontColor: v })} />
                                  <ColorPicker key={`${selectedComp.id}-bg`} label="Background" value={selectedComp.bgColor === "transparent" || !selectedComp.bgColor ? "#ffffff" : selectedComp.bgColor} onChange={(v) => updateComp(selectedComp.id, { bgColor: v })} />
                                </div>
                                <div>
                                  <label className={sLabel}>Alignment</label>
                                  <div className="grid grid-cols-3 gap-1">
                                    {([["left", AlignLeft], ["center", AlignCenter], ["right", AlignRight]] as const).map(([a, Icon]) => (
                                      <button key={a} type="button" onClick={() => updateComp(selectedComp.id, { textAlign: a })} className={`flex items-center justify-center py-1 rounded border ${selectedComp.textAlign === a ? "bg-black text-white" : "hover:bg-muted hover:text-gray-900"}`}>
                                        <Icon className="h-3 w-3" />
                                      </button>
                                    ))}
                                  </div>
                                </div>
                                <div>
                                  <label className={sLabel}>Letter spacing</label>
                                  {renderStepperInput(selectedComp.letterSpacing ?? 0, 0.5, -20, 100, (v) => updateComp(selectedComp.id, { letterSpacing: v }))}
                                </div>
                                <div>
                                  <label className={sLabel}>Line height</label>
                                  {renderStepperInput(selectedComp.lineHeight ?? 1.4, 0.1, 0.5, 4, (v) => updateComp(selectedComp.id, { lineHeight: Math.round(v * 100) / 100 }))}
                                </div>
                                <p className="text-[10px] text-muted-foreground leading-tight">Double-click the text on canvas to edit its content.</p>
                              </>
                            )}
                          </>)}
                          {renderFlatSection("Responsive", renderResponsiveHint())}
                        </div>
                      ) : (
                        <div className="flex flex-col gap-2">
                          <div className="grid grid-cols-2 gap-1.5">
                            <button type="button" onClick={() => addComponent("text", { fontFamily: (fontItems ?? [])[0]?.family })}
                              className="flex flex-col items-center justify-center gap-1 h-14 rounded border border-gray-700 bg-gray-800 text-gray-200 transition-colors">
                              <Type className="h-4 w-4 text-muted-foreground" />
                              <span className="text-[11px]">+ Add Text</span>
                            </button>
                            <button type="button" onClick={() => addComponent("header", { fontFamily: (fontItems ?? [])[0]?.family })}
                              className="flex flex-col items-center justify-center gap-1 h-14 rounded border border-gray-700 bg-gray-800 text-gray-200 transition-colors">
                              <Type className="h-4 w-4 text-muted-foreground" />
                              <span className="text-[11px]">+ Add Heading</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Shape */}
                <div>
                  <button type="button" onClick={() => setOpenTool(openTool === "shape" ? null : "shape")}
                    className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md border text-xs transition-colors text-left text-gray-200 ${openTool === "shape" ? "border-white bg-gray-700" : "border-gray-700 hover:bg-gray-700"}`}>
                    <Square className="h-3.5 w-3.5 text-muted-foreground shrink-0" /> Shape
                    <ChevronDown className={`h-3 w-3 ml-auto text-muted-foreground transition-transform ${openTool === "shape" ? "rotate-180" : ""}`} />
                  </button>
                  {openTool === "shape" && (
                    <div className="mt-1 p-1.5 border rounded-md bg-gray-900 border-gray-700 text-gray-200">
                      {selectedComp && selectedComp.type === "shape" ? (
                        <div className="flex flex-col">
                          {renderTypeHeader(selectedComp)}
                          {renderPropertySection("layout", "Layout", renderCommonFields(selectedComp))}
                          {renderPropertySection("appearance", "Appearance", <>
                            <div>
                              <label className={sLabel}>Shape type</label>
                              <div className="grid grid-cols-4 gap-1">
                                {SHAPES.map(({ type, label: shapeLabel }) => (
                                  <button
                                    key={type}
                                    type="button"
                                    title={shapeLabel}
                                    onClick={() => updateComp(selectedComp.id, { shapeType: type })}
                                    className={`flex items-center justify-center h-7 rounded border ${(selectedComp.shapeType ?? "rectangle") === type ? "bg-black text-white" : "hover:bg-muted hover:text-gray-900 text-muted-foreground"}`}
                                  >
                                    <ShapeSwatch type={type} />
                                  </button>
                                ))}
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-1.5">
                              <ColorPicker key={`${selectedComp.id}-bg`} label="Fill" value={selectedComp.bgColor ?? "#3b82f6"} onChange={(v) => updateComp(selectedComp.id, { bgColor: v })} />
                              {shapeHasRadius(selectedComp.shapeType) && (
                                <div>
                                  <label className={sLabel}>Radius</label>
                                  <Input type="number" min="0" value={selectedComp.borderRadius ?? 0} onChange={(e) => updateComp(selectedComp.id, { borderRadius: +e.target.value })} className="h-6 text-xs px-1.5" />
                                </div>
                              )}
                            </div>
                            <div>
                              <label className={sLabel}>Transparency</label>
                              <div className="grid grid-cols-[1fr_54px] gap-1.5">
                                <input type="range" min="0" max="100" value={selectedComp.opacity ?? 100} onChange={(e) => updateComp(selectedComp.id, { opacity: +e.target.value })} className="w-full" />
                                <Input type="number" min="0" max="100" value={selectedComp.opacity ?? 100} onChange={(e) => updateComp(selectedComp.id, { opacity: +e.target.value })} className="h-6 text-xs px-1.5" />
                              </div>
                            </div>
                          </>)}
                          {renderPropertySection("responsive", "Responsive", renderResponsiveHint())}
                          {renderPropertySection("effects", "Effects", renderShadowBlurFields(selectedComp))}
                        </div>
                      ) : (
                        <div className="grid grid-cols-4 gap-1">
                          {SHAPES.map(({ type, label: shapeLabel }) => (
                            <button key={type} type="button" onClick={() => addShape(type)} title={shapeLabel}
                              className="flex items-center justify-center h-9 rounded-md border border-gray-700 bg-gray-800 transition-colors text-gray-300">
                              <ShapeSwatch type={type} />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Header — a component like any other: click to add, click
                    again to edit its position/size/colour/rotation/scroll
                    behaviour. Multiple can exist (see renderBlockSelector's
                    pills below); the block's own content is edited directly
                    on the canvas, exactly like Template's content. */}
                <div>
                  <button type="button" onClick={() => setOpenTool(openTool === "header-block" ? null : "header-block")}
                    className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md border text-xs transition-colors text-left text-gray-200 ${openTool === "header-block" ? "border-white bg-gray-700" : "border-gray-700 hover:bg-gray-700"}`}>
                    <ArrowUpToLine className="h-3.5 w-3.5 text-muted-foreground shrink-0" /> Header
                    <ChevronDown className={`h-3 w-3 ml-auto text-muted-foreground transition-transform ${openTool === "header-block" ? "rotate-180" : ""}`} />
                  </button>
                  {openTool === "header-block" && (
                    <div className="mt-1 p-1.5 border rounded-md bg-gray-900 border-gray-700 text-gray-200">
                      {hasHeaderBlock ? (
                        <div className="flex flex-col gap-2">
                          {renderBlockSelector("header")}
                          {renderBlockSettings("header")}
                          <button type="button"
                            onClick={() => { const id = view === "desktop" ? activeHeaderId.desktop : activeHeaderId.mobile; if (id) removeBlock("header", id); }}
                            className="flex items-center justify-center gap-1.5 h-7 rounded border border-gray-700 text-xs text-red-400">
                            <Trash2 className="h-3 w-3" /> Remove header
                          </button>
                        </div>
                      ) : (
                        <button type="button" onClick={() => addBlock("header")}
                          className="w-full flex flex-col items-center justify-center gap-1 h-14 rounded border border-gray-700 bg-gray-800 text-gray-200 transition-colors">
                          <ArrowUpToLine className="h-4 w-4 text-muted-foreground" />
                          <span className="text-[11px]">+ Add Header</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Footer — same pattern as Header, docked to the bottom by default. */}
                <div>
                  <button type="button" onClick={() => setOpenTool(openTool === "footer-block" ? null : "footer-block")}
                    className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md border text-xs transition-colors text-left text-gray-200 ${openTool === "footer-block" ? "border-white bg-gray-700" : "border-gray-700 hover:bg-gray-700"}`}>
                    <ArrowDownToLine className="h-3.5 w-3.5 text-muted-foreground shrink-0" /> Footer
                    <ChevronDown className={`h-3 w-3 ml-auto text-muted-foreground transition-transform ${openTool === "footer-block" ? "rotate-180" : ""}`} />
                  </button>
                  {openTool === "footer-block" && (
                    <div className="mt-1 p-1.5 border rounded-md bg-gray-900 border-gray-700 text-gray-200">
                      {hasFooterBlock ? (
                        <div className="flex flex-col gap-2">
                          {renderBlockSelector("footer")}
                          {renderBlockSettings("footer")}
                          <button type="button"
                            onClick={() => { const id = view === "desktop" ? activeFooterId.desktop : activeFooterId.mobile; if (id) removeBlock("footer", id); }}
                            className="flex items-center justify-center gap-1.5 h-7 rounded border border-gray-700 text-xs text-red-400">
                            <Trash2 className="h-3 w-3" /> Remove footer
                          </button>
                        </div>
                      ) : (
                        <button type="button" onClick={() => addBlock("footer")}
                          className="w-full flex flex-col items-center justify-center gap-1 h-14 rounded border border-gray-700 bg-gray-800 text-gray-200 transition-colors">
                          <ArrowDownToLine className="h-4 w-4 text-muted-foreground" />
                          <span className="text-[11px]">+ Add Footer</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Image */}
                <div>
                  <button type="button" onClick={() => setOpenTool(openTool === "image" ? null : "image")}
                    className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md border text-xs transition-colors text-left text-gray-200 ${openTool === "image" ? "border-white bg-gray-700" : "border-gray-700 hover:bg-gray-700"}`}>
                    <ImageIcon className="h-3.5 w-3.5 text-muted-foreground shrink-0" /> Image
                    <ChevronDown className={`h-3 w-3 ml-auto text-muted-foreground transition-transform ${openTool === "image" ? "rotate-180" : ""}`} />
                  </button>
                  {openTool === "image" && (
                    <div className="mt-1 p-2 border rounded-md bg-gray-900 border-gray-700 text-gray-200">
                      {selectedComp && selectedComp.type === "image" ? (
                        <div className="flex flex-col">
                          {renderTypeHeader(selectedComp)}
                          {renderPropertySection("layout", "Layout", renderCommonFields(selectedComp))}
                          {renderPropertySection("appearance", "Appearance", <>
                          {(selectedComp.imageMode ?? "single") === "single" ? (
                            <div>
                              <label className={sLabel}>Image</label>
                              <ImagePickerButton
                                label="Choose image" icon={ImageIcon}
                                uploading={uploading} uploadProgress={uploadProgress}
                                assetItems={assetItems} assetsLoading={assetsLoading} loadAssets={loadAssets}
                                onUpload={uploadToAssets}
                                onSelect={(url) => updateComp(selectedComp.id, { imageUrl: url })}
                              />
                            </div>
                          ) : (
                            <div className="flex flex-col gap-2.5 p-2 border border-gray-700 rounded-md bg-gray-900 text-gray-200">
                              <p className={sLabel + " mb-0"}>Slideshow settings</p>

                              {/* Photos */}
                              <div>
                                <label className={sLabel}>
                                  Photos ({(selectedComp.images ?? []).length}{(selectedComp.slideshowMax ?? 5) > 0 ? `/${selectedComp.slideshowMax ?? 5}` : ""})
                                </label>
                                {(selectedComp.images ?? []).length > 0 && (() => {
                                  const images = selectedComp.images ?? [];
                                  return (
                                  <div className="grid grid-cols-3 gap-1 mb-1.5">
                                    {images.map((url, i) => {
                                      return (
                                        <div key={i} className="relative group aspect-square rounded border overflow-hidden">
                                          <img src={url} alt="" className="w-full h-full object-cover" />
                                          <div className="absolute inset-x-0 top-0 flex items-center justify-between px-0.5 pt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button type="button" title="Move earlier" disabled={i === 0}
                                              onClick={() => moveSlideshowImage(selectedComp.id, images, i, -1)}
                                              className="bg-black/60 text-white rounded-full p-0.5 disabled:opacity-30">
                                              <ChevronLeft className="h-2.5 w-2.5" />
                                            </button>
                                            <button type="button" title="Remove"
                                              onClick={() => updateComp(selectedComp.id, { images: images.filter((_, idx) => idx !== i) })}
                                              className="bg-black/60 text-white rounded-full p-0.5">
                                              <Trash2 className="h-2.5 w-2.5" />
                                            </button>
                                            <button type="button" title="Move later" disabled={i === images.length - 1}
                                              onClick={() => moveSlideshowImage(selectedComp.id, images, i, 1)}
                                              className="bg-black/60 text-white rounded-full p-0.5 disabled:opacity-30">
                                              <ChevronRight className="h-2.5 w-2.5" />
                                            </button>
                                          </div>
                                          <span className="absolute bottom-0.5 left-0.5 text-[8px] text-white bg-black/60 rounded px-1 leading-tight">{i + 1}</span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                  );
                                })()}
                                {((selectedComp.slideshowMax ?? 5) === 0 || (selectedComp.images ?? []).length < (selectedComp.slideshowMax ?? 5)) && (
                                  <ImagePickerButton
                                    label="Add photo" icon={ImageIcon}
                                    uploading={uploading} uploadProgress={uploadProgress}
                                    assetItems={assetItems} assetsLoading={assetsLoading} loadAssets={loadAssets}
                                    onUpload={uploadToAssets}
                                    onSelect={(url) => updateComp(selectedComp.id, { images: [...(selectedComp.images ?? []), url] })}
                                  />
                                )}
                              </div>

                              {/* Photo limit */}
                              <div>
                                <label className={sLabel}>Photo limit</label>
                                <div className="grid grid-cols-4 gap-1">
                                  {([5, 10, 15, 0] as const).map((max) => (
                                    <button key={max} type="button"
                                      onClick={() => updateComp(selectedComp.id, { slideshowMax: max })}
                                      className={`flex items-center justify-center gap-0.5 text-[10px] py-1 rounded border transition-colors ${(selectedComp.slideshowMax ?? 5) === max ? "bg-black text-white border-black" : "bg-gray-800 border-gray-700 text-gray-200"}`}>
                                      {max === 0 ? <InfinityIcon className="h-3 w-3" /> : max}
                                    </button>
                                  ))}
                                </div>
                              </div>

                              {/* Slide duration */}
                              <div>
                                <label className={sLabel + " flex items-center gap-0.5"}><Timer className="h-2.5 w-2.5" /> Slide duration (seconds)</label>
                                <div className="grid grid-cols-[1fr_54px] gap-1.5">
                                  <input type="range" min="1" max="15" step="0.5" value={selectedComp.slideshowDuration ?? 3.5} onChange={(e) => updateComp(selectedComp.id, { slideshowDuration: +e.target.value })} className="w-full" />
                                  <Input type="number" min="1" max="15" step="0.5" value={selectedComp.slideshowDuration ?? 3.5} onChange={(e) => updateComp(selectedComp.id, { slideshowDuration: +e.target.value })} className="h-6 text-xs px-1.5" />
                                </div>
                              </div>
                            </div>
                          )}
                          <div className="grid grid-cols-2 gap-1.5">
                            <ColorPicker key={`${selectedComp.id}-bg`} label="Background" value={selectedComp.bgColor === "transparent" ? "#ffffff" : (selectedComp.bgColor ?? "#e5e7eb")} onChange={(v) => updateComp(selectedComp.id, { bgColor: v })} />
                            <div>
                              <label className={sLabel}>Radius</label>
                              <Input type="number" value={selectedComp.borderRadius ?? 4} onChange={(e) => updateComp(selectedComp.id, { borderRadius: +e.target.value })} className="h-6 text-xs px-1.5" />
                            </div>
                          </div>
                          </>)}
                          {renderPropertySection("responsive", "Responsive", renderResponsiveHint())}
                          {renderPropertySection("effects", "Effects", renderShadowBlurFields(selectedComp))}
                        </div>
                      ) : (
                        <div className="flex flex-col gap-2">
                          <div>
                            <p className="text-[9px] uppercase tracking-wide text-muted-foreground mb-1">Frame type</p>
                            <div className="grid grid-cols-2 gap-1">
                              <button type="button" onClick={() => addImage("single")}
                                className="flex flex-col items-center justify-center gap-1 h-14 rounded border border-gray-700 bg-gray-800 text-gray-200 transition-colors">
                                <ImageIcon className="h-4 w-4 text-muted-foreground" />
                                <span className="text-[10px]">Photo Frame</span>
                              </button>
                              <button type="button" onClick={() => addImage("slideshow")}
                                className="flex flex-col items-center justify-center gap-1 h-14 rounded border border-gray-700 bg-gray-800 text-gray-200 transition-colors">
                                <Images className="h-4 w-4 text-muted-foreground" />
                                <span className="text-[10px]">Slideshow</span>
                              </button>
                            </div>
                          </div>
                          <div>
                            <p className="text-[9px] uppercase tracking-wide text-muted-foreground mb-1">Size</p>
                            <div className="grid grid-cols-4 gap-1">
                              {IMAGE_SIZES.map((s) => (
                                <button key={s.id} type="button" onClick={() => setImageSizePreset(s.id)}
                                  className={`text-[10px] py-1 rounded border transition-colors ${imageSizePreset === s.id ? "bg-black text-white border-black" : "bg-gray-800 border-gray-700 text-gray-200"}`}>
                                  {s.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Button */}
                <div>
                  <button type="button" onClick={() => setOpenTool(openTool === "button" ? null : "button")}
                    className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md border text-xs transition-colors text-left text-gray-200 ${openTool === "button" ? "border-white bg-gray-700" : "border-gray-700 hover:bg-gray-700"}`}>
                    <MousePointerClick className="h-3.5 w-3.5 text-muted-foreground shrink-0" /> Button
                    <ChevronDown className={`h-3 w-3 ml-auto text-muted-foreground transition-transform ${openTool === "button" ? "rotate-180" : ""}`} />
                  </button>
                  {openTool === "button" && (
                    <div className="mt-1 p-1.5 border rounded-md bg-gray-900 border-gray-700 text-gray-200">
                      {selectedComp && selectedComp.type === "button" ? (
                        <div className="flex flex-col">
                          {renderTypeHeader(selectedComp)}
                          {renderPropertySection("layout", "Layout", <>
                            {renderCommonFields(selectedComp)}
                            <div>
                              <label className={sLabel}>Action</label>
                              <select value={selectedComp.buttonAction?.type ?? "url"} onChange={(e) => updateComp(selectedComp.id, { buttonAction: { type: e.target.value as ButtonActionType, value: selectedComp.buttonAction?.value ?? "" } })} className="w-full text-xs border rounded px-1.5 py-1 bg-background h-6">
                                {BUTTON_ACTIONS.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
                              </select>
                            </div>
                            <div>
                              <label className={sLabel}>
                                {selectedComp.buttonAction?.type === "url" ? "URL" : selectedComp.buttonAction?.type === "buy" ? "Product slug" : selectedComp.buttonAction?.type === "search" ? "Search query" : "Value"}
                              </label>
                              <Input value={selectedComp.buttonAction?.value ?? ""} onChange={(e) => updateComp(selectedComp.id, { buttonAction: { type: selectedComp.buttonAction?.type ?? "url", value: e.target.value } })}
                                placeholder={selectedComp.buttonAction?.type === "url" ? "https://…" : selectedComp.buttonAction?.type === "buy" ? "product-slug" : ""}
                                className="h-6 text-xs px-1.5" />
                            </div>
                          </>)}
                          {renderPropertySection("typography", "Typography", <>
                            <div>
                              <label className={sLabel}>Label</label>
                              <Input value={selectedComp.content ?? ""} onChange={(e) => updateComp(selectedComp.id, { content: e.target.value })} className="h-6 text-xs px-1.5" />
                            </div>
                            <div>
                              <label className={sLabel}>Font size</label>
                              <Input type="number" value={selectedComp.fontSize ?? 16} onChange={(e) => updateComp(selectedComp.id, { fontSize: +e.target.value })} className="h-6 text-xs px-1.5" />
                            </div>
                            <div>
                              <label className={sLabel}>Font</label>
                              <FontSelect value={selectedComp.fontFamily ?? "system-ui, -apple-system, sans-serif"} onChange={(v) => updateComp(selectedComp.id, { fontFamily: v })} />
                            </div>
                          </>)}
                          {renderPropertySection("appearance", "Appearance", <>
                            <div>
                              <label className={sLabel}>Style</label>
                              <div className="grid grid-cols-4 gap-1">
                                {(["solid", "outline", "ghost", "link"] as const).map((s) => (
                                  <button key={s} onClick={() => updateComp(selectedComp.id, { buttonStyle: s })}
                                    className={`text-[11px] py-0.5 rounded border capitalize ${(selectedComp.buttonStyle ?? "solid") === s ? "bg-black text-white" : "hover:bg-muted hover:text-gray-900"}`}>{s}</button>
                                ))}
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-1.5">
                              <ColorPicker key={`${selectedComp.id}-bg`} label={(selectedComp.buttonStyle ?? "solid") === "solid" ? "Background" : "Accent"} value={selectedComp.bgColor ?? "#3b82f6"} onChange={(v) => updateComp(selectedComp.id, { bgColor: v })} />
                              <ColorPicker key={`${selectedComp.id}-fc`} label="Text" value={selectedComp.fontColor ?? "#ffffff"} onChange={(v) => updateComp(selectedComp.id, { fontColor: v })} />
                            </div>
                            {(selectedComp.buttonStyle === "outline" || selectedComp.buttonStyle === "ghost") && (
                              <ColorPicker key={`${selectedComp.id}-bc`} label="Border" value={selectedComp.borderColor ?? selectedComp.bgColor ?? "#3b82f6"} onChange={(v) => updateComp(selectedComp.id, { borderColor: v })} />
                            )}
                            <div className="grid grid-cols-2 gap-1.5">
                              <ColorPicker key={`${selectedComp.id}-hbg`} label="Hover BG" value={selectedComp.hoverBgColor ?? "#2563eb"} onChange={(v) => updateComp(selectedComp.id, { hoverBgColor: v })} />
                              <ColorPicker key={`${selectedComp.id}-hfc`} label="Hover text" value={selectedComp.hoverFontColor ?? "#ffffff"} onChange={(v) => updateComp(selectedComp.id, { hoverFontColor: v })} />
                            </div>
                            <div>
                              <label className={sLabel}>Radius</label>
                              <Input type="number" min="0" max="200" value={selectedComp.borderRadius ?? 8} onChange={(e) => updateComp(selectedComp.id, { borderRadius: +e.target.value })} className="h-6 text-xs px-1.5" />
                            </div>
                          </>)}
                          {renderPropertySection("responsive", "Responsive", renderResponsiveHint())}
                          {renderPropertySection("effects", "Effects", renderShadowBlurFields(selectedComp))}
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-1">
                          {BUTTON_PRESETS.map((preset) => {
                            const s = resolveButtonStyles(preset.patch as PageComponent, false);
                            return (
                              <button key={preset.id} type="button" onClick={() => addComponent("button", preset.patch)}
                                className="flex items-center justify-center h-9 rounded border border-gray-700 bg-gray-800 transition-colors p-1">
                                <span className="w-full truncate text-center text-[10px] font-semibold py-1 px-1"
                                  style={{ backgroundColor: s.bg, color: s.color, border: s.border, borderRadius: preset.patch.borderRadius ?? 8, textDecoration: s.isLink ? "underline" : "none" }}>
                                  {preset.patch.content}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Carousel */}
                <div>
                  <button type="button" onClick={() => setOpenTool(openTool === "carousel" ? null : "carousel")}
                    className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md border text-xs transition-colors text-left text-gray-200 ${openTool === "carousel" ? "border-white bg-gray-700" : "border-gray-700 hover:bg-gray-700"}`}>
                    <GalleryHorizontal className="h-3.5 w-3.5 text-muted-foreground shrink-0" /> Carousel
                    <ChevronDown className={`h-3 w-3 ml-auto text-muted-foreground transition-transform ${openTool === "carousel" ? "rotate-180" : ""}`} />
                  </button>
                  {openTool === "carousel" && (
                    <div className="mt-1 p-1.5 border rounded-md bg-gray-900 border-gray-700 text-gray-200">
                      {selectedComp && selectedComp.type === "carousel" ? (() => {
                        const items = selectedComp.carouselItems ?? [];
                        return (
                          <div className="flex flex-col">
                            {renderTypeHeader(selectedComp)}
                            {renderPropertySection("layout", "Layout", renderCommonFields(selectedComp))}
                            {renderPropertySection("appearance", "Appearance", <>
                            <div>
                              <label className={sLabel}>Items ({items.length})</label>
                              {items.length > 0 && (
                                <div className="flex flex-col gap-1 mb-1.5">
                                  {items.map((item, i) => (
                                    <div key={item.id} className="flex gap-1.5 items-center p-1.5 border border-gray-700 rounded bg-gray-900 text-gray-200">
                                      <div className="w-8 h-8 rounded bg-gray-100 overflow-hidden shrink-0 flex items-center justify-center">
                                        {item.imageUrl ? <img src={item.imageUrl} alt="" className="w-full h-full object-cover" /> : <ImageIcon className="h-3.5 w-3.5 text-gray-300" />}
                                      </div>
                                      <div className="flex-1 min-w-0 flex flex-col gap-1">
                                        <Input value={item.label ?? ""} onChange={(e) => updateCarouselItem(selectedComp.id, items, item.id, { label: e.target.value })} placeholder="Label" className="h-6 text-xs px-1.5" />
                                        <Input value={item.link ?? ""} onChange={(e) => updateCarouselItem(selectedComp.id, items, item.id, { link: e.target.value })} placeholder="Link to page" className="h-6 text-xs px-1.5" />
                                      </div>
                                      <div className="flex flex-col shrink-0">
                                        <button type="button" title="Move earlier" disabled={i === 0} onClick={() => moveCarouselItem(selectedComp.id, items, i, -1)} className="h-4 w-4 flex items-center justify-center disabled:opacity-20 hover:bg-muted hover:text-gray-900 rounded"><ChevronLeft className="h-3 w-3" /></button>
                                        <button type="button" title="Move later" disabled={i === items.length - 1} onClick={() => moveCarouselItem(selectedComp.id, items, i, 1)} className="h-4 w-4 flex items-center justify-center disabled:opacity-20 hover:bg-muted hover:text-gray-900 rounded"><ChevronRight className="h-3 w-3" /></button>
                                      </div>
                                      <button type="button" title="Remove" onClick={() => removeCarouselItem(selectedComp.id, items, item.id)} className="text-destructive shrink-0 hover:bg-destructive/10 rounded p-0.5">
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}
                              <div className="grid grid-cols-2 gap-1.5">
                                <button type="button"
                                  onClick={() => { setShowCategoryPicker((v) => !v); if (!showCategoryPicker) loadCategoryOptions(); }}
                                  className={`flex items-center justify-center gap-1 h-7 rounded border text-xs transition-colors ${showCategoryPicker ? "bg-black text-white border-black" : "border-gray-700 text-gray-200"}`}>
                                  <Tag className="h-3 w-3" /> From Categories
                                </button>
                                <ImagePickerButton
                                  label="Custom item" icon={ImageIcon}
                                  buttonClassName="flex items-center justify-center gap-1 h-7 rounded border border-gray-700 text-xs text-gray-200 cursor-pointer w-full"
                                  uploading={uploading} uploadProgress={uploadProgress}
                                  assetItems={assetItems} assetsLoading={assetsLoading} loadAssets={loadAssets}
                                  onUpload={uploadToAssets}
                                  onSelect={(url) => updateComp(selectedComp.id, { carouselItems: [...items, { id: uid(), imageUrl: url, label: "", link: "" }] })}
                                />
                              </div>
                              {showCategoryPicker && (
                                <div className="mt-1.5 max-h-36 overflow-y-auto border border-gray-700 rounded bg-gray-900 text-gray-200 flex flex-col gap-0.5 p-1">
                                  {loadingCategories ? (
                                    <p className="text-[11px] text-muted-foreground p-1">Loading…</p>
                                  ) : (categoryOptions ?? []).length === 0 ? (
                                    <p className="text-[11px] text-muted-foreground p-1">No categories found.</p>
                                  ) : (
                                    (categoryOptions ?? []).map((cat) => (
                                      <button key={cat.id} type="button" onClick={() => addCategoryItem(selectedComp.id, items, cat)}
                                        className="flex items-center gap-1.5 text-left text-xs px-1.5 py-1 rounded hover:bg-muted hover:text-gray-900">
                                        {cat.imageUrl ? <img src={cat.imageUrl} alt="" className="w-4 h-4 rounded object-cover shrink-0" /> : <Tag className="h-3 w-3 text-muted-foreground shrink-0" />}
                                        <span className="truncate">{cat.name}</span>
                                      </button>
                                    ))
                                  )}
                                </div>
                              )}
                            </div>

                            <div>
                              <label className={sLabel}>Style</label>
                              <div className="grid grid-cols-2 gap-1">
                                <button type="button" onClick={() => updateComp(selectedComp.id, { carouselStyle: "zoom" })}
                                  className={`text-[11px] py-1 rounded border ${(selectedComp.carouselStyle ?? "zoom") === "zoom" ? "bg-black text-white" : "hover:bg-muted hover:text-gray-900"}`}>
                                  Zoom carousel
                                </button>
                                <button type="button" onClick={() => updateComp(selectedComp.id, { carouselStyle: "row" })}
                                  className={`text-[11px] py-1 rounded border ${selectedComp.carouselStyle === "row" ? "bg-black text-white" : "hover:bg-muted hover:text-gray-900"}`}>
                                  Category row
                                </button>
                              </div>
                            </div>
                            <div className="grid grid-cols-3 gap-1.5">
                              <div>
                                <label className={sLabel}>Item width</label>
                                <Input type="number" min="40" max="600" value={selectedComp.carouselItemWidth ?? 160} onChange={(e) => updateComp(selectedComp.id, { carouselItemWidth: +e.target.value })} className="h-6 text-xs px-1.5" />
                              </div>
                              <div>
                                <label className={sLabel}>Spacing</label>
                                <Input type="number" min="0" max="100" value={selectedComp.carouselGap ?? 12} onChange={(e) => updateComp(selectedComp.id, { carouselGap: +e.target.value })} className="h-6 text-xs px-1.5" />
                              </div>
                              <div>
                                <label className={sLabel}>Radius</label>
                                <Input type="number" min="0" value={selectedComp.borderRadius ?? 12} onChange={(e) => updateComp(selectedComp.id, { borderRadius: +e.target.value })} className="h-6 text-xs px-1.5" />
                              </div>
                            </div>
                            {(selectedComp.carouselStyle ?? "zoom") === "zoom" ? (
                              <div>
                                <label className={sLabel}>Center zoom</label>
                                <div className="grid grid-cols-[1fr_54px] gap-1.5">
                                  <input type="range" min="1" max="2" step="0.05" value={selectedComp.carouselZoom ?? 1.25} onChange={(e) => updateComp(selectedComp.id, { carouselZoom: +e.target.value })} className="w-full" />
                                  <Input type="number" min="1" max="2" step="0.05" value={selectedComp.carouselZoom ?? 1.25} onChange={(e) => updateComp(selectedComp.id, { carouselZoom: +e.target.value })} className="h-6 text-xs px-1.5" />
                                </div>
                              </div>
                            ) : (
                              <ColorPicker label="Item background" value={selectedComp.carouselItemBg ?? "#eef2f6"} onChange={(v) => updateComp(selectedComp.id, { carouselItemBg: v })} />
                            )}
                            <ColorPicker label="Background" value={selectedComp.bgColor === "transparent" ? "#ffffff" : (selectedComp.bgColor ?? "#ffffff")} onChange={(v) => updateComp(selectedComp.id, { bgColor: v })} />
                            </>)}
                            {renderPropertySection("responsive", "Responsive", renderResponsiveHint())}
                            {renderPropertySection("effects", "Effects", renderShadowBlurFields(selectedComp))}
                          </div>
                        );
                      })() : (
                        <button type="button" onClick={() => addCarousel()}
                          className="w-full flex items-center justify-center gap-1.5 h-9 rounded border border-gray-700 bg-gray-800 transition-colors text-xs text-gray-200">
                          <GalleryHorizontal className="h-4 w-4" /> Add Carousel
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Hero Carousel */}
                <div>
                  <button type="button" onClick={() => setOpenTool(openTool === "hero-carousel" ? null : "hero-carousel")}
                    className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md border text-xs transition-colors text-left text-gray-200 ${openTool === "hero-carousel" ? "border-white bg-gray-700" : "border-gray-700 hover:bg-gray-700"}`}>
                    <GalleryHorizontalEnd className="h-3.5 w-3.5 text-muted-foreground shrink-0" /> Hero Carousel
                    <ChevronDown className={`h-3 w-3 ml-auto text-muted-foreground transition-transform ${openTool === "hero-carousel" ? "rotate-180" : ""}`} />
                  </button>
                  {openTool === "hero-carousel" && (
                    <div className="mt-1 p-1.5 border rounded-md bg-gray-900 border-gray-700 text-gray-200">
                      {selectedComp && selectedComp.type === "hero-carousel" ? (() => {
                        const slides = selectedComp.heroSlides ?? [];
                        return (
                          <div className="flex flex-col">
                            {renderTypeHeader(selectedComp)}
                            {renderPropertySection("layout", "Layout", renderCommonFields(selectedComp))}
                            {renderPropertySection("appearance", "Appearance", <>
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <label className={sLabel + " mb-0"}>Slides ({slides.length})</label>
                                <button type="button" onClick={() => addHeroSlide(selectedComp.id, slides)} className="text-[10px] px-1.5 py-0.5 rounded border hover:bg-muted hover:text-gray-900 flex items-center gap-1"><Plus className="h-3 w-3" /> Add</button>
                              </div>
                              <div className="flex flex-col gap-1.5">
                                {slides.map((slide, i) => (
                                  <div key={slide.id} className="flex flex-col gap-1 p-1.5 border border-gray-700 rounded bg-gray-900 text-gray-200">
                                    <div className="flex gap-1.5 items-center">
                                      <ImagePickerButton
                                        label="Slide image"
                                        buttonClassName="w-9 h-9 rounded bg-gray-100 overflow-hidden shrink-0 flex items-center justify-center cursor-pointer hover:opacity-80"
                                        uploading={uploading} uploadProgress={uploadProgress}
                                        assetItems={assetItems} assetsLoading={assetsLoading} loadAssets={loadAssets}
                                        onUpload={uploadToAssets}
                                        onSelect={(url) => updateHeroSlide(selectedComp.id, slides, slide.id, { imageUrl: url })}
                                      >
                                        {slide.imageUrl ? <img src={slide.imageUrl} alt="" className="w-full h-full object-cover" /> : <ImageIcon className="h-3.5 w-3.5 text-gray-300" />}
                                      </ImagePickerButton>
                                      <div className="flex-1 min-w-0 flex flex-col gap-1">
                                        <Input value={slide.headline ?? ""} onChange={(e) => updateHeroSlide(selectedComp.id, slides, slide.id, { headline: e.target.value })} placeholder="Headline" className="h-6 text-xs px-1.5" />
                                        <Input value={slide.subtext ?? ""} onChange={(e) => updateHeroSlide(selectedComp.id, slides, slide.id, { subtext: e.target.value })} placeholder="Subtext" className="h-6 text-xs px-1.5" />
                                      </div>
                                      <div className="flex flex-col shrink-0">
                                        <button type="button" title="Move earlier" disabled={i === 0} onClick={() => moveHeroSlide(selectedComp.id, slides, i, -1)} className="h-4 w-4 flex items-center justify-center disabled:opacity-20 hover:bg-muted hover:text-gray-900 rounded"><ChevronLeft className="h-3 w-3" /></button>
                                        <button type="button" title="Move later" disabled={i === slides.length - 1} onClick={() => moveHeroSlide(selectedComp.id, slides, i, 1)} className="h-4 w-4 flex items-center justify-center disabled:opacity-20 hover:bg-muted hover:text-gray-900 rounded"><ChevronRight className="h-3 w-3" /></button>
                                      </div>
                                      <button type="button" title="Remove" onClick={() => removeHeroSlide(selectedComp.id, slides, slide.id)} className="text-destructive shrink-0 hover:bg-destructive/10 rounded p-0.5">
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </button>
                                    </div>
                                    <div className="grid grid-cols-2 gap-1">
                                      <Input value={slide.buttonLabel ?? ""} onChange={(e) => updateHeroSlide(selectedComp.id, slides, slide.id, { buttonLabel: e.target.value })} placeholder="Button label" className="h-6 text-xs px-1.5" />
                                      <Input value={slide.buttonLink ?? ""} onChange={(e) => updateHeroSlide(selectedComp.id, slides, slide.id, { buttonLink: e.target.value })} placeholder="Link to page" className="h-6 text-xs px-1.5" />
                                    </div>
                                  </div>
                                ))}
                                {slides.length === 0 && <p className="text-[11px] text-muted-foreground text-center py-2">No slides yet</p>}
                              </div>
                            </div>
                            <div className="flex items-center justify-between">
                              <label className={sLabel + " mb-0"}>Autoplay</label>
                              <button type="button" onClick={() => updateComp(selectedComp.id, { heroAutoplay: !(selectedComp.heroAutoplay ?? true) })}
                                className={`text-[11px] px-2 py-0.5 rounded border ${(selectedComp.heroAutoplay ?? true) ? "bg-black text-white border-black" : "hover:bg-muted hover:text-gray-900"}`}>
                                {(selectedComp.heroAutoplay ?? true) ? "On" : "Off"}
                              </button>
                            </div>
                            {(selectedComp.heroAutoplay ?? true) && (
                              <div>
                                <label className={sLabel}>Autoplay every (seconds)</label>
                                <div className="grid grid-cols-[1fr_54px] gap-1.5">
                                  <input type="range" min="3" max="10" step="0.5" value={selectedComp.heroAutoplaySeconds ?? 5} onChange={(e) => updateComp(selectedComp.id, { heroAutoplaySeconds: +e.target.value })} className="w-full" />
                                  <Input type="number" min="3" max="10" step="0.5" value={selectedComp.heroAutoplaySeconds ?? 5} onChange={(e) => updateComp(selectedComp.id, { heroAutoplaySeconds: +e.target.value })} className="h-6 text-xs px-1.5" />
                                </div>
                              </div>
                            )}
                            <div className="grid grid-cols-2 gap-1.5">
                              <button type="button" onClick={() => updateComp(selectedComp.id, { heroShowArrows: !(selectedComp.heroShowArrows ?? true) })}
                                className={`text-[11px] py-1 rounded border ${(selectedComp.heroShowArrows ?? true) ? "bg-black text-white border-black" : "hover:bg-muted hover:text-gray-900"}`}>
                                Arrows {(selectedComp.heroShowArrows ?? true) ? "On" : "Off"}
                              </button>
                              <button type="button" onClick={() => updateComp(selectedComp.id, { heroShowDots: !(selectedComp.heroShowDots ?? true) })}
                                className={`text-[11px] py-1 rounded border ${(selectedComp.heroShowDots ?? true) ? "bg-black text-white border-black" : "hover:bg-muted hover:text-gray-900"}`}>
                                Dots {(selectedComp.heroShowDots ?? true) ? "On" : "Off"}
                              </button>
                            </div>
                            <div>
                              <label className={sLabel}>Next-slide peek (%)</label>
                              <div className="grid grid-cols-[1fr_54px] gap-1.5">
                                <input type="range" min="0" max="20" value={selectedComp.heroPeekPercent ?? 6} onChange={(e) => updateComp(selectedComp.id, { heroPeekPercent: +e.target.value })} className="w-full" />
                                <Input type="number" min="0" max="20" value={selectedComp.heroPeekPercent ?? 6} onChange={(e) => updateComp(selectedComp.id, { heroPeekPercent: +e.target.value })} className="h-6 text-xs px-1.5" />
                              </div>
                            </div>
                            <div>
                              <label className={sLabel}>Image overlay darkness (%)</label>
                              <div className="grid grid-cols-[1fr_54px] gap-1.5">
                                <input type="range" min="0" max="80" value={selectedComp.heroOverlayOpacity ?? 35} onChange={(e) => updateComp(selectedComp.id, { heroOverlayOpacity: +e.target.value })} className="w-full" />
                                <Input type="number" min="0" max="80" value={selectedComp.heroOverlayOpacity ?? 35} onChange={(e) => updateComp(selectedComp.id, { heroOverlayOpacity: +e.target.value })} className="h-6 text-xs px-1.5" />
                              </div>
                            </div>
                            <ColorPicker label="Headline color" value={selectedComp.heroHeadlineColor ?? "#ffffff"} onChange={(v) => updateComp(selectedComp.id, { heroHeadlineColor: v })} />
                            <ColorPicker label="Subtext color" value={selectedComp.heroSubtextColor ?? "#f3f4f6"} onChange={(v) => updateComp(selectedComp.id, { heroSubtextColor: v })} />
                            <ColorPicker label="Button background" value={selectedComp.heroCtaBgColor ?? "#ffffff"} onChange={(v) => updateComp(selectedComp.id, { heroCtaBgColor: v })} />
                            <ColorPicker label="Button text" value={selectedComp.heroCtaFontColor ?? "#111111"} onChange={(v) => updateComp(selectedComp.id, { heroCtaFontColor: v })} />
                            <ColorPicker label="Background" value={selectedComp.bgColor === "transparent" ? "#111827" : (selectedComp.bgColor ?? "#111827")} onChange={(v) => updateComp(selectedComp.id, { bgColor: v })} />
                            </>)}
                            {renderPropertySection("responsive", "Responsive", renderResponsiveHint())}
                            {renderPropertySection("effects", "Effects", renderShadowBlurFields(selectedComp))}
                          </div>
                        );
                      })() : (
                        <button type="button" onClick={() => addHeroCarousel()}
                          className="w-full flex items-center justify-center gap-1.5 h-9 rounded border border-gray-700 bg-gray-800 transition-colors text-xs text-gray-200">
                          <GalleryHorizontalEnd className="h-4 w-4" /> Add Hero Carousel
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Category Carousel */}
                <div>
                  <button type="button" onClick={() => setOpenTool(openTool === "category-carousel" ? null : "category-carousel")}
                    className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md border text-xs transition-colors text-left text-gray-200 ${openTool === "category-carousel" ? "border-white bg-gray-700" : "border-gray-700 hover:bg-gray-700"}`}>
                    <LayoutGrid className="h-3.5 w-3.5 text-muted-foreground shrink-0" /> Category Carousel
                    <ChevronDown className={`h-3 w-3 ml-auto text-muted-foreground transition-transform ${openTool === "category-carousel" ? "rotate-180" : ""}`} />
                  </button>
                  {openTool === "category-carousel" && (
                    <div className="mt-1 p-1.5 border rounded-md bg-gray-900 border-gray-700 text-gray-200">
                      {selectedComp && selectedComp.type === "category-carousel" ? (() => {
                        const items = selectedComp.catCarouselItems ?? [];
                        const cardStyle = selectedComp.catCarouselCardStyle ?? "image-first";
                        return (
                          <div className="flex flex-col">
                            {renderTypeHeader(selectedComp)}
                            {renderPropertySection("layout", "Layout", renderCommonFields(selectedComp))}
                            {renderPropertySection("appearance", "Appearance", <>
                            <div>
                              <label className={sLabel}>Section title</label>
                              <Input value={selectedComp.catCarouselTitle ?? ""} onChange={(e) => updateComp(selectedComp.id, { catCarouselTitle: e.target.value })} placeholder="e.g. Shop by Category" className="h-7 text-xs" />
                            </div>
                            <div>
                              <label className={sLabel}>Section subtitle</label>
                              <Input value={selectedComp.catCarouselSubtitle ?? ""} onChange={(e) => updateComp(selectedComp.id, { catCarouselSubtitle: e.target.value })} placeholder="Optional subtitle" className="h-7 text-xs" />
                            </div>
                            <div>
                              <label className={sLabel}>Card style</label>
                              <div className="grid grid-cols-3 gap-1">
                                {([["image-first", "Image-first"], ["icon-text", "Icon + text"], ["split", "Split"]] as [CardStyle, string][]).map(([val, label]) => (
                                  <button key={val} type="button" onClick={() => updateComp(selectedComp.id, { catCarouselCardStyle: val })}
                                    className={`text-[10px] py-1 rounded border ${cardStyle === val ? "bg-black text-white border-black" : "hover:bg-muted hover:text-gray-900"}`}>
                                    {label}
                                  </button>
                                ))}
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-1.5">
                              <div>
                                <label className={sLabel}>Aspect ratio</label>
                                <div className="grid grid-cols-2 gap-1">
                                  {(["1:1", "3:4"] as CardAspectRatio[]).map((val) => (
                                    <button key={val} type="button" onClick={() => updateComp(selectedComp.id, { catCarouselAspectRatio: val })}
                                      className={`text-[10px] py-1 rounded border ${(selectedComp.catCarouselAspectRatio ?? "1:1") === val ? "bg-black text-white border-black" : "hover:bg-muted hover:text-gray-900"}`}>
                                      {val}
                                    </button>
                                  ))}
                                </div>
                              </div>
                              <div>
                                <label className={sLabel}>Corner radius</label>
                                <Input type="number" min="0" max="40" value={selectedComp.catCarouselCornerRadius ?? 12} onChange={(e) => updateComp(selectedComp.id, { catCarouselCornerRadius: +e.target.value })} className="h-6 text-xs px-1.5" />
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-1.5">
                              <button type="button" onClick={() => updateComp(selectedComp.id, { catCarouselShowDescriptor: !(selectedComp.catCarouselShowDescriptor ?? false) })}
                                className={`text-[11px] py-1 rounded border ${(selectedComp.catCarouselShowDescriptor ?? false) ? "bg-black text-white border-black" : "hover:bg-muted hover:text-gray-900"}`}>
                                Descriptor {(selectedComp.catCarouselShowDescriptor ?? false) ? "On" : "Off"}
                              </button>
                              <button type="button" onClick={() => updateComp(selectedComp.id, { catCarouselShowBadge: !(selectedComp.catCarouselShowBadge ?? false) })}
                                className={`text-[11px] py-1 rounded border ${(selectedComp.catCarouselShowBadge ?? false) ? "bg-black text-white border-black" : "hover:bg-muted hover:text-gray-900"}`}>
                                Badge {(selectedComp.catCarouselShowBadge ?? false) ? "On" : "Off"}
                              </button>
                            </div>
                            <div>
                              <label className={sLabel}>Snap scrolling</label>
                              <div className="grid grid-cols-2 gap-1">
                                {(["single", "double"] as SnapMode[]).map((val) => (
                                  <button key={val} type="button" onClick={() => updateComp(selectedComp.id, { catCarouselSnapMode: val })}
                                    className={`text-[10px] py-1 rounded border ${(selectedComp.catCarouselSnapMode ?? "single") === val ? "bg-black text-white border-black" : "hover:bg-muted hover:text-gray-900"}`}>
                                    {val === "single" ? "Per card" : "Per 2 cards"}
                                  </button>
                                ))}
                              </div>
                            </div>
                            <div className="grid grid-cols-3 gap-1.5">
                              <div>
                                <label className={sLabel}>Desktop cards</label>
                                <Input type="number" min="3" max="5" value={selectedComp.catCarouselDesktopCards ?? 4} onChange={(e) => updateComp(selectedComp.id, { catCarouselDesktopCards: Math.max(3, Math.min(5, +e.target.value)) })} className="h-6 text-xs px-1.5" />
                              </div>
                              <div>
                                <label className={sLabel}>Gap desktop</label>
                                <Input type="number" min="0" value={selectedComp.catCarouselGapDesktop ?? 16} onChange={(e) => updateComp(selectedComp.id, { catCarouselGapDesktop: +e.target.value })} className="h-6 text-xs px-1.5" />
                              </div>
                              <div>
                                <label className={sLabel}>Gap mobile</label>
                                <Input type="number" min="0" value={selectedComp.catCarouselGapMobile ?? 12} onChange={(e) => updateComp(selectedComp.id, { catCarouselGapMobile: +e.target.value })} className="h-6 text-xs px-1.5" />
                              </div>
                            </div>
                            <ColorPicker label="Title color" value={selectedComp.catCarouselTitleColor ?? "#111111"} onChange={(v) => updateComp(selectedComp.id, { catCarouselTitleColor: v })} />
                            <ColorPicker label="Subtitle color" value={selectedComp.catCarouselSubtitleColor ?? "#6b7280"} onChange={(v) => updateComp(selectedComp.id, { catCarouselSubtitleColor: v })} />
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <label className={sLabel + " mb-0"}>Categories ({items.length})</label>
                                <button type="button" onClick={() => addCatCarouselItem(selectedComp.id, items)} className="text-[10px] px-1.5 py-0.5 rounded border hover:bg-muted hover:text-gray-900 flex items-center gap-1"><Plus className="h-3 w-3" /> Add</button>
                              </div>
                              <div className="flex flex-col gap-1.5">
                                {items.map((item, i) => (
                                  <div key={item.id} className="flex flex-col gap-1 p-1.5 border border-gray-700 rounded bg-gray-900 text-gray-200">
                                    <div className="flex gap-1.5 items-center">
                                      <ImagePickerButton
                                        label="Category image"
                                        buttonClassName="w-9 h-9 rounded bg-gray-100 overflow-hidden shrink-0 flex items-center justify-center cursor-pointer hover:opacity-80"
                                        uploading={uploading} uploadProgress={uploadProgress}
                                        assetItems={assetItems} assetsLoading={assetsLoading} loadAssets={loadAssets}
                                        onUpload={uploadToAssets}
                                        onSelect={(url) => updateCatCarouselItem(selectedComp.id, items, item.id, { imageUrl: url })}
                                      >
                                        {item.imageUrl ? <img src={item.imageUrl} alt="" className="w-full h-full object-cover" /> : <ImageIcon className="h-3.5 w-3.5 text-gray-300" />}
                                      </ImagePickerButton>
                                      <div className="flex-1 min-w-0 flex flex-col gap-1">
                                        <Input value={item.name ?? ""} onChange={(e) => updateCatCarouselItem(selectedComp.id, items, item.id, { name: e.target.value })} placeholder="Category name" className="h-6 text-xs px-1.5" />
                                        <Input value={item.link ?? ""} onChange={(e) => updateCatCarouselItem(selectedComp.id, items, item.id, { link: e.target.value })} placeholder="Link to page" className="h-6 text-xs px-1.5" />
                                      </div>
                                      <div className="flex flex-col shrink-0">
                                        <button type="button" title="Move earlier" disabled={i === 0} onClick={() => moveCatCarouselItem(selectedComp.id, items, i, -1)} className="h-4 w-4 flex items-center justify-center disabled:opacity-20 hover:bg-muted hover:text-gray-900 rounded"><ChevronLeft className="h-3 w-3" /></button>
                                        <button type="button" title="Move later" disabled={i === items.length - 1} onClick={() => moveCatCarouselItem(selectedComp.id, items, i, 1)} className="h-4 w-4 flex items-center justify-center disabled:opacity-20 hover:bg-muted hover:text-gray-900 rounded"><ChevronRight className="h-3 w-3" /></button>
                                      </div>
                                      <button type="button" title="Remove" onClick={() => removeCatCarouselItem(selectedComp.id, items, item.id)} className="text-destructive shrink-0 hover:bg-destructive/10 rounded p-0.5">
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </button>
                                    </div>
                                    {((selectedComp.catCarouselShowDescriptor ?? false) || (selectedComp.catCarouselShowBadge ?? false)) && (
                                      <div className="grid grid-cols-2 gap-1">
                                        {(selectedComp.catCarouselShowDescriptor ?? false) && (
                                          <Input value={item.descriptor ?? ""} onChange={(e) => updateCatCarouselItem(selectedComp.id, items, item.id, { descriptor: e.target.value })} placeholder="Descriptor" className="h-6 text-xs px-1.5" />
                                        )}
                                        {(selectedComp.catCarouselShowBadge ?? false) && (
                                          <Input value={item.badge ?? ""} onChange={(e) => updateCatCarouselItem(selectedComp.id, items, item.id, { badge: e.target.value })} placeholder="Badge, e.g. New" className="h-6 text-xs px-1.5" />
                                        )}
                                      </div>
                                    )}
                                  </div>
                                ))}
                                {items.length === 0 && <p className="text-[11px] text-muted-foreground text-center py-2">No categories yet</p>}
                              </div>
                            </div>
                            </>)}
                            {renderPropertySection("responsive", "Responsive", renderResponsiveHint())}
                            {renderPropertySection("effects", "Effects", renderShadowBlurFields(selectedComp))}
                          </div>
                        );
                      })() : (
                        <button type="button" onClick={() => addCategoryCarousel()}
                          className="w-full flex items-center justify-center gap-1.5 h-9 rounded border border-gray-700 bg-gray-800 transition-colors text-xs text-gray-200">
                          <LayoutGrid className="h-4 w-4" /> Add Category Carousel
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Icon */}
                <div>
                  <button type="button" onClick={() => setOpenTool(openTool === "icon" ? null : "icon")}
                    className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md border text-xs transition-colors text-left text-gray-200 ${openTool === "icon" ? "border-white bg-gray-700" : "border-gray-700 hover:bg-gray-700"}`}>
                    <ComponentIcon className="h-3.5 w-3.5 text-muted-foreground shrink-0" /> Icon
                    <ChevronDown className={`h-3 w-3 ml-auto text-muted-foreground transition-transform ${openTool === "icon" ? "rotate-180" : ""}`} />
                  </button>
                  {openTool === "icon" && (
                    <div className="mt-1 p-1.5 border rounded-md bg-gray-900 border-gray-700 text-gray-200">
                      {selectedComp && selectedComp.type === "icon" ? (
                        <div className="flex flex-col">
                          {renderTypeHeader(selectedComp)}
                          {renderPropertySection("layout", "Layout", renderCommonFields(selectedComp))}
                          {renderPropertySection("appearance", "Appearance", <>
                            <div>
                              <label className={sLabel}>Icon</label>
                              {renderIconPicker((id) => updateComp(selectedComp.id, { iconName: id }), selectedComp.iconName)}
                            </div>
                            <ColorPicker label="Color" value={selectedComp.fontColor ?? "#111111"} onChange={(v) => updateComp(selectedComp.id, { fontColor: v })} />
                            <div>
                              <label className={sLabel}>Icon size</label>
                              <div className="grid grid-cols-[1fr_54px] gap-1.5">
                                <input type="range" min="8" max="300" value={selectedComp.fontSize ?? 32} onChange={(e) => updateComp(selectedComp.id, { fontSize: +e.target.value })} className="w-full" />
                                <Input type="number" min="8" max="300" value={selectedComp.fontSize ?? 32} onChange={(e) => updateComp(selectedComp.id, { fontSize: +e.target.value })} className="h-6 text-xs px-1.5" />
                              </div>
                            </div>
                            <div>
                              <label className={sLabel}>Transparency</label>
                              <div className="grid grid-cols-[1fr_54px] gap-1.5">
                                <input type="range" min="0" max="100" value={selectedComp.opacity ?? 100} onChange={(e) => updateComp(selectedComp.id, { opacity: +e.target.value })} className="w-full" />
                                <Input type="number" min="0" max="100" value={selectedComp.opacity ?? 100} onChange={(e) => updateComp(selectedComp.id, { opacity: +e.target.value })} className="h-6 text-xs px-1.5" />
                              </div>
                            </div>
                          </>)}
                          {renderPropertySection("responsive", "Responsive", renderResponsiveHint())}
                          {renderPropertySection("effects", "Effects", renderShadowBlurFields(selectedComp))}
                        </div>
                      ) : (
                        renderIconPicker(addIcon)
                      )}
                    </div>
                  )}
                </div>

                {/* Location Input */}
                <div>
                  <button type="button" onClick={() => setOpenTool(openTool === "location-input" ? null : "location-input")}
                    className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md border text-xs transition-colors text-left text-gray-200 ${openTool === "location-input" ? "border-white bg-gray-700" : "border-gray-700 hover:bg-gray-700"}`}>
                    <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" /> Location Input
                    <ChevronDown className={`h-3 w-3 ml-auto text-muted-foreground transition-transform ${openTool === "location-input" ? "rotate-180" : ""}`} />
                  </button>
                  {openTool === "location-input" && (
                    <div className="mt-1 p-1.5 border rounded-md bg-gray-900 border-gray-700 text-gray-200">
                      {selectedComp && selectedComp.type === "location-input" ? (
                        <div className="flex flex-col">
                          {renderTypeHeader(selectedComp)}
                          {renderPropertySection("layout", "Layout", renderCommonFields(selectedComp))}
                          {renderPropertySection("appearance", "Appearance", <>
                            <div>
                              <label className={sLabel}>Label</label>
                              <Input value={selectedComp.locationLabel ?? ""} onChange={(e) => updateComp(selectedComp.id, { locationLabel: e.target.value })} placeholder="Pickup location" className="h-7 text-xs" />
                            </div>
                            <div>
                              <label className={sLabel}>Placeholder</label>
                              <Input value={selectedComp.locationPlaceholder ?? ""} onChange={(e) => updateComp(selectedComp.id, { locationPlaceholder: e.target.value })} placeholder="Enter location" className="h-7 text-xs" />
                            </div>
                            <ColorPicker label="Icon / text color" value={selectedComp.fontColor ?? "#111111"} onChange={(v) => updateComp(selectedComp.id, { fontColor: v })} />
                            <ColorPicker label="Background" value={selectedComp.bgColor === "transparent" ? "#ffffff" : (selectedComp.bgColor ?? "#ffffff")} onChange={(v) => updateComp(selectedComp.id, { bgColor: v })} />
                            <ColorPicker label="Border" value={selectedComp.borderColor ?? "#e5e7eb"} onChange={(v) => updateComp(selectedComp.id, { borderColor: v })} />
                          </>)}
                          {renderPropertySection("responsive", "Responsive", renderResponsiveHint())}
                          {renderPropertySection("effects", "Effects", renderShadowBlurFields(selectedComp))}
                        </div>
                      ) : (
                        <button type="button" onClick={() => addLocationInput()}
                          className="w-full flex items-center justify-center gap-1.5 h-9 rounded border border-gray-700 bg-gray-800 transition-colors text-xs text-gray-200">
                          <MapPin className="h-4 w-4" /> Add Location Input
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Map */}
                <div>
                  <button type="button" onClick={() => setOpenTool(openTool === "map" ? null : "map")}
                    className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md border text-xs transition-colors text-left text-gray-200 ${openTool === "map" ? "border-white bg-gray-700" : "border-gray-700 hover:bg-gray-700"}`}>
                    <MapIcon className="h-3.5 w-3.5 text-muted-foreground shrink-0" /> Map
                    <ChevronDown className={`h-3 w-3 ml-auto text-muted-foreground transition-transform ${openTool === "map" ? "rotate-180" : ""}`} />
                  </button>
                  {openTool === "map" && (
                    <div className="mt-1 p-1.5 border rounded-md bg-gray-900 border-gray-700 text-gray-200">
                      {selectedComp && selectedComp.type === "map" ? (() => {
                        const markers = selectedComp.mapMarkers ?? [];
                        return (
                          <div className="flex flex-col">
                            {renderTypeHeader(selectedComp)}
                            {renderPropertySection("layout", "Layout", renderCommonFields(selectedComp))}
                            {renderPropertySection("appearance", "Appearance", <>
                              {!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY && (
                                <p className="text-[10px] text-amber-600 bg-amber-50 border border-amber-200 rounded px-2 py-1">Set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to preview the real map.</p>
                              )}
                              <div className="grid grid-cols-2 gap-1.5">
                                <div>
                                  <label className={sLabel}>Center lat</label>
                                  <Input type="number" step="0.0001" value={selectedComp.mapCenterLat ?? 12.9716} onChange={(e) => updateComp(selectedComp.id, { mapCenterLat: +e.target.value })} className="h-6 text-xs px-1.5" />
                                </div>
                                <div>
                                  <label className={sLabel}>Center lng</label>
                                  <Input type="number" step="0.0001" value={selectedComp.mapCenterLng ?? 77.5946} onChange={(e) => updateComp(selectedComp.id, { mapCenterLng: +e.target.value })} className="h-6 text-xs px-1.5" />
                                </div>
                              </div>
                              <div>
                                <label className={sLabel}>Zoom</label>
                                <div className="grid grid-cols-[1fr_54px] gap-1.5">
                                  <input type="range" min="1" max="20" value={selectedComp.mapZoom ?? 13} onChange={(e) => updateComp(selectedComp.id, { mapZoom: +e.target.value })} className="w-full" />
                                  <Input type="number" min="1" max="20" value={selectedComp.mapZoom ?? 13} onChange={(e) => updateComp(selectedComp.id, { mapZoom: +e.target.value })} className="h-6 text-xs px-1.5" />
                                </div>
                              </div>
                              <div>
                                <label className={sLabel}>Service radius (km)</label>
                                <Input type="number" min="0" step="0.5" value={selectedComp.mapServiceRadiusKm ?? 5} onChange={(e) => updateComp(selectedComp.id, { mapServiceRadiusKm: +e.target.value })} className="h-6 text-xs px-1.5" />
                              </div>
                              <div>
                                <div className="flex items-center justify-between mb-1">
                                  <label className={sLabel + " mb-0"}>Markers ({markers.length})</label>
                                  <button type="button" onClick={() => addMapMarker(selectedComp.id, markers)} className="text-[10px] px-1.5 py-0.5 rounded border hover:bg-muted hover:text-gray-900 flex items-center gap-1"><Plus className="h-3 w-3" /> Add</button>
                                </div>
                                <div className="flex flex-col gap-1.5">
                                  {markers.map((m) => (
                                    <div key={m.id} className="flex items-center gap-1 p-1 border border-gray-700 rounded bg-gray-900 text-gray-200">
                                      <Input value={m.label ?? ""} onChange={(e) => updateMapMarker(selectedComp.id, markers, m.id, { label: e.target.value })} placeholder="Label" className="h-6 text-xs px-1.5 flex-1 min-w-0" />
                                      <Input type="number" step="0.0001" value={m.lat} onChange={(e) => updateMapMarker(selectedComp.id, markers, m.id, { lat: +e.target.value })} placeholder="Lat" className="h-6 text-xs px-1.5 w-16" />
                                      <Input type="number" step="0.0001" value={m.lng} onChange={(e) => updateMapMarker(selectedComp.id, markers, m.id, { lng: +e.target.value })} placeholder="Lng" className="h-6 text-xs px-1.5 w-16" />
                                      <button type="button" title="Remove" onClick={() => removeMapMarker(selectedComp.id, markers, m.id)} className="text-destructive shrink-0 hover:bg-destructive/10 rounded p-0.5">
                                        <X className="h-3 w-3" />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </>)}
                            {renderPropertySection("responsive", "Responsive", renderResponsiveHint())}
                            {renderPropertySection("effects", "Effects", renderShadowBlurFields(selectedComp))}
                          </div>
                        );
                      })() : (
                        <button type="button" onClick={() => addMap()}
                          className="w-full flex items-center justify-center gap-1.5 h-9 rounded border border-gray-700 bg-gray-800 transition-colors text-xs text-gray-200">
                          <MapIcon className="h-4 w-4" /> Add Map
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Date & Time Picker */}
                <div>
                  <button type="button" onClick={() => setOpenTool(openTool === "datetime-picker" ? null : "datetime-picker")}
                    className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md border text-xs transition-colors text-left text-gray-200 ${openTool === "datetime-picker" ? "border-white bg-gray-700" : "border-gray-700 hover:bg-gray-700"}`}>
                    <CalendarClock className="h-3.5 w-3.5 text-muted-foreground shrink-0" /> Date & Time Picker
                    <ChevronDown className={`h-3 w-3 ml-auto text-muted-foreground transition-transform ${openTool === "datetime-picker" ? "rotate-180" : ""}`} />
                  </button>
                  {openTool === "datetime-picker" && (
                    <div className="mt-1 p-1.5 border rounded-md bg-gray-900 border-gray-700 text-gray-200">
                      {selectedComp && selectedComp.type === "datetime-picker" ? (
                        <div className="flex flex-col">
                          {renderTypeHeader(selectedComp)}
                          {renderPropertySection("layout", "Layout", renderCommonFields(selectedComp))}
                          {renderPropertySection("appearance", "Appearance", <>
                            <div>
                              <label className={sLabel}>Default date</label>
                              <div className="flex gap-1">
                                {(["today", "tomorrow", "custom"] as DateOption[]).map((opt) => (
                                  <button key={opt} type="button" onClick={() => updateComp(selectedComp.id, { dtDefaultOption: opt })}
                                    className={`flex-1 text-[11px] px-1.5 py-1 rounded border capitalize ${(selectedComp.dtDefaultOption ?? "today") === opt ? "border-black bg-black text-white" : "hover:bg-muted hover:text-gray-900"}`}>
                                    {opt}
                                  </button>
                                ))}
                              </div>
                            </div>
                            {(selectedComp.dtDefaultOption ?? "today") === "custom" && (
                              <div>
                                <label className={sLabel}>Custom date</label>
                                <Input type="date" value={selectedComp.dtCustomDate ?? ""} onChange={(e) => updateComp(selectedComp.id, { dtCustomDate: e.target.value })} className="h-7 text-xs" />
                              </div>
                            )}
                            <div>
                              <label className={sLabel}>Time</label>
                              <Input type="time" value={selectedComp.dtTime ?? "09:00"} onChange={(e) => updateComp(selectedComp.id, { dtTime: e.target.value })} className="h-7 text-xs" />
                            </div>
                            <ColorPicker label="Text color" value={selectedComp.fontColor ?? "#111111"} onChange={(v) => updateComp(selectedComp.id, { fontColor: v })} />
                            <ColorPicker label="Background" value={selectedComp.bgColor === "transparent" ? "#ffffff" : (selectedComp.bgColor ?? "#ffffff")} onChange={(v) => updateComp(selectedComp.id, { bgColor: v })} />
                            <ColorPicker label="Border" value={selectedComp.borderColor ?? "#e5e7eb"} onChange={(v) => updateComp(selectedComp.id, { borderColor: v })} />
                          </>)}
                          {renderPropertySection("responsive", "Responsive", renderResponsiveHint())}
                          {renderPropertySection("effects", "Effects", renderShadowBlurFields(selectedComp))}
                        </div>
                      ) : (
                        <button type="button" onClick={() => addDateTimePicker()}
                          className="w-full flex items-center justify-center gap-1.5 h-9 rounded border border-gray-700 bg-gray-800 transition-colors text-xs text-gray-200">
                          <CalendarClock className="h-4 w-4" /> Add Date & Time Picker
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Vehicle Selector */}
                <div>
                  <button type="button" onClick={() => setOpenTool(openTool === "vehicle-selector" ? null : "vehicle-selector")}
                    className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md border text-xs transition-colors text-left text-gray-200 ${openTool === "vehicle-selector" ? "border-white bg-gray-700" : "border-gray-700 hover:bg-gray-700"}`}>
                    <CarFront className="h-3.5 w-3.5 text-muted-foreground shrink-0" /> Vehicle Selector
                    <ChevronDown className={`h-3 w-3 ml-auto text-muted-foreground transition-transform ${openTool === "vehicle-selector" ? "rotate-180" : ""}`} />
                  </button>
                  {openTool === "vehicle-selector" && (
                    <div className="mt-1 p-1.5 border rounded-md bg-gray-900 border-gray-700 text-gray-200">
                      {selectedComp && selectedComp.type === "vehicle-selector" ? (() => {
                        const options = selectedComp.vehicleOptions ?? [];
                        return (
                          <div className="flex flex-col">
                            {renderTypeHeader(selectedComp)}
                            {renderPropertySection("layout", "Layout", renderCommonFields(selectedComp))}
                            {renderPropertySection("appearance", "Appearance", <>
                              <div>
                                <div className="flex items-center justify-between mb-1">
                                  <label className={sLabel + " mb-0"}>Options ({options.length})</label>
                                  <button type="button" onClick={() => addVehicleOption(selectedComp.id, options)} className="text-[10px] px-1.5 py-0.5 rounded border hover:bg-muted hover:text-gray-900 flex items-center gap-1"><Plus className="h-3 w-3" /> Add</button>
                                </div>
                                <div className="flex flex-col gap-2">
                                  {options.map((opt) => {
                                    const isSelected = (selectedComp.selectedVehicleId ?? options[0]?.id) === opt.id;
                                    return (
                                      <div key={opt.id} className="flex flex-col gap-1 p-1.5 border border-gray-700 rounded bg-gray-900 text-gray-200">
                                        <div className="flex items-center gap-1">
                                          <Input value={opt.label} onChange={(e) => updateVehicleOption(selectedComp.id, options, opt.id, { label: e.target.value })} placeholder="Label" className="h-6 text-xs px-1.5 flex-1 min-w-0" />
                                          <Input value={opt.fareText ?? ""} onChange={(e) => updateVehicleOption(selectedComp.id, options, opt.id, { fareText: e.target.value })} placeholder="₹99" className="h-6 text-xs px-1.5 w-16" />
                                          <button type="button" title="Remove" onClick={() => removeVehicleOption(selectedComp.id, options, opt.id)} className="text-destructive shrink-0 hover:bg-destructive/10 rounded p-0.5">
                                            <X className="h-3 w-3" />
                                          </button>
                                        </div>
                                        <div className="flex items-center justify-between">
                                          {renderIconPicker((id) => updateVehicleOption(selectedComp.id, options, opt.id, { iconId: id }), opt.iconId)}
                                          <button type="button" onClick={() => updateComp(selectedComp.id, { selectedVehicleId: opt.id })}
                                            className={`text-[10px] px-1.5 py-0.5 rounded border shrink-0 ml-1 ${isSelected ? "border-black bg-black text-white" : "hover:bg-muted hover:text-gray-900"}`}>
                                            {isSelected ? "Default" : "Set default"}
                                          </button>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                              <ColorPicker label="Background" value={selectedComp.bgColor === "transparent" ? "#ffffff" : (selectedComp.bgColor ?? "#ffffff")} onChange={(v) => updateComp(selectedComp.id, { bgColor: v })} />
                            </>)}
                            {renderPropertySection("responsive", "Responsive", renderResponsiveHint())}
                            {renderPropertySection("effects", "Effects", renderShadowBlurFields(selectedComp))}
                          </div>
                        );
                      })() : (
                        <button type="button" onClick={() => addVehicleSelector()}
                          className="w-full flex items-center justify-center gap-1.5 h-9 rounded border border-gray-700 bg-gray-800 transition-colors text-xs text-gray-200">
                          <CarFront className="h-4 w-4" /> Add Vehicle Selector
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Driver Badge */}
                <div>
                  <button type="button" onClick={() => setOpenTool(openTool === "driver-badge" ? null : "driver-badge")}
                    className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md border text-xs transition-colors text-left text-gray-200 ${openTool === "driver-badge" ? "border-white bg-gray-700" : "border-gray-700 hover:bg-gray-700"}`}>
                    <BadgeCheck className="h-3.5 w-3.5 text-muted-foreground shrink-0" /> Driver Badge
                    <ChevronDown className={`h-3 w-3 ml-auto text-muted-foreground transition-transform ${openTool === "driver-badge" ? "rotate-180" : ""}`} />
                  </button>
                  {openTool === "driver-badge" && (
                    <div className="mt-1 p-1.5 border rounded-md bg-gray-900 border-gray-700 text-gray-200">
                      {selectedComp && selectedComp.type === "driver-badge" ? (
                        <div className="flex flex-col">
                          {renderTypeHeader(selectedComp)}
                          {renderPropertySection("layout", "Layout", renderCommonFields(selectedComp))}
                          {renderPropertySection("appearance", "Appearance", <>
                            <div>
                              <label className={sLabel}>Photo</label>
                              <ImagePickerButton
                                label="Choose photo" icon={ImageIcon}
                                buttonClassName="flex items-center gap-1.5 cursor-pointer px-2 py-1 rounded border text-xs hover:bg-muted hover:text-gray-900 w-fit"
                                uploading={uploading} uploadProgress={uploadProgress}
                                assetItems={assetItems} assetsLoading={assetsLoading} loadAssets={loadAssets}
                                onUpload={uploadToAssets}
                                onSelect={(url) => updateComp(selectedComp.id, { driverPhotoUrl: url })}
                              />
                            </div>
                            <div>
                              <label className={sLabel}>Name</label>
                              <Input value={selectedComp.driverName ?? ""} onChange={(e) => updateComp(selectedComp.id, { driverName: e.target.value })} placeholder="Driver name" className="h-7 text-xs" />
                            </div>
                            <div>
                              <label className={sLabel}>Rating</label>
                              <div className="grid grid-cols-[1fr_54px] gap-1.5">
                                <input type="range" min="1" max="5" step="0.1" value={selectedComp.driverRating ?? 4.8} onChange={(e) => updateComp(selectedComp.id, { driverRating: +e.target.value })} className="w-full" />
                                <Input type="number" min="1" max="5" step="0.1" value={selectedComp.driverRating ?? 4.8} onChange={(e) => updateComp(selectedComp.id, { driverRating: +e.target.value })} className="h-6 text-xs px-1.5" />
                              </div>
                            </div>
                            <div>
                              <label className={sLabel}>Vehicle</label>
                              <Input value={selectedComp.driverVehicle ?? ""} onChange={(e) => updateComp(selectedComp.id, { driverVehicle: e.target.value })} placeholder="White Toyota Etios · KA 01 AB 1234" className="h-7 text-xs" />
                            </div>
                            <ColorPicker label="Text color" value={selectedComp.fontColor ?? "#111111"} onChange={(v) => updateComp(selectedComp.id, { fontColor: v })} />
                            <ColorPicker label="Background" value={selectedComp.bgColor === "transparent" ? "#ffffff" : (selectedComp.bgColor ?? "#ffffff")} onChange={(v) => updateComp(selectedComp.id, { bgColor: v })} />
                          </>)}
                          {renderPropertySection("responsive", "Responsive", renderResponsiveHint())}
                          {renderPropertySection("effects", "Effects", renderShadowBlurFields(selectedComp))}
                        </div>
                      ) : (
                        <button type="button" onClick={() => addDriverBadge()}
                          className="w-full flex items-center justify-center gap-1.5 h-9 rounded border border-gray-700 bg-gray-800 transition-colors text-xs text-gray-200">
                          <BadgeCheck className="h-4 w-4" /> Add Driver Badge
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Fare Display */}
                <div>
                  <button type="button" onClick={() => setOpenTool(openTool === "fare-display" ? null : "fare-display")}
                    className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md border text-xs transition-colors text-left text-gray-200 ${openTool === "fare-display" ? "border-white bg-gray-700" : "border-gray-700 hover:bg-gray-700"}`}>
                    <Receipt className="h-3.5 w-3.5 text-muted-foreground shrink-0" /> Fare Display
                    <ChevronDown className={`h-3 w-3 ml-auto text-muted-foreground transition-transform ${openTool === "fare-display" ? "rotate-180" : ""}`} />
                  </button>
                  {openTool === "fare-display" && (
                    <div className="mt-1 p-1.5 border rounded-md bg-gray-900 border-gray-700 text-gray-200">
                      {selectedComp && selectedComp.type === "fare-display" ? (
                        <div className="flex flex-col">
                          {renderTypeHeader(selectedComp)}
                          {renderPropertySection("layout", "Layout", renderCommonFields(selectedComp))}
                          {renderPropertySection("appearance", "Appearance", <>
                            <div>
                              <label className={sLabel}>Currency symbol</label>
                              <Input value={selectedComp.fareCurrency ?? "₹"} onChange={(e) => updateComp(selectedComp.id, { fareCurrency: e.target.value })} className="h-7 text-xs" />
                            </div>
                            <div className="grid grid-cols-2 gap-1.5">
                              <div>
                                <label className={sLabel}>Base fare</label>
                                <Input type="number" min="0" value={selectedComp.fareBase ?? 50} onChange={(e) => updateComp(selectedComp.id, { fareBase: +e.target.value })} className="h-6 text-xs px-1.5" />
                              </div>
                              <div>
                                <label className={sLabel}>Distance (km)</label>
                                <Input type="number" min="0" step="0.1" value={selectedComp.fareDistanceKm ?? 5} onChange={(e) => updateComp(selectedComp.id, { fareDistanceKm: +e.target.value })} className="h-6 text-xs px-1.5" />
                              </div>
                              <div>
                                <label className={sLabel}>Rate / km</label>
                                <Input type="number" min="0" value={selectedComp.fareRatePerKm ?? 12} onChange={(e) => updateComp(selectedComp.id, { fareRatePerKm: +e.target.value })} className="h-6 text-xs px-1.5" />
                              </div>
                              <div>
                                <label className={sLabel}>Surge ×</label>
                                <Input type="number" min="1" step="0.1" value={selectedComp.fareSurgeMultiplier ?? 1} onChange={(e) => updateComp(selectedComp.id, { fareSurgeMultiplier: +e.target.value })} className="h-6 text-xs px-1.5" />
                              </div>
                            </div>
                            <ColorPicker label="Text color" value={selectedComp.fontColor ?? "#111111"} onChange={(v) => updateComp(selectedComp.id, { fontColor: v })} />
                            <ColorPicker label="Background" value={selectedComp.bgColor === "transparent" ? "#ffffff" : (selectedComp.bgColor ?? "#ffffff")} onChange={(v) => updateComp(selectedComp.id, { bgColor: v })} />
                          </>)}
                          {renderPropertySection("responsive", "Responsive", renderResponsiveHint())}
                          {renderPropertySection("effects", "Effects", renderShadowBlurFields(selectedComp))}
                        </div>
                      ) : (
                        <button type="button" onClick={() => addFareDisplay()}
                          className="w-full flex items-center justify-center gap-1.5 h-9 rounded border border-gray-700 bg-gray-800 transition-colors text-xs text-gray-200">
                          <Receipt className="h-4 w-4" /> Add Fare Display
                        </button>
                      )}
                    </div>
                  )}
                </div>

              </div>

              {/* Canvas Background — page-level (see canvasBgColor state comment),
                  applies to whichever zone canvas is currently being edited and to
                  every zone on the live site (see PageRenderer.tsx). */}
              <div className="mt-3 pt-3 border-t">
                <ColorPicker label="Canvas Background" value={canvasBgColor} onChange={setCanvasBgColor} />
              </div>

              {/* Logo & Favicon — genuinely global (see siteSettings state comment
                  above), shared across every page's header/browser tab, not tied to
                  this page. See the "Live Preview" overlay for the true WYSIWYG check
                  (the free-drag canvas doesn't render this overlay). */}
              <div className="mt-3 pt-3 border-t flex flex-col gap-3">
                <p className={sLabel}>Logo & Favicon</p>

                <div>
                  <label className="text-[10px] text-muted-foreground block mb-1 uppercase tracking-wide">Logo</label>
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => logoInputRef.current?.click()}
                      className="h-12 w-12 shrink-0 rounded border border-dashed border-gray-700 bg-gray-900 flex items-center justify-center overflow-hidden transition-colors">
                      {logoUploading ? (
                        <span className="text-[9px] text-muted-foreground">…</span>
                      ) : siteSettings.logoUrl ? (
                        <img src={siteSettings.logoUrl} alt="" className="max-h-full max-w-full object-contain" />
                      ) : (
                        <ImageIcon className="h-4 w-4 text-muted-foreground" />
                      )}
                    </button>
                    <div className="flex-1 flex flex-col gap-1">
                      <button type="button" onClick={() => logoInputRef.current?.click()} className="text-[11px] px-2 py-1 rounded border hover:bg-muted hover:text-gray-900 text-left">
                        {siteSettings.logoUrl ? "Replace logo" : "Upload logo"}
                      </button>
                      {siteSettings.logoUrl && (
                        <button type="button" onClick={() => updateSiteSettings({ logoUrl: null })} className="text-[11px] text-muted-foreground hover:text-destructive text-left">
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                  <input ref={logoInputRef} type="file" accept="image/*" className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleLogoUpload(f); e.target.value = ""; }} />

                  {siteSettings.logoUrl && (
                    <div className="mt-2 flex flex-col gap-1.5">
                      <div>
                        <label className={sLabel}>Width (px)</label>
                        <Input type="number" min="20" max="600" value={siteSettings.logoWidth}
                          onChange={(e) => updateSiteSettings({ logoWidth: +e.target.value || 120 })} className="h-6 text-xs px-1.5" />
                      </div>
                      <div>
                        <label className={sLabel}>Alignment</label>
                        <div className="grid grid-cols-3 gap-1">
                          {(["left", "center", "right"] as const).map((a) => (
                            <button key={a} type="button" onClick={() => updateSiteSettings({ logoAlign: a })}
                              className={`text-[11px] py-0.5 rounded border capitalize ${siteSettings.logoAlign === a ? "bg-black text-white" : "hover:bg-muted hover:text-gray-900"}`}>
                              {a}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className={sLabel}>Link</label>
                        <Input value={siteSettings.logoLink} onChange={(e) => updateSiteSettings({ logoLink: e.target.value })}
                          placeholder="/" className="h-6 text-xs px-1.5" />
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-[10px] text-muted-foreground block mb-1 uppercase tracking-wide">Favicon</label>
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => faviconInputRef.current?.click()}
                      className="h-8 w-8 shrink-0 rounded border border-dashed border-gray-700 bg-gray-900 flex items-center justify-center overflow-hidden transition-colors">
                      {faviconUploading ? (
                        <span className="text-[8px] text-muted-foreground">…</span>
                      ) : siteSettings.faviconUrl ? (
                        <img src={siteSettings.faviconUrl} alt="" className="max-h-full max-w-full object-contain" />
                      ) : (
                        <ImageIcon className="h-3 w-3 text-muted-foreground" />
                      )}
                    </button>
                    <div className="flex-1 flex flex-col gap-1">
                      <button type="button" onClick={() => faviconInputRef.current?.click()} className="text-[11px] px-2 py-1 rounded border hover:bg-muted hover:text-gray-900 text-left">
                        {siteSettings.faviconUrl ? "Replace favicon" : "Upload favicon"}
                      </button>
                      {siteSettings.faviconUrl && (
                        <button type="button" onClick={() => updateSiteSettings({ faviconUrl: null })} className="text-[11px] text-muted-foreground hover:text-destructive text-left">
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                  <input ref={faviconInputRef} type="file" accept="image/*" className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFaviconUpload(f); e.target.value = ""; }} />
                </div>
              </div>

              {/* Reusable Components — always visible (not an openTool accordion) since
                  it's a persistent drag source, not a per-type settings panel. Populated
                  by the "Save as Reusable Component" context-menu action above. */}
              <div className="mt-3 pt-3 border-t">
                <p className={sLabel + " mb-2"}>Reusable Components</p>
                {reusableComponents.length === 0 ? (
                  <p className="text-[11px] text-muted-foreground">Right-click a component and choose "Save as Reusable Component" to see it here.</p>
                ) : (
                  <div className="flex flex-col gap-1.5">
                    {reusableComponents.map((r) => (
                      <div
                        key={r.id}
                        draggable
                        onDragStart={(e) => e.dataTransfer.setData("application/x-reusable-component", JSON.stringify(r))}
                        className="flex items-center gap-2 px-2.5 py-1.5 rounded-md border border-gray-700 text-xs text-gray-200 cursor-grab"
                        title={`From "${r.sourcePage}"`}
                      >
                        <ComponentIcon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <span className="truncate flex-1">{r.name}</span>
                        <span className="text-[9px] uppercase text-muted-foreground shrink-0">{componentTypeLabel(r.type)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Group / multi-selection settings — not tied to one component type */}
              {(selectedComps.length > 1 || (selectedComp && selectedComp.groupId)) && (
                <div className="mt-3 p-3 border rounded-md bg-gray-900 border-gray-700 text-gray-200 flex flex-col gap-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold flex-1">
                      {selectionGroupId ? "Group" : `${selectedComps.length} selected`}
                    </span>
                    <Button variant="destructive" size="sm" className="h-6 px-2 gap-1 text-xs" onClick={() => deleteComp(selectedIds)}>
                      <Trash2 className="h-3 w-3" /> Delete
                    </Button>
                  </div>

                  {selectionGroupId ? (
                    <>
                      <div>
                        <label className={sLabel}>Name</label>
                        <Input value={selectedComps[0].groupName ?? ""} onChange={(e) => updateGroup(selectionGroupId, { groupName: e.target.value })} placeholder="e.g. Category Menu" className="h-6 text-xs px-1.5" />
                      </div>
                      <div>
                        <label className={sLabel}>Link to page</label>
                        <Input value={selectedComps[0].groupLink ?? ""} onChange={(e) => updateGroup(selectionGroupId, { groupLink: e.target.value })} placeholder="/products or https://…" className="h-6 text-xs px-1.5" />
                      </div>
                      <Button variant="outline" size="sm" className="gap-1.5 text-xs h-7 justify-center" onClick={ungroupSelected}>
                        <UngroupIcon className="h-3.5 w-3.5" /> Ungroup
                      </Button>
                    </>
                  ) : (
                    <>
                      <p className="text-xs text-muted-foreground">{selectedComps.length} components selected. Group them to move, name, and link them as one unit.</p>
                      <Button size="sm" className="gap-1.5 text-xs h-7 justify-center" onClick={groupSelected}>
                        <GroupIcon className="h-3.5 w-3.5" /> Create Group
                      </Button>
                    </>
                  )}

                  <p className="text-[10px] text-muted-foreground pt-1.5 border-t">
                    {selectedComps.length} component{selectedComps.length !== 1 ? "s" : ""} · drag to move together · corner to resize together
                  </p>

                  {/* Batch property edit — only when every selected component shares one
                      type, so "color/size" edits below apply meaningfully to all of them. */}
                  {selectedComps.every((c) => c.type === selectedComps[0].type) && (
                    <div className="flex flex-col gap-2 pt-2 border-t">
                      <p className={sLabel}>Batch edit — all {selectedComps.length} {componentTypeLabel(selectedComps[0].type)}{selectedComps.length !== 1 ? "s" : ""}</p>
                      <ColorPicker label="Background" value={selectedComps[0].bgColor === "transparent" ? "#ffffff" : (selectedComps[0].bgColor ?? "#ffffff")} onChange={(v) => updateSelectedBatch({ bgColor: v })} />
                      <ColorPicker label="Text color" value={selectedComps[0].fontColor ?? "#111111"} onChange={(v) => updateSelectedBatch({ fontColor: v })} />
                      <div className="grid grid-cols-2 gap-1.5">
                        <div>
                          <label className={sLabel}>Opacity</label>
                          <Input type="number" min="0" max="100" value={selectedComps[0].opacity ?? 100} onChange={(e) => updateSelectedBatch({ opacity: +e.target.value })} className="h-6 text-xs px-1.5" />
                        </div>
                        <div>
                          <label className={sLabel}>Radius</label>
                          <Input type="number" min="0" value={selectedComps[0].borderRadius ?? 0} onChange={(e) => updateSelectedBatch({ borderRadius: +e.target.value })} className="h-6 text-xs px-1.5" />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Empty hint */}
              {selectedIds.length === 0 && !openTool && (
                <div className="flex flex-col items-center justify-center gap-2 text-center px-4 py-8 mt-2">
                  <MousePointerClick className="h-6 w-6 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">Click a component on the canvas to edit its properties</p>
                </div>
              )}
            </div>
              </>
            )}
          </div>
          {/* end right panel */}

        </div>
        {/* end canvas + panel row */}

        {/* Right-click context menu */}
        {contextMenu && (
          <div
            className="fixed z-50 min-w-[170px] rounded-md border bg-white shadow-lg py-1 text-xs"
            style={{ top: contextMenu.y, left: contextMenu.x }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            {selectedIds.length > 1 && !selectionGroupId && (
              <button
                type="button"
                className="w-full flex items-center gap-2 text-left px-3 py-1.5 hover:bg-muted hover:text-gray-900"
                onClick={groupSelected}
              >
                <GroupIcon className="h-3.5 w-3.5" /> Create Group
              </button>
            )}
            {selectionGroupId && (
              <button
                type="button"
                className="w-full flex items-center gap-2 text-left px-3 py-1.5 hover:bg-muted hover:text-gray-900"
                onClick={ungroupSelected}
              >
                <UngroupIcon className="h-3.5 w-3.5" /> Ungroup
              </button>
            )}
            {selectedComp && (
              <button
                type="button"
                className="w-full flex items-center gap-2 text-left px-3 py-1.5 hover:bg-muted hover:text-gray-900"
                onClick={copySelection}
              >
                <ClipboardCopy className="h-3.5 w-3.5" /> Copy
              </button>
            )}
            {selectedComp && (
              <button
                type="button"
                className="w-full flex items-center gap-2 text-left px-3 py-1.5 hover:bg-muted hover:text-gray-900"
                onClick={() => duplicateInPlace(selectedComp)}
              >
                <Copy className="h-3.5 w-3.5" /> Duplicate
              </button>
            )}
            {selectedComp && (
              <button
                type="button"
                className="w-full flex items-center gap-2 text-left px-3 py-1.5 hover:bg-muted hover:text-gray-900"
                onClick={() => copyStyle(selectedComp)}
              >
                <Paintbrush className="h-3.5 w-3.5" /> Copy style
              </button>
            )}
            {selectedComp && copiedStyleRef.current && (
              <button
                type="button"
                className="w-full flex items-center gap-2 text-left px-3 py-1.5 hover:bg-muted hover:text-gray-900"
                onClick={() => pasteStyle(selectedComp)}
              >
                <ClipboardPaste className="h-3.5 w-3.5" /> Paste style
              </button>
            )}
            {selectedComp && !selectedComp.reusable && (
              <button
                type="button"
                className="w-full flex items-center gap-2 text-left px-3 py-1.5 hover:bg-muted hover:text-gray-900"
                onClick={() => {
                  setReusablePrompt({ id: selectedComp.id, name: selectedComp.reusableName ?? selectedComp.name ?? "", x: contextMenu.x, y: contextMenu.y });
                  setContextMenu(null);
                }}
              >
                <ComponentIcon className="h-3.5 w-3.5" /> Save as Reusable Component
              </button>
            )}
            {selectedComp && selectedComp.reusable && (
              <button
                type="button"
                className="w-full flex items-center gap-2 text-left px-3 py-1.5 hover:bg-muted hover:text-gray-900"
                onClick={() => {
                  updateComp(selectedComp.id, { reusable: false, reusableName: undefined });
                  setReusableRefreshPending(true);
                  setContextMenu(null);
                }}
              >
                <ComponentIcon className="h-3.5 w-3.5" /> Remove from Reusable Components
              </button>
            )}
            <button
              type="button"
              disabled={selectedComps.some((c) => c.locked)}
              className="w-full flex items-center gap-2 text-left px-3 py-1.5 hover:bg-muted hover:text-gray-900 text-destructive disabled:opacity-40 disabled:cursor-not-allowed"
              onClick={() => { deleteComp(selectedIds); setContextMenu(null); }}
            >
              <Trash2 className="h-3.5 w-3.5" /> Delete
            </button>
          </div>
        )}

        {/* Save as Reusable Component — naming popover, positioned at the same
            spot the context menu appeared (reusablePrompt carries {id, name}
            forward past the menu closing). */}
        {reusablePrompt && (
          <div
            className="fixed z-50 min-w-[220px] rounded-md border bg-white shadow-lg p-2.5 text-xs"
            style={{ top: reusablePrompt.y, left: reusablePrompt.x }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <p className="font-medium mb-1.5">Save as Reusable Component</p>
            <Input
              autoFocus
              value={reusablePrompt.name}
              onChange={(e) => setReusablePrompt({ ...reusablePrompt, name: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === "Enter" && reusablePrompt.name.trim()) {
                  updateComp(reusablePrompt.id, { reusable: true, reusableName: reusablePrompt.name.trim() });
                  setReusableRefreshPending(true);
                  setReusablePrompt(null);
                } else if (e.key === "Escape") {
                  setReusablePrompt(null);
                }
              }}
              placeholder="e.g. Featured Product Card"
              className="h-7 text-xs px-2 mb-2"
            />
            <div className="flex justify-end gap-1.5">
              <Button variant="outline" size="sm" className="h-6 px-2 text-xs" onClick={() => setReusablePrompt(null)}>Cancel</Button>
              <Button
                size="sm"
                className="h-6 px-2 text-xs"
                disabled={!reusablePrompt.name.trim()}
                onClick={() => {
                  updateComp(reusablePrompt.id, { reusable: true, reusableName: reusablePrompt.name.trim() });
                  setReusableRefreshPending(true);
                  setReusablePrompt(null);
                }}
              >
                Save
              </Button>
            </div>
          </div>
        )}

        {/* Bottom bar — gray chrome (matches top bar + sidebars). Sync status/
            Version Control counts stay here (absorbed from the stat-tile row
            that used to sit above the canvas); zoom controls moved here from
            their old floating position at the canvas's bottom-right corner;
            Logout moved here from the top bar. */}
        <div className="flex items-center gap-3 shrink-0 mt-3 rounded-lg px-3 py-2 bg-gray-800 border border-gray-700 text-xs text-gray-400">
          <span className={`flex items-center gap-1.5 font-medium ${syncStatus === "error" ? "text-destructive" : syncStatus === "dirty" ? "text-amber-400" : "text-gray-300"}`}>
            <Cloud className={`h-3 w-3 ${syncStatus === "syncing" ? "animate-pulse" : ""}`} /> {syncLabel}
          </span>
          <span className="flex items-center gap-1"><History className="h-3 w-3" /> {versions.length} checkpoint{versions.length === 1 ? "" : "s"}</span>
          <span className="flex items-center gap-1"><Activity className="h-3 w-3" /> {changeCount === 0 ? "Clean" : `${changeCount} tracked`}</span>

          {/* Zoom controls */}
          <div className="flex items-center gap-0.5 rounded-lg border border-gray-600 bg-gray-700 px-1 py-1">
            <button type="button" title="Zoom out" onClick={() => setZoom((z) => Math.max(25, z - 10))}
              className="flex h-6 w-6 items-center justify-center rounded hover:bg-gray-600 text-gray-300">
              <Minus className="h-3 w-3" />
            </button>
            <button type="button" title="Reset to 100%" onClick={() => setZoom(100)}
              className="h-6 px-1.5 text-[11px] rounded hover:bg-gray-600 text-gray-300 tabular-nums">
              {zoom}%
            </button>
            <button type="button" title="Zoom in" onClick={() => setZoom((z) => Math.min(300, z + 10))}
              className="flex h-6 w-6 items-center justify-center rounded hover:bg-gray-600 text-gray-300">
              <Plus className="h-3 w-3" />
            </button>
            <div className="w-px h-4 bg-gray-600 mx-0.5" />
            <button type="button" title="Fit to screen"
              onClick={() => {
                const containerW = scrollContainerRef.current?.clientWidth ?? canvasW;
                setZoom(Math.max(25, Math.min(300, Math.floor((containerW - 24) / canvasW * 100))));
              }}
              className="flex items-center gap-1 h-6 px-1.5 text-[11px] rounded hover:bg-gray-600 text-gray-300"
            >
              <Maximize className="h-3 w-3" /> Fit
            </button>
          </div>

          {/* Logout — right-aligned */}
          <button
            onClick={logout}
            disabled={loggingOut}
            className="ml-auto flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm text-gray-400 hover:bg-gray-700 hover:text-gray-100 transition-colors disabled:opacity-50"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{loggingOut ? "Logging out…" : "Logout"}</span>
          </button>
        </div>

      </div>
      {/* end main editor */}

    </div>
  );
}
