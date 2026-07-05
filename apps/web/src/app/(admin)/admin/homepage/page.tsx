"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Trash2, Image as ImageIcon, Type, Square, Heading, Check,
  Monitor, Smartphone, MousePointerClick, Eye, Pencil, X,
} from "lucide-react";

type ComponentType = "text" | "header" | "shape" | "image" | "button";
type ViewMode = "desktop" | "mobile";
type ButtonStyle = "solid" | "outline" | "ghost" | "link";
type ButtonActionType = "url" | "buy" | "search" | "custom";

interface PageComponent {
  id: string;
  type: ComponentType;
  x: number;
  y: number;
  width: number;
  height: number;
  // text / header / button
  content?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: number;
  lineHeight?: number;
  fontColor?: string;
  italic?: boolean;
  textAlign?: "left" | "center" | "right";
  // legacy compat
  bold?: boolean;
  // shared
  bgColor?: string;
  borderRadius?: number;
  opacity?: number;
  // image
  imageUrl?: string;
  // button-specific
  buttonStyle?: ButtonStyle;
  borderColor?: string;
  hoverBgColor?: string;
  hoverFontColor?: string;
  buttonAction?: { type: ButtonActionType; value: string };
}

const DESKTOP_W = 1920;
const MOBILE_W = 375;
const DEFAULT_DESKTOP_H = 900;
const DEFAULT_MOBILE_H = 812;

function uid() {
  return Math.random().toString(36).slice(2);
}

const FONT_FAMILIES = [
  { label: "Default", value: "system-ui, -apple-system, sans-serif" },
  { label: "Serif", value: "Georgia, 'Times New Roman', serif" },
  { label: "Monospace", value: "ui-monospace, 'Courier New', monospace" },
  { label: "Arial", value: "Arial, Helvetica, sans-serif" },
  { label: "Verdana", value: "Verdana, Geneva, sans-serif" },
  { label: "Impact", value: "Impact, Charcoal, sans-serif" },
  { label: "Trebuchet", value: "'Trebuchet MS', Helvetica, sans-serif" },
  { label: "Palatino", value: "Palatino, 'Palatino Linotype', serif" },
];

const FONT_WEIGHTS = [
  { label: "Thin", value: 100 },
  { label: "Light", value: 300 },
  { label: "Regular", value: 400 },
  { label: "Medium", value: 500 },
  { label: "Semibold", value: 600 },
  { label: "Bold", value: 700 },
  { label: "Extrabold", value: 800 },
  { label: "Black", value: 900 },
];

const BUTTON_ACTIONS: { label: string; value: ButtonActionType }[] = [
  { label: "Link to URL", value: "url" },
  { label: "Buy (product slug)", value: "buy" },
  { label: "Search query", value: "search" },
  { label: "Custom", value: "custom" },
];

function defaults(type: ComponentType, canvasW: number): Partial<PageComponent> {
  switch (type) {
    case "header":
      return { width: Math.round(canvasW * 0.35), height: 70, content: "Heading", fontSize: 36, fontFamily: "system-ui, -apple-system, sans-serif", fontWeight: 700, lineHeight: 1.2, fontColor: "#111111", bgColor: "transparent", italic: false, textAlign: "center" };
    case "text":
      return { width: Math.round(canvasW * 0.22), height: 80, content: "Text block", fontSize: 16, fontFamily: "system-ui, -apple-system, sans-serif", fontWeight: 400, lineHeight: 1.5, fontColor: "#333333", bgColor: "transparent", italic: false, textAlign: "left" };
    case "shape":
      return { width: Math.round(canvasW * 0.12), height: 120, bgColor: "#3b82f6", borderRadius: 8 };
    case "image":
      return { width: Math.round(canvasW * 0.18), height: 180, bgColor: "#e5e7eb", borderRadius: 4 };
    case "button":
      return {
        width: Math.round(canvasW * 0.1),
        height: 56,
        content: "Click me",
        fontSize: 16,
        fontFamily: "system-ui, -apple-system, sans-serif",
        fontWeight: 600,
        fontColor: "#ffffff",
        bgColor: "#3b82f6",
        borderRadius: 8,
        buttonStyle: "solid",
        borderColor: "#3b82f6",
        hoverBgColor: "#2563eb",
        hoverFontColor: "#ffffff",
        buttonAction: { type: "url", value: "" },
      };
  }
}

// ─── Shared button style helper ──────────────────────────────────────────────

