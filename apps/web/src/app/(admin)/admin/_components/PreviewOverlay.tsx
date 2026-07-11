"use client";

import { useEffect, useRef, useState } from "react";
import { Monitor, Smartphone, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PreviewCanvas, type PageComponent } from "./PageEditor";

const DESKTOP_W = 1920;
const MOBILE_W = 375;

export interface PreviewZonePayload {
  components: PageComponent[];
  height: number;
}

// One header or footer block — any of 4 sides, see lib/page-template-zones.ts.
export interface PreviewBlockPayload {
  id: string;
  kind: "header" | "footer";
  dock: "top" | "bottom" | "left" | "right";
  size: number;
  rotation: number;
  bgColor: string;
  hideOnScrollUpPx: number | null;
  hideOnScrollDownPx: number | null;
  components: PageComponent[];
}

// Shaped exactly like the existing pageConfigPayload / GET /page-config/:page
// response — a plain page-data object, not PageEditor's own live local state,
// so this component can render *any* page (e.g. a folder's root page fetched
// fresh for a Pages-panel Preview click), not just the one currently open.
export interface PreviewPageData {
  blocks: { desktop: PreviewBlockPayload[]; mobile: PreviewBlockPayload[] };
  template: { desktop: PreviewZonePayload; mobile: PreviewZonePayload };
}

export interface PreviewSiteSettings {
  logoUrl: string | null;
  logoWidth: number;
  logoAlign: "left" | "center" | "right";
  logoLink: string;
}

// Tracks raw scroll position + direction once (not per-block) — each block
// independently derives its own hidden/shown state from this via
// isBlockHidden() below, so an arbitrary number of blocks can each have their
// own independent hide-on-scroll thresholds without one hook per block
// (which the rules of hooks wouldn't allow for a dynamic-length block list).
function useScrollState(scrollRef: { current: HTMLDivElement | null }) {
  const [state, setState] = useState({ y: 0, direction: "down" as "up" | "down", directionChangeY: 0 });
  const lastY = useRef(0);
  const directionChangeY = useRef(0);
  const direction = useRef<"up" | "down">("down");

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    function onScroll() {
      const y = el!.scrollTop;
      const newDirection = y > lastY.current ? "down" : y < lastY.current ? "up" : direction.current;
      if (newDirection !== direction.current) {
        direction.current = newDirection;
        directionChangeY.current = lastY.current;
      }
      lastY.current = y;
      setState({ y, direction: newDirection, directionChangeY: directionChangeY.current });
    }
    el.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => el.removeEventListener("scroll", onScroll);
  }, [scrollRef]);

  return state;
}

function isBlockHidden(scroll: { y: number; direction: "up" | "down"; directionChangeY: number }, hideDownPx: number | null, hideUpPx: number | null): boolean {
  if (scroll.direction === "down" && typeof hideDownPx === "number") return scroll.y - scroll.directionChangeY > hideDownPx;
  if (scroll.direction === "up" && typeof hideUpPx === "number") return scroll.directionChangeY - scroll.y > hideUpPx;
  return false;
}

// Renders a block (header/footer children) with rotation applied to the
// block's own outer bar ONLY — the inner wrapper carries an equal-and-
// opposite counter-rotation so the children inside always stay upright,
// regardless of what the outer bar's rotation is doing.
function RotatableBlock({ components, canvasW, canvasH, rotation, bgColor, logoUrl }: { components: PageComponent[]; canvasW: number; canvasH: number; rotation: number; bgColor?: string; logoUrl?: string | null }) {
  if (!rotation) return <PreviewCanvas components={components} canvasW={canvasW} canvasH={canvasH} logoUrl={logoUrl} />;
  return (
    <div className="relative shadow-sm mx-auto" style={{ width: "100%", maxWidth: canvasW, aspectRatio: `${canvasW} / ${canvasH}`, transform: `rotate(${rotation}deg)`, transformOrigin: "center", backgroundColor: bgColor ?? "#ffffff" }}>
      <div className="absolute inset-0" style={{ transform: `rotate(${-rotation}deg)`, transformOrigin: "center" }}>
        <PreviewCanvas components={components} canvasW={canvasW} canvasH={canvasH} logoUrl={logoUrl} />
      </div>
    </div>
  );
}

