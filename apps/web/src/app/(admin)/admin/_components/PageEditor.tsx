"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Trash2, Image as ImageIcon, Images, Type, Check, Copy,
  Monitor, Smartphone, Eye, Pencil, RotateCcw, MousePointerClick, Move, ChevronDown, ChevronUp, Square,
  Group as GroupIcon, Ungroup as UngroupIcon, Link2, Ruler,
  ChevronLeft, ChevronRight, Infinity as InfinityIcon, Timer,
  GalleryHorizontal, Tag, Component as ComponentIcon, Grid3x3, GripVertical, Layers,
  BarChart3, Users, Activity, Cloud, Rocket, Palette, Radio, History, RotateCw, ShieldCheck,
} from "lucide-react";
import { HOME_ICONS, HOME_ICON_CATEGORIES, getHomeIcon } from "@/lib/homepage-icons";

type ComponentType = "text" | "header" | "shape" | "image" | "button" | "carousel" | "icon";
type ViewMode = "desktop" | "mobile";
type ButtonStyle = "solid" | "outline" | "ghost" | "link";
type ButtonActionType = "url" | "buy" | "search" | "custom";
type TextStyle = "heading" | "subheading" | "body";
type TextEffect = "none" | "glow" | "outline" | "background" | "hollow" | "neon" | "glitch";
type ShapeType = "square" | "rectangle" | "circle" | "ellipse" | "triangle" | "diamond" | "hexagon" | "star";
type ResizeCorner = "tl" | "tr" | "bl" | "br";
type ImageMode = "single" | "slideshow";
type ImageSizePreset = "square" | "portrait" | "landscape" | "wide";
type SyncStatus = "idle" | "dirty" | "syncing" | "synced" | "error";

