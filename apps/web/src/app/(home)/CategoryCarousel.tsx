"use client";

import { useRef } from "react";
import { ChevronLeft, ChevronRight, Image as ImageIcon } from "lucide-react";

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

// Separate from HomeCarousel.tsx (the existing Carousel component's live
// counterpart) — no shared code. Snap-scrolling is pure CSS (scroll-snap-type/
// align), so touch swipe and trackpad/shift-wheel scrolling both work natively
// with no JS; the only JS here is the desktop hover-reveal chevron buttons
// (scrollBy) and the hover scale/"Shop" label (CSS group-hover, no state).
// Deliberately no autoplay/rotation.
function cardWidthStyle(snapMode: SnapMode, index: number): React.CSSProperties {
  // Mobile-first inline default (88% width = first card full + next peeking in);
  // the desktop N-card width is applied via the media-queried <style> block below,
  // since it depends on the editable desktopCards count across a breakpoint.
  const snapAlign = snapMode === "double" && index % 2 === 1 ? undefined : "start";
  return { flex: "0 0 88%", scrollSnapAlign: snapAlign };
}

function CategoryCard({
  item, cardStyle, aspectRatio, cornerRadius, showDescriptor, showBadge, titleColor,
}: {
  item: CategoryCarouselItem;
  cardStyle: CardStyle;
  aspectRatio: CardAspectRatio;
  cornerRadius: number;
  showDescriptor: boolean;
  showBadge: boolean;
  titleColor?: string;
}) {
  const aspectClass = aspectRatio === "1:1" ? "aspect-square" : "aspect-[3/4]";

  const image = (
    <div className={`relative w-full ${cardStyle === "split" ? "h-full" : aspectClass} overflow-hidden bg-gray-100 shrink-0`} style={{ borderRadius: cardStyle === "split" ? 0 : cornerRadius }}>
      {item.imageUrl ? (
        <img src={item.imageUrl} alt="" loading="lazy" draggable={false} className="w-full h-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.04]" />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-gray-300"><ImageIcon className="h-6 w-6" /></div>
      )}
      {showBadge && item.badge && (
        <span className="absolute top-1.5 left-1.5 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-black/70 text-white">{item.badge}</span>
      )}
      {cardStyle === "image-first" && (
        <span className="absolute inset-0 flex items-end justify-center pb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-white/90 text-black">Shop</span>
        </span>
      )}
    </div>
  );

  const label = (
    <div className={cardStyle === "icon-text" ? "text-center" : "px-0.5"}>
      <p className="text-[13px] font-semibold truncate" style={{ color: titleColor ?? "#111111" }}>{item.name || "Category"}</p>
      {showDescriptor && item.descriptor && <p className="text-[11px] text-muted-foreground truncate">{item.descriptor}</p>}
    </div>
  );

  const inner = cardStyle === "icon-text" ? (
    <div className="group flex flex-col items-center gap-1.5 w-16 mx-auto">
      <div className="w-14 h-14 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center shrink-0">
        {item.imageUrl ? <img src={item.imageUrl} alt="" loading="lazy" className="w-full h-full object-cover" /> : <ImageIcon className="h-5 w-5 text-gray-300" />}
      </div>
      {label}
    </div>
  ) : cardStyle === "split" ? (
    <div className="group flex h-full w-full overflow-hidden border border-gray-200" style={{ borderRadius: cornerRadius }}>
      <div className="w-1/2 h-full">{image}</div>
      <div className="w-1/2 h-full flex flex-col justify-center gap-1 p-2">{label}</div>
    </div>
  ) : (
    <div className="group flex flex-col gap-1.5">
      {image}
      {label}
    </div>
  );

  return item.link ? <a href={item.link} className="block">{inner}</a> : inner;
}

export function CategoryCarousel({
  items,
  title,
  subtitle,
  cardStyle = "image-first",
  aspectRatio = "1:1",
  cornerRadius = 12,
  showDescriptor = false,
  showBadge = false,
  snapMode = "single",
  desktopCards = 4,
  gapDesktop = 16,
  gapMobile = 12,
  titleColor,
  subtitleColor,
}: {
  items: CategoryCarouselItem[];
  title?: string;
  subtitle?: string;
  cardStyle?: CardStyle;
  aspectRatio?: CardAspectRatio;
  cornerRadius?: number;
  showDescriptor?: boolean;
  showBadge?: boolean;
  snapMode?: SnapMode;
  desktopCards?: number;
  gapDesktop?: number;
  gapMobile?: number;
  titleColor?: string;
  subtitleColor?: string;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  if (items.length === 0) return null;
  const isIconText = cardStyle === "icon-text";

  return (
    <div className="group/carousel w-full h-full flex flex-col gap-3">
      {(title || subtitle) && (
        <div className="flex flex-col gap-0.5">
          {title && <h2 className="text-xl md:text-2xl font-bold" style={{ color: titleColor ?? "#111111" }}>{title}</h2>}
          {subtitle && <p className="text-sm" style={{ color: subtitleColor ?? "#6b7280" }}>{subtitle}</p>}
        </div>
      )}
      <div className="relative flex-1 min-h-0">
        <div
          ref={trackRef}
          className="w-full h-full flex overflow-x-auto overflow-y-hidden [&::-webkit-scrollbar]:hidden category-carousel-track"
          style={{ gap: gapMobile, scrollSnapType: "x mandatory", scrollbarWidth: "none", alignItems: isIconText ? "flex-start" : "stretch" }}
        >
          {items.map((item, idx) => (
            <div
              key={item.id}
              className="cat-card shrink-0"
              style={cardWidthStyle(snapMode, idx)}
            >
              <CategoryCard item={item} cardStyle={cardStyle} aspectRatio={aspectRatio} cornerRadius={cornerRadius} showDescriptor={showDescriptor} showBadge={showBadge} titleColor={titleColor} />
            </div>
          ))}
        </div>
        <button type="button" aria-label="Scroll left"
          onClick={() => trackRef.current?.scrollBy({ left: -240, behavior: "smooth" })}
          className="hidden md:flex absolute left-1 top-1/2 -translate-y-1/2 z-20 h-8 w-8 rounded-full bg-white shadow border items-center justify-center opacity-0 group-hover/carousel:opacity-100 transition-opacity duration-200">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button type="button" aria-label="Scroll right"
          onClick={() => trackRef.current?.scrollBy({ left: 240, behavior: "smooth" })}
          className="hidden md:flex absolute right-1 top-1/2 -translate-y-1/2 z-20 h-8 w-8 rounded-full bg-white shadow border items-center justify-center opacity-0 group-hover/carousel:opacity-100 transition-opacity duration-200">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
      {/* Desktop card width overrides the mobile default (flex-basis: 88%) set inline
          above — media-queried here since it depends on the editable desktopCards
          count and can't be expressed as a single inline style across breakpoints. */}
      <style>{`
        @media (min-width: 768px) {
          .category-carousel-track { gap: ${gapDesktop}px !important; }
          .category-carousel-track > .cat-card { flex: 0 0 calc((100% - ${(desktopCards - 1) * gapDesktop}px) / ${desktopCards}) !important; }
        }
      `}</style>
    </div>
  );
}