// Standalone Preview overlay chrome — extracted from PageEditor.tsx's former
// inline Preview overlay. That version closed over ~10 pieces of PageEditor's
// own local state (view, canvasW, zoneComponents, zoneHeights, siteSettings,
// headerSticky, etc.); this one takes a plain data object instead, so any
// caller (the folder-level Preview button in the Pages panel) can use it
// without opening the page in the editor first. Owns its own desktop/mobile
// toggle since there's no longer a shared editor `view` to inherit.
export function PreviewOverlay({
  pageData,
  siteSettings,
  title,
  onClose,
  actions,
  statusBanner,
  footerNote = "Preview only — publish the folder to make it live.",
}: {
  pageData: PreviewPageData;
  siteSettings: PreviewSiteSettings;
  title: string;
  onClose: () => void;
  actions?: React.ReactNode;
  statusBanner?: React.ReactNode;
  footerNote?: string;
}) {
  const [view, setView] = useState<"desktop" | "mobile">("desktop");
  const scrollRef = useRef<HTMLDivElement>(null);
  const canvasW = view === "desktop" ? DESKTOP_W : MOBILE_W;
  const scroll = useScrollState(scrollRef);

  const blocks = pageData.blocks[view];
  const templateZone = pageData.template[view];
  const topBlocks = blocks.filter((b) => b.dock === "top");
  const bottomBlocks = blocks.filter((b) => b.dock === "bottom");
  const leftBlocks = blocks.filter((b) => b.dock === "left");
  const rightBlocks = blocks.filter((b) => b.dock === "right");
  const totalHeight = topBlocks.reduce((s, b) => s + b.size, 0) + templateZone.height + bottomBlocks.reduce((s, b) => s + b.size, 0);

  function renderStack(list: PreviewBlockPayload[], edge: "top" | "bottom" | "left" | "right") {
    let offset = 0;
    return list.map((b) => {
      const hidden = isBlockHidden(scroll, b.hideOnScrollDownPx, b.hideOnScrollUpPx);
      const isVertical = edge === "left" || edge === "right";
      // Same rule as the live site (PageRenderer.tsx's DockedBlock): top/left/
      // right blocks are always sticky; a bottom block only goes sticky when
      // it actually has a hide-on-scroll threshold set, otherwise it just
      // sits in normal flow at the natural end of the page.
      const isSticky = edge !== "bottom" || b.hideOnScrollDownPx != null || b.hideOnScrollUpPx != null;
      const style: React.CSSProperties = {
        position: isSticky ? "sticky" : "static",
        zIndex: 40,
        backgroundColor: b.bgColor,
        transition: "transform 0.25s ease",
        ...(isSticky && edge === "top" ? { top: offset } : {}),
        ...(isSticky && edge === "bottom" ? { bottom: offset } : {}),
        ...(edge === "left" ? { left: 0, ...(isSticky ? { top: offset } : {}), float: "left" as const } : {}),
        ...(edge === "right" ? { right: 0, ...(isSticky ? { top: offset } : {}), float: "right" as const } : {}),
        transform: isSticky && hidden
          ? (edge === "top" ? "translateY(-100%)" : edge === "bottom" ? "translateY(100%)" : edge === "left" ? "translateX(-100%)" : "translateX(100%)")
          : "translate(0,0)",
      };
      offset += isVertical ? 0 : b.size;
      const blockCanvasW = isVertical ? b.size : canvasW;
      const blockCanvasH = isVertical ? totalHeight : b.size;
      return (
        <div key={b.id} style={style} className="relative">
          <RotatableBlock components={b.components} canvasW={blockCanvasW} canvasH={blockCanvasH} rotation={b.rotation} bgColor={b.bgColor} logoUrl={siteSettings.logoUrl} />
        </div>
      );
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      <div className="flex items-center gap-3 px-5 py-3 border-b bg-background shrink-0">
        <div className="flex items-center gap-2">
          {view === "desktop" ? <Monitor className="h-4 w-4 text-muted-foreground" /> : <Smartphone className="h-4 w-4 text-muted-foreground" />}
          <span className="font-semibold text-sm">{title} · {view === "desktop" ? "Desktop" : "Mobile"}</span>
          <span className="text-xs text-muted-foreground">
            ({canvasW} × {Math.round(totalHeight)} px)
          </span>
        </div>
        <div className="flex items-center gap-1 ml-2">
          <button type="button" title="Desktop" onClick={() => setView("desktop")}
            className={`p-1.5 rounded ${view === "desktop" ? "bg-muted" : "hover:bg-muted/60 text-muted-foreground"}`}>
            <Monitor className="h-3.5 w-3.5" />
          </button>
          <button type="button" title="Mobile" onClick={() => setView("mobile")}
            className={`p-1.5 rounded ${view === "mobile" ? "bg-muted" : "hover:bg-muted/60 text-muted-foreground"}`}>
            <Smartphone className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={onClose}>
            <Pencil className="h-3.5 w-3.5" /> Close
          </Button>
          {actions}
        </div>
      </div>
      {statusBanner}
      <div ref={scrollRef} className="flex-1 overflow-auto bg-gray-100 p-4">
        <div style={view === "mobile" ? { maxWidth: 375, margin: "0 auto" } : undefined}>
          {/* Left/right rails float alongside the top/template/bottom column —
              sticky-positioned so they track the scroll like a fixed sidebar
              without needing real position:fixed (which would escape this
              overlay's own scroll container). */}
          {renderStack(leftBlocks, "left")}
          {renderStack(rightBlocks, "right")}
          {renderStack(topBlocks, "top")}
          <PreviewCanvas components={templateZone.components} canvasW={canvasW} canvasH={templateZone.height} logoUrl={siteSettings.logoUrl} />
          {renderStack(bottomBlocks, "bottom")}
          <div style={{ clear: "both" }} />
        </div>
        <p className="text-center text-xs text-muted-foreground mt-3 select-none">{footerNote}</p>
      </div>
    </div>
  );
}