function resolveButtonStyles(comp: PageComponent, hovered: boolean, scale: number) {
  const isSolid = !comp.buttonStyle || comp.buttonStyle === "solid";
  const isOutline = comp.buttonStyle === "outline";
  const isGhost = comp.buttonStyle === "ghost";
  const isLink = comp.buttonStyle === "link";

  const bg = hovered && comp.hoverBgColor
    ? comp.hoverBgColor
    : isSolid ? (comp.bgColor ?? "#3b82f6") : "transparent";

  const color = hovered && comp.hoverFontColor
    ? comp.hoverFontColor
    : (comp.fontColor ?? (isSolid ? "#ffffff" : (comp.bgColor ?? "#3b82f6")));

  const border = isOutline || isGhost
    ? `${Math.max(1, Math.round(2 * scale))}px solid ${comp.borderColor ?? comp.bgColor ?? "#3b82f6"}`
    : "none";

  return { bg, color, border, isLink };
}

// ─── Preview canvas (clean read-only render) ──────────────────────────────────

function PreviewCanvas({
  components, canvasW, canvasH,
}: {
  components: PageComponent[];
  canvasW: number;
  canvasH: number;
}) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const scale = ref.current ? ref.current.clientWidth / canvasW : 1;

  const pct = (v: number, total: number) => `${(v / total) * 100}%`;

  return (
    <div
      ref={ref}
      className="relative bg-white shadow-sm mx-auto"
      style={{ width: "100%", maxWidth: canvasW, aspectRatio: `${canvasW} / ${canvasH}` }}
    >
      {components.map((comp) => {
        const isHovered = hoveredId === comp.id;
        const isBtn = comp.type === "button";
        const btn = isBtn ? resolveButtonStyles(comp, isHovered, scale) : null;

        return (
          <div
            key={comp.id}
            className="absolute"
            style={{
              left: pct(comp.x, canvasW),
              top: pct(comp.y, canvasH),
              width: pct(comp.width, canvasW),
              height: pct(comp.height, canvasH),
              borderRadius: isBtn ? 0 : (comp.borderRadius ?? 0),
              backgroundColor: isBtn ? "transparent" : (comp.bgColor === "transparent" ? "transparent" : (comp.bgColor ?? "transparent")),
            }}
            onMouseEnter={() => isBtn && setHoveredId(comp.id)}
            onMouseLeave={() => isBtn && setHoveredId(null)}
          >
            {(comp.type === "text" || comp.type === "header") && (
              <div
                className="w-full h-full flex items-center overflow-hidden px-1"
                style={{
                  fontSize: `calc(${comp.fontSize ?? 16}px * (${ref.current?.clientWidth ?? canvasW} / ${canvasW}))`,
                  fontFamily: comp.fontFamily ?? "system-ui, -apple-system, sans-serif",
                  fontWeight: comp.fontWeight ?? (comp.bold ? 700 : 400),
                  fontStyle: comp.italic ? "italic" : "normal",
                  lineHeight: comp.lineHeight ?? 1.4,
                  color: comp.fontColor ?? "#111",
                  textAlign: comp.textAlign ?? "left",
                  justifyContent: comp.textAlign === "center" ? "center" : comp.textAlign === "right" ? "flex-end" : "flex-start",
                }}
              >
                <span>{comp.content}</span>
              </div>
            )}
            {comp.type === "shape" && <div className="w-full h-full" style={{ borderRadius: comp.borderRadius ?? 0 }} />}
            {comp.type === "image" && (
              comp.imageUrl
                ? <img src={comp.imageUrl} alt="" className="w-full h-full object-cover" style={{ borderRadius: comp.borderRadius ?? 4 }} />
                : <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs gap-1"><ImageIcon className="h-4 w-4" /> Image</div>
            )}
            {isBtn && btn && (
              <div
                className="w-full h-full flex items-center justify-center overflow-hidden cursor-pointer transition-colors duration-150"
                style={{
                  borderRadius: comp.borderRadius ?? 8,
                  backgroundColor: btn.bg,
                  color: btn.color,
                  border: btn.border,
                  textDecoration: btn.isLink ? "underline" : "none",
                  fontSize: `calc(${comp.fontSize ?? 16}px * (${ref.current?.clientWidth ?? canvasW} / ${canvasW}))`,
                  fontFamily: comp.fontFamily ?? "system-ui, -apple-system, sans-serif",
                  fontWeight: comp.fontWeight ?? 600,
                }}
              >
                {comp.content ?? "Button"}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Main editor ─────────────────────────────────────────────────────────────

export default function HomepageEditorPage() {
  const [view, setView] = useState<ViewMode>("desktop");
  const [desktopComponents, setDesktopComponents] = useState<PageComponent[]>([]);
  const [mobileComponents, setMobileComponents] = useState<PageComponent[]>([]);
  const [desktopHeight, setDesktopHeight] = useState(DEFAULT_DESKTOP_H);
  const [mobileHeight, setMobileHeight] = useState(DEFAULT_MOBILE_H);
  const [selected, setSelected] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const canvasW = view === "desktop" ? DESKTOP_W : MOBILE_W;
  const canvasH = view === "desktop" ? desktopHeight : mobileHeight;
  const components = view === "desktop" ? desktopComponents : mobileComponents;

  const dragRef = useRef<{ id: string; startX: number; startY: number; origX: number; origY: number } | null>(null);
  const resizeRef = useRef<{ id: string; startX: number; startY: number; origW: number; origH: number } | null>(null);
  const heightDragRef = useRef<{ startY: number; origH: number } | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  const updateCompRef = useRef<(id: string, patch: Partial<PageComponent>) => void>(() => {});
  const canvasWRef = useRef(canvasW);
  const setHeightRef = useRef<(h: number) => void>(() => {});

  updateCompRef.current = (id, patch) => {
    const setter = view === "desktop" ? setDesktopComponents : setMobileComponents;
    setter((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  };
  canvasWRef.current = canvasW;
  setHeightRef.current = (h: number) => {
    if (view === "desktop") setDesktopHeight(h);
    else setMobileHeight(h);
  };

  const selectedComp = components.find((c) => c.id === selected) ?? null;
  const canvasScale = canvasRef.current ? canvasRef.current.clientWidth / canvasW : 1;

  useEffect(() => {
    fetch("/api/page-config")
      .then((r) => r.json())
      .then((d) => {
        if (d?.desktop) {
          setDesktopComponents(Array.isArray(d.desktop.components) ? d.desktop.components : []);
          setDesktopHeight(typeof d.desktop.height === "number" ? d.desktop.height : DEFAULT_DESKTOP_H);
          setMobileComponents(Array.isArray(d.mobile?.components) ? d.mobile.components : []);
          setMobileHeight(typeof d.mobile?.height === "number" ? d.mobile.height : DEFAULT_MOBILE_H);
        } else if (Array.isArray(d?.components)) {
          setDesktopComponents(d.components);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function addComponent(type: ComponentType) {
    const comp: PageComponent = { id: uid(), type, x: 80, y: 80, ...defaults(type, canvasW) } as PageComponent;
    if (view === "desktop") setDesktopComponents((prev) => [...prev, comp]);
    else setMobileComponents((prev) => [...prev, comp]);
    setSelected(comp.id);
  }

  function updateComp(id: string, patch: Partial<PageComponent>) {
    updateCompRef.current(id, patch);
  }

  function deleteComp(id: string) {
    if (view === "desktop") setDesktopComponents((prev) => prev.filter((c) => c.id !== id));
    else setMobileComponents((prev) => prev.filter((c) => c.id !== id));
    if (selected === id) setSelected(null);
  }

  const onDragStart = useCallback(
    (e: React.MouseEvent, id: string) => {
      e.preventDefault();
      e.stopPropagation();
      const comp = components.find((c) => c.id === id);
      if (!comp) return;
      dragRef.current = { id, startX: e.clientX, startY: e.clientY, origX: comp.x, origY: comp.y };
      setSelected(id);
    },
    [components],
  );

  const onResizeStart = useCallback(
    (e: React.MouseEvent, id: string) => {
      e.preventDefault();
      e.stopPropagation();
      const comp = components.find((c) => c.id === id);
      if (!comp) return;
      resizeRef.current = { id, startX: e.clientX, startY: e.clientY, origW: comp.width, origH: comp.height };
    },
    [components],
  );

  const onHeightDragStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      heightDragRef.current = { startY: e.clientY, origH: canvasWRef.current === DESKTOP_W ? desktopHeight : mobileHeight };
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [desktopHeight, mobileHeight],
  );

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const scale = canvasRef.current ? canvasRef.current.clientWidth / canvasWRef.current : 1;

      if (dragRef.current) {
        const { id, startX, startY, origX, origY } = dragRef.current;
        updateCompRef.current(id, {
          x: Math.max(0, Math.min(canvasWRef.current - 20, origX + (e.clientX - startX) / scale)),
          y: Math.max(0, origY + (e.clientY - startY) / scale),
        });
      }
      if (resizeRef.current) {
        const { id, startX, startY, origW, origH } = resizeRef.current;
        updateCompRef.current(id, {
          width: Math.max(40, origW + (e.clientX - startX) / scale),
          height: Math.max(20, origH + (e.clientY - startY) / scale),
        });
      }
      if (heightDragRef.current) {
        const { startY, origH } = heightDragRef.current;
        setHeightRef.current(Math.max(400, origH + (e.clientY - startY) / scale));
      }
    };
    const onUp = () => {
      dragRef.current = null;
      resizeRef.current = null;
      heightDragRef.current = null;
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, []);

  async function uploadImage(file: File): Promise<string | null> {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/page-config/upload", { method: "POST", body: fd });
      const data = await res.json();
      return data.url ?? null;
    } catch {
      return null;
    } finally {
      setUploading(false);
    }
  }

  async function save() {
    setSaving(true);
    await fetch("/api/page-config", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        config: {
          desktop: { components: desktopComponents, height: desktopHeight },
          mobile: { components: mobileComponents, height: mobileHeight },
        },
      }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  // ── JSX ────────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full">
      {/* Mobile gate */}
      <div className="flex md:hidden flex-col items-center justify-center min-h-[60vh] text-center px-6 gap-4">
        <Monitor className="h-12 w-12 text-muted-foreground" />
        <h2 className="text-lg font-semibold">Desktop only</h2>
        <p className="text-sm text-muted-foreground max-w-xs">
          The homepage editor uses a drag-and-drop canvas that requires a desktop browser. Please open this page on a laptop or desktop.
        </p>
      </div>

      {/* ── Preview overlay ─────────────────────────────────────────────── */}
      {showPreview && (
        <div className="fixed inset-0 z-50 flex flex-col bg-background">
          {/* Preview toolbar */}
          <div className="flex items-center gap-3 px-5 py-3 border-b bg-background shrink-0">
            <div className="flex items-center gap-2">
              {view === "desktop" ? <Monitor className="h-4 w-4 text-muted-foreground" /> : <Smartphone className="h-4 w-4 text-muted-foreground" />}
              <span className="font-semibold text-sm">Live Preview — {view === "desktop" ? "Desktop" : "Mobile"}</span>
              <span className="text-xs text-muted-foreground">({canvasW} × {Math.round(canvasH)} px)</span>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setShowPreview(false)}>
                <Pencil className="h-3.5 w-3.5" /> Back to Edit
              </Button>
              <Button
                size="sm"
                className="gap-1.5"
                disabled={saving}
                onClick={async () => { await save(); setShowPreview(false); }}
              >
                {saving ? "Publishing…" : <><Check className="h-3.5 w-3.5" /> Publish to Homepage</>}
              </Button>
            </div>
          </div>

          {/* Preview canvas area */}
          <div className="flex-1 overflow-auto bg-gray-100 p-4">
            <div style={view === "mobile" ? { maxWidth: 375, margin: "0 auto" } : undefined}>
              <PreviewCanvas components={components} canvasW={canvasW} canvasH={canvasH} />
            </div>
            <p className="text-center text-xs text-muted-foreground mt-3 select-none">
              This is an exact preview of how the homepage will look. Click "Publish to Homepage" to make it live.
            </p>
          </div>
        </div>
      )}

      {/* ── Main editor ─────────────────────────────────────────────────── */}
      <div className="hidden md:flex flex-col h-full">
        {/* Header bar */}
        <div className="flex items-center gap-3 mb-4">
          <h1 className="text-xl font-semibold">Homepage Editor</h1>

          {/* View toggle */}
          <div className="flex items-center rounded-lg border overflow-hidden ml-2">
            <button
              onClick={() => { setSelected(null); setView("desktop"); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm transition-colors ${view === "desktop" ? "bg-black text-white" : "hover:bg-muted"}`}
            >
              <Monitor className="h-3.5 w-3.5" /> Desktop
            </button>
            <button
              onClick={() => { setSelected(null); setView("mobile"); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm transition-colors ${view === "mobile" ? "bg-black text-white" : "hover:bg-muted"}`}
            >
              <Smartphone className="h-3.5 w-3.5" /> Mobile
            </button>
          </div>

          <div className="ml-auto flex items-center gap-2">
            {saved && <span className="text-xs text-green-600 font-medium flex items-center gap-1"><Check className="h-3.5 w-3.5" /> Published</span>}
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => setShowPreview(true)}
            >
              <Eye className="h-4 w-4" /> Preview &amp; Publish
            </Button>
          </div>
        </div>

        <div className="flex gap-4 flex-1 min-h-0">
          {/* ── Left panel ────────────────────────────────────────────────── */}
          <div className="w-48 shrink-0 flex flex-col gap-2 overflow-y-auto pb-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Add Component</p>
            {([
              { type: "header" as const, label: "Header", icon: Heading },
              { type: "text" as const, label: "Text", icon: Type },
              { type: "shape" as const, label: "Shape", icon: Square },
              { type: "image" as const, label: "Image Frame", icon: ImageIcon },
              { type: "button" as const, label: "Button", icon: MousePointerClick },
            ]).map(({ type, label, icon: Icon }) => (
              <button
                key={type}
                onClick={() => addComponent(type)}
                className="flex items-center gap-2 px-3 py-2 rounded-md border border-gray-200 text-sm hover:bg-muted transition-colors text-left"
              >
                <Icon className="h-4 w-4 text-muted-foreground" /> {label}
              </button>
            ))}

            {selectedComp && (
              <div className="mt-4 border-t pt-4 flex flex-col gap-3">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {selectedComp.type.charAt(0).toUpperCase() + selectedComp.type.slice(1)} Properties
                </p>

                {/* ── Text / Header properties ─────────────────────────── */}
                {(selectedComp.type === "text" || selectedComp.type === "header") && (
                  <>
                    <div>
                      <label className="text-xs text-muted-foreground">Content</label>
                      <textarea value={selectedComp.content ?? ""} onChange={(e) => updateComp(selectedComp.id, { content: e.target.value })} className="w-full mt-1 text-sm border rounded px-2 py-1 resize-none" rows={3} />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Font family</label>
                      <select value={selectedComp.fontFamily ?? "system-ui, -apple-system, sans-serif"} onChange={(e) => updateComp(selectedComp.id, { fontFamily: e.target.value })} className="w-full mt-1 text-xs border rounded px-2 py-1 bg-background">
                        {FONT_FAMILIES.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-1">
                      <div>
                        <label className="text-xs text-muted-foreground">Size</label>
                        <Input type="number" value={selectedComp.fontSize ?? 16} onChange={(e) => updateComp(selectedComp.id, { fontSize: +e.target.value })} className="h-7 text-sm mt-1" />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground">Line height</label>
                        <Input type="number" step="0.1" min="0.8" max="4" value={selectedComp.lineHeight ?? 1.4} onChange={(e) => updateComp(selectedComp.id, { lineHeight: +e.target.value })} className="h-7 text-sm mt-1" />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Font weight</label>
                      <select value={selectedComp.fontWeight ?? (selectedComp.bold ? 700 : 400)} onChange={(e) => updateComp(selectedComp.id, { fontWeight: +e.target.value, bold: +e.target.value >= 700 })} className="w-full mt-1 text-xs border rounded px-2 py-1 bg-background">
                        {FONT_WEIGHTS.map((w) => <option key={w.value} value={w.value}>{w.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Text color</label>
                      <input type="color" value={selectedComp.fontColor ?? "#000000"} onChange={(e) => updateComp(selectedComp.id, { fontColor: e.target.value })} className="mt-1 w-full h-7 rounded cursor-pointer border" />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Align</label>
                      <div className="flex gap-1 mt-1">
                        {(["left", "center", "right"] as const).map((a) => (
                          <button key={a} onClick={() => updateComp(selectedComp.id, { textAlign: a })} className={`flex-1 text-xs py-1 rounded border ${selectedComp.textAlign === a ? "bg-black text-white" : "hover:bg-muted"}`}>
                            {a[0].toUpperCase()}
                          </button>
                        ))}
                      </div>
                    </div>
                    <button onClick={() => updateComp(selectedComp.id, { italic: !selectedComp.italic })} className={`w-full text-xs py-1 rounded border italic ${selectedComp.italic ? "bg-black text-white" : "hover:bg-muted"}`}>
                      Italic
                    </button>
                  </>
                )}

                {/* ── Shape properties ─────────────────────────────────── */}
                {selectedComp.type === "shape" && (
                  <>
                    <div>
                      <label className="text-xs text-muted-foreground">Fill color</label>
                      <input type="color" value={selectedComp.bgColor ?? "#3b82f6"} onChange={(e) => updateComp(selectedComp.id, { bgColor: e.target.value })} className="mt-1 w-full h-7 rounded cursor-pointer border" />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Border radius</label>
                      <Input type="number" value={selectedComp.borderRadius ?? 0} onChange={(e) => updateComp(selectedComp.id, { borderRadius: +e.target.value })} className="h-7 text-sm mt-1" />
                    </div>
                  </>
                )}

                {/* ── Image properties ─────────────────────────────────── */}
                {selectedComp.type === "image" && (
                  <>
                    <div>
                      <label className="text-xs text-muted-foreground">Upload image</label>
                      <label className="mt-1 flex items-center gap-2 cursor-pointer px-2 py-1.5 rounded border text-xs hover:bg-muted">
                        <ImageIcon className="h-3.5 w-3.5" />
                        {uploading ? "Uploading…" : "Choose file"}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            const localUrl = URL.createObjectURL(file);
                            updateComp(selectedComp.id, { imageUrl: localUrl });
                            const remoteUrl = await uploadImage(file);
                            if (remoteUrl) {
                              updateComp(selectedComp.id, { imageUrl: remoteUrl });
                              URL.revokeObjectURL(localUrl);
                            }
                          }}
                        />
                      </label>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Border radius</label>
                      <Input type="number" value={selectedComp.borderRadius ?? 4} onChange={(e) => updateComp(selectedComp.id, { borderRadius: +e.target.value })} className="h-7 text-sm mt-1" />
                    </div>
                  </>
                )}

                {/* ── Button properties ─────────────────────────────────── */}
                {selectedComp.type === "button" && (
                  <>
                    <div>
                      <label className="text-xs text-muted-foreground">Label</label>
                      <Input value={selectedComp.content ?? ""} onChange={(e) => updateComp(selectedComp.id, { content: e.target.value })} className="h-7 text-sm mt-1" />
                    </div>

                    {/* Style */}
                    <div>
                      <label className="text-xs text-muted-foreground">Style</label>
                      <div className="grid grid-cols-2 gap-1 mt-1">
                        {(["solid", "outline", "ghost", "link"] as const).map((s) => (
                          <button key={s} onClick={() => updateComp(selectedComp.id, { buttonStyle: s })}
                            className={`text-xs py-1 rounded border capitalize ${selectedComp.buttonStyle === s || (!selectedComp.buttonStyle && s === "solid") ? "bg-black text-white" : "hover:bg-muted"}`}>
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Colors */}
                    <div>
                      <label className="text-xs text-muted-foreground">
                        {selectedComp.buttonStyle === "solid" || !selectedComp.buttonStyle ? "Background" : "Accent color"}
                      </label>
                      <input type="color" value={selectedComp.bgColor ?? "#3b82f6"} onChange={(e) => updateComp(selectedComp.id, { bgColor: e.target.value })} className="mt-1 w-full h-7 rounded cursor-pointer border" />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Text color</label>
                      <input type="color" value={selectedComp.fontColor ?? "#ffffff"} onChange={(e) => updateComp(selectedComp.id, { fontColor: e.target.value })} className="mt-1 w-full h-7 rounded cursor-pointer border" />
                    </div>
                    {(selectedComp.buttonStyle === "outline" || selectedComp.buttonStyle === "ghost") && (
                      <div>
                        <label className="text-xs text-muted-foreground">Border color</label>
                        <input type="color" value={selectedComp.borderColor ?? selectedComp.bgColor ?? "#3b82f6"} onChange={(e) => updateComp(selectedComp.id, { borderColor: e.target.value })} className="mt-1 w-full h-7 rounded cursor-pointer border" />
                      </div>
                    )}

                    {/* Hover colors */}
                    <div className="border-t pt-2">
                      <label className="text-xs font-medium text-muted-foreground">Hover states</label>
                    </div>
                    <div className="grid grid-cols-2 gap-1">
                      <div>
                        <label className="text-xs text-muted-foreground">BG</label>
                        <input type="color" value={selectedComp.hoverBgColor ?? "#2563eb"} onChange={(e) => updateComp(selectedComp.id, { hoverBgColor: e.target.value })} className="mt-1 w-full h-7 rounded cursor-pointer border" />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground">Text</label>
                        <input type="color" value={selectedComp.hoverFontColor ?? "#ffffff"} onChange={(e) => updateComp(selectedComp.id, { hoverFontColor: e.target.value })} className="mt-1 w-full h-7 rounded cursor-pointer border" />
                      </div>
                    </div>

                    {/* Typography */}
                    <div className="border-t pt-2">
                      <label className="text-xs font-medium text-muted-foreground">Typography</label>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Font family</label>
                      <select value={selectedComp.fontFamily ?? "system-ui, -apple-system, sans-serif"} onChange={(e) => updateComp(selectedComp.id, { fontFamily: e.target.value })} className="w-full mt-1 text-xs border rounded px-2 py-1 bg-background">
                        {FONT_FAMILIES.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-1">
                      <div>
                        <label className="text-xs text-muted-foreground">Size</label>
                        <Input type="number" value={selectedComp.fontSize ?? 16} onChange={(e) => updateComp(selectedComp.id, { fontSize: +e.target.value })} className="h-7 text-sm mt-1" />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground">Weight</label>
                        <select value={selectedComp.fontWeight ?? 600} onChange={(e) => updateComp(selectedComp.id, { fontWeight: +e.target.value })} className="w-full mt-1 text-xs border rounded px-2 py-1 bg-background h-7">
                          {FONT_WEIGHTS.map((w) => <option key={w.value} value={w.value}>{w.label}</option>)}
                        </select>
                      </div>
                    </div>

                    {/* Shape */}
                    <div>
                      <label className="text-xs text-muted-foreground">Border radius</label>
                      <Input type="number" min="0" max="200" value={selectedComp.borderRadius ?? 8} onChange={(e) => updateComp(selectedComp.id, { borderRadius: +e.target.value })} className="h-7 text-sm mt-1" />
                    </div>

                    {/* Action */}
                    <div className="border-t pt-2">
                      <label className="text-xs font-medium text-muted-foreground">Action</label>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Type</label>
                      <select
                        value={selectedComp.buttonAction?.type ?? "url"}
                        onChange={(e) => updateComp(selectedComp.id, { buttonAction: { type: e.target.value as ButtonActionType, value: selectedComp.buttonAction?.value ?? "" } })}
                        className="w-full mt-1 text-xs border rounded px-2 py-1 bg-background"
                      >
                        {BUTTON_ACTIONS.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">
                        {selectedComp.buttonAction?.type === "url" ? "URL" :
                         selectedComp.buttonAction?.type === "buy" ? "Product slug" :
                         selectedComp.buttonAction?.type === "search" ? "Search query" : "Value"}
                      </label>
                      <Input
                        value={selectedComp.buttonAction?.value ?? ""}
                        onChange={(e) => updateComp(selectedComp.id, { buttonAction: { type: selectedComp.buttonAction?.type ?? "url", value: e.target.value } })}
                        placeholder={
                          selectedComp.buttonAction?.type === "url" ? "https://…" :
                          selectedComp.buttonAction?.type === "buy" ? "product-slug" :
                          selectedComp.buttonAction?.type === "search" ? "shoes" : ""
                        }
                        className="h-7 text-sm mt-1"
                      />
                    </div>
                  </>
                )}

                {/* ── Shared: background + size + delete ───────────────── */}
                {selectedComp.type !== "button" && (
                  <div>
                    <label className="text-xs text-muted-foreground">Background</label>
                    <input type="color" value={selectedComp.bgColor === "transparent" ? "#ffffff" : (selectedComp.bgColor ?? "#ffffff")} onChange={(e) => updateComp(selectedComp.id, { bgColor: e.target.value })} className="mt-1 w-full h-7 rounded cursor-pointer border" />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-1">
                  <div>
                    <label className="text-xs text-muted-foreground">W</label>
                    <Input type="number" value={Math.round(selectedComp.width)} onChange={(e) => updateComp(selectedComp.id, { width: +e.target.value })} className="h-7 text-sm mt-1" />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">H</label>
                    <Input type="number" value={Math.round(selectedComp.height)} onChange={(e) => updateComp(selectedComp.id, { height: +e.target.value })} className="h-7 text-sm mt-1" />
                  </div>
                </div>

                <Button variant="destructive" size="sm" className="mt-1 gap-1" onClick={() => deleteComp(selectedComp.id)}>
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </Button>
              </div>
            )}
          </div>

          {/* ── Canvas area ──────────────────────────────────────────────── */}
          <div className="flex-1 overflow-auto bg-gray-100 rounded-lg p-3">
            <div
              ref={canvasRef}
              className="relative bg-white shadow-sm mx-auto select-none"
              style={{ width: "100%", maxWidth: canvasW, aspectRatio: `${canvasW} / ${canvasH}` }}
              onClick={() => setSelected(null)}
            >
              {loading && (
                <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">Loading…</div>
              )}

              {components.map((comp) => {
                const pct = (v: number, total: number) => `${(v / total) * 100}%`;
                const isSelected = selected === comp.id;
                const isHovered = hoveredId === comp.id;
                const isBtn = comp.type === "button";
                const btn = isBtn ? resolveButtonStyles(comp, isHovered, canvasScale) : null;

                return (
                  <div
                    key={comp.id}
                    className={`absolute group ${isSelected ? "ring-2 ring-blue-500" : "hover:ring-1 hover:ring-blue-300"}`}
                    style={{
                      left: pct(comp.x, canvasW),
                      top: pct(comp.y, canvasH),
                      width: pct(comp.width, canvasW),
                      height: pct(comp.height, canvasH),
                      borderRadius: isBtn ? 0 : (comp.borderRadius ?? 0),
                      backgroundColor: isBtn ? "transparent" : (comp.bgColor === "transparent" ? "transparent" : (comp.bgColor ?? "transparent")),
                      cursor: "move",
                    }}
                    onMouseDown={(e) => onDragStart(e, comp.id)}
                    onClick={(e) => { e.stopPropagation(); setSelected(comp.id); }}
                    onMouseEnter={() => isBtn && setHoveredId(comp.id)}
                    onMouseLeave={() => isBtn && setHoveredId(null)}
                  >
                    {(comp.type === "text" || comp.type === "header") && (
                      <div
                        className="w-full h-full flex items-center overflow-hidden px-1"
                        style={{
                          fontSize: `calc(${comp.fontSize ?? 16}px * (${canvasRef.current?.clientWidth ?? canvasW} / ${canvasW}))`,
                          fontFamily: comp.fontFamily ?? "system-ui, -apple-system, sans-serif",
                          fontWeight: comp.fontWeight ?? (comp.bold ? 700 : 400),
                          fontStyle: comp.italic ? "italic" : "normal",
                          lineHeight: comp.lineHeight ?? 1.4,
                          color: comp.fontColor ?? "#111",
                          textAlign: comp.textAlign ?? "left",
                          justifyContent: comp.textAlign === "center" ? "center" : comp.textAlign === "right" ? "flex-end" : "flex-start",
                        }}
                      >
                        <span>{comp.content}</span>
                      </div>
                    )}
                    {comp.type === "shape" && <div className="w-full h-full" />}
                    {comp.type === "image" && (
                      comp.imageUrl
                        ? <img src={comp.imageUrl} alt="" className="w-full h-full object-cover" style={{ borderRadius: comp.borderRadius ?? 4 }} />
                        : <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs gap-1"><ImageIcon className="h-4 w-4" /> Image</div>
                    )}
                    {isBtn && btn && (
                      <div
                        className="w-full h-full flex items-center justify-center overflow-hidden"
                        style={{
                          borderRadius: comp.borderRadius ?? 8,
                          backgroundColor: btn.bg,
                          color: btn.color,
                          border: btn.border,
                          textDecoration: btn.isLink ? "underline" : "none",
                          fontSize: `calc(${comp.fontSize ?? 16}px * (${canvasRef.current?.clientWidth ?? canvasW} / ${canvasW}))`,
                          fontFamily: comp.fontFamily ?? "system-ui, -apple-system, sans-serif",
                          fontWeight: comp.fontWeight ?? 600,
                          transition: "background-color 0.15s, color 0.15s",
                          pointerEvents: "none",
                        }}
                      >
                        {comp.content ?? "Button"}
                      </div>
                    )}

                    {isSelected && (
                      <div
                        className="absolute bottom-0 right-0 w-3 h-3 bg-blue-500 cursor-se-resize z-10"
                        style={{ borderRadius: "2px 0 2px 0" }}
                        onMouseDown={(e) => onResizeStart(e, comp.id)}
                      />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Height drag handle */}
            <div
              className="mx-auto mt-0 flex items-center justify-center h-5 cursor-ns-resize group"
              style={{ width: "100%", maxWidth: canvasW }}
              onMouseDown={onHeightDragStart}
              title="Drag to adjust canvas height"
            >
              <div className="w-16 h-1.5 bg-gray-300 group-hover:bg-blue-400 rounded-full transition-colors" />
            </div>

            <p className="text-center text-xs text-muted-foreground mt-1 select-none">
              {view === "desktop" ? "Desktop" : "Mobile"} — {canvasW} × {Math.round(canvasH)} px — drag to move · corner to resize · pill below to adjust height
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
