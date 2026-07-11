import { HomeCarousel } from "./HomeCarousel";
import { HomeMap } from "./HomeMap";
import { HomeLocationInput } from "./HomeLocationInput";
import { HomeDateTimePicker } from "./HomeDateTimePicker";
import { HomeVehicleSelector } from "./HomeVehicleSelector";
import { HeroCarousel } from "./HeroCarousel";
import { CategoryCarousel } from "./CategoryCarousel";
import { StickyHeader } from "./StickyHeader";
import { extractZonesFromTemplate, type HeaderFooterBlock } from "@/lib/page-template-zones";

const API = process.env.API_INTERNAL_URL ?? "http://localhost:4000";
const MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

function buildBoxShadow(comp: PageComponent): string | undefined {
  const { shadowX, shadowY, shadowBlur, shadowSpread, shadowColor } = comp;
  if (shadowX == null && shadowY == null && shadowBlur == null && shadowSpread == null && !shadowColor) return undefined;
  return `${shadowX ?? 0}px ${shadowY ?? 0}px ${Math.max(0, shadowBlur ?? 0)}px ${shadowSpread ?? 0}px ${shadowColor ?? "rgba(0,0,0,0.35)"}`;
}
function buildBlurFilter(comp: PageComponent): string | undefined {
  return comp.blurAmount ? `blur(${comp.blurAmount}px)` : undefined;
}

type ButtonStyle = "solid" | "outline" | "ghost" | "link";
type ButtonActionType = "url" | "buy" | "search" | "custom";
type ShapeType = "square" | "rectangle" | "circle" | "ellipse" | "triangle" | "diamond" | "hexagon" | "star";

interface CarouselItem {
  id: string;
  imageUrl?: string;
  label?: string;
  link?: string;
}

interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  label?: string;
}

interface VehicleOption {
  id: string;
  label: string;
  iconId?: string;
  fareText?: string;
}

type DateOption = "today" | "tomorrow" | "custom";

interface HeroSlide {
  id: string;
  imageUrl?: string;
  headline?: string;
  subtext?: string;
  buttonLabel?: string;
  buttonLink?: string;
}
interface CategoryCarouselItem {
  id: string;
  imageUrl?: string;
  name?: string;
  descriptor?: string;
  badge?: string;
  link?: string;
}
type CardStyle = "image-first" | "icon-text" | "split";
type CardAspectRatio = "1:1" | "3:4";
type SnapMode = "single" | "double";

interface PageComponent {
  id: string;
  type: "text" | "header" | "shape" | "image" | "button" | "carousel" | "icon"
    | "location-input" | "map" | "datetime-picker" | "vehicle-selector" | "driver-badge" | "fare-display"
    | "hero-carousel" | "category-carousel" | "logo";
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
  bgColor?: string;
  borderRadius?: number;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  letterSpacing?: number;
  textTransform?: "none" | "uppercase" | "capitalize";
  listType?: "none" | "bullet" | "number";
  listIndent?: number;
  maxLines?: number;
  opacity?: number;
  shadowX?: number;
  shadowY?: number;
  shadowBlur?: number;
  shadowSpread?: number;
  shadowColor?: string;
  blurAmount?: number;
  shapeType?: ShapeType;
  textAlign?: "left" | "center" | "right" | "justify";
  imageUrl?: string;
  imageMode?: "single" | "slideshow";
  images?: string[];
  slideshowDuration?: number;
  buttonStyle?: ButtonStyle;
  borderColor?: string;
  hoverBgColor?: string;
  hoverFontColor?: string;
  buttonAction?: { type: ButtonActionType; value: string };
  link?: string;
  linkNewTab?: boolean;
  groupId?: string;
  groupLink?: string;
  carouselItems?: CarouselItem[];
  carouselItemWidth?: number;
  carouselZoom?: number;
  carouselStyle?: "zoom" | "row";
  carouselGap?: number;
  carouselItemBg?: string;
  iconName?: string;
  iconUrl?: string;
  locationPlaceholder?: string;
  locationLabel?: string;
  mapCenterLat?: number;
  mapCenterLng?: number;
  mapZoom?: number;
  mapMarkers?: MapMarker[];
  mapServiceRadiusKm?: number;
  dtDefaultOption?: DateOption;
  dtCustomDate?: string;
  dtTime?: string;
  vehicleOptions?: VehicleOption[];
  selectedVehicleId?: string;
  driverName?: string;
  driverRating?: number;
  driverVehicle?: string;
  driverPhotoUrl?: string;
  fareCurrency?: string;
  fareBase?: number;
  fareDistanceKm?: number;
  fareRatePerKm?: number;
  fareSurgeMultiplier?: number;
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
}