interface CarouselItem {
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

interface PageComponent {
  id: string;
  type: ComponentType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  content?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: number;
  lineHeight?: number;
  fontColor?: string;
  italic?: boolean;
  textAlign?: "left" | "center" | "right";
  bold?: boolean;
  textStyle?: TextStyle;
  letterSpacing?: number;
  textEffect?: TextEffect;
  effectStrength?: number;
  bgColor?: string;
  borderRadius?: number;
  opacity?: number;
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
  iconName?: string;
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

const FONT_WEIGHTS = [
  { label: "Thin", value: 100 }, { label: "Light", value: 300 },
  { label: "Regular", value: 400 }, { label: "Medium", value: 500 },
  { label: "Semibold", value: 600 }, { label: "Bold", value: 700 },
  { label: "Extrabold", value: 800 }, { label: "Black", value: 900 },
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

interface TextPreset { id: string; label: string; sample: string; patch: Partial<PageComponent> }

const TEXT_PRESETS: TextPreset[] = [
  { id: "display",    label: "Display",    sample: "Display",    patch: { textStyle: "heading",    content: "Display",    fontSize: 72, fontWeight: 800, lineHeight: 1.05, letterSpacing: -1.5, fontColor: "#0f172a" } },
  { id: "header",      label: "Header",     sample: "Header",     patch: { textStyle: "heading",    content: "Header",     fontSize: 44, fontWeight: 700, lineHeight: 1.15, letterSpacing: -0.5, fontColor: "#0f172a" } },
  { id: "subheading",  label: "Subheading", sample: "Subheading", patch: { textStyle: "subheading", content: "Subheading", fontSize: 24, fontWeight: 600, lineHeight: 1.3,  letterSpacing: 0,    fontColor: "#334155" } },
  { id: "body",        label: "Body",       sample: "Body text",  patch: { textStyle: "body",       content: "Body text",  fontSize: 16, fontWeight: 400, lineHeight: 1.6,  letterSpacing: 0,    fontColor: "#334155" } },
  { id: "caption",     label: "Caption",    sample: "Caption",    patch: { textStyle: "body",       content: "Caption",    fontSize: 12, fontWeight: 500, lineHeight: 1.4,  letterSpacing: 0.5,  fontColor: "#64748b" } },
  { id: "label",       label: "Label",      sample: "LABEL",      patch: { textStyle: "body",       content: "LABEL",      fontSize: 13, fontWeight: 700, lineHeight: 1.2,  letterSpacing: 1.5,  fontColor: "#0f172a" } },
];

interface ButtonPreset { id: string; label: string; patch: Partial<PageComponent> }

const BUTTON_PRESETS: ButtonPreset[] = [
  { id: "add-to-cart", label: "Add to Cart", patch: { content: "Add to Cart", buttonStyle: "solid",  bgColor: "#111827", fontColor: "#ffffff", hoverBgColor: "#1f2937", hoverFontColor: "#ffffff", borderRadius: 8,   fontWeight: 600 } },
  { id: "buy-now",     label: "Buy Now",     patch: { content: "Buy Now",     buttonStyle: "solid",  bgColor: "#16a34a", fontColor: "#ffffff", hoverBgColor: "#15803d", hoverFontColor: "#ffffff", borderRadius: 999, fontWeight: 700 } },
  { id: "sign-in",     label: "Sign In",     patch: { content: "Sign In",     buttonStyle: "outline", bgColor: "#111827", borderColor: "#111827", fontColor: "#111827", hoverBgColor: "#111827", hoverFontColor: "#ffffff", borderRadius: 6, fontWeight: 500 } },
  { id: "subscribe",   label: "Subscribe",   patch: { content: "Subscribe",   buttonStyle: "solid",  bgColor: "#4f46e5", fontColor: "#ffffff", hoverBgColor: "#4338ca", hoverFontColor: "#ffffff", borderRadius: 8,   fontWeight: 600 } },
  { id: "learn-more",  label: "Learn More",  patch: { content: "Learn More",  buttonStyle: "ghost",  bgColor: "#111827", fontColor: "#111827", hoverBgColor: "#f3f4f6", hoverFontColor: "#111827", borderRadius: 6,   fontWeight: 500 } },
  { id: "contact-us",  label: "Contact Us",  patch: { content: "Contact Us",  buttonStyle: "link",   fontColor: "#2563eb", hoverFontColor: "#1d4ed8", borderRadius: 0, fontWeight: 600 } },
];

const IMAGE_SIZES: { id: ImageSizePreset; label: string; ratio: number }[] = [
  { id: "square",    label: "Square",    ratio: 1 },
  { id: "portrait",  label: "Portrait",  ratio: 4 / 5 },
  { id: "landscape", label: "Landscape", ratio: 16 / 9 },
  { id: "wide",      label: "Wide",      ratio: 21 / 9 },
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
  const radius = comp.borderRadius ?? 12;
  const trackRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const dragRef = useRef<{ startX: number; startScroll: number; dragged: boolean } | null>(null);
  const [scales, setScales] = useState<number[]>([]);
  const [pad, setPad] = useState(0);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const recompute = useCallback(() => {
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
  }, [zoom]);

  const onScroll = useCallback(() => {
    if (rafRef.current) return;
    rafRef.current = requestAnimationFrame(() => { rafRef.current = null; recompute(); });
  }, [recompute]);

  useEffect(() => {
    function updatePad() {
      if (trackRef.current) setPad(Math.max(0, trackRef.current.clientWidth / 2 - itemWidth / 2));
    }
    updatePad();
    recompute();
    window.addEventListener("resize", updatePad);
    return () => window.removeEventListener("resize", updatePad);
  }, [itemWidth, items.length, recompute]);

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
      className="w-full h-full flex items-center gap-3 overflow-x-auto overflow-y-hidden cursor-grab active:cursor-grabbing"
      style={{ borderRadius: radius, paddingLeft: pad, paddingRight: pad, scrollSnapType: "x proximity", scrollBehavior: "smooth", scrollbarWidth: "none" }}
    >
      {items.map((item, i) => {
        const baseScale = scales[i] ?? 1;
        const scale = hoverIndex === i ? baseScale + 0.08 : baseScale;
        const card = (
          <div
            data-carousel-item
            onMouseEnter={() => setHoverIndex(i)}
            onMouseLeave={() => setHoverIndex((h) => (h === i ? null : h))}
            className="shrink-0 flex flex-col items-center gap-1 rounded-lg overflow-hidden bg-white shadow select-none"
            style={{ width: itemWidth, transform: `scale(${scale})`, transition: "transform 0.25s ease-out", scrollSnapAlign: "center", zIndex: hoverIndex === i ? 999 : Math.round(baseScale * 10) }}
          >
            {item.imageUrl
              ? <img src={item.imageUrl} alt="" draggable={false} className="w-full aspect-square object-cover pointer-events-none" />
              : <div className="w-full aspect-square bg-gray-200 flex items-center justify-center"><ImageIcon className="h-5 w-5 text-gray-400" /></div>}
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

// ── Margin guides + spacing rulers (rulers live outside the canvas border) ──

const RULER_SIZE = 20;

function rulerStep(canvasSize: number) {
  if (canvasSize > 1200) return 100;
  if (canvasSize > 500) return 50;
  return 25;
}

function TopRuler({ canvasW }: { canvasW: number }) {
  const step = rulerStep(canvasW);
  const ticks: number[] = [];
  for (let x = 0; x <= canvasW; x += step) ticks.push(x);
  return (
    <div className="absolute inset-0 bg-blue-50 border-b border-blue-200 select-none">
      {ticks.map((x) => (
        <div key={x} className="absolute top-0 h-full" style={{ left: `${(x / canvasW) * 100}%` }}>
          <div className="w-px h-2 bg-blue-400" />
          <span className="text-[8px] text-blue-500 leading-none pl-0.5 whitespace-nowrap">{x}</span>
        </div>
      ))}
    </div>
  );
}

function LeftRuler({ canvasH }: { canvasH: number }) {
  const step = rulerStep(canvasH);
  const ticks: number[] = [];
  for (let y = 0; y <= canvasH; y += step) ticks.push(y);
  return (
    <div className="absolute inset-0 bg-blue-50 border-r border-blue-200 select-none">
      {ticks.map((y) => (
        <div key={y} className="absolute left-0 w-full" style={{ top: `${(y / canvasH) * 100}%` }}>
          <div className="h-px w-2 bg-blue-400 ml-auto" />
        </div>
      ))}
    </div>
  );
}

function MarginGuides({ canvasW, canvasH }: { canvasW: number; canvasH: number }) {
  const marginX = Math.round(canvasW * 0.04);
  const marginY = Math.round(canvasH * 0.04);
  return (
    <div className="absolute inset-0 pointer-events-none z-10 select-none">
      {/* Margin guide box */}
      <div className="absolute border border-dashed border-pink-400/70"
        style={{ left: `${(marginX / canvasW) * 100}%`, top: `${(marginY / canvasH) * 100}%`, right: `${(marginX / canvasW) * 100}%`, bottom: `${(marginY / canvasH) * 100}%` }} />
      {/* Center cross-hair guides */}
      <div className="absolute top-0 bottom-0 border-l border-dashed border-purple-300/70" style={{ left: "50%" }} />
      <div className="absolute left-0 right-0 border-t border-dashed border-purple-300/70" style={{ top: "50%" }} />
    </div>
  );
}

// ── Grid overlay (graph paper) — editor-only, never rendered on the live page ──
// Pure-CSS repeating background so it stays cheap regardless of grid density.
// The canvas is always scaled uniformly (width and height share one scale factor,
// since aspect-ratio locks them together), so a background-size percentage of
// gridSize/canvasW and gridSize/canvasH always paints a true square on screen.

function GridOverlay({ canvasW, canvasH, gridSize }: { canvasW: number; canvasH: number; gridSize: number }) {
  const minorX = (gridSize / canvasW) * 100;
  const minorY = (gridSize / canvasH) * 100;
  const majorSize = gridSize * 5;
  const majorX = (majorSize / canvasW) * 100;
  const majorY = (majorSize / canvasH) * 100;
  return (
    <div
      className="absolute inset-0 pointer-events-none select-none"
      style={{
        backgroundImage: [
          `linear-gradient(to right, rgba(59,130,246,0.3) 1px, transparent 1px)`,
          `linear-gradient(to bottom, rgba(59,130,246,0.3) 1px, transparent 1px)`,
          `linear-gradient(to right, rgba(59,130,246,0.12) 1px, transparent 1px)`,
          `linear-gradient(to bottom, rgba(59,130,246,0.12) 1px, transparent 1px)`,
        ].join(", "),
        backgroundSize: `${majorX}% ${majorY}%, ${majorX}% ${majorY}%, ${minorX}% ${minorY}%, ${minorX}% ${minorY}%`,
      }}
    />
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
  return <ComponentIcon className="h-3 w-3 text-muted-foreground shrink-0" />;
}

function defaults(type: ComponentType, canvasW: number): Partial<PageComponent> {
  switch (type) {
    case "header": return { width: Math.round(canvasW * 0.35), height: 70, content: "Heading", textStyle: "heading", fontSize: 56, fontFamily: "system-ui, -apple-system, sans-serif", fontWeight: 700, lineHeight: 1.15, letterSpacing: 0, fontColor: "#111111", bgColor: "transparent", italic: false, textAlign: "center", textEffect: "none", effectStrength: 30, opacity: 100, rotation: 0 };
    case "text":   return { width: Math.round(canvasW * 0.28), height: 96, content: "Edit text", textStyle: "body", fontSize: 28, fontFamily: "system-ui, -apple-system, sans-serif", fontWeight: 400, lineHeight: 1.4, letterSpacing: 0, fontColor: "#111111", bgColor: "transparent", italic: false, textAlign: "left", textEffect: "none", effectStrength: 30, opacity: 100, rotation: 0 };
    case "shape":  return { width: Math.round(canvasW * 0.12), height: 120, bgColor: "#3b82f6", borderRadius: 8, opacity: 100, shapeType: "rectangle", rotation: 0 };
    case "image":  return { width: Math.round(canvasW * 0.18), height: 180, bgColor: "#e5e7eb", borderRadius: 4, rotation: 0 };
    case "button": return { width: Math.round(canvasW * 0.1), height: 56, content: "Click me", fontSize: 16, fontFamily: "system-ui, -apple-system, sans-serif", fontWeight: 600, fontColor: "#ffffff", bgColor: "#3b82f6", borderRadius: 8, buttonStyle: "solid", borderColor: "#3b82f6", hoverBgColor: "#2563eb", hoverFontColor: "#ffffff", buttonAction: { type: "url", value: "" }, rotation: 0 };
    case "carousel": return { width: Math.round(canvasW * 0.6), height: 220, bgColor: "transparent", borderRadius: 12, opacity: 100, rotation: 0, carouselItems: [], carouselItemWidth: 160, carouselZoom: 1.25 };
    case "icon": return { width: 64, height: 64, fontColor: "#111111", fontSize: 32, opacity: 100, rotation: 0, iconName: "cart" };
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

function textStylePatch(style: TextStyle): Partial<PageComponent> {
  if (style === "heading") return { textStyle: style, fontSize: 64, fontWeight: 800, lineHeight: 1.1 };
  if (style === "subheading") return { textStyle: style, fontSize: 36, fontWeight: 600, lineHeight: 1.25 };
  return { textStyle: style, fontSize: 20, fontWeight: 400, lineHeight: 1.45 };
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
        <input type="color" value={value} onChange={(e) => { onChange(e.target.value); setHex(e.target.value); }} className="h-6 w-7 rounded cursor-pointer border p-0.5 shrink-0" />
        <input type="text" value={hex} onChange={(e) => setHex(e.target.value)} onBlur={(e) => commit(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") commit((e.target as HTMLInputElement).value); }} className="flex-1 h-6 text-[11px] border rounded px-1.5 font-mono min-w-0" maxLength={7} placeholder="#000000" />
      </div>
    </div>
  );
}

// ── Font picker with real per-font preview (native <select> can't render this reliably) ──

function FontSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDocDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocDown);
    return () => document.removeEventListener("mousedown", onDocDown);
  }, []);

  const current = FONT_FAMILIES.find((f) => f.value === value) ?? FONT_FAMILIES[0];

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
        <div className="absolute z-40 mt-1 left-0 right-0 max-h-52 overflow-y-auto rounded-md border bg-white shadow-lg">
          {FONT_FAMILIES.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => { onChange(f.value); setOpen(false); }}
              className={`block w-full text-left px-2 py-1 text-[13px] hover:bg-muted ${f.value === value ? "bg-muted" : ""}`}
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

// ── Preview canvas ─────────────────────────────────────────────────────────────

function PreviewCanvas({ components, canvasW, canvasH }: { components: PageComponent[]; canvasW: number; canvasH: number }) {
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
        const btn = isBtn ? resolveButtonStyles(comp, isHovered) : null;
        return (
          <div key={comp.id} className="absolute"
            style={{ left: pct(comp.x, canvasW), top: pct(comp.y, canvasH), width: pct(comp.width, canvasW), height: pct(comp.height, canvasH), borderRadius: isBtn || isShape || isCarousel || isIcon ? 0 : (comp.borderRadius ?? 0), backgroundColor: isBtn || isShape || isCarousel || isIcon ? "transparent" : (comp.bgColor === "transparent" ? "transparent" : (comp.bgColor ?? "transparent")), transform: `rotate(${comp.rotation ?? 0}deg)`, transformOrigin: "center" }}
            onMouseEnter={() => isBtn && setHoveredId(comp.id)} onMouseLeave={() => isBtn && setHoveredId(null)}
          >
            {(comp.type === "text" || comp.type === "header") && (
              <div className="w-full h-full flex items-center overflow-hidden px-1"
                style={{ fontSize: `calc(${comp.fontSize ?? 16}px * (${ref.current?.clientWidth ?? canvasW} / ${canvasW}))`, fontFamily: comp.fontFamily ?? "system-ui, -apple-system, sans-serif", fontWeight: comp.fontWeight ?? (comp.bold ? 700 : 400), fontStyle: comp.italic ? "italic" : "normal", lineHeight: comp.lineHeight ?? 1.4, letterSpacing: `${comp.letterSpacing ?? 0}px`, color: comp.fontColor ?? "#111", opacity: (comp.opacity ?? 100) / 100, textAlign: comp.textAlign ?? "left", justifyContent: comp.textAlign === "center" ? "center" : comp.textAlign === "right" ? "flex-end" : "flex-start" }}>
                <span style={{ whiteSpace: "pre-wrap", wordBreak: "break-word", ...textEffectStyle(comp) }}>{comp.content}</span>
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

export function PageEditor({ slug, label }: PageEditorProps) {
  const router = useRouter();
  const [view, setView] = useState<ViewMode>("desktop");
  const [desktopComponents, setDesktopComponents] = useState<PageComponent[]>([]);
  const [mobileComponents, setMobileComponents] = useState<PageComponent[]>([]);
  const [desktopHeight, setDesktopHeight] = useState(DEFAULT_DESKTOP_H);
  const [mobileHeight, setMobileHeight] = useState(DEFAULT_MOBILE_H);
  const [pageLabel, setPageLabel] = useState(label ?? "");
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(label ?? "");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [marquee, setMarquee] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
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
  const [showPreview, setShowPreview] = useState(false);
  const [showGuides, setShowGuides] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  const [gridSize, setGridSize] = useState(50);
  const [openTool, setOpenTool] = useState<ComponentType | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragLayerId, setDragLayerId] = useState<string | null>(null);
  const [dragOverLayerId, setDragOverLayerId] = useState<string | null>(null);
  const [layersOpen, setLayersOpen] = useState(false);
  const [imageSizePreset, setImageSizePreset] = useState<ImageSizePreset>("landscape");
  const [categoryOptions, setCategoryOptions] = useState<CategoryOption[] | null>(null);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const isHomePage = slug === "home";

  const canvasW = view === "desktop" ? DESKTOP_W : MOBILE_W;
  const canvasH = view === "desktop" ? desktopHeight : mobileHeight;
  const components = view === "desktop" ? desktopComponents : mobileComponents;

  // Mouse drag refs
  const dragRef        = useRef<{ ids: string[]; startX: number; startY: number; origins: Map<string, { x: number; y: number; width: number; height: number }> } | null>(null);
  const resizeRef      = useRef<{ ids: string[]; corner: ResizeCorner; startX: number; startY: number; bbox: { x: number; y: number; width: number; height: number }; origins: Map<string, { x: number; y: number; width: number; height: number }> } | null>(null);
  const rotateRef      = useRef<{ id: string; centerX: number; centerY: number; startAngle: number; startRotation: number } | null>(null);
  const heightDragRef  = useRef<{ startY: number; origH: number } | null>(null);
  const marqueeStartRef = useRef<{ x: number; y: number } | null>(null);
  const canvasRef      = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Always-current refs
  const updateCompRef   = useRef<(id: string, patch: Partial<PageComponent>) => void>(() => {});
  const deleteCompRef   = useRef<(ids: string[]) => void>(() => {});
  const pasteCompRef    = useRef<(comps: PageComponent[]) => void>(() => {});
  const canvasWRef      = useRef(canvasW);
  const canvasHRef      = useRef(canvasH);
  const setHeightRef    = useRef<(h: number) => void>(() => {});
  const selectedIdsRef  = useRef<string[]>([]);
  const viewRef         = useRef<ViewMode>("desktop");
  const compsRef        = useRef<{ desktop: PageComponent[]; mobile: PageComponent[] }>({ desktop: [], mobile: [] });
  const clipboardRef    = useRef<PageComponent[] | null>(null);
  const syncedSignatureRef = useRef("");
  const versionSignatureRef = useRef("");

  updateCompRef.current = (id, patch) => {
    const setter = view === "desktop" ? setDesktopComponents : setMobileComponents;
    setter((prev) => prev.map((c) => {
      if (c.id !== id) return c;
      const merged = { ...c, ...patch };
      const bounds = clampToCanvas(merged.x, merged.y, merged.width, merged.height, canvasWRef.current, canvasHRef.current, merged.rotation ?? 0);
      return { ...merged, ...bounds };
    }));
  };
  deleteCompRef.current = (ids) => {
    if (view === "desktop") setDesktopComponents((prev) => prev.filter((c) => !ids.includes(c.id)));
    else setMobileComponents((prev) => prev.filter((c) => !ids.includes(c.id)));
    setSelectedIds((prev) => prev.filter((id) => !ids.includes(id)));
  };
  pasteCompRef.current = (comps) => {
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
    if (view === "desktop") setDesktopComponents((prev) => [...prev, ...newComps]);
    else setMobileComponents((prev) => [...prev, ...newComps]);
    setSelectedIds(newComps.map((c) => c.id));
  };
  canvasWRef.current      = canvasW;
  canvasHRef.current      = canvasH;
  setHeightRef.current    = (h) => { if (view === "desktop") setDesktopHeight(h); else setMobileHeight(h); };
  selectedIdsRef.current  = selectedIds;
  viewRef.current         = view;
  compsRef.current        = { desktop: desktopComponents, mobile: mobileComponents };

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

  // ── Load ────────────────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    setLoading(true); setSelectedIds([]);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10_000); // 10s timeout
    fetch(`/api/pages/${encodeURIComponent(slug)}`, { signal: controller.signal })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((d) => {
        if (cancelled) return;
        if (d?.desktop) {
          const dH = typeof d.desktop.height === "number" ? d.desktop.height : DEFAULT_DESKTOP_H;
          const mH = typeof d.mobile?.height === "number" ? d.mobile.height : DEFAULT_MOBILE_H;
          const dComps: PageComponent[] = Array.isArray(d.desktop.components) ? d.desktop.components : [];
          const mComps: PageComponent[] = Array.isArray(d.mobile?.components) ? d.mobile.components : [];
          setDesktopComponents(dComps.map((c) => ({ ...c, ...clampToCanvas(c.x, c.y, c.width, c.height, DESKTOP_W, dH, c.rotation ?? 0) })));
          setDesktopHeight(dH);
          setMobileComponents(mComps.map((c) => ({ ...c, ...clampToCanvas(c.x, c.y, c.width, c.height, MOBILE_W, mH, c.rotation ?? 0) })));
          setMobileHeight(mH);
        } else if (Array.isArray(d?.components)) {
          const comps: PageComponent[] = d.components;
          setDesktopComponents(comps.map((c) => ({ ...c, ...clampToCanvas(c.x, c.y, c.width, c.height, DESKTOP_W, DEFAULT_DESKTOP_H, c.rotation ?? 0) })));
        }
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
        const list = compsRef.current[viewRef.current === "desktop" ? "desktop" : "mobile"];
        clipboardRef.current = list.filter((c) => selectedIdsRef.current.includes(c.id));
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "v" && clipboardRef.current) {
        pasteCompRef.current(clipboardRef.current);
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
    const canvas = canvasRef.current;
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

  function addComponent(type: ComponentType, patch?: Partial<PageComponent>) {
    const base: PageComponent = { id: uid(), type, x: 0, y: 0, ...defaults(type, canvasW), ...(patch ?? {}) } as PageComponent;
    const center = getVisibleCenter();
    const comp = { ...base, ...clampToCanvas(center.x - base.width / 2, center.y - base.height / 2, base.width, base.height, canvasW, canvasH, base.rotation ?? 0) };
    if (view === "desktop") setDesktopComponents((prev) => [...prev, comp]);
    else setMobileComponents((prev) => [...prev, comp]);
    setSelectedIds([comp.id]);
  }
  function addShape(shapeType: ShapeType) {
    const size = shapeSize(shapeType, canvasW);
    const base: PageComponent = {
      id: uid(), type: "shape", x: 0, y: 0, ...size,
      bgColor: "#3b82f6", borderRadius: shapeHasRadius(shapeType) ? 8 : 0,
      opacity: 100, rotation: 0, shapeType,
    };
    const center = getVisibleCenter();
    const comp = { ...base, ...clampToCanvas(center.x - base.width / 2, center.y - base.height / 2, base.width, base.height, canvasW, canvasH, base.rotation ?? 0) };
    if (view === "desktop") setDesktopComponents((prev) => [...prev, comp]);
    else setMobileComponents((prev) => [...prev, comp]);
    setSelectedIds([comp.id]);
  }
  function addImage(mode: ImageMode) {
    const preset = IMAGE_SIZES.find((s) => s.id === imageSizePreset) ?? IMAGE_SIZES[2];
    const width = Math.round(canvasW * 0.22);
    const height = Math.max(40, Math.round(width / preset.ratio));
    const base: PageComponent = {
      id: uid(), type: "image", x: 0, y: 0, width, height,
      bgColor: "#e5e7eb", borderRadius: 8, opacity: 100, rotation: 0,
      imageMode: mode, images: mode === "slideshow" ? [] : undefined,
    };
    const center = getVisibleCenter();
    const comp = { ...base, ...clampToCanvas(center.x - base.width / 2, center.y - base.height / 2, base.width, base.height, canvasW, canvasH, base.rotation ?? 0) };
    if (view === "desktop") setDesktopComponents((prev) => [...prev, comp]);
    else setMobileComponents((prev) => [...prev, comp]);
    setSelectedIds([comp.id]);
  }
  function addCarousel() {
    const base: PageComponent = { id: uid(), type: "carousel", x: 0, y: 0, ...defaults("carousel", canvasW) } as PageComponent;
    const center = getVisibleCenter();
    const comp = { ...base, ...clampToCanvas(center.x - base.width / 2, center.y - base.height / 2, base.width, base.height, canvasW, canvasH, base.rotation ?? 0) };
    if (view === "desktop") setDesktopComponents((prev) => [...prev, comp]);
    else setMobileComponents((prev) => [...prev, comp]);
    setSelectedIds([comp.id]);
  }
  function addIcon(iconName: string) {
    const base: PageComponent = { id: uid(), type: "icon", x: 0, y: 0, ...defaults("icon", canvasW), iconName } as PageComponent;
    const center = getVisibleCenter();
    const comp = { ...base, ...clampToCanvas(center.x - base.width / 2, center.y - base.height / 2, base.width, base.height, canvasW, canvasH, base.rotation ?? 0) };
    if (view === "desktop") setDesktopComponents((prev) => [...prev, comp]);
    else setMobileComponents((prev) => [...prev, comp]);
    setSelectedIds([comp.id]);
  }
  function addMarketWidget(id: MarketWidgetId) {
    const center = getVisibleCenter();
    const widget = buildMarketWidget(id, center, canvasW, canvasH).map((c) => ({
      ...c,
      ...clampToCanvas(c.x, c.y, c.width, c.height, canvasW, canvasH, c.rotation ?? 0),
    }));
    if (view === "desktop") setDesktopComponents((prev) => [...prev, ...widget]);
    else setMobileComponents((prev) => [...prev, ...widget]);
    setSelectedIds(widget.map((c) => c.id));
  }
  function updateComp(id: string, patch: Partial<PageComponent>) { updateCompRef.current(id, patch); }
  function deleteComp(ids: string[]) { deleteCompRef.current(ids); }
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
  function duplicateComp(comp: PageComponent) {
    pasteCompRef.current([comp]);
  }
  function duplicateInPlace(comp: PageComponent) {
    const copy: PageComponent = { ...comp, id: uid(), groupId: undefined, groupName: undefined, groupLink: undefined };
    if (view === "desktop") setDesktopComponents((prev) => [...prev, copy]);
    else setMobileComponents((prev) => [...prev, copy]);
    setSelectedIds([copy.id]);
    setContextMenu(null);
  }
  // Stacking order == array order (later elements render on top, no explicit z-index).
  // "Forward" nudges a component one slot later in the array (toward the top of the
  // stack); "backward" nudges it one slot earlier — mirrors typical design-tool controls.
  function moveComponentOrder(id: string, direction: "forward" | "backward") {
    const setter = view === "desktop" ? setDesktopComponents : setMobileComponents;
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
  function reorderComponents(fromId: string, toId: string) {
    const setter = view === "desktop" ? setDesktopComponents : setMobileComponents;
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
  function updateGroup(groupId: string, patch: { groupName?: string; groupLink?: string }) {
    const setter = view === "desktop" ? setDesktopComponents : setMobileComponents;
    setter((prev) => prev.map((c) => (c.groupId === groupId ? { ...c, ...patch } : c)));
  }
  function groupSelected() {
    const gid = uid();
    const setter = view === "desktop" ? setDesktopComponents : setMobileComponents;
    setter((prev) => prev.map((c) => (selectedIds.includes(c.id) ? { ...c, groupId: gid } : c)));
    setContextMenu(null);
  }
  function ungroupSelected() {
    const setter = view === "desktop" ? setDesktopComponents : setMobileComponents;
    setter((prev) => prev.map((c) => (selectedIds.includes(c.id) ? { ...c, groupId: undefined, groupName: undefined, groupLink: undefined } : c)));
    setContextMenu(null);
  }
  function handleContextMenu(e: React.MouseEvent, comp: PageComponent) {
    e.preventDefault(); e.stopPropagation();
    setSelectedIds((prev) => {
      if (prev.includes(comp.id)) return prev;
      const list = compsRef.current[viewRef.current === "desktop" ? "desktop" : "mobile"];
      return comp.groupId ? list.filter((c) => c.groupId === comp.groupId).map((c) => c.id) : [comp.id];
    });
    setContextMenu({ x: e.clientX, y: e.clientY });
  }

  // ── Drag / resize / rotate start ───────────────────────────────────────────
  const onDragStart = useCallback((e: React.MouseEvent, id: string) => {
    e.preventDefault(); e.stopPropagation();
    const list = compsRef.current[viewRef.current === "desktop" ? "desktop" : "mobile"];
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
    // Spacing guides only make sense against a single moving box, not a multi/group drag.
    setDraggingId(idsToMove.length === 1 ? idsToMove[0] : null);

    const origins = new Map(idsToMove.map((mid) => {
      const c = list.find((cc) => cc.id === mid)!;
      return [mid, { x: c.x, y: c.y, width: c.width, height: c.height }];
    }));
    dragRef.current = { ids: idsToMove, startX: e.clientX, startY: e.clientY, origins };
  }, []);

  const onResizeStart = useCallback((e: React.MouseEvent, ids: string[], corner: ResizeCorner = "br") => {
    e.preventDefault(); e.stopPropagation();
    const list = compsRef.current[viewRef.current === "desktop" ? "desktop" : "mobile"];
    const comps = ids.map((id) => list.find((c) => c.id === id)).filter((c): c is PageComponent => !!c);
    if (comps.length === 0) return;
    const minX = Math.min(...comps.map((c) => c.x));
    const minY = Math.min(...comps.map((c) => c.y));
    const maxX = Math.max(...comps.map((c) => c.x + c.width));
    const maxY = Math.max(...comps.map((c) => c.y + c.height));
    const bbox = { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
    const origins = new Map(comps.map((c) => [c.id, { x: c.x, y: c.y, width: c.width, height: c.height }]));
    resizeRef.current = { ids, corner, startX: e.clientX, startY: e.clientY, bbox, origins };
  }, []);

  const onRotateStart = useCallback((e: React.MouseEvent, id: string) => {
    e.preventDefault(); e.stopPropagation();
    const canvas = canvasRef.current; if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const comp = compsRef.current[viewRef.current === "desktop" ? "desktop" : "mobile"].find((c) => c.id === id);
    if (!comp) return;
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

  const onHeightDragStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    heightDragRef.current = { startY: e.clientY, origH: viewRef.current === "desktop" ? desktopHeight : mobileHeight };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [desktopHeight, mobileHeight]);

  const onCanvasMouseDown = useCallback((e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
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
      const scale = canvasRef.current ? canvasRef.current.clientWidth / canvasWRef.current : 1;
      if (dragRef.current) {
        // Boundary clamping happens centrally in updateCompRef, so the raw delta is enough here.
        const { ids, startX, startY, origins } = dragRef.current;
        const dx = (e.clientX - startX) / scale;
        const dy = (e.clientY - startY) / scale;
        ids.forEach((id) => {
          const o = origins.get(id);
          if (!o) return;
          updateCompRef.current(id, { x: o.x + dx, y: o.y + dy });
        });
      }
      if (resizeRef.current) {
        const { ids, corner, startX, startY, bbox, origins } = resizeRef.current;
        const dx = (e.clientX - startX) / scale;
        const dy = (e.clientY - startY) / scale;
        const { x: bx, y: by, width: bw, height: bh } = bbox;
        let newBW = bw, newBH = bh, newBX = bx, newBY = by;
        if (corner === "br") { newBW = bw + dx; newBH = bh + dy; }
        else if (corner === "bl") { newBW = bw - dx; newBH = bh + dy; newBX = bx + dx; }
        else if (corner === "tr") { newBW = bw + dx; newBH = bh - dy; newBY = by + dy; }
        else { newBW = bw - dx; newBH = bh - dy; newBX = bx + dx; newBY = by + dy; }
        newBW = Math.max(20, newBW);
        newBH = Math.max(20, newBH);
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
        const { startY, origH } = heightDragRef.current;
        setHeightRef.current(Math.max(400, origH + (e.clientY - startY) / scale));
      }
      if (marqueeStartRef.current) {
        const rect = canvasRef.current?.getBoundingClientRect();
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
      if (marqueeStartRef.current) {
        setMarquee((box) => {
          if (box && (box.w > 3 || box.h > 3)) {
            const list = compsRef.current[viewRef.current === "desktop" ? "desktop" : "mobile"];
            const hits = list.filter((c) =>
              c.x < box.x + box.w && c.x + c.width > box.x && c.y < box.y + box.h && c.y + c.height > box.y
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
  async function uploadImage(file: File): Promise<string | null> {
    setUploading(true);
    try {
      const fd = new FormData(); fd.append("file", file);
      const res = await fetch("/api/page-config/upload", { method: "POST", body: fd });
      return (await res.json()).url ?? null;
    } catch { return null; } finally { setUploading(false); }
  }

  // ── Rename ──────────────────────────────────────────────────────────────────
  function startRename() { setNameInput(pageLabel); setEditingName(true); setTimeout(() => nameInputRef.current?.select(), 0); }

  async function commitRename() {
    setEditingName(false);
    const name = nameInput.trim();
    if (!name || name === pageLabel) return;
    setPageLabel(name);
    await fetch(`/api/pages/${encodeURIComponent(slug)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ config: { name, desktop: { components: desktopComponents, height: desktopHeight }, mobile: { components: mobileComponents, height: mobileHeight } } }),
    });
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

  const configPayload = {
    name: pageLabel || label || slug,
    desktop: { components: desktopComponents, height: desktopHeight },
    mobile: { components: mobileComponents, height: mobileHeight },
  };
  const configSignature = JSON.stringify(configPayload);

  function captureVersion(reason = "Manual checkpoint") {
    if (versionSignatureRef.current === configSignature) return;
    versionSignatureRef.current = configSignature;
    setVersions((prev) => [{
      id: uid(),
      label: reason,
      createdAt: new Date().toISOString(),
      desktop: { components: desktopComponents.map((c) => ({ ...c })), height: desktopHeight },
      mobile: { components: mobileComponents.map((c) => ({ ...c })), height: mobileHeight },
    }, ...prev].slice(0, 6));
  }

  function restoreVersion(version: VersionSnapshot) {
    setDesktopComponents(version.desktop.components.map((c) => ({ ...c })));
    setDesktopHeight(version.desktop.height);
    setMobileComponents(version.mobile.components.map((c) => ({ ...c })));
    setMobileHeight(version.mobile.height);
    setSelectedIds([]);
    setSyncStatus("dirty");
    setChangeCount((n) => n + 1);
  }

  // ── Save ────────────────────────────────────────────────────────────────────
  // Ref-guarded (not just `disabled={saving}`) so a publish in flight can never be
  // re-triggered by a second click landing in the brief window before React re-renders.
  async function save() {
    if (savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    setSyncStatus("syncing");
    try {
      await fetch(`/api/pages/${encodeURIComponent(slug)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ config: configPayload }),
      });
      syncedSignatureRef.current = configSignature;
      setSyncStatus("synced");
      setLastSyncedAt(new Date());
      setChangeCount(0);
      captureVersion("Published version");
      setSaved(true); setTimeout(() => setSaved(false), 2500);
    } catch {
      setSyncStatus("error");
    } finally {
      setSaving(false);
      savingRef.current = false;
    }
  }

  useEffect(() => {
    if (loading) return;
    if (!syncedSignatureRef.current) {
      syncedSignatureRef.current = configSignature;
      versionSignatureRef.current = configSignature;
      return;
    }
    if (syncedSignatureRef.current === configSignature) return;
    setSyncStatus("dirty");
    setChangeCount((n) => n + 1);
    const versionTimer = window.setTimeout(() => captureVersion("Auto checkpoint"), 1200);
    const syncTimer = window.setTimeout(() => { void save(); }, 4000);
    return () => {
      window.clearTimeout(versionTimer);
      window.clearTimeout(syncTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [configSignature, loading]);

  // Publish from the preview overlay: save, then hold the overlay open just long
  // enough to show the "Published!" confirmation before dismissing it, so the
  // user has clear proof it went through exactly once instead of the overlay
  // just vanishing right when the request resolves.
  async function publishAndClose() {
    await save();
    setTimeout(() => setShowPreview(false), 700);
  }

  const sLabel = "text-[10px] text-muted-foreground block mb-0.5 uppercase tracking-wide";
  const displayLabel = pageLabel || label || slug;
  const syncLabel =
    syncStatus === "syncing" ? "Syncing to server" :
    syncStatus === "dirty" ? "Unsaved changes" :
    syncStatus === "error" ? "Sync failed" :
    syncStatus === "synced" ? "Server synced" :
    "Ready";

  // Shared header (type label + Delete) + Name/Link + W/H/Rotation fields, reused inside
  // each Add Component accordion so a selected component's settings live right there.
  function renderCommonFields(comp: PageComponent) {
    return (
      <>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold capitalize flex-1">
            {componentTypeLabel(comp.type)}
          </span>
          <Button variant="destructive" size="sm" className="h-6 px-2 gap-1 text-xs" onClick={() => deleteComp([comp.id])}>
            <Trash2 className="h-3 w-3" /> Delete
          </Button>
        </div>
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
      </>
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

  // ── JSX ─────────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full">
      {/* Preview overlay */}
      {showPreview && (
        <div className="fixed inset-0 z-50 flex flex-col bg-background">
          <div className="flex items-center gap-3 px-5 py-3 border-b bg-background shrink-0">
            <div className="flex items-center gap-2">
              {view === "desktop" ? <Monitor className="h-4 w-4 text-muted-foreground" /> : <Smartphone className="h-4 w-4 text-muted-foreground" />}
              <span className="font-semibold text-sm">Live Preview — {displayLabel} · {view === "desktop" ? "Desktop" : "Mobile"}</span>
              <span className="text-xs text-muted-foreground">({canvasW} × {Math.round(canvasH)} px)</span>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setShowPreview(false)}>
                <Pencil className="h-3.5 w-3.5" /> Back to Edit
              </Button>
              <Button size="sm" className="gap-1.5" disabled={saving || saved} onClick={publishAndClose}>
                {saving ? "Publishing…" : saved ? <><Check className="h-3.5 w-3.5" /> Published!</> : <><Check className="h-3.5 w-3.5" /> Publish</>}
              </Button>
            </div>
          </div>
          <div className="flex-1 overflow-auto bg-gray-100 p-4">
            <div style={view === "mobile" ? { maxWidth: 375, margin: "0 auto" } : undefined}>
              <PreviewCanvas components={components} canvasW={canvasW} canvasH={canvasH} />
            </div>
            <p className="text-center text-xs text-muted-foreground mt-3 select-none">Exact preview — click "Publish" to make it live.</p>
          </div>
        </div>
      )}

      {/* Main editor */}
      <div className="flex flex-col h-full min-h-0">

        {/* Top bar */}
        <div className="flex flex-wrap items-center gap-2 shrink-0 pb-3">

          {/* Inline-editable page name */}
          {editingName ? (
            <input
              ref={nameInputRef}
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              onBlur={commitRename}
              onKeyDown={(e) => { if (e.key === "Enter") commitRename(); if (e.key === "Escape") setEditingName(false); }}
              className="text-xl font-semibold bg-transparent border-b border-black outline-none w-48"
            />
          ) : (
            <button onClick={startRename} className="flex items-center gap-1.5 group">
              <h1 className="text-lg sm:text-xl font-semibold">{displayLabel}</h1>
              <Pencil className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          )}

          {/* Desktop/Mobile toggle */}
          <div className="flex items-center rounded-lg border overflow-hidden ml-0 sm:ml-1">
            <button onClick={() => { setSelectedIds([]); setView("desktop"); }}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-sm transition-colors ${view === "desktop" ? "bg-black text-white" : "hover:bg-muted"}`}>
              <Monitor className="h-3.5 w-3.5" /><span className="hidden sm:inline">Desktop</span>
            </button>
            <button onClick={() => { setSelectedIds([]); setView("mobile"); }}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-sm transition-colors ${view === "mobile" ? "bg-black text-white" : "hover:bg-muted"}`}>
              <Smartphone className="h-3.5 w-3.5" /><span className="hidden sm:inline">Mobile</span>
            </button>
          </div>

          {/* Margin guides / ruler toggle */}
          <button
            type="button"
            onClick={() => setShowGuides((v) => !v)}
            title="Show/hide margin guides and spacing rulers"
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg border text-sm transition-colors ${showGuides ? "bg-black text-white border-black" : "hover:bg-muted"}`}
          >
            <Ruler className="h-3.5 w-3.5" /><span className="hidden sm:inline">Guides</span>
          </button>

          {/* Grid overlay toggle — editor-only alignment aid, never published */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setShowGrid((v) => !v)}
              title="Show/hide alignment grid (editor only — never appears on the published page)"
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg border text-sm transition-colors ${showGrid ? "bg-black text-white border-black" : "hover:bg-muted"}`}
            >
              <Grid3x3 className="h-3.5 w-3.5" /><span className="hidden sm:inline">Grid</span>
            </button>
            {showGrid && (
              <div className="flex items-center gap-1 rounded-lg border px-2 py-1.5">
                <label className="text-[10px] text-muted-foreground uppercase tracking-wide">Size</label>
                <input
                  type="number" min="5" max="500" step="5" value={gridSize}
                  onChange={(e) => setGridSize(Math.max(5, +e.target.value || 5))}
                  className="w-12 h-5 text-xs border rounded px-1 bg-background"
                />
              </div>
            )}
          </div>

          <div className="ml-auto flex flex-wrap items-center gap-2">
            {saved && <span className="text-xs text-green-600 font-medium flex items-center gap-1"><Check className="h-3.5 w-3.5" /> Published</span>}

            {/* Delete page — not shown for home page */}
            {!isHomePage && !confirmDelete && (
              <Button variant="outline" size="sm" className="gap-1.5 text-destructive hover:bg-destructive/10 border-destructive/30"
                onClick={() => setConfirmDelete(true)}>
                <Trash2 className="h-3.5 w-3.5" /> Delete Page
              </Button>
            )}
            {!isHomePage && confirmDelete && (
              <div className="flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/5 px-3 py-1.5">
                <span className="text-xs text-destructive font-medium">Delete "{displayLabel}"?</span>
                <button onClick={deletePage} disabled={deleting}
                  className="text-xs px-2 py-0.5 rounded bg-destructive text-white disabled:opacity-50">
                  {deleting ? "Deleting…" : "Yes, delete"}
                </button>
                <button onClick={() => setConfirmDelete(false)} className="text-xs px-2 py-0.5 rounded border hover:bg-muted">
                  Cancel
                </button>
              </div>
            )}

            <Button variant="outline" className="gap-2" onClick={() => setShowPreview(true)}>
              <Eye className="h-4 w-4" /> Preview &amp; Publish
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 pb-3 shrink-0">
          <div className="rounded-lg border bg-background px-3 py-2">
            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-muted-foreground"><Cloud className="h-3 w-3" /> Sync</div>
            <p className={`mt-1 text-sm font-semibold ${syncStatus === "error" ? "text-destructive" : syncStatus === "dirty" ? "text-amber-700" : "text-foreground"}`}>{syncLabel}</p>
          </div>
          <div className="rounded-lg border bg-background px-3 py-2">
            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-muted-foreground"><History className="h-3 w-3" /> Versions</div>
            <p className="mt-1 text-sm font-semibold">{versions.length} checkpoint{versions.length === 1 ? "" : "s"}</p>
          </div>
          <div className="rounded-lg border bg-background px-3 py-2">
            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-muted-foreground"><Activity className="h-3 w-3" /> Changes</div>
            <p className="mt-1 text-sm font-semibold">{changeCount === 0 ? "Clean" : `${changeCount} tracked`}</p>
          </div>
          <div className="rounded-lg border bg-background px-3 py-2">
            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-muted-foreground"><ShieldCheck className="h-3 w-3" /> A11y</div>
            <p className="mt-1 text-sm font-semibold">Brand-safe contrast</p>
          </div>
        </div>

        {/* Canvas + right panel */}
        <div className="flex flex-col lg:flex-row flex-1 min-h-0 border rounded-lg overflow-hidden">

          {/* Canvas (scrollable) */}
          <div ref={scrollContainerRef} className="flex-1 overflow-auto bg-gray-100 p-3 min-w-0 min-h-[44vh]">
            <div className="mx-auto" style={{ width: "100%", maxWidth: showGuides ? canvasW + RULER_SIZE : canvasW }}>

              {/* Top ruler — outside the canvas border */}
              {showGuides && (
                <div className="flex">
                  <div style={{ width: RULER_SIZE, height: RULER_SIZE }} className="shrink-0 bg-blue-50 border-b border-r border-blue-200" />
                  <div className="relative flex-1 min-w-0" style={{ height: RULER_SIZE }}>
                    <TopRuler canvasW={canvasW} />
                  </div>
                </div>
              )}

              <div className="flex">
                {/* Left ruler — outside the canvas border */}
                {showGuides && (
                  <div className="relative shrink-0" style={{ width: RULER_SIZE }}>
                    <LeftRuler canvasH={canvasH} />
                  </div>
                )}

                <div
                  ref={canvasRef}
                  className="relative bg-white shadow-sm select-none flex-1 min-w-0"
                  style={{ aspectRatio: `${canvasW} / ${canvasH}` }}
                  onMouseDown={onCanvasMouseDown}
                >
              {loading && <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">Loading…</div>}
              {showGrid && <GridOverlay canvasW={canvasW} canvasH={canvasH} gridSize={gridSize} />}
              {draggingId && (() => {
                const dragged = components.find((c) => c.id === draggingId);
                if (!dragged) return null;
                const guides = computeSpacingGuides(dragged, components.filter((c) => c.id !== draggingId));
                return guides.length > 0 ? <SpacingGuides guides={guides} canvasW={canvasW} canvasH={canvasH} /> : null;
              })()}
              {components.map((comp) => {
                const pct = (v: number, total: number) => `${(v / total) * 100}%`;
                const isSelected = selectedIds.includes(comp.id);
                const isSoleSelected = isSelected && selectedIds.length === 1;
                const isHovered = hoveredId === comp.id;
                const isBtn = comp.type === "button";
                const isShape = comp.type === "shape";
                const isCarousel = comp.type === "carousel";
                const isIcon = comp.type === "icon";
                const btn = isBtn ? resolveButtonStyles(comp, isHovered) : null;
                const rotation = comp.rotation ?? 0;

                return (
                  <div key={comp.id}
                    className={`absolute group ${isSoleSelected ? "ring-2 ring-blue-500" : isSelected ? "ring-1 ring-blue-400" : "hover:ring-1 hover:ring-blue-300"}`}
                    style={{ left: pct(comp.x, canvasW), top: pct(comp.y, canvasH), width: pct(comp.width, canvasW), height: pct(comp.height, canvasH), borderRadius: isBtn || isShape || isCarousel || isIcon ? 0 : (comp.borderRadius ?? 0), backgroundColor: isBtn || isShape || isCarousel || isIcon ? "transparent" : (comp.bgColor === "transparent" ? "transparent" : (comp.bgColor ?? "transparent")), transform: `rotate(${rotation}deg)`, transformOrigin: "center", cursor: "move" }}
                    onMouseDown={(e) => onDragStart(e, comp.id)}
                    onContextMenu={(e) => handleContextMenu(e, comp)}
                    onMouseEnter={() => isBtn && setHoveredId(comp.id)}
                    onMouseLeave={() => isBtn && setHoveredId(null)}
                  >
                    {(comp.type === "text" || comp.type === "header") && (
                      <div className="w-full h-full flex items-center overflow-hidden px-1"
                        style={{ fontSize: `calc(${comp.fontSize ?? 16}px * (${canvasRef.current?.clientWidth ?? canvasW} / ${canvasW}))`, fontFamily: comp.fontFamily ?? "system-ui, -apple-system, sans-serif", fontWeight: comp.fontWeight ?? (comp.bold ? 700 : 400), fontStyle: comp.italic ? "italic" : "normal", lineHeight: comp.lineHeight ?? 1.4, letterSpacing: `${comp.letterSpacing ?? 0}px`, color: comp.fontColor ?? "#111", opacity: (comp.opacity ?? 100) / 100, textAlign: comp.textAlign ?? "left", justifyContent: comp.textAlign === "center" ? "center" : comp.textAlign === "right" ? "flex-end" : "flex-start" }}>
                        <span style={{ whiteSpace: "pre-wrap", wordBreak: "break-word", ...textEffectStyle(comp) }}>{comp.content}</span>
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
                    {comp.type === "image" && <ImageBody comp={comp} placeholderClass="text-gray-400" />}
                    {isBtn && btn && (
                      <div className="w-full h-full flex items-center justify-center overflow-hidden"
                        style={{ borderRadius: comp.borderRadius ?? 8, backgroundColor: btn.bg, color: btn.color, border: btn.border, textDecoration: btn.isLink ? "underline" : "none", fontSize: `calc(${comp.fontSize ?? 16}px * (${canvasRef.current?.clientWidth ?? canvasW} / ${canvasW}))`, fontFamily: comp.fontFamily ?? "system-ui, -apple-system, sans-serif", fontWeight: comp.fontWeight ?? 600, transition: "background-color 0.15s, color 0.15s", pointerEvents: "none" }}>
                        {comp.content ?? "Button"}
                      </div>
                    )}
                    {isSoleSelected && (
                      <>
                        {(comp.type === "text" || comp.type === "header") && (
                          <>
                            <div
                              className="absolute z-30 flex items-center gap-1 rounded-md border bg-white px-1 py-1 shadow-sm"
                              style={{ top: -38, left: "50%", transform: "translateX(-50%)" }}
                              onMouseDown={(e) => e.stopPropagation()}
                            >
                              <button
                                type="button"
                                title="Duplicate"
                                className="flex h-6 w-6 items-center justify-center rounded hover:bg-muted"
                                onClick={(e) => { e.stopPropagation(); duplicateComp(comp); }}
                              >
                                <Copy className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                title="Delete"
                                className="flex h-6 w-6 items-center justify-center rounded text-destructive hover:bg-destructive/10"
                                onClick={(e) => { e.stopPropagation(); deleteComp([comp.id]); }}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                            <div
                              className="absolute z-30 flex items-center gap-1 rounded-md border bg-white px-1 py-1 shadow-sm"
                              style={{ bottom: -38, left: "50%", transform: "translateX(-50%)" }}
                              onMouseDown={(e) => e.stopPropagation()}
                            >
                              <button
                                type="button"
                                title="Rotate"
                                className="flex h-6 items-center gap-1 rounded px-1.5 text-[11px] hover:bg-muted"
                                onMouseDown={(e) => onRotateStart(e, comp.id)}
                              >
                                <RotateCcw className="h-3.5 w-3.5" /> Rotate
                              </button>
                              <button
                                type="button"
                                title="Drag"
                                className="flex h-6 items-center gap-1 rounded px-1.5 text-[11px] hover:bg-muted"
                                onMouseDown={(e) => onDragStart(e, comp.id)}
                              >
                                <Move className="h-3.5 w-3.5" /> Drag
                              </button>
                            </div>
                          </>
                        )}
                        {comp.type !== "text" && comp.type !== "header" && (
                          <div className="absolute cursor-grab z-20 flex flex-col items-center" style={{ top: 0, left: "50%", transform: "translateX(-50%) translateY(-100%)", paddingBottom: 2 }} onMouseDown={(e) => onRotateStart(e, comp.id)}>
                            <div className="w-2.5 h-2.5 rounded-full bg-purple-500 border-2 border-white shadow" />
                            <div style={{ width: 1, height: 8, backgroundColor: "#a855f7", opacity: 0.7 }} />
                          </div>
                        )}
                        {/* Resize handles */}
                        {isShape || isCarousel ? (
                          <>
                            <div className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-blue-500 rounded-full border-2 border-white shadow cursor-nwse-resize z-10" onMouseDown={(e) => onResizeStart(e, [comp.id], "tl")} />
                            <div className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-blue-500 rounded-full border-2 border-white shadow cursor-nesw-resize z-10" onMouseDown={(e) => onResizeStart(e, [comp.id], "tr")} />
                            <div className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-blue-500 rounded-full border-2 border-white shadow cursor-nesw-resize z-10" onMouseDown={(e) => onResizeStart(e, [comp.id], "bl")} />
                            <div className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-blue-500 rounded-full border-2 border-white shadow cursor-nwse-resize z-10" onMouseDown={(e) => onResizeStart(e, [comp.id], "br")} />
                          </>
                        ) : (
                          <div className="absolute bottom-0 right-0 w-3 h-3 bg-blue-500 cursor-se-resize z-10" style={{ borderRadius: "2px 0 2px 0" }} onMouseDown={(e) => onResizeStart(e, [comp.id])} />
                        )}
                      </>
                    )}
                  </div>
                );
              })}

              {/* Margin guides */}
              {showGuides && <MarginGuides canvasW={canvasW} canvasH={canvasH} />}

              {/* Multi/group selection bounding box + resize handles */}
              {selectedComps.length > 1 && (() => {
                const minX = Math.min(...selectedComps.map((c) => c.x));
                const minY = Math.min(...selectedComps.map((c) => c.y));
                const maxX = Math.max(...selectedComps.map((c) => c.x + c.width));
                const maxY = Math.max(...selectedComps.map((c) => c.y + c.height));
                const ids = selectedComps.map((c) => c.id);
                const pct = (v: number, total: number) => `${(v / total) * 100}%`;
                return (
                  <div className="absolute border-2 border-blue-500 pointer-events-none z-20"
                    style={{ left: pct(minX, canvasW), top: pct(minY, canvasH), width: pct(maxX - minX, canvasW), height: pct(maxY - minY, canvasH) }}>
                    <div className="absolute -top-6 left-0 text-[10px] bg-blue-500 text-white px-1.5 py-0.5 rounded whitespace-nowrap">
                      {selectionGroupId ? (selectedComps[0].groupName || "Group") : `${ids.length} selected`}
                    </div>
                    <div className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-blue-500 rounded-full border-2 border-white shadow cursor-nwse-resize pointer-events-auto" onMouseDown={(e) => onResizeStart(e, ids, "tl")} />
                    <div className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-blue-500 rounded-full border-2 border-white shadow cursor-nesw-resize pointer-events-auto" onMouseDown={(e) => onResizeStart(e, ids, "tr")} />
                    <div className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-blue-500 rounded-full border-2 border-white shadow cursor-nesw-resize pointer-events-auto" onMouseDown={(e) => onResizeStart(e, ids, "bl")} />
                    <div className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-blue-500 rounded-full border-2 border-white shadow cursor-nwse-resize pointer-events-auto" onMouseDown={(e) => onResizeStart(e, ids, "br")} />
                  </div>
                );
              })()}

              {/* Rubber-band marquee */}
              {marquee && (marquee.w > 1 || marquee.h > 1) && (
                <div className="absolute border border-blue-500 bg-blue-500/10 pointer-events-none z-30"
                  style={{ left: `${(marquee.x / canvasW) * 100}%`, top: `${(marquee.y / canvasH) * 100}%`, width: `${(marquee.w / canvasW) * 100}%`, height: `${(marquee.h / canvasH) * 100}%` }} />
              )}
                </div>
              </div>

              {/* Height drag handle */}
              <div className="mx-auto mt-0 flex items-center justify-center h-5 cursor-ns-resize group" style={{ width: "100%", maxWidth: canvasW }} onMouseDown={onHeightDragStart}>
                <div className="w-16 h-1.5 bg-gray-300 group-hover:bg-blue-400 rounded-full transition-colors" />
              </div>
              <p className="text-center text-xs text-muted-foreground mt-1 select-none">
                {canvasW} × {Math.round(canvasH)} px · drag to move · corner to resize · purple to rotate · Del · ⌘C/⌘V
              </p>
            </div>
          </div>

          {/* ── Right panel (fixed, locked alongside canvas) ── */}
          <div className="w-full lg:w-72 lg:max-w-72 shrink-0 border-t lg:border-t-0 lg:border-l bg-background flex flex-col overflow-hidden max-h-[48vh] lg:max-h-none">

            {/* Layers — collapsed by default; expands to list every component in
                stacking order (top = frontmost). Click to select, drag to reorder,
                chevrons nudge forward/backward. Click the header again to collapse. */}
            <div className="shrink-0 border-b px-3 py-2">
              <button
                type="button"
                onClick={() => setLayersOpen((o) => !o)}
                className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md border text-xs transition-colors text-left ${layersOpen ? "border-black bg-muted" : "border-gray-200 hover:bg-muted"}`}
              >
                <Layers className="h-3.5 w-3.5 text-muted-foreground shrink-0" /> Layers
                {components.length > 0 && <span className="text-muted-foreground">({components.length})</span>}
                <ChevronDown className={`h-3 w-3 ml-auto text-muted-foreground transition-transform ${layersOpen ? "rotate-180" : ""}`} />
              </button>
              {layersOpen && (
                <div className="mt-1.5 border rounded-md bg-muted/30 flex flex-col" style={{ maxHeight: 220 }}>
                  <div className="flex-1 min-h-0 overflow-y-auto p-1.5 flex flex-col gap-0.5">
                    {components.length === 0 && (
                      <p className="text-[11px] text-muted-foreground text-center py-3">No components yet</p>
                    )}
                    {[...components].reverse().map((comp) => {
                      const idx = components.findIndex((c) => c.id === comp.id);
                      const isFront = idx === components.length - 1;
                      const isBack = idx === 0;
                      const isSelected = selectedIds.includes(comp.id);
                      return (
                        <div
                          key={comp.id}
                          draggable
                          onDragStart={(e) => { setDragLayerId(comp.id); e.dataTransfer.effectAllowed = "move"; }}
                          onDragOver={(e) => { e.preventDefault(); if (dragOverLayerId !== comp.id) setDragOverLayerId(comp.id); }}
                          onDragLeave={() => setDragOverLayerId((id) => (id === comp.id ? null : id))}
                          onDrop={(e) => {
                            e.preventDefault();
                            if (dragLayerId && dragLayerId !== comp.id) reorderComponents(dragLayerId, comp.id);
                            setDragLayerId(null); setDragOverLayerId(null);
                          }}
                          onDragEnd={() => { setDragLayerId(null); setDragOverLayerId(null); }}
                          onClick={() => setSelectedIds([comp.id])}
                          className={`group flex items-center gap-1.5 rounded-md border px-1.5 py-1 text-xs cursor-pointer transition-colors bg-background ${
                            isSelected ? "bg-blue-50 border-blue-400" : "border-transparent hover:bg-muted"
                          } ${dragOverLayerId === comp.id && dragLayerId !== comp.id ? "border-dashed border-blue-500" : ""}`}
                        >
                          <GripVertical className="h-3 w-3 text-muted-foreground shrink-0 cursor-grab" />
                          {layerIcon(comp)}
                          <span className="truncate flex-1">{comp.name?.trim() || componentTypeLabel(comp.type)}</span>
                          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 shrink-0">
                            <button type="button" title="Bring forward" disabled={isFront}
                              onClick={(e) => { e.stopPropagation(); moveComponentOrder(comp.id, "forward"); }}
                              className="flex h-5 w-5 items-center justify-center rounded hover:bg-background disabled:opacity-30 disabled:cursor-not-allowed">
                              <ChevronUp className="h-3 w-3" />
                            </button>
                            <button type="button" title="Send backward" disabled={isBack}
                              onClick={(e) => { e.stopPropagation(); moveComponentOrder(comp.id, "backward"); }}
                              className="flex h-5 w-5 items-center justify-center rounded hover:bg-background disabled:opacity-30 disabled:cursor-not-allowed">
                              <ChevronDown className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="shrink-0 border-b px-3 py-2">
              <div className="flex items-center gap-2 mb-2">
                <Cloud className="h-3.5 w-3.5 text-muted-foreground" />
                <p className="text-xs font-semibold flex-1">Live Workflow</p>
                <span className={`text-[10px] font-semibold ${syncStatus === "error" ? "text-destructive" : syncStatus === "dirty" ? "text-amber-700" : "text-green-700"}`}>
                  {syncStatus === "syncing" ? "Syncing" : syncStatus === "dirty" ? "Draft" : syncStatus === "error" ? "Error" : "Live"}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {["Draft", "Preview", "Publish"].map((step, i) => (
                  <div key={step} className={`rounded-md border px-1.5 py-1 text-center ${i === 0 && syncStatus === "dirty" ? "bg-amber-50 border-amber-200" : i === 2 && syncStatus === "synced" ? "bg-green-50 border-green-200" : "bg-background"}`}>
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

            <div className="shrink-0 border-b px-3 py-2">
              <div className="flex items-center gap-2 mb-2">
                <ComponentIcon className="h-3.5 w-3.5 text-muted-foreground" />
                <p className="text-xs font-semibold">Market Widgets</p>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {MARKET_WIDGETS.map((widget) => (
                  <button
                    key={widget.id}
                    type="button"
                    onClick={() => addMarketWidget(widget.id)}
                    className="rounded-md border bg-background px-2 py-2 text-left hover:border-black hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center gap-1.5">
                      <widget.icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className="text-[11px] font-semibold truncate">{widget.label}</span>
                    </div>
                    <p className="mt-1 text-[10px] text-muted-foreground truncate">{widget.hint}</p>
                  </button>
                ))}
              </div>
            </div>

            {versions.length > 0 && (
              <div className="shrink-0 border-b px-3 py-2">
                <div className="flex items-center gap-2 mb-2">
                  <RotateCw className="h-3.5 w-3.5 text-muted-foreground" />
                  <p className="text-xs font-semibold">Version Control</p>
                </div>
                <div className="flex flex-col gap-1.5 max-h-28 overflow-y-auto pr-0.5">
                  {versions.map((version) => (
                    <button
                      key={version.id}
                      type="button"
                      onClick={() => restoreVersion(version)}
                      className="flex items-center gap-2 rounded-md border bg-background px-2 py-1.5 text-left hover:bg-muted"
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

            {/* Add Component — a selected component's editing settings appear inline,
                right inside its own type's section, instead of in a separate panel. */}
            <div className="flex-1 overflow-y-auto p-3">
              <p className={sLabel + " mb-2"}>Add Component</p>
              <div className="flex flex-col gap-1.5">

                {/* Text */}
                <div>
                  <button type="button" onClick={() => setOpenTool(openTool === "text" ? null : "text")}
                    className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md border text-xs transition-colors text-left ${openTool === "text" ? "border-black bg-muted" : "border-gray-200 hover:bg-muted"}`}>
                    <Type className="h-3.5 w-3.5 text-muted-foreground shrink-0" /> Text
                    <ChevronDown className={`h-3 w-3 ml-auto text-muted-foreground transition-transform ${openTool === "text" ? "rotate-180" : ""}`} />
                  </button>
                  {openTool === "text" && (
                    <div className="mt-1 p-1.5 border rounded-md bg-muted/30">
                      {selectedComp && (selectedComp.type === "text" || selectedComp.type === "header") ? (
                        <div className="flex flex-col gap-2.5">
                          {renderCommonFields(selectedComp)}
                          <div>
                            <label className={sLabel}>Edit text</label>
                            <textarea value={selectedComp.content ?? ""} onChange={(e) => updateComp(selectedComp.id, { content: e.target.value })} className="w-full text-xs border rounded px-2 py-1 resize-none bg-background" rows={2} />
                          </div>
                          <div>
                            <label className={sLabel}>Font style</label>
                            <FontSelect value={selectedComp.fontFamily ?? "system-ui, -apple-system, sans-serif"} onChange={(v) => updateComp(selectedComp.id, { fontFamily: v })} />
                          </div>
                          <div>
                            <label className={sLabel}>Text style</label>
                            <div className="grid grid-cols-3 gap-1">
                              {(["heading", "subheading", "body"] as const).map((style) => (
                                <button
                                  key={style}
                                  type="button"
                                  onClick={() => updateComp(selectedComp.id, textStylePatch(style))}
                                  className={`text-[11px] py-0.5 rounded border capitalize ${(selectedComp.textStyle ?? "body") === style ? "bg-black text-white" : "hover:bg-muted"}`}
                                >
                                  {style === "subheading" ? "Sub" : style}
                                </button>
                              ))}
                            </div>
                          </div>
                          <div>
                            <label className={sLabel}>Font size</label>
                            <div className="grid grid-cols-[1fr_64px] gap-1.5">
                              <input type="range" min="1" max="300" value={selectedComp.fontSize ?? 20} onChange={(e) => updateComp(selectedComp.id, { fontSize: +e.target.value })} className="w-full" />
                              <Input type="number" min="1" max="300" value={selectedComp.fontSize ?? 20} onChange={(e) => updateComp(selectedComp.id, { fontSize: +e.target.value })} className="h-6 text-xs px-1.5" />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-1.5">
                            <ColorPicker key={`${selectedComp.id}-fc`} label="Text color" value={selectedComp.fontColor ?? "#000000"} onChange={(v) => updateComp(selectedComp.id, { fontColor: v })} />
                            <ColorPicker key={`${selectedComp.id}-bg`} label="Background" value={selectedComp.bgColor === "transparent" ? "#ffffff" : (selectedComp.bgColor ?? "#ffffff")} onChange={(v) => updateComp(selectedComp.id, { bgColor: v })} />
                          </div>
                          <div>
                            <label className={sLabel}>Format</label>
                            <div className="grid grid-cols-5 gap-1">
                              <button type="button" onClick={() => updateComp(selectedComp.id, { bold: !selectedComp.bold, fontWeight: selectedComp.bold ? 400 : 700 })} className={`text-xs py-0.5 rounded border font-bold ${selectedComp.bold || (selectedComp.fontWeight ?? 400) >= 700 ? "bg-black text-white" : "hover:bg-muted"}`}>B</button>
                              <button type="button" onClick={() => updateComp(selectedComp.id, { italic: !selectedComp.italic })} className={`text-xs py-0.5 rounded border italic ${selectedComp.italic ? "bg-black text-white" : "hover:bg-muted"}`}>I</button>
                              {(["left", "center", "right"] as const).map((a) => (
                                <button key={a} type="button" onClick={() => updateComp(selectedComp.id, { textAlign: a })} className={`text-[11px] py-0.5 rounded border ${selectedComp.textAlign === a ? "bg-black text-white" : "hover:bg-muted"}`}>{a[0].toUpperCase()}</button>
                              ))}
                            </div>
                          </div>
                          <div>
                            <label className={sLabel}>Font weight</label>
                            <select value={selectedComp.fontWeight ?? (selectedComp.bold ? 700 : 400)} onChange={(e) => updateComp(selectedComp.id, { fontWeight: +e.target.value, bold: +e.target.value >= 700 })} className="w-full text-xs border rounded px-1.5 py-1 bg-background h-6">
                              {FONT_WEIGHTS.map((w) => <option key={w.value} value={w.value}>{w.label}</option>)}
                            </select>
                          </div>
                          <div className="grid grid-cols-2 gap-1.5">
                            <div>
                              <label className={sLabel}>Letter spacing</label>
                              <Input type="number" step="0.5" min="-20" max="80" value={selectedComp.letterSpacing ?? 0} onChange={(e) => updateComp(selectedComp.id, { letterSpacing: +e.target.value })} className="h-6 text-xs px-1.5" />
                            </div>
                            <div>
                              <label className={sLabel}>Line spacing</label>
                              <Input type="number" step="0.1" min="0.5" max="5" value={selectedComp.lineHeight ?? 1.4} onChange={(e) => updateComp(selectedComp.id, { lineHeight: +e.target.value })} className="h-6 text-xs px-1.5" />
                            </div>
                          </div>
                          <div>
                            <label className={sLabel}>Effect</label>
                            <select value={selectedComp.textEffect ?? "none"} onChange={(e) => updateComp(selectedComp.id, { textEffect: e.target.value as TextEffect })} className="w-full text-xs border rounded px-1.5 py-1 bg-background h-6">
                              {(["none", "glow", "outline", "background", "hollow", "neon", "glitch"] as const).map((effect) => (
                                <option key={effect} value={effect}>{effect[0].toUpperCase() + effect.slice(1)}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className={sLabel}>Effect strength</label>
                            <div className="grid grid-cols-[1fr_54px] gap-1.5">
                              <input type="range" min="0" max="100" value={selectedComp.effectStrength ?? 30} onChange={(e) => updateComp(selectedComp.id, { effectStrength: +e.target.value })} className="w-full" />
                              <Input type="number" min="0" max="100" value={selectedComp.effectStrength ?? 30} onChange={(e) => updateComp(selectedComp.id, { effectStrength: +e.target.value })} className="h-6 text-xs px-1.5" />
                            </div>
                          </div>
                          <div>
                            <label className={sLabel}>Transparency</label>
                            <div className="grid grid-cols-[1fr_54px] gap-1.5">
                              <input type="range" min="0" max="100" value={selectedComp.opacity ?? 100} onChange={(e) => updateComp(selectedComp.id, { opacity: +e.target.value })} className="w-full" />
                              <Input type="number" min="0" max="100" value={selectedComp.opacity ?? 100} onChange={(e) => updateComp(selectedComp.id, { opacity: +e.target.value })} className="h-6 text-xs px-1.5" />
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-1">
                          {TEXT_PRESETS.map((preset) => (
                            <button key={preset.id} type="button" onClick={() => addComponent("text", preset.patch)}
                              className="flex flex-col items-center justify-center gap-0.5 h-12 rounded border border-gray-200 bg-white hover:border-black transition-colors overflow-hidden px-1">
                              <span className="truncate w-full text-center leading-tight"
                                style={{ fontSize: Math.min(preset.patch.fontSize ?? 16, 20), fontWeight: preset.patch.fontWeight, letterSpacing: preset.patch.letterSpacing, color: preset.patch.fontColor }}>
                                {preset.sample}
                              </span>
                              <span className="text-[9px] text-muted-foreground">{preset.label}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Shape */}
                <div>
                  <button type="button" onClick={() => setOpenTool(openTool === "shape" ? null : "shape")}
                    className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md border text-xs transition-colors text-left ${openTool === "shape" ? "border-black bg-muted" : "border-gray-200 hover:bg-muted"}`}>
                    <Square className="h-3.5 w-3.5 text-muted-foreground shrink-0" /> Shape
                    <ChevronDown className={`h-3 w-3 ml-auto text-muted-foreground transition-transform ${openTool === "shape" ? "rotate-180" : ""}`} />
                  </button>
                  {openTool === "shape" && (
                    <div className="mt-1 p-1.5 border rounded-md bg-muted/30">
                      {selectedComp && selectedComp.type === "shape" ? (
                        <div className="flex flex-col gap-2.5">
                          {renderCommonFields(selectedComp)}
                          <div>
                            <label className={sLabel}>Shape type</label>
                            <div className="grid grid-cols-4 gap-1">
                              {SHAPES.map(({ type, label: shapeLabel }) => (
                                <button
                                  key={type}
                                  type="button"
                                  title={shapeLabel}
                                  onClick={() => updateComp(selectedComp.id, { shapeType: type })}
                                  className={`flex items-center justify-center h-7 rounded border ${(selectedComp.shapeType ?? "rectangle") === type ? "bg-black text-white" : "hover:bg-muted text-muted-foreground"}`}
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
                        </div>
                      ) : (
                        <div className="grid grid-cols-4 gap-1">
                          {SHAPES.map(({ type, label: shapeLabel }) => (
                            <button key={type} type="button" onClick={() => addShape(type)} title={shapeLabel}
                              className="flex items-center justify-center h-9 rounded-md border border-gray-200 bg-white hover:border-black transition-colors text-muted-foreground">
                              <ShapeSwatch type={type} />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Image */}
                <div>
                  <button type="button" onClick={() => setOpenTool(openTool === "image" ? null : "image")}
                    className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md border text-xs transition-colors text-left ${openTool === "image" ? "border-black bg-muted" : "border-gray-200 hover:bg-muted"}`}>
                    <ImageIcon className="h-3.5 w-3.5 text-muted-foreground shrink-0" /> Image
                    <ChevronDown className={`h-3 w-3 ml-auto text-muted-foreground transition-transform ${openTool === "image" ? "rotate-180" : ""}`} />
                  </button>
                  {openTool === "image" && (
                    <div className="mt-1 p-2 border rounded-md bg-muted/30">
                      {selectedComp && selectedComp.type === "image" ? (
                        <div className="flex flex-col gap-2.5">
                          {renderCommonFields(selectedComp)}
                          {(selectedComp.imageMode ?? "single") === "single" ? (
                            <div>
                              <label className={sLabel}>Upload</label>
                              <label className="flex items-center gap-1.5 cursor-pointer px-2 py-1 rounded border text-xs hover:bg-muted">
                                <ImageIcon className="h-3 w-3" />
                                {uploading ? "Uploading…" : "Choose image"}
                                <input type="file" accept="image/*" className="hidden"
                                  onChange={async (e) => {
                                    const file = e.target.files?.[0]; if (!file) return;
                                    const localUrl = URL.createObjectURL(file);
                                    updateComp(selectedComp.id, { imageUrl: localUrl });
                                    const remoteUrl = await uploadImage(file);
                                    if (remoteUrl) { updateComp(selectedComp.id, { imageUrl: remoteUrl }); URL.revokeObjectURL(localUrl); }
                                  }} />
                              </label>
                            </div>
                          ) : (
                            <div className="flex flex-col gap-2.5 p-2 border rounded-md bg-white">
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
                                  <label className="flex items-center gap-1.5 cursor-pointer px-2 py-1 rounded border text-xs hover:bg-muted">
                                    <ImageIcon className="h-3 w-3" />
                                    {uploading ? "Uploading…" : "Add photo"}
                                    <input type="file" accept="image/*" className="hidden"
                                      onChange={async (e) => {
                                        const file = e.target.files?.[0]; if (!file) return;
                                        const before = selectedComp.images ?? [];
                                        const localUrl = URL.createObjectURL(file);
                                        updateComp(selectedComp.id, { images: [...before, localUrl] });
                                        const remoteUrl = await uploadImage(file);
                                        if (remoteUrl) {
                                          updateComp(selectedComp.id, { images: [...before, remoteUrl] });
                                          URL.revokeObjectURL(localUrl);
                                        }
                                      }} />
                                  </label>
                                )}
                              </div>

                              {/* Photo limit */}
                              <div>
                                <label className={sLabel}>Photo limit</label>
                                <div className="grid grid-cols-4 gap-1">
                                  {([5, 10, 15, 0] as const).map((max) => (
                                    <button key={max} type="button"
                                      onClick={() => updateComp(selectedComp.id, { slideshowMax: max })}
                                      className={`flex items-center justify-center gap-0.5 text-[10px] py-1 rounded border transition-colors ${(selectedComp.slideshowMax ?? 5) === max ? "bg-black text-white border-black" : "bg-white border-gray-200 hover:bg-muted"}`}>
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
                        </div>
                      ) : (
                        <div className="flex flex-col gap-2">
                          <div>
                            <p className="text-[9px] uppercase tracking-wide text-muted-foreground mb-1">Frame type</p>
                            <div className="grid grid-cols-2 gap-1">
                              <button type="button" onClick={() => addImage("single")}
                                className="flex flex-col items-center justify-center gap-1 h-14 rounded border border-gray-200 bg-white hover:border-black transition-colors">
                                <ImageIcon className="h-4 w-4 text-muted-foreground" />
                                <span className="text-[10px]">Photo Frame</span>
                              </button>
                              <button type="button" onClick={() => addImage("slideshow")}
                                className="flex flex-col items-center justify-center gap-1 h-14 rounded border border-gray-200 bg-white hover:border-black transition-colors">
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
                                  className={`text-[10px] py-1 rounded border transition-colors ${imageSizePreset === s.id ? "bg-black text-white border-black" : "bg-white border-gray-200 hover:bg-muted"}`}>
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
                    className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md border text-xs transition-colors text-left ${openTool === "button" ? "border-black bg-muted" : "border-gray-200 hover:bg-muted"}`}>
                    <MousePointerClick className="h-3.5 w-3.5 text-muted-foreground shrink-0" /> Button
                    <ChevronDown className={`h-3 w-3 ml-auto text-muted-foreground transition-transform ${openTool === "button" ? "rotate-180" : ""}`} />
                  </button>
                  {openTool === "button" && (
                    <div className="mt-1 p-1.5 border rounded-md bg-muted/30">
                      {selectedComp && selectedComp.type === "button" ? (
                        <div className="flex flex-col gap-2.5">
                          {renderCommonFields(selectedComp)}
                          <div>
                            <label className={sLabel}>Label</label>
                            <Input value={selectedComp.content ?? ""} onChange={(e) => updateComp(selectedComp.id, { content: e.target.value })} className="h-6 text-xs px-1.5" />
                          </div>
                          <div>
                            <label className={sLabel}>Style</label>
                            <div className="grid grid-cols-4 gap-1">
                              {(["solid", "outline", "ghost", "link"] as const).map((s) => (
                                <button key={s} onClick={() => updateComp(selectedComp.id, { buttonStyle: s })}
                                  className={`text-[11px] py-0.5 rounded border capitalize ${(selectedComp.buttonStyle ?? "solid") === s ? "bg-black text-white" : "hover:bg-muted"}`}>{s}</button>
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
                          <div className="grid grid-cols-2 gap-1.5">
                            <div>
                              <label className={sLabel}>Font size</label>
                              <Input type="number" value={selectedComp.fontSize ?? 16} onChange={(e) => updateComp(selectedComp.id, { fontSize: +e.target.value })} className="h-6 text-xs px-1.5" />
                            </div>
                            <div>
                              <label className={sLabel}>Radius</label>
                              <Input type="number" min="0" max="200" value={selectedComp.borderRadius ?? 8} onChange={(e) => updateComp(selectedComp.id, { borderRadius: +e.target.value })} className="h-6 text-xs px-1.5" />
                            </div>
                          </div>
                          <div>
                            <label className={sLabel}>Font</label>
                            <FontSelect value={selectedComp.fontFamily ?? "system-ui, -apple-system, sans-serif"} onChange={(v) => updateComp(selectedComp.id, { fontFamily: v })} />
                          </div>
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
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-1">
                          {BUTTON_PRESETS.map((preset) => {
                            const s = resolveButtonStyles(preset.patch as PageComponent, false);
                            return (
                              <button key={preset.id} type="button" onClick={() => addComponent("button", preset.patch)}
                                className="flex items-center justify-center h-9 rounded border border-gray-200 bg-white hover:border-black transition-colors p-1">
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
                    className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md border text-xs transition-colors text-left ${openTool === "carousel" ? "border-black bg-muted" : "border-gray-200 hover:bg-muted"}`}>
                    <GalleryHorizontal className="h-3.5 w-3.5 text-muted-foreground shrink-0" /> Carousel
                    <ChevronDown className={`h-3 w-3 ml-auto text-muted-foreground transition-transform ${openTool === "carousel" ? "rotate-180" : ""}`} />
                  </button>
                  {openTool === "carousel" && (
                    <div className="mt-1 p-1.5 border rounded-md bg-muted/30">
                      {selectedComp && selectedComp.type === "carousel" ? (() => {
                        const items = selectedComp.carouselItems ?? [];
                        return (
                          <div className="flex flex-col gap-2.5">
                            {renderCommonFields(selectedComp)}

                            <div>
                              <label className={sLabel}>Items ({items.length})</label>
                              {items.length > 0 && (
                                <div className="flex flex-col gap-1 mb-1.5">
                                  {items.map((item, i) => (
                                    <div key={item.id} className="flex gap-1.5 items-center p-1.5 border rounded bg-white">
                                      <div className="w-8 h-8 rounded bg-gray-100 overflow-hidden shrink-0 flex items-center justify-center">
                                        {item.imageUrl ? <img src={item.imageUrl} alt="" className="w-full h-full object-cover" /> : <ImageIcon className="h-3.5 w-3.5 text-gray-300" />}
                                      </div>
                                      <div className="flex-1 min-w-0 flex flex-col gap-1">
                                        <Input value={item.label ?? ""} onChange={(e) => updateCarouselItem(selectedComp.id, items, item.id, { label: e.target.value })} placeholder="Label" className="h-6 text-xs px-1.5" />
                                        <Input value={item.link ?? ""} onChange={(e) => updateCarouselItem(selectedComp.id, items, item.id, { link: e.target.value })} placeholder="Link to page" className="h-6 text-xs px-1.5" />
                                      </div>
                                      <div className="flex flex-col shrink-0">
                                        <button type="button" title="Move earlier" disabled={i === 0} onClick={() => moveCarouselItem(selectedComp.id, items, i, -1)} className="h-4 w-4 flex items-center justify-center disabled:opacity-20 hover:bg-muted rounded"><ChevronLeft className="h-3 w-3" /></button>
                                        <button type="button" title="Move later" disabled={i === items.length - 1} onClick={() => moveCarouselItem(selectedComp.id, items, i, 1)} className="h-4 w-4 flex items-center justify-center disabled:opacity-20 hover:bg-muted rounded"><ChevronRight className="h-3 w-3" /></button>
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
                                  className={`flex items-center justify-center gap-1 h-7 rounded border text-xs transition-colors ${showCategoryPicker ? "bg-black text-white border-black" : "border-gray-200 hover:bg-muted"}`}>
                                  <Tag className="h-3 w-3" /> From Categories
                                </button>
                                <label className="flex items-center justify-center gap-1 h-7 rounded border border-gray-200 text-xs hover:bg-muted cursor-pointer">
                                  <ImageIcon className="h-3 w-3" />
                                  {uploading ? "Uploading…" : "Custom item"}
                                  <input type="file" accept="image/*" className="hidden"
                                    onChange={async (e) => {
                                      const file = e.target.files?.[0]; if (!file) return;
                                      const before = items;
                                      const localUrl = URL.createObjectURL(file);
                                      const newItem: CarouselItem = { id: uid(), imageUrl: localUrl, label: "", link: "" };
                                      updateComp(selectedComp.id, { carouselItems: [...before, newItem] });
                                      const remoteUrl = await uploadImage(file);
                                      if (remoteUrl) {
                                        updateComp(selectedComp.id, { carouselItems: [...before, { ...newItem, imageUrl: remoteUrl }] });
                                        URL.revokeObjectURL(localUrl);
                                      }
                                    }} />
                                </label>
                              </div>
                              {showCategoryPicker && (
                                <div className="mt-1.5 max-h-36 overflow-y-auto border rounded bg-white flex flex-col gap-0.5 p-1">
                                  {loadingCategories ? (
                                    <p className="text-[11px] text-muted-foreground p-1">Loading…</p>
                                  ) : (categoryOptions ?? []).length === 0 ? (
                                    <p className="text-[11px] text-muted-foreground p-1">No categories found.</p>
                                  ) : (
                                    (categoryOptions ?? []).map((cat) => (
                                      <button key={cat.id} type="button" onClick={() => addCategoryItem(selectedComp.id, items, cat)}
                                        className="flex items-center gap-1.5 text-left text-xs px-1.5 py-1 rounded hover:bg-muted">
                                        {cat.imageUrl ? <img src={cat.imageUrl} alt="" className="w-4 h-4 rounded object-cover shrink-0" /> : <Tag className="h-3 w-3 text-muted-foreground shrink-0" />}
                                        <span className="truncate">{cat.name}</span>
                                      </button>
                                    ))
                                  )}
                                </div>
                              )}
                            </div>

                            <div className="grid grid-cols-2 gap-1.5">
                              <div>
                                <label className={sLabel}>Item width</label>
                                <Input type="number" min="60" max="600" value={selectedComp.carouselItemWidth ?? 160} onChange={(e) => updateComp(selectedComp.id, { carouselItemWidth: +e.target.value })} className="h-6 text-xs px-1.5" />
                              </div>
                              <div>
                                <label className={sLabel}>Radius</label>
                                <Input type="number" min="0" value={selectedComp.borderRadius ?? 12} onChange={(e) => updateComp(selectedComp.id, { borderRadius: +e.target.value })} className="h-6 text-xs px-1.5" />
                              </div>
                            </div>
                            <div>
                              <label className={sLabel}>Center zoom</label>
                              <div className="grid grid-cols-[1fr_54px] gap-1.5">
                                <input type="range" min="1" max="2" step="0.05" value={selectedComp.carouselZoom ?? 1.25} onChange={(e) => updateComp(selectedComp.id, { carouselZoom: +e.target.value })} className="w-full" />
                                <Input type="number" min="1" max="2" step="0.05" value={selectedComp.carouselZoom ?? 1.25} onChange={(e) => updateComp(selectedComp.id, { carouselZoom: +e.target.value })} className="h-6 text-xs px-1.5" />
                              </div>
                            </div>
                            <ColorPicker label="Background" value={selectedComp.bgColor === "transparent" ? "#ffffff" : (selectedComp.bgColor ?? "#ffffff")} onChange={(v) => updateComp(selectedComp.id, { bgColor: v })} />
                          </div>
                        );
                      })() : (
                        <button type="button" onClick={addCarousel}
                          className="w-full flex items-center justify-center gap-1.5 h-9 rounded border border-gray-200 bg-white hover:border-black transition-colors text-xs">
                          <GalleryHorizontal className="h-4 w-4" /> Add Carousel
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Icon */}
                <div>
                  <button type="button" onClick={() => setOpenTool(openTool === "icon" ? null : "icon")}
                    className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md border text-xs transition-colors text-left ${openTool === "icon" ? "border-black bg-muted" : "border-gray-200 hover:bg-muted"}`}>
                    <ComponentIcon className="h-3.5 w-3.5 text-muted-foreground shrink-0" /> Icon
                    <ChevronDown className={`h-3 w-3 ml-auto text-muted-foreground transition-transform ${openTool === "icon" ? "rotate-180" : ""}`} />
                  </button>
                  {openTool === "icon" && (
                    <div className="mt-1 p-1.5 border rounded-md bg-muted/30">
                      {selectedComp && selectedComp.type === "icon" ? (
                        <div className="flex flex-col gap-2.5">
                          {renderCommonFields(selectedComp)}
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
                        </div>
                      ) : (
                        renderIconPicker(addIcon)
                      )}
                    </div>
                  )}
                </div>

              </div>

              {/* Group / multi-selection settings — not tied to one component type */}
              {(selectedComps.length > 1 || (selectedComp && selectedComp.groupId)) && (
                <div className="mt-3 p-3 border rounded-md bg-muted/30 flex flex-col gap-2.5">
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
                className="w-full flex items-center gap-2 text-left px-3 py-1.5 hover:bg-muted"
                onClick={groupSelected}
              >
                <GroupIcon className="h-3.5 w-3.5" /> Create Group
              </button>
            )}
            {selectionGroupId && (
              <button
                type="button"
                className="w-full flex items-center gap-2 text-left px-3 py-1.5 hover:bg-muted"
                onClick={ungroupSelected}
              >
                <UngroupIcon className="h-3.5 w-3.5" /> Ungroup
              </button>
            )}
            {selectedComp && (
              <button
                type="button"
                className="w-full flex items-center gap-2 text-left px-3 py-1.5 hover:bg-muted"
                onClick={() => duplicateInPlace(selectedComp)}
              >
                <Copy className="h-3.5 w-3.5" /> Duplicate
              </button>
            )}
            <button
              type="button"
              className="w-full flex items-center gap-2 text-left px-3 py-1.5 hover:bg-muted text-destructive"
              onClick={() => { deleteComp(selectedIds); setContextMenu(null); }}
            >
              <Trash2 className="h-3.5 w-3.5" /> Delete
            </button>
          </div>
        )}

      </div>
      {/* end main editor */}

    </div>
  );
}
