"use client";

import { useEffect, useRef, useState } from "react";

// Keeps the header/footer pinned to the viewport edge while scrolling, then
// slides away once one of two INDEPENDENT scroll-direction thresholds is
// crossed — hideOnScrollDownPx (hide after scrolling down past X px) and
// hideOnScrollUpPx (hide after scrolling up past Y px from wherever the
// direction last flipped). Either, both, or neither can be set (null = that
// direction never hides it). Mirrored in the editor's own Preview overlay
// (PreviewOverlay.tsx's useScrollHide) so both stay behaviorally identical —
// this one tracks window.scrollY since the live page scrolls the window, not
// an inner container.
export function StickyHeader({
  hideOnScrollDownPx,
  hideOnScrollUpPx,
  edge = "top",
  children,
}: {
  hideOnScrollDownPx?: number | null;
  hideOnScrollUpPx?: number | null;
  edge?: "top" | "bottom";
  children: React.ReactNode;
}) {
  const [hidden, setHidden] = useState(false);
  const lastY = useRef(0);
  const directionChangeY = useRef(0);
  const direction = useRef<"up" | "down">("down");

  useEffect(() => {
    function onScroll() {
      const y = window.scrollY;
      const newDirection = y > lastY.current ? "down" : y < lastY.current ? "up" : direction.current;
      if (newDirection !== direction.current) {
        direction.current = newDirection;
        directionChangeY.current = lastY.current;
      }
      lastY.current = y;
      if (newDirection === "down" && typeof hideOnScrollDownPx === "number") {
        setHidden(y - directionChangeY.current > hideOnScrollDownPx);
      } else if (newDirection === "up" && typeof hideOnScrollUpPx === "number") {
        setHidden(directionChangeY.current - y > hideOnScrollUpPx);
      } else {
        setHidden(false);
      }
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [hideOnScrollDownPx, hideOnScrollUpPx]);

  return (
    <div
      style={{
        position: "sticky",
        [edge]: 0,
        zIndex: 40,
        transform: hidden ? `translateY(${edge === "top" ? "-100%" : "100%"})` : "translateY(0)",
        transition: "transform 0.25s ease",
      }}
    >
      {children}
    </div>
  );
}
