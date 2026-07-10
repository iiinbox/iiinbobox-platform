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

export interface PreviewBlockZonePayload extends PreviewZonePayload {
  rotation?: number;
  hideOnScrollUpPx?: number | null;
  hideOnScrollDownPx?: number | null;
}

// Shaped exactly like the existing pageConfigPayload / GET /page-config/:page
// response — a plain page-data object, not PageEditor's own live local state,
// so this component can render *any* page (e.g. a folder's root page fetched
// fresh for a Pages-panel Preview click), not just the one currently open.
export interface PreviewPageData {
  header: { desktop: PreviewBlockZonePayload; mobile: PreviewBlockZonePayload };
  template: { desktop: PreviewZonePayload; mobile: PreviewZonePayload };
  footer: { desktop: PreviewBlockZonePayload; mobile: PreviewBlockZonePayload };
}

export interface PreviewSiteSettings {
  logoUrl: string | null;
  logoWidth: number;
  logoAlign: "left" | "center" | "right";
  logoLink: string;
}

// Tracks scroll direction to drive two INDEPENDENT hide thresholds (hide
// after scrolling down past X px vs. hide after scrolling up past Y px from
// wherever the direction last flipped) — replaces the old single sticky+
// hideAfterPx pair. Either, both, or neither threshold can be enabled
// (null = that direction never hides it).
function useScrollHide(scrollRef: { current: HTMLDivElement | null }, hideDownPx: number | null | undefined, hideUpPx: number | null | undefined) {
  const [hidden, setHidden] = useState(false);
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
      if (newDirection === "down" && typeof hideDownPx === "number") {
        setHidden(y - directionChangeY.current > hideDownPx);
      } else if (newDirection === "up" && typeof hideUpPx === "number") {
        setHidden(directionChangeY.current - y > hideUpPx);
      } else {
        setHidden(false);
      }
    }
    el.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => el.removeEventListener("scroll", onScroll);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hideDownPx, hideUpPx]);

  return hidden;
}

// Renders a block (header/footer children) with rotation applied to the
// block's own outer bar ONLY — the inner wrapper carries an equal-and-
// opposite counter-rotation so the children inside always stay upright,
// regardless of what the outer bar's rotation is doing.
function RotatableBlock({ components, canvasW, canvasH, rotation }: { components: PageComponent[]; canvasW: number; canvasH: number; rotation: number }) {
  if (!rotation) return <PreviewCanvas components={components} canvasW={canvasW} canvasH={canvasH} />;
  return (
    <div className="relative bg-white shadow-sm mx-auto" style={{ width: "100%", maxWidth: canvasW, aspectRatio: `${canvasW} / ${canvasH}`, transform: `rotate(${rotation}deg)`, transformOrigin: "center" }}>
      <div className="absolute inset-0" style={{ transform: `rotate(${-rotation}deg)`, transformOrigin: "center" }}>
        <PreviewCanvas components={components} canvasW={canvasW} canvasH={canvasH} />
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
  const headerHidden = useScrollHide(scrollRef, pageData.header[view].hideOnScrollDownPx, pageData.header[view].hideOnScrollUpPx);
  const footerHidden = useScrollHide(scrollRef, pageData.footer[view].hideOnScrollDownPx, pageData.footer[view].hideOnScrollUpPx);

  const zoneHeights = {
    header: { desktop: pageData.header.desktop.height, mobile: pageData.header.mobile.height },
    template: { desktop: pageData.template.desktop.height, mobile: pageData.template.mobile.height },
    footer: { desktop: pageData.footer.desktop.height, mobile: pageData.footer.mobile.height },
  };
  const zoneComponents = {
    header: { desktop: pageData.header.desktop.components, mobile: pageData.header.mobile.components },
    template: { desktop: pageData.template.desktop.components, mobile: pageData.template.mobile.components },
    footer: { desktop: pageData.footer.desktop.components, mobile: pageData.footer.mobile.components },
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      <div className="flex items-center gap-3 px-5 py-3 border-b bg-background shrink-0">
        <div className="flex items-center gap-2">
          {view === "desktop" ? <Monitor className="h-4 w-4 text-muted-foreground" /> : <Smartphone className="h-4 w-4 text-muted-foreground" />}
          <span className="font-semibold text-sm">{title} · {view === "desktop" ? "Desktop" : "Mobile"}</span>
          <span className="text-xs text-muted-foreground">
            ({canvasW} × {Math.round(zoneHeights.header[view] + zoneHeights.template[view] + zoneHeights.footer[view])} px)
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
          {zoneComponents.header[view].length > 0 && (
            <div style={{ position: "sticky", top: 0, zIndex: 40, transform: headerHidden ? "translateY(-100%)" : "translateY(0)", transition: "transform 0.25s ease" }}>
              <div className="relative">
                <RotatableBlock components={zoneComponents.header[view]} canvasW={canvasW} canvasH={zoneHeights.header[view]} rotation={pageData.header[view].rotation ?? 0} />
                {siteSettings.logoUrl && (
                  <a
                    href={siteSettings.logoLink || "/"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute z-30 top-1/2"
                    style={{
                      left: siteSettings.logoAlign === "left" ? "2%" : siteSettings.logoAlign === "center" ? "50%" : undefined,
                      right: siteSettings.logoAlign === "right" ? "2%" : undefined,
                      transform: siteSettings.logoAlign === "center" ? "translate(-50%, -50%)" : "translateY(-50%)",
                    }}
                  >
                    <img src={siteSettings.logoUrl} alt="Logo" style={{ width: `${(siteSettings.logoWidth / canvasW) * 100}%`, height: "auto", display: "block" }} />
                  </a>
                )}
              </div>
            </div>
          )}
          <PreviewCanvas components={zoneComponents.template[view]} canvasW={canvasW} canvasH={zoneHeights.template[view]} />
          {zoneComponents.footer[view].length > 0 && (
            // Sticky-to-bottom only kicks in when a hide-on-scroll threshold is
            // actually set — see the matching comment in PageRenderer.tsx's
            // RenderedPage. Otherwise the footer just sits in normal flow,
            // matching what this app has always done.
            pageData.footer[view].hideOnScrollDownPx != null || pageData.footer[view].hideOnScrollUpPx != null ? (
              <div style={{ position: "sticky", bottom: 0, zIndex: 40, transform: footerHidden ? "translateY(100%)" : "translateY(0)", transition: "transform 0.25s ease" }}>
                <RotatableBlock components={zoneComponents.footer[view]} canvasW={canvasW} canvasH={zoneHeights.footer[view]} rotation={pageData.footer[view].rotation ?? 0} />
              </div>
            ) : (
              <RotatableBlock components={zoneComponents.footer[view]} canvasW={canvasW} canvasH={zoneHeights.footer[view]} rotation={pageData.footer[view].rotation ?? 0} />
            )
          )}
        </div>
        <p className="text-center text-xs text-muted-foreground mt-3 select-none">{footerNote}</p>
      </div>
    </div>
  );
}
