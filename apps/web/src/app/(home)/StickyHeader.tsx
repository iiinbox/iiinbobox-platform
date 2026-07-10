"use client";

import { useEffect, useRef, useState } from "react";

// Tracks window scroll position + direction once, shared by every docked
// header/footer block on the page (see PageRenderer.tsx's DockedBlock) — each
// block independently derives its own hidden/shown state from this via
// isDockedBlockHidden() below, so an arbitrary number of blocks can each have
// their own independent hide-on-scroll thresholds without one scroll listener
// (or hook) per block. Mirrored in the editor's own Preview overlay
// (PreviewOverlay.tsx's useScrollState) so both stay behaviorally identical —
// this one tracks window.scrollY since the live page scrolls the window, not
// an inner container.
export function useWindowScrollState() {
  const [state, setState] = useState({ y: 0, direction: "down" as "up" | "down", directionChangeY: 0 });
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
      setState({ y, direction: newDirection, directionChangeY: directionChangeY.current });
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return state;
}

export function isDockedBlockHidden(scroll: { y: number; direction: "up" | "down"; directionChangeY: number }, hideDownPx: number | null | undefined, hideUpPx: number | null | undefined): boolean {
  if (scroll.direction === "down" && typeof hideDownPx === "number") return scroll.y - scroll.directionChangeY > hideDownPx;
  if (scroll.direction === "up" && typeof hideUpPx === "number") return scroll.directionChangeY - scroll.y > hideUpPx;
  return false;
}

// Keeps a single header/footer/side-rail block pinned to its dock edge while
// scrolling, then slides away once one of two INDEPENDENT scroll-direction
// thresholds is crossed — hideOnScrollDownPx (hide after scrolling down past
// X px) and hideOnScrollUpPx (hide after scrolling up past Y px from wherever
// the direction last flipped). Either, both, or neither can be set (null =
// that direction never hides it). `offset` stacks multiple blocks on the same
// edge (e.g. two top headers) without overlapping.
export function StickyHeader({
  hideOnScrollDownPx,
  hideOnScrollUpPx,
  edge = "top",
  offset = 0,
  children,
}: {
  hideOnScrollDownPx?: number | null;
  hideOnScrollUpPx?: number | null;
  edge?: "top" | "bottom" | "left" | "right";
  offset?: number;
  children: React.ReactNode;
}) {
  const scroll = useWindowScrollState();
  const hidden = isDockedBlockHidden(scroll, hideOnScrollDownPx, hideOnScrollUpPx);
  const isVertical = edge === "left" || edge === "right";
  const hideTransform =
    edge === "top" ? "translateY(-100%)" : edge === "bottom" ? "translateY(100%)" : edge === "left" ? "translateX(-100%)" : "translateX(100%)";

  return (
    <div
      style={{
        position: "sticky",
        [edge]: offset,
        ...(isVertical ? { top: offset, height: "100%" } : {}),
        zIndex: 40,
        transform: hidden ? hideTransform : "translate(0,0)",
        transition: "transform 0.25s ease",
        ...(isVertical ? { float: edge as "left" | "right" } : {}),
      }}
    >
      {children}
    </div>
  );
}
