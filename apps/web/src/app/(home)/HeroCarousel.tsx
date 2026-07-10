"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Image as ImageIcon } from "lucide-react";

interface HeroSlide {
  id: string;
  imageUrl?: string;
  headline?: string;
  subtext?: string;
  buttonLabel?: string;
  buttonLink?: string;
}

// Full-width banner carousel — real swipe/drag (pointer events, unified mouse+
// touch), 300ms eased transitions, rubber-band edge resistance past the first/
// last slide, autoplay with pause on hover/touch, dot indicators + a numeric
// counter, and desktop-only arrows. Mobile stacks image-over-text (large CTA);
// desktop splits text beside the image. This is the live/interactive
// counterpart to the editor's static HeroCarouselBody preview.
export function HeroCarousel({
  slides,
  peekPercent = 6,
  autoplay = true,
  autoplaySeconds = 5,
  showArrows = true,
  showDots = true,
  headlineColor,
  subtextColor,
  overlayOpacity = 35,
  ctaBgColor,
  ctaFontColor,
  borderRadius = 0,
}: {
  slides: HeroSlide[];
  peekPercent?: number;
  autoplay?: boolean;
  autoplaySeconds?: number;
  showArrows?: boolean;
  showDots?: boolean;
  headlineColor?: string;
  subtextColor?: string;
  overlayOpacity?: number;
  ctaBgColor?: string;
  ctaFontColor?: string;
  borderRadius?: number;
}) {
  const [index, setIndex] = useState(0);
  const [dragPx, setDragPx] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isInteracting, setIsInteracting] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<{ x: number; width: number } | null>(null);

  const count = slides.length;
  const slideWidthPercent = 100 - peekPercent;

  const goTo = useCallback((i: number) => {
    if (count === 0) return;
    setIndex(Math.max(0, Math.min(count - 1, i)));
  }, [count]);

  // Autoplay — paused while the user is actively dragging/hovering/touching.
  useEffect(() => {
    if (!autoplay || count <= 1 || isInteracting) return;
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % count);
    }, Math.max(1, autoplaySeconds) * 1000);
    return () => clearInterval(timer);
  }, [autoplay, autoplaySeconds, count, isInteracting]);

  function onPointerDown(e: React.PointerEvent) {
    if (count <= 1) return;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    const width = containerRef.current?.clientWidth ?? 1;
    dragStartRef.current = { x: e.clientX, width };
    setIsDragging(true);
    setIsInteracting(true);
  }
  function onPointerMove(e: React.PointerEvent) {
    const start = dragStartRef.current;
    if (!start) return;
    let delta = e.clientX - start.x;
    // Rubber-band resistance past the first/last slide — the further you pull,
    // the less it moves, giving a soft bounce feel instead of a hard stop.
    const atStart = index === 0 && delta > 0;
    const atEnd = index === count - 1 && delta < 0;
    if (atStart || atEnd) delta *= 0.35;
    setDragPx(delta);
  }
  function endDrag() {
    const start = dragStartRef.current;
    if (start) {
      const threshold = start.width * 0.15;
      if (dragPx <= -threshold) goTo(index + 1);
      else if (dragPx >= threshold) goTo(index - 1);
    }
    dragStartRef.current = null;
    setIsDragging(false);
    setDragPx(0);
    // Small delay before autoplay can resume, so it doesn't immediately jump
    // right after the user lets go.
    setTimeout(() => setIsInteracting(false), 400);
  }

  if (count === 0) return null;

  const translatePercent = -(index * slideWidthPercent);
  const dragPercent = containerRef.current?.clientWidth ? (dragPx / containerRef.current.clientWidth) * 100 : 0;

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden select-none touch-pan-y"
      style={{ borderRadius }}
      onMouseEnter={() => setIsInteracting(true)}
      onMouseLeave={() => { if (!isDragging) setIsInteracting(false); }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
    >
      <div
        className="flex h-full"
        style={{
          width: `${count * slideWidthPercent}%`,
          transform: `translateX(calc(${translatePercent}% + ${dragPercent}%))`,
          transition: isDragging ? "none" : "transform 300ms cubic-bezier(0.22, 1, 0.36, 1)",
        }}
      >
        {slides.map((slide, i) => (
          <div key={slide.id} className="h-full shrink-0" style={{ width: `${100 / count}%` }}>
            <div className="relative w-full h-full flex flex-col md:flex-row bg-gray-900">
              <div className="relative w-full h-[45%] md:h-full md:w-1/2 order-1 md:order-2 overflow-hidden">
                {slide.imageUrl ? (
                  <img
                    src={slide.imageUrl}
                    alt=""
                    loading={i === 0 ? "eager" : "lazy"}
                    draggable={false}
                    className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-800 text-white/30">
                    <ImageIcon className="h-10 w-10" />
                  </div>
                )}
                <div className="absolute inset-0 pointer-events-none" style={{ backgroundColor: `rgba(0,0,0,${(overlayOpacity ?? 35) / 100})` }} />
              </div>
              <div className="relative w-full flex-1 md:h-full md:w-1/2 order-2 md:order-1 flex flex-col justify-center gap-2 md:gap-3 p-5 md:p-10 bg-gray-900">
                {slide.headline && (
                  <h2 className="text-xl sm:text-2xl md:text-4xl font-bold" style={{ color: headlineColor ?? "#ffffff" }}>
                    {slide.headline}
                  </h2>
                )}
                {slide.subtext && (
                  <p className="text-sm md:text-base line-clamp-2" style={{ color: subtextColor ?? "#f3f4f6" }}>
                    {slide.subtext}
                  </p>
                )}
                {slide.buttonLabel && (
                  <a
                    href={slide.buttonLink || undefined}
                    onClick={(e) => { if (isDragging) e.preventDefault(); }}
                    className="mt-2 inline-block w-full sm:w-fit text-center px-6 py-3 md:px-5 md:py-2.5 rounded-md text-base md:text-sm font-semibold transition-transform active:scale-[0.98]"
                    style={{ backgroundColor: ctaBgColor ?? "#ffffff", color: ctaFontColor ?? "#111111" }}
                  >
                    {slide.buttonLabel}
                  </a>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {showArrows && count > 1 && (
        <>
          <button
            type="button"
            aria-label="Previous slide"
            onClick={() => goTo(index - 1)}
            className="hidden md:flex absolute left-3 top-1/2 -translate-y-1/2 z-20 h-9 w-9 rounded-full bg-white/80 hover:bg-white items-center justify-center shadow"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="Next slide"
            onClick={() => goTo(index + 1)}
            className="hidden md:flex absolute right-3 top-1/2 -translate-y-1/2 z-20 h-9 w-9 rounded-full bg-white/80 hover:bg-white items-center justify-center shadow"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </>
      )}

      {showDots && count > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2.5">
          <div className="flex items-center gap-1.5">
            {slides.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Go to slide ${i + 1}`}
                onClick={() => goTo(i)}
                className={`h-1.5 rounded-full transition-all ${i === index ? "w-4 bg-white" : "w-1.5 bg-white/50"}`}
              />
            ))}
          </div>
          <span className="text-[11px] text-white/90 bg-black/30 px-1.5 py-0.5 rounded">{index + 1}/{count}</span>
        </div>
      )}
    </div>
  );
}
