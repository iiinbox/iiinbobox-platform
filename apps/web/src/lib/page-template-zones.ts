// Header/Footer no longer live as separate top-level fields in a page's
// config — they're optional "header-block"/"footer-block" components INSIDE
// template.components, each carrying its own `children` (the actual header/
// footer content, positioned in its own local coordinate space, same
// convention the old separate header/footer zones already used). This file
// is the single place that converts between that storage shape and the
// simpler {blocks, template} shape the editor's zone-based UI and the live
// renderer both want to work with — so extraction/reconstruction logic
// exists exactly once, shared by PageEditor.tsx, the folder Preview fetch,
// and PageRenderer.tsx.
//
// Multi-block / any-side redesign: a page can now have any number of header
// and footer blocks, each independently "docked" to one of the 4 canvas
// edges (`dock`). Kind ("header" vs "footer") is purely a UI/labeling
// distinction (which "+ Add" button created it, how it's named in the tree)
// — for layout purposes every block behaves identically regardless of kind,
// governed entirely by its own `dock`. Legacy pages saved before this
// existed have at most one header-block/footer-block with no `dock` field —
// those default to dock:"top"/"bottom" respectively, so old pages keep
// rendering pixel-identical to before.

export type Dock = "top" | "bottom" | "left" | "right";

// Deliberately no index signature — an index signature would force every
// caller's richer component type (PageComponent, with dozens of optional
// styling fields) to also declare one just to satisfy assignability here.
// Only the fields this module actually reads/writes are listed.
export interface ZoneComponent {
  id: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  children?: ZoneComponent[];
  hideOnScrollUpPx?: number | null;
  hideOnScrollDownPx?: number | null;
  dock?: Dock;
  bgColor?: string;
}

export interface RawTemplateZone {
  components?: ZoneComponent[];
  height?: number;
}

// One header or footer block, fully self-contained.
export interface HeaderFooterBlock {
  id: string;
  kind: "header" | "footer";
  dock: Dock;
  // Thickness along the dock axis — height for top/bottom, width for left/right.
  size: number;
  rotation: number;
  bgColor: string;
  hideOnScrollUpPx: number | null;
  hideOnScrollDownPx: number | null;
  components: ZoneComponent[];
}

export interface ExtractedZones {
  blocks: HeaderFooterBlock[];
  template: { components: ZoneComponent[]; height: number };
}

const DEFAULT_BLOCK_BG = "#ffffff";

// Reads a page's template zone (the ONLY zone left in storage) and pulls
// every header-block/footer-block out of it, un-shifting the remaining
// components' x/y by the combined inset of top/left-docked blocks so
// "template content" keeps its own 0-based coordinate space — same principle
// as the original single-header/footer version, generalized to N blocks per
// side. Only top/bottom-docked blocks affect the template's vertical extent
// (and thus its stored `height`); left/right-docked blocks overlay the
// template horizontally at render time without shrinking its own coordinate
// space (see buildTemplateZone below and PageRenderer's fixed positioning).
export function extractZonesFromTemplate(templateZone: RawTemplateZone | undefined, defaultTemplateHeight: number): ExtractedZones {
  const components = Array.isArray(templateZone?.components) ? templateZone!.components : [];
  const blockComps = components.filter((c) => c?.type === "header-block" || c?.type === "footer-block");
  const rest = components.filter((c) => c?.type !== "header-block" && c?.type !== "footer-block");

  const blocks: HeaderFooterBlock[] = blockComps.map((c) => {
    const kind: "header" | "footer" = c.type === "footer-block" ? "footer" : "header";
    const dock: Dock = c.dock ?? (kind === "footer" ? "bottom" : "top");
    // Legacy blocks stored size as height regardless of dock (dock didn't
    // exist yet, so it was always top/bottom); for those, height IS the size.
    const size = dock === "left" || dock === "right" ? c.width : c.height;
    return {
      id: c.id,
      kind,
      dock,
      size: typeof size === "number" ? size : 60,
      rotation: typeof c.rotation === "number" ? c.rotation : 0,
      bgColor: typeof c.bgColor === "string" ? c.bgColor : DEFAULT_BLOCK_BG,
      hideOnScrollUpPx: typeof c.hideOnScrollUpPx === "number" ? c.hideOnScrollUpPx : null,
      hideOnScrollDownPx: typeof c.hideOnScrollDownPx === "number" ? c.hideOnScrollDownPx : null,
      components: Array.isArray(c.children) ? c.children : [],
    };
  });

  const topInset = blocks.filter((b) => b.dock === "top").reduce((sum, b) => sum + b.size, 0);
  const bottomInset = blocks.filter((b) => b.dock === "bottom").reduce((sum, b) => sum + b.size, 0);
  const shifted = topInset ? rest.map((c) => ({ ...c, y: c.y - topInset })) : rest;
  const totalHeight = typeof templateZone?.height === "number" ? templateZone.height : defaultTemplateHeight;

  return { blocks, template: { components: shifted, height: Math.max(0, totalHeight - topInset - bottomInset) } };
}

export interface BuildTemplateOpts {
  blocks: HeaderFooterBlock[];
  templateComponents: ZoneComponent[];
  templateHeight: number;
  canvasWidth: number;
  canvasHeightHint: number;
  newId: () => string;
}

// Inverse of extractZonesFromTemplate — reconstructs the single
// template.components array (with template content re-shifted back into the
// shared coordinate space) for saving. Top/bottom blocks always span the
// full canvas width; left/right blocks always span the full canvas height
// (canvasHeightHint — the template's own height plus top/bottom insets,
// since a left/right rail runs the full page length, not just alongside the
// template body).
export function buildTemplateZone(opts: BuildTemplateOpts): { components: ZoneComponent[]; height: number } {
  const topInset = opts.blocks.filter((b) => b.dock === "top").reduce((sum, b) => sum + b.size, 0);
  const bottomInset = opts.blocks.filter((b) => b.dock === "bottom").reduce((sum, b) => sum + b.size, 0);
  const shiftedTemplate = topInset ? opts.templateComponents.map((c) => ({ ...c, y: c.y + topInset })) : opts.templateComponents;

  const result: ZoneComponent[] = [];
  let topOffset = 0, bottomOffset = 0, leftOffset = 0, rightOffset = 0;
  const totalHeight = topInset + opts.templateHeight + bottomInset;
  for (const b of opts.blocks) {
    const isVertical = b.dock === "left" || b.dock === "right";
    const width = isVertical ? b.size : opts.canvasWidth;
    const height = isVertical ? Math.max(opts.canvasHeightHint, totalHeight) : b.size;
    let x = 0, y = 0;
    if (b.dock === "top") { y = topOffset; topOffset += b.size; }
    else if (b.dock === "bottom") { y = totalHeight - bottomOffset - b.size; bottomOffset += b.size; }
    else if (b.dock === "left") { x = leftOffset; leftOffset += b.size; }
    else { x = opts.canvasWidth - rightOffset - b.size; rightOffset += b.size; }
    result.push({
      id: b.id,
      type: b.kind === "footer" ? "footer-block" : "header-block",
      x, y, width, height, rotation: b.rotation,
      dock: b.dock,
      bgColor: b.bgColor,
      children: b.components,
      hideOnScrollUpPx: b.hideOnScrollUpPx,
      hideOnScrollDownPx: b.hideOnScrollDownPx,
    } as ZoneComponent);
  }
  result.push(...shiftedTemplate);
  return { components: result, height: totalHeight };
}
