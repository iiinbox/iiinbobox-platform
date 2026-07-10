"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Image as ImageIcon } from "lucide-react";

interface CarouselItem {
  id: string;
  imageUrl?: string;
  label?: string;
  link?: string;
}

export function HomeCarousel({
  items,
  itemWidth,
  zoom,
  borderRadius,
  gap = 12,
  carouselStyle,
  itemBg,
}: {
  items: CarouselItem[];
  itemWidth: number;
  zoom: number;
  borderRadius: number;
  gap?: number;
  carouselStyle?: "zoom" | "row";
  itemBg?: string;
}) {
  // "row" = flat category-row style (Swiggy/Instamart-like): uniform item size, no
  // scroll-position zoom, items start flush at the edge instead of centered.
  const isRow = carouselStyle === "row";
  const trackRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const dragRef = useRef<{ startX: number; startScroll: number; dragged: boolean } | null>(null);
  const [scales, setScales] = useState<number[]>([]);
  const [pad, setPad] = useState(0);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const recompute = useCallback(() => {
    if (isRow) return;
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
  }, [items.length === 0]);

  if (items.length === 0) return null;

  return (
    <div
      ref={trackRef}
      onScroll={onScroll}
      onMouseDown={(e) => {
        if (!trackRef.current) return;
        trackRef.current.style.scrollBehavior = "auto"; // instant 1:1 tracking while dragging
        dragRef.current = { startX: e.clientX, startScroll: trackRef.current.scrollLeft, dragged: false };
      }}
      className="w-full h-full flex items-center overflow-x-auto overflow-y-hidden cursor-grab active:cursor-grabbing [&::-webkit-scrollbar]:hidden"
      style={{
        borderRadius, paddingLeft: pad, paddingRight: pad, gap,
        scrollSnapType: "x proximity", scrollBehavior: "smooth", scrollbarWidth: "none",
        WebkitOverflowScrolling: "touch",
      }}
    >
      {items.map((item, i) => {
        const baseScale = isRow ? 1 : (scales[i] ?? 1);
        const scale = hoverIndex === i ? baseScale + 0.08 : baseScale;
        // Row style: Swiggy/Instamart-style "chip" — icon with visible padding inside
        // a light colored square, label as plain text below (not inside the same card).
        const card = isRow ? (
          <div
            data-carousel-item
            onMouseEnter={() => setHoverIndex(i)}
            onMouseLeave={() => setHoverIndex((h) => (h === i ? null : h))}
            className="shrink-0 flex flex-col items-center select-none"
            style={{ width: itemWidth, transform: `scale(${scale})`, transition: "transform 0.2s ease-out", scrollSnapAlign: "start", zIndex: hoverIndex === i ? 999 : 1 }}
          >
            <div className="w-full aspect-square flex items-center justify-center overflow-hidden p-2.5"
              style={{ backgroundColor: itemBg ?? "#eef2f6", borderRadius }}>
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
            style={{ width: itemWidth, transform: `scale(${scale})`, transition: "transform 0.2s ease-out", scrollSnapAlign: "center", zIndex: hoverIndex === i ? 999 : Math.round(baseScale * 10), boxShadow: "0 1px 3px rgba(0,0,0,0.15)", borderRadius }}
          >
            {item.imageUrl ? (
              <img src={item.imageUrl} alt={item.label ?? ""} draggable={false} className="w-full aspect-square object-cover pointer-events-none" style={{ borderRadius }} />
            ) : (
              <div className="w-full aspect-square bg-gray-200" style={{ borderRadius }} />
            )}
            {item.label && <span className="text-xs font-medium text-center px-1 pb-1 truncate w-full">{item.label}</span>}
          </div>
        );
        return item.link ? (
          <a
            key={item.id}
            href={item.link}
            onClick={(e) => { if (dragRef.current?.dragged) e.preventDefault(); }}
            className="shrink-0"
          >
            {card}
          </a>
        ) : (
          <div key={item.id} className="shrink-0">{card}</div>
        );
      })}
    </div>
  );
}