// Generalized version of the old getHomeConfig() — /published hits the
// Redis-cached read (purged immediately on publish), used by every live page,
// not just "home". The plain /page-config/:page route (admin editor only)
// always reads Postgres directly so drafts stay fresh.
export async function getPublishedPageConfig(slug: string) {
  try {
    const res = await fetch(`${API}/page-config/${encodeURIComponent(slug)}/published`, { next: { revalidate: 10 } });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export interface PublicSiteSettings {
  logoUrl: string | null;
  logoWidth: number;
  logoAlign: "left" | "center" | "right";
  logoLink: string;
}

// Global (not per-page) — same Redis-cached-with-graceful-fallback shape as
// getPublishedPageConfig above, just hitting /settings/public instead. A
// 60s window (vs. page content's 10s) since logo changes are rarer — but not
// the hour-plus window this originally used, which meant an admin uploading a
// new logo wouldn't see it live for up to an hour with no way to force it
// short of a full redeploy. Backend Redis cache is still actively purged on
// every save regardless — this is purely the frontend ISR layer on top.
export async function getPublicSettings(): Promise<PublicSiteSettings | null> {
  try {
    const res = await fetch(`${API}/settings/public`, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    const d = await res.json();
    return {
      logoUrl: d?.logoUrl ?? null,
      logoWidth: typeof d?.logoWidth === "number" ? d.logoWidth : 120,
      logoAlign: d?.logoAlign === "center" || d?.logoAlign === "right" ? d.logoAlign : "left",
      logoLink: typeof d?.logoLink === "string" ? d.logoLink : "/",
    };
  } catch {
    return null;
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

function shapeBorderRadius(comp: PageComponent): number | string {
  const st = comp.shapeType ?? "rectangle";
  if (st === "circle" || st === "ellipse") return "50%";
  if (st === "square" || st === "rectangle") return comp.borderRadius ?? 0;
  return 0;
}

function buttonHref(comp: PageComponent): string | undefined {
  const action = comp.buttonAction;
  if (!action?.value) return undefined;
  switch (action.type) {
    case "url": return action.value;
    case "buy": return `/products/${action.value}`;
    case "search": return `/search?q=${encodeURIComponent(action.value)}`;
    default: return undefined;
  }
}

function Canvas({ components, canvasW, canvasH, bgColor, settings, rotation }: { components: PageComponent[]; canvasW: number; canvasH: number; bgColor?: string; settings?: PublicSiteSettings | null; rotation?: number }) {
  // Generate per-button hover CSS so we don't need a client component
  const hoverCss = components
    .filter((c) => c.type === "button")
    .map((c) => {
      const isSolid = !c.buttonStyle || c.buttonStyle === "solid";
      const hoverBg = c.hoverBgColor ?? (isSolid ? (c.bgColor ?? "#2563eb") : "rgba(0,0,0,0.05)");
      const hoverColor = c.hoverFontColor ?? c.fontColor;
      return [
        `#hpbtn-${c.id}:hover{`,
        hoverBg ? `background-color:${hoverBg}!important;` : "",
        hoverColor ? `color:${hoverColor}!important;` : "",
        `}`,
      ].join("");
    })
    .join("");

  // Generate per-slideshow auto-cycle CSS (pure CSS crossfade, no client JS needed)
  const slideshowCss = components
    .filter((c) => c.type === "image" && c.imageMode === "slideshow" && (c.images?.length ?? 0) > 1)
    .map((c) => {
      const images = c.images!;
      const n = images.length;
      const perSlide = Math.max(1, c.slideshowDuration ?? 3.5); // seconds each photo stays visible (incl. fade)
      const duration = n * perSlide;
      const segment = 100 / n;
      const fadePct = Math.min((0.6 / duration) * 100, segment / 2);
      const keyframesName = `slideshow-${c.id}`;
      const keyframes = `@keyframes ${keyframesName}{0%{opacity:0;}${fadePct.toFixed(2)}%{opacity:1;}${(segment - fadePct).toFixed(2)}%{opacity:1;}${segment.toFixed(2)}%{opacity:0;}100%{opacity:0;}}`;
      const imgRules = images
        .map((_, i) => `#slide-${c.id}-${i}{animation:${keyframesName} ${duration}s ease-in-out infinite;animation-delay:${(i * perSlide).toFixed(2)}s;}`)
        .join("");
      return keyframes + imgRules;
    })
    .join("\n");

  const styleBlock = hoverCss + slideshowCss;

  // rotation (header-block/footer-block only) spins this whole canvas's outer
  // frame — the counter-rotated inner wrapper cancels that out for every
  // component inside, so they always render upright regardless.
  return (
    <>
      {styleBlock && <style>{styleBlock}</style>}
      <div className="w-full overflow-hidden" style={{ backgroundColor: bgColor ?? "#ffffff", transform: rotation ? `rotate(${rotation}deg)` : undefined, transformOrigin: "center" }}>
        <div className="relative w-full" style={{ paddingBottom: `${(canvasH / canvasW) * 100}%`, transform: rotation ? `rotate(${-rotation}deg)` : undefined, transformOrigin: "center" }}>
          {components.map((comp) => {
            const left = `${(comp.x / canvasW) * 100}%`;
            const top = `${(comp.y / canvasH) * 100}%`;
            const width = `${(comp.width / canvasW) * 100}%`;
            const height = `${(comp.height / canvasH) * 100}%`;
            const isBtn = comp.type === "button";
            const isShape = comp.type === "shape";
            const isCarousel = comp.type === "carousel";
            const isIcon = comp.type === "icon";
            const isLogo = comp.type === "logo";
            const isTaxi = comp.type === "location-input" || comp.type === "map" || comp.type === "datetime-picker" || comp.type === "vehicle-selector" || comp.type === "driver-badge" || comp.type === "fare-display";
            const isHero = comp.type === "hero-carousel";
            const isCatCarousel = comp.type === "category-carousel";
            const isSolid = !comp.buttonStyle || comp.buttonStyle === "solid";
            const isOutline = comp.buttonStyle === "outline";
            const isGhost = comp.buttonStyle === "ghost";
            const isLink = comp.buttonStyle === "link";
            const navHref = !isBtn ? (comp.link || comp.groupLink) : undefined;
            const Wrapper: "a" | "div" = navHref ? "a" : "div";
            // Internal navigation stays in the same window by default — only an
            // explicit `true` opens a new tab, for the rare case a link genuinely
            // points off-site.
            const opensNewTab = comp.linkNewTab === true;
            const wrapperExtra = navHref ? (opensNewTab ? { href: navHref, target: "_blank", rel: "noopener noreferrer" } : { href: navHref }) : {};

            return (
              <Wrapper
                key={comp.id}
                className="absolute"
                style={{
                  left, top, width, height,
                  borderRadius: isBtn || isShape || isCarousel || isIcon || isLogo || isTaxi || isHero || isCatCarousel ? 0 : (comp.borderRadius ?? 0),
                  backgroundColor: isBtn || isShape || isCarousel || isIcon || isLogo || isTaxi || isHero || isCatCarousel
                    ? "transparent"
                    : (comp.bgColor === "transparent" ? "transparent" : (comp.bgColor ?? "transparent")),
                  transform: comp.rotation ? `rotate(${comp.rotation}deg)` : undefined,
                  transformOrigin: "center",
                  boxShadow: buildBoxShadow(comp),
                  filter: buildBlurFilter(comp),
                  ...(navHref ? { cursor: "pointer" } : {}),
                }}
                {...wrapperExtra}
              >
                {isShape && (
                  <div className="w-full h-full" style={{
                    backgroundColor: comp.bgColor ?? "#3b82f6",
                    borderRadius: shapeBorderRadius(comp),
                    clipPath: shapeClipPath(comp.shapeType),
                    opacity: (comp.opacity ?? 100) / 100,
                  }} />
                )}

                {isCarousel && (comp.carouselItems?.length ?? 0) > 0 && (
                  <div className="w-full h-full" style={{
                    backgroundColor: comp.bgColor === "transparent" ? "transparent" : (comp.bgColor ?? "transparent"),
                    opacity: (comp.opacity ?? 100) / 100,
                  }}>
                    <HomeCarousel
                      items={comp.carouselItems!}
                      itemWidth={comp.carouselItemWidth ?? 160}
                      zoom={comp.carouselZoom ?? 1.25}
                      borderRadius={comp.borderRadius ?? 12}
                      gap={comp.carouselGap ?? 12}
                      carouselStyle={comp.carouselStyle}
                      itemBg={comp.carouselItemBg}
                    />
                  </div>
                )}

                {isIcon && comp.iconUrl && (() => {
                  const size = comp.fontSize ?? 32;
                  const color = comp.fontColor ?? "#111111";
                  return (
                    <div className="w-full h-full flex items-center justify-center" style={{ opacity: (comp.opacity ?? 100) / 100 }}>
                      <div style={{
                        width: size, height: size, backgroundColor: color,
                        WebkitMaskImage: `url(${comp.iconUrl})`, maskImage: `url(${comp.iconUrl})`,
                        WebkitMaskSize: "contain", maskSize: "contain",
                        WebkitMaskRepeat: "no-repeat", maskRepeat: "no-repeat",
                        WebkitMaskPosition: "center", maskPosition: "center",
                      }} />
                    </div>
                  );
                })()}

                {/* Logo — no longer auto-attached to a header block; it's a plain
                    freely-placed component like Image, sourcing the current global
                    logo at render time so re-uploading it updates every instance. */}
                {isLogo && settings?.logoUrl && (
                  <img src={settings.logoUrl} alt="Logo" className="w-full h-full object-contain" style={{ opacity: (comp.opacity ?? 100) / 100 }} />
                )}

                {comp.type === "location-input" && (
                  <HomeLocationInput
                    apiKey={MAPS_API_KEY}
                    placeholder={comp.locationPlaceholder}
                    fontColor={comp.fontColor}
                    bgColor={comp.bgColor}
                    borderColor={comp.borderColor}
                    borderRadius={comp.borderRadius ?? 8}
                  />
                )}

                {comp.type === "map" && (
                  <HomeMap
                    apiKey={MAPS_API_KEY}
                    centerLat={comp.mapCenterLat ?? 12.9716}
                    centerLng={comp.mapCenterLng ?? 77.5946}
                    zoom={comp.mapZoom ?? 13}
                    markers={comp.mapMarkers ?? []}
                    serviceRadiusKm={comp.mapServiceRadiusKm}
                    borderRadius={comp.borderRadius ?? 12}
                  />
                )}

                {comp.type === "datetime-picker" && (
                  <HomeDateTimePicker
                    defaultOption={comp.dtDefaultOption}
                    customDate={comp.dtCustomDate}
                    time={comp.dtTime}
                    fontColor={comp.fontColor}
                    bgColor={comp.bgColor}
                    borderColor={comp.borderColor}
                    borderRadius={comp.borderRadius ?? 8}
                  />
                )}

                {comp.type === "vehicle-selector" && (
                  <HomeVehicleSelector
                    options={comp.vehicleOptions ?? []}
                    defaultSelectedId={comp.selectedVehicleId}
                    bgColor={comp.bgColor}
                  />
                )}

                {comp.type === "driver-badge" && (() => {
                  const rating = Math.max(0, Math.min(5, comp.driverRating ?? 4.8));
                  return (
                    <div className="w-full h-full flex items-center gap-2.5 px-3" style={{ backgroundColor: comp.bgColor ?? "#ffffff", borderRadius: comp.borderRadius ?? 12 }}>
                      <div className="h-10 w-10 rounded-full bg-gray-200 shrink-0 overflow-hidden flex items-center justify-center">
                        {comp.driverPhotoUrl ? <img src={comp.driverPhotoUrl} alt="" className="w-full h-full object-cover" /> : null}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold truncate" style={{ color: comp.fontColor ?? "#111111" }}>{comp.driverName || "Driver Name"}</p>
                        <div className="flex items-center gap-0.5">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <span key={i} style={{ color: i < Math.round(rating) ? "#f59e0b" : "#d1d5db" }}>★</span>
                          ))}
                          <span className="text-[10px] text-muted-foreground ml-1">{rating.toFixed(1)}</span>
                        </div>
                        {comp.driverVehicle && <p className="text-[11px] text-muted-foreground truncate">{comp.driverVehicle}</p>}
                      </div>
                    </div>
                  );
                })()}

                {comp.type === "fare-display" && (() => {
                  const currency = comp.fareCurrency ?? "₹";
                  const base = comp.fareBase ?? 50;
                  const km = comp.fareDistanceKm ?? 5;
                  const rate = comp.fareRatePerKm ?? 12;
                  const surge = comp.fareSurgeMultiplier ?? 1;
                  const distanceFare = km * rate;
                  const total = Math.round((base + distanceFare) * surge);
                  return (
                    <div className="w-full h-full flex flex-col justify-center gap-1 px-3 py-2" style={{ backgroundColor: comp.bgColor ?? "#ffffff", borderRadius: comp.borderRadius ?? 12 }}>
                      <div className="text-xs text-muted-foreground">Fare estimate</div>
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
                })()}

                {isHero && (comp.heroSlides?.length ?? 0) > 0 && (
                  <HeroCarousel
                    slides={comp.heroSlides!}
                    peekPercent={comp.heroPeekPercent ?? 6}
                    autoplay={comp.heroAutoplay ?? true}
                    autoplaySeconds={comp.heroAutoplaySeconds ?? 5}
                    showArrows={comp.heroShowArrows ?? true}
                    showDots={comp.heroShowDots ?? true}
                    headlineColor={comp.heroHeadlineColor}
                    subtextColor={comp.heroSubtextColor}
                    overlayOpacity={comp.heroOverlayOpacity ?? 35}
                    ctaBgColor={comp.heroCtaBgColor}
                    ctaFontColor={comp.heroCtaFontColor}
                    borderRadius={comp.borderRadius ?? 0}
                  />
                )}

                {isCatCarousel && (comp.catCarouselItems?.length ?? 0) > 0 && (
                  <CategoryCarousel
                    items={comp.catCarouselItems!}
                    title={comp.catCarouselTitle}
                    subtitle={comp.catCarouselSubtitle}
                    cardStyle={comp.catCarouselCardStyle ?? "image-first"}
                    aspectRatio={comp.catCarouselAspectRatio ?? "1:1"}
                    cornerRadius={comp.catCarouselCornerRadius ?? 12}
                    showDescriptor={comp.catCarouselShowDescriptor ?? false}
                    showBadge={comp.catCarouselShowBadge ?? false}
                    snapMode={comp.catCarouselSnapMode ?? "single"}
                    desktopCards={comp.catCarouselDesktopCards ?? 4}
                    gapDesktop={comp.catCarouselGapDesktop ?? 16}
                    gapMobile={comp.catCarouselGapMobile ?? 12}
                    titleColor={comp.catCarouselTitleColor}
                    subtitleColor={comp.catCarouselSubtitleColor}
                  />
                )}

                {(comp.type === "text" || comp.type === "header") && (
                  <div
                    className="w-full h-full flex items-center px-1 overflow-hidden"
                    style={{
                      fontSize: `${((comp.fontSize ?? 16) / canvasW) * 100}vw`,
                      fontFamily: comp.fontFamily ?? "system-ui, -apple-system, sans-serif",
                      fontWeight: comp.fontWeight ?? (comp.bold ? 700 : 400),
                      fontStyle: comp.italic ? "italic" : "normal",
                      lineHeight: comp.lineHeight ?? 1.4,
                      letterSpacing: comp.letterSpacing ? `${(comp.letterSpacing / canvasW) * 100}vw` : undefined,
                      color: comp.fontColor ?? "#111",
                      opacity: (comp.opacity ?? 100) / 100,
                      textAlign: comp.textAlign ?? "left",
                      textTransform: comp.textTransform ?? "none",
                      textDecoration: [comp.underline && "underline", comp.strikethrough && "line-through"].filter(Boolean).join(" ") || "none",
                      justifyContent:
                        comp.textAlign === "center" ? "center"
                        : comp.textAlign === "right" ? "flex-end"
                        : "flex-start",
                    }}
                  >
                    {comp.listType === "bullet" || comp.listType === "number" ? (
                      (() => {
                        const items = (comp.content ?? "").split("\n").filter((l) => l.trim().length > 0);
                        const listStyle: React.CSSProperties = { margin: 0, paddingLeft: 20 + (comp.listIndent ?? 0) * 16 };
                        return comp.listType === "number"
                          ? <ol style={listStyle}>{items.map((line, i) => <li key={i}>{line}</li>)}</ol>
                          : <ul style={listStyle}>{items.map((line, i) => <li key={i}>{line}</li>)}</ul>;
                      })()
                    ) : (
                      <span style={{
                        whiteSpace: "pre-wrap", wordBreak: "break-word",
                        ...(comp.textAlign === "justify" ? { display: "block", width: "100%", textAlign: "justify" as const } : {}),
                        ...(comp.maxLines && comp.maxLines > 0 ? { display: "-webkit-box", WebkitLineClamp: comp.maxLines, WebkitBoxOrient: "vertical" as const, overflow: "hidden" } : {}),
                      }}>
                        {comp.content}
                      </span>
                    )}
                  </div>
                )}

                {comp.type === "image" && comp.imageMode === "slideshow" && comp.images && comp.images.length > 0 && (
                  <div className="relative w-full h-full overflow-hidden" style={{ borderRadius: comp.borderRadius ?? 4 }}>
                    {comp.images.map((url, i) => (
                      <img
                        key={i}
                        id={`slide-${comp.id}-${i}`}
                        src={url}
                        alt=""
                        className="absolute inset-0 w-full h-full object-cover"
                        style={{ opacity: i === 0 ? 1 : 0 }}
                      />
                    ))}
                  </div>
                )}

                {comp.type === "image" && comp.imageMode !== "slideshow" && comp.imageUrl && (
                  <img
                    src={comp.imageUrl}
                    alt=""
                    className="w-full h-full object-cover"
                    style={{ borderRadius: comp.borderRadius ?? 4 }}
                  />
                )}

                {isBtn && (() => {
                  const href = buttonHref(comp);
                  const sharedStyle: React.CSSProperties = {
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "100%",
                    height: "100%",
                    borderRadius: comp.borderRadius ?? 8,
                    backgroundColor: isSolid ? (comp.bgColor ?? "#3b82f6") : "transparent",
                    color: comp.fontColor ?? (isSolid ? "#ffffff" : (comp.bgColor ?? "#3b82f6")),
                    border: (isOutline || isGhost) ? `2px solid ${comp.borderColor ?? comp.bgColor ?? "#3b82f6"}` : "none",
                    textDecoration: isLink ? "underline" : "none",
                    fontSize: `${((comp.fontSize ?? 16) / canvasW) * 100}vw`,
                    fontFamily: comp.fontFamily ?? "system-ui, -apple-system, sans-serif",
                    fontWeight: comp.fontWeight ?? 600,
                    cursor: "pointer",
                    transition: "background-color 0.15s, color 0.15s",
                    overflow: "hidden",
                  };
                  return href ? (
                    <a
                      id={`hpbtn-${comp.id}`}
                      href={href}
                      style={sharedStyle}
                    >
                      {comp.content ?? "Button"}
                    </a>
                  ) : (
                    <button id={`hpbtn-${comp.id}`} type="button" style={sharedStyle}>
                      {comp.content ?? "Button"}
                    </button>
                  );
                })()}
              </Wrapper>
            );
          })}
        </div>
      </div>
    </>
  );
}

// One header/footer block, fixed to its own dock edge (top/bottom/left/right)
// — `offset` stacks multiple blocks on the same edge without overlapping.
// Left/right blocks get a fixed pixel width (their own `size`) and run the
// full page height; top/bottom blocks span the full canvas width and are
// `size` px tall — the same convention every other component's dimensions
// already use elsewhere in this app (numeric px, never percentage strings).
//
// Sticky positioning: top/left/right blocks are always sticky (same as the
// original single-header design — a header/rail is meant to stay put while
// scrolling). A bottom block only goes sticky when a hide-on-scroll threshold
// is actually set, same rule the original single-footer had — a non-fixed
// element can't "hide" mid-scroll, but a plain bottom block with no threshold
// has no reason to float over content; it just sits in normal flow at the
// natural end of the page like every other component does.
function DockedBlock({ block, canvasW, pageHeight, bgColor, settings, offset }: {
  block: HeaderFooterBlock;
  canvasW: number;
  pageHeight: number;
  bgColor?: string;
  settings?: PublicSiteSettings | null;
  offset: number;
}) {
  const isVertical = block.dock === "left" || block.dock === "right";
  const comps = block.components as unknown as PageComponent[];
  const body = (
    <div style={isVertical ? { width: block.size } : undefined} className="relative">
      <Canvas
        components={comps}
        canvasW={isVertical ? block.size : canvasW}
        canvasH={isVertical ? pageHeight : block.size}
        bgColor={block.bgColor ?? bgColor}
        settings={settings}
        rotation={block.rotation}
      />
    </div>
  );
  const isSticky = block.dock !== "bottom" || block.hideOnScrollDownPx != null || block.hideOnScrollUpPx != null;
  if (!isSticky) return body;
  return (
    <StickyHeader hideOnScrollDownPx={block.hideOnScrollDownPx} hideOnScrollUpPx={block.hideOnScrollUpPx} edge={block.dock} offset={offset}>
      {body}
    </StickyHeader>
  );
}

// Shared by (home)/page.tsx (slug "home") and [slug]/page.tsx (any other
// published page) — the only per-slug specifics live in getPublishedPageConfig().
// Header/Footer no longer have their own top-level fields, and there can be
// any number of each, each independently docked to any of the 4 canvas edges
// (see lib/page-template-zones.ts) — extractZonesFromTemplate pulls every
// header-block/footer-block back out of template.components for each
// viewport independently, same as the editor's own load effect does.
export function RenderedPage({ data, settings }: { data: any; settings?: PublicSiteSettings | null }) {
  const desktopZones = extractZonesFromTemplate(data?.template?.desktop, 900);
  const mobileZones = extractZonesFromTemplate(data?.template?.mobile, 812);

  // Page-level, not per-zone (see PageEditor.tsx's canvasBgColor) — same color
  // behind every zone since there's one control per page, not one per zone.
  const canvasBgColor = typeof data.canvasBgColor === "string" ? data.canvasBgColor : "#ffffff";

  function renderViewport(zones: typeof desktopZones, canvasW: number) {
    const top = zones.blocks.filter((b) => b.dock === "top");
    const bottom = zones.blocks.filter((b) => b.dock === "bottom");
    const left = zones.blocks.filter((b) => b.dock === "left");
    const right = zones.blocks.filter((b) => b.dock === "right");
    const topInset = top.reduce((s, b) => s + b.size, 0);
    const bottomInset = bottom.reduce((s, b) => s + b.size, 0);
    const pageHeight = topInset + zones.template.height + bottomInset;

    let offset = 0;
    const topEls = top.map((b) => { const el = <DockedBlock key={b.id} block={b} canvasW={canvasW} pageHeight={pageHeight} bgColor={canvasBgColor} settings={settings} offset={offset} />; offset += b.size; return el; });
    offset = 0;
    const bottomEls = bottom.map((b) => { const el = <DockedBlock key={b.id} block={b} canvasW={canvasW} pageHeight={pageHeight} bgColor={canvasBgColor} settings={settings} offset={offset} />; offset += b.size; return el; });
    offset = 0;
    const leftEls = left.map((b) => { const el = <DockedBlock key={b.id} block={b} canvasW={canvasW} pageHeight={pageHeight} bgColor={canvasBgColor} settings={settings} offset={offset} />; offset += 0; return el; });
    offset = 0;
    const rightEls = right.map((b) => { const el = <DockedBlock key={b.id} block={b} canvasW={canvasW} pageHeight={pageHeight} bgColor={canvasBgColor} settings={settings} offset={offset} />; offset += 0; return el; });

    return (
      <>
        {leftEls}
        {rightEls}
        {topEls}
        <Canvas components={zones.template.components as unknown as PageComponent[]} canvasW={canvasW} canvasH={zones.template.height} bgColor={canvasBgColor} settings={settings} />
        {bottomEls}
        <div style={{ clear: "both" }} />
      </>
    );
  }

  const hasDesktopContent = desktopZones.blocks.length > 0 || desktopZones.template.components.length > 0 || Boolean(settings?.logoUrl);
  const hasMobileContent = mobileZones.blocks.length > 0 || mobileZones.template.components.length > 0 || Boolean(settings?.logoUrl);

  return (
    <>
      {hasDesktopContent && (
        <div className={hasMobileContent ? "hidden lg:block" : undefined}>
          {renderViewport(desktopZones, 1920)}
        </div>
      )}
      {hasMobileContent && (
        <div className={hasDesktopContent ? "lg:hidden" : undefined}>
          {renderViewport(mobileZones, 375)}
        </div>
      )}
    </>
  );
}
