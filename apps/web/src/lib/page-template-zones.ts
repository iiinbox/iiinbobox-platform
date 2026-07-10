// Header/Footer no longer live as separate top-level fields in a page's
// config — they're optional "header-block"/"footer-block" components INSIDE
// template.components, each carrying its own `children` (the actual header/
// footer content, positioned in its own local coordinate space, same
// convention the old separate header/footer zones already used). This file
// is the single place that converts between that storage shape and the
// simpler {header, template, footer} shape the editor's zone-based UI and
// the live renderer both want to work with — so extraction/reconstruction
// logic exists exactly once, shared by PageEditor.tsx, the folder Preview
// fetch, and PageRenderer.tsx.

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
}

export interface RawTemplateZone {
  components?: ZoneComponent[];
  height?: number;
}

export interface ExtractedBlockZone {
  components: ZoneComponent[];
  height: number;
  rotation: number;
  hideOnScrollUpPx: number | null;
  hideOnScrollDownPx: number | null;
  blockId: string | null;
}

export interface ExtractedZones {
  header: ExtractedBlockZone;
  footer: ExtractedBlockZone;
  template: { components: ZoneComponent[]; height: number };
}

function emptyBlock(): ExtractedBlockZone {
  return { components: [], height: 0, rotation: 0, hideOnScrollUpPx: null, hideOnScrollDownPx: null, blockId: null };
}

// Reads a page's template zone (the ONLY zone left in storage) and pulls the
// optional header-block/footer-block out of it, un-shifting the remaining
// components' y-position by the header's height so "template content" keeps
// its own 0-based coordinate space — same as before header/footer moved in.
export function extractZonesFromTemplate(templateZone: RawTemplateZone | undefined, defaultTemplateHeight: number): ExtractedZones {
  const components = Array.isArray(templateZone?.components) ? templateZone!.components : [];
  const headerBlock = components.find((c) => c?.type === "header-block") ?? null;
  const footerBlock = components.find((c) => c?.type === "footer-block") ?? null;
  const headerHeight = typeof headerBlock?.height === "number" ? headerBlock.height : 0;
  const footerHeight = typeof footerBlock?.height === "number" ? footerBlock.height : 0;
  const rest = components.filter((c) => c?.type !== "header-block" && c?.type !== "footer-block");
  const shifted = headerHeight ? rest.map((c) => ({ ...c, y: c.y - headerHeight })) : rest;
  const totalHeight = typeof templateZone?.height === "number" ? templateZone.height : defaultTemplateHeight;

  const header = headerBlock
    ? {
        components: Array.isArray(headerBlock.children) ? (headerBlock.children as ZoneComponent[]) : [],
        height: headerHeight,
        rotation: typeof headerBlock.rotation === "number" ? headerBlock.rotation : 0,
        hideOnScrollUpPx: typeof headerBlock.hideOnScrollUpPx === "number" ? headerBlock.hideOnScrollUpPx : null,
        hideOnScrollDownPx: typeof headerBlock.hideOnScrollDownPx === "number" ? headerBlock.hideOnScrollDownPx : null,
        blockId: typeof headerBlock.id === "string" ? headerBlock.id : null,
      }
    : emptyBlock();
  const footer = footerBlock
    ? {
        components: Array.isArray(footerBlock.children) ? (footerBlock.children as ZoneComponent[]) : [],
        height: footerHeight,
        rotation: typeof footerBlock.rotation === "number" ? footerBlock.rotation : 0,
        hideOnScrollUpPx: typeof footerBlock.hideOnScrollUpPx === "number" ? footerBlock.hideOnScrollUpPx : null,
        hideOnScrollDownPx: typeof footerBlock.hideOnScrollDownPx === "number" ? footerBlock.hideOnScrollDownPx : null,
        blockId: typeof footerBlock.id === "string" ? footerBlock.id : null,
      }
    : emptyBlock();

  return { header, footer, template: { components: shifted, height: Math.max(0, totalHeight - headerHeight - footerHeight) } };
}

export interface BuildTemplateOpts {
  hasHeader: boolean;
  header: { components: ZoneComponent[]; height: number; rotation: number; hideOnScrollUpPx: number | null; hideOnScrollDownPx: number | null; blockId: string | null };
  hasFooter: boolean;
  footer: { components: ZoneComponent[]; height: number; rotation: number; hideOnScrollUpPx: number | null; hideOnScrollDownPx: number | null; blockId: string | null };
  templateComponents: ZoneComponent[];
  templateHeight: number;
  canvasWidth: number;
  newId: () => string;
}

// Inverse of extractZonesFromTemplate — reconstructs the single
// template.components array (with header/footer blocks re-shifted back into
// the shared coordinate space) for saving. Header/footer blocks always span
// the full canvas width numerically (same convention every other component's
// `width` already uses — not a "100%" string), matching canvasWidth for
// whichever viewport (desktop/mobile) this call is building.
export function buildTemplateZone(opts: BuildTemplateOpts): { components: ZoneComponent[]; height: number } {
  const headerShift = opts.hasHeader ? opts.header.height : 0;
  const shiftedTemplate = headerShift ? opts.templateComponents.map((c) => ({ ...c, y: c.y + headerShift })) : opts.templateComponents;
  const result: ZoneComponent[] = [];
  if (opts.hasHeader) {
    result.push({
      id: opts.header.blockId ?? opts.newId(),
      type: "header-block",
      x: 0, y: 0, width: opts.canvasWidth, height: opts.header.height, rotation: opts.header.rotation,
      children: opts.header.components,
      hideOnScrollUpPx: opts.header.hideOnScrollUpPx,
      hideOnScrollDownPx: opts.header.hideOnScrollDownPx,
    } as ZoneComponent);
  }
  result.push(...shiftedTemplate);
  if (opts.hasFooter) {
    result.push({
      id: opts.footer.blockId ?? opts.newId(),
      type: "footer-block",
      x: 0, y: headerShift + opts.templateHeight, width: opts.canvasWidth, height: opts.footer.height, rotation: opts.footer.rotation,
      children: opts.footer.components,
      hideOnScrollUpPx: opts.footer.hideOnScrollUpPx,
      hideOnScrollDownPx: opts.footer.hideOnScrollDownPx,
    } as ZoneComponent);
  }
  return { components: result, height: headerShift + opts.templateHeight + (opts.hasFooter ? opts.footer.height : 0) };
}
