"use client";

import { memo } from "react";
import { PreviewCanvas, type PageComponent } from "./PageEditor";

// Renders a template's real components at a small, fixed pixel width via a
// CSS transform (not a % width) — PreviewCanvas measures its own rendered
// clientWidth to size text (see PageEditor.tsx), so a plain responsive
// shrink would leave fonts oversized relative to a tiny card. Rendering at
// native canvasW inside a scaled wrapper keeps text/shapes proportional
// without any DOM measurement, ResizeObserver, or post-mount re-render —
// deterministic and SSR-safe. The container is a fixed THUMB_WIDTH px (not
// responsive) so this scale factor always matches what actually renders.
export const TEMPLATE_THUMB_WIDTH = 280;

interface TemplateThumbnailProps {
  components: PageComponent[];
  canvasW: number;
  canvasH: number;
}

// memo: NewPageDialog re-renders on every keystroke in its "Page Name" input
// (same component tree as the gallery grid). Template props are referentially
// stable (same array/numbers from static template data each render), so
// without memo every thumbnail — a full PreviewCanvas, including any
// carousel/hero-carousel sub-components with their own measurement effects —
// was being reconciled on every keystroke for no reason. This makes typing
// the page name skip that work entirely.
export const TemplateThumbnail = memo(function TemplateThumbnail({ components, canvasW, canvasH }: TemplateThumbnailProps) {
  const scale = TEMPLATE_THUMB_WIDTH / canvasW;
  const thumbHeight = canvasH * scale;

  return (
    <div
      className="relative overflow-hidden bg-white rounded border border-gray-200"
      style={{ width: TEMPLATE_THUMB_WIDTH, height: thumbHeight }}
    >
      <div
        className="absolute top-0 left-0 origin-top-left pointer-events-none"
        style={{ width: canvasW, height: canvasH, transform: `scale(${scale})` }}
      >
        <PreviewCanvas components={components} canvasW={canvasW} canvasH={canvasH} />
      </div>
    </div>
  );
});
