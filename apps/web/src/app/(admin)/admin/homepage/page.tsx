"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Image as ImageIcon, Type, Square, Heading, Check, Move, Monitor } from "lucide-react";

type ComponentType = "text" | "header" | "shape" | "image";

interface PageComponent {
  id: string;
  type: ComponentType;
  x: number;
  y: number;
  width: number;
  height: number;
  content?: string;
  fontSize?: number;
  fontColor?: string;
  bgColor?: string;
  borderRadius?: number;
  bold?: boolean;
  italic?: boolean;
  textAlign?: "left" | "center" | "right";
  imageUrl?: string;
  opacity?: number;
}

const CANVAS_W = 1200;
const CANVAS_H = 700;

function uid() {
  return Math.random().toString(36).slice(2);
}

function defaults(type: ComponentType): Partial<PageComponent> {
  switch (type) {
    case "header":
      return { width: 400, height: 70, content: "Heading", fontSize: 36, fontColor: "#111111", bgColor: "transparent", bold: true, textAlign: "center" };
    case "text":
      return { width: 300, height: 80, content: "Text block", fontSize: 16, fontColor: "#333333", bgColor: "transparent", textAlign: "left" };
    case "shape":
      return { width: 200, height: 120, bgColor: "#3b82f6", borderRadius: 8 };
    case "image":
      return { width: 240, height: 180, bgColor: "#e5e7eb", borderRadius: 4 };
  }
}

export default function HomepageEditorPage() {
  const [components, setComponents] = useState<PageComponent[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const dragRef = useRef<{ id: string; startX: number; startY: number; origX: number; origY: number } | null>(null);
  const resizeRef = useRef<{ id: string; startX: number; startY: number; origW: number; origH: number } | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  const selectedComp = components.find((c) => c.id === selected) ?? null;

  useEffect(() => {
    fetch("/api/page-config")
      .then((r) => r.json())
      .then((d) => { setComponents(Array.isArray(d?.components) ? d.components : []); })
      .catch(() => setComponents([]))
      .finally(() => setLoading(false));
  }, []);

  function addComponent(type: ComponentType) {
    const comp: PageComponent = {
      id: uid(),
      type,
      x: 80,
      y: 80,
      ...defaults(type),
    } as PageComponent;
    setComponents((prev) => [...prev, comp]);
    setSelected(comp.id);
  }

  function updateComp(id: string, patch: Partial<PageComponent>) {
    setComponents((prev) => prev.map((c) => c.id === id ? { ...c, ...patch } : c));
  }

  function deleteComp(id: string) {
    setComponents((prev) => prev.filter((c) => c.id !== id));
    if (selected === id) setSelected(null);
  }

  // Drag to move
  const onDragStart = useCallback((e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    const comp = components.find((c) => c.id === id);
    if (!comp) return;
    dragRef.current = { id, startX: e.clientX, startY: e.clientY, origX: comp.x, origY: comp.y };
    setSelected(id);
  }, [components]);

  const onResizeStart = useCallback((e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    const comp = components.find((c) => c.id === id);
    if (!comp) return;
    resizeRef.current = { id, startX: e.clientX, startY: e.clientY, origW: comp.width, origH: comp.height };
  }, [components]);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (dragRef.current) {
        const { id, startX, startY, origX, origY } = dragRef.current;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        const scale = canvasRef.current ? canvasRef.current.clientWidth / CANVAS_W : 1;
        updateComp(id, {
          x: Math.max(0, Math.min(CANVAS_W - 20, origX + dx / scale)),
          y: Math.max(0, Math.min(CANVAS_H - 20, origY + dy / scale)),
        });
      }
      if (resizeRef.current) {
        const { id, startX, startY, origW, origH } = resizeRef.current;
        const scale = canvasRef.current ? canvasRef.current.clientWidth / CANVAS_W : 1;
        updateComp(id, {
          width: Math.max(40, origW + (e.clientX - startX) / scale),
          height: Math.max(20, origH + (e.clientY - startY) / scale),
        });
      }
    };
    const onUp = () => { dragRef.current = null; resizeRef.current = null; };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
  }, []);

  async function uploadImage(file: File): Promise<string | null> {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/page-config/upload", { method: "POST", body: fd });
      const data = await res.json();
      return data.url ?? null;
    } catch { return null; }
    finally { setUploading(false); }
  }

  async function save() {
    setSaving(true);
    await fetch("/api/page-config", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ config: { components } }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

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

      <div className="hidden md:flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">Homepage Editor</h1>
        <Button onClick={save} disabled={saving} className="gap-2">
          {saved ? <><Check className="h-4 w-4" /> Applied</> : saving ? "Saving…" : "Apply to Homepage"}
        </Button>
      </div>

      <div className="flex gap-4 flex-1 min-h-0">
        {/* Left: toolbox */}
        <div className="w-44 shrink-0 flex flex-col gap-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Add Component</p>
          {([
            { type: "header" as const, label: "Header", icon: Heading },
            { type: "text" as const, label: "Text", icon: Type },
            { type: "shape" as const, label: "Shape", icon: Square },
            { type: "image" as const, label: "Image Frame", icon: ImageIcon },
          ]).map(({ type, label, icon: Icon }) => (
            <button key={type} onClick={() => addComponent(type)}
              className="flex items-center gap-2 px-3 py-2 rounded-md border border-gray-200 text-sm hover:bg-muted transition-colors text-left">
              <Icon className="h-4 w-4 text-muted-foreground" /> {label}
            </button>
          ))}

          {selectedComp && (
            <div className="mt-4 border-t pt-4 flex flex-col gap-3">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Properties</p>

              {(selectedComp.type === "text" || selectedComp.type === "header") && (
                <>
                  <div>
                    <label className="text-xs text-muted-foreground">Content</label>
                    <textarea
                      value={selectedComp.content ?? ""}
                      onChange={(e) => updateComp(selectedComp.id, { content: e.target.value })}
                      className="w-full mt-1 text-sm border rounded px-2 py-1 resize-none"
                      rows={3}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Font size</label>
                    <Input type="number" value={selectedComp.fontSize ?? 16}
                      onChange={(e) => updateComp(selectedComp.id, { fontSize: +e.target.value })}
                      className="h-7 text-sm mt-1" />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Text color</label>
                    <input type="color" value={selectedComp.fontColor ?? "#000000"}
                      onChange={(e) => updateComp(selectedComp.id, { fontColor: e.target.value })}
                      className="mt-1 w-full h-7 rounded cursor-pointer border" />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Align</label>
                    <div className="flex gap-1 mt-1">
                      {(["left", "center", "right"] as const).map((a) => (
                        <button key={a} onClick={() => updateComp(selectedComp.id, { textAlign: a })}
                          className={`flex-1 text-xs py-1 rounded border ${selectedComp.textAlign === a ? "bg-black text-white" : "hover:bg-muted"}`}>
                          {a[0].toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => updateComp(selectedComp.id, { bold: !selectedComp.bold })}
                      className={`flex-1 text-xs py-1 rounded border font-bold ${selectedComp.bold ? "bg-black text-white" : "hover:bg-muted"}`}>B</button>
                    <button onClick={() => updateComp(selectedComp.id, { italic: !selectedComp.italic })}
                      className={`flex-1 text-xs py-1 rounded border italic ${selectedComp.italic ? "bg-black text-white" : "hover:bg-muted"}`}>I</button>
                  </div>
                </>
              )}

              {selectedComp.type === "shape" && (
                <>
                  <div>
                    <label className="text-xs text-muted-foreground">Fill color</label>
                    <input type="color" value={selectedComp.bgColor ?? "#3b82f6"}
                      onChange={(e) => updateComp(selectedComp.id, { bgColor: e.target.value })}
                      className="mt-1 w-full h-7 rounded cursor-pointer border" />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Border radius</label>
                    <Input type="number" value={selectedComp.borderRadius ?? 0}
                      onChange={(e) => updateComp(selectedComp.id, { borderRadius: +e.target.value })}
                      className="h-7 text-sm mt-1" />
                  </div>
                </>
              )}

              {selectedComp.type === "image" && (
                <>
                  <div>
                    <label className="text-xs text-muted-foreground">Upload image</label>
                    <label className="mt-1 flex items-center gap-2 cursor-pointer px-2 py-1.5 rounded border text-xs hover:bg-muted">
                      <ImageIcon className="h-3.5 w-3.5" />
                      {uploading ? "Uploading…" : "Choose file"}
                      <input type="file" accept="image/*" className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) { const url = await uploadImage(file); if (url) updateComp(selectedComp.id, { imageUrl: url }); }
                        }} />
                    </label>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Border radius</label>
                    <Input type="number" value={selectedComp.borderRadius ?? 4}
                      onChange={(e) => updateComp(selectedComp.id, { borderRadius: +e.target.value })}
                      className="h-7 text-sm mt-1" />
                  </div>
                </>
              )}

              <div>
                <label className="text-xs text-muted-foreground">Background</label>
                <input type="color" value={selectedComp.bgColor === "transparent" ? "#ffffff" : (selectedComp.bgColor ?? "#ffffff")}
                  onChange={(e) => updateComp(selectedComp.id, { bgColor: e.target.value })}
                  className="mt-1 w-full h-7 rounded cursor-pointer border" />
              </div>

              <div className="grid grid-cols-2 gap-1">
                <div><label className="text-xs text-muted-foreground">W</label>
                  <Input type="number" value={Math.round(selectedComp.width)}
                    onChange={(e) => updateComp(selectedComp.id, { width: +e.target.value })}
                    className="h-7 text-sm mt-1" /></div>
                <div><label className="text-xs text-muted-foreground">H</label>
                  <Input type="number" value={Math.round(selectedComp.height)}
                    onChange={(e) => updateComp(selectedComp.id, { height: +e.target.value })}
                    className="h-7 text-sm mt-1" /></div>
              </div>

              <Button variant="destructive" size="sm" className="mt-1 gap-1"
                onClick={() => deleteComp(selectedComp.id)}>
                <Trash2 className="h-3.5 w-3.5" /> Delete
              </Button>
            </div>
          )}
        </div>

        {/* Canvas */}
        <div className="flex-1 overflow-auto bg-gray-100 rounded-lg p-2">
          <div
            ref={canvasRef}
            className="relative bg-white shadow-sm mx-auto select-none"
            style={{ width: "100%", maxWidth: CANVAS_W, aspectRatio: `${CANVAS_W}/${CANVAS_H}` }}
            onClick={() => setSelected(null)}
          >
            {loading && <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">Loading…</div>}
            {components.map((comp) => {
              const pct = (v: number, total: number) => `${(v / total) * 100}%`;
              const isSelected = selected === comp.id;
              return (
                <div
                  key={comp.id}
                  className={`absolute group ${isSelected ? "ring-2 ring-blue-500" : "hover:ring-1 hover:ring-blue-300"}`}
                  style={{
                    left: pct(comp.x, CANVAS_W),
                    top: pct(comp.y, CANVAS_H),
                    width: pct(comp.width, CANVAS_W),
                    height: pct(comp.height, CANVAS_H),
                    borderRadius: comp.borderRadius ?? 0,
                    backgroundColor: comp.bgColor === "transparent" ? "transparent" : (comp.bgColor ?? "transparent"),
                    cursor: "move",
                  }}
                  onMouseDown={(e) => onDragStart(e, comp.id)}
                  onClick={(e) => { e.stopPropagation(); setSelected(comp.id); }}
                >
                  {/* Content */}
                  {(comp.type === "text" || comp.type === "header") && (
                    <div className="w-full h-full flex items-center overflow-hidden px-1"
                      style={{
                        fontSize: `calc(${comp.fontSize ?? 16}px * (${canvasRef.current?.clientWidth ?? CANVAS_W} / ${CANVAS_W}))`,
                        color: comp.fontColor ?? "#111",
                        fontWeight: comp.bold ? "bold" : "normal",
                        fontStyle: comp.italic ? "italic" : "normal",
                        textAlign: comp.textAlign ?? "left",
                        justifyContent: comp.textAlign === "center" ? "center" : comp.textAlign === "right" ? "flex-end" : "flex-start",
                      }}>
                      <span>{comp.content}</span>
                    </div>
                  )}
                  {comp.type === "shape" && <div className="w-full h-full" />}
                  {comp.type === "image" && (
                    comp.imageUrl
                      ? <img src={comp.imageUrl} alt="" className="w-full h-full object-cover" style={{ borderRadius: comp.borderRadius ?? 4 }} />
                      : <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs gap-1">
                          <ImageIcon className="h-4 w-4" /> Image
                        </div>
                  )}

                  {/* Resize handle */}
                  {isSelected && (
                    <div
                      className="absolute bottom-0 right-0 w-3 h-3 bg-blue-500 cursor-se-resize"
                      style={{ borderRadius: "2px 0 2px 0" }}
                      onMouseDown={(e) => onResizeStart(e, comp.id)}
                    />
                  )}
                </div>
              );
            })}
          </div>
          <p className="text-center text-xs text-muted-foreground mt-2">Canvas {CANVAS_W}×{CANVAS_H} — drag to move, corner to resize</p>
        </div>
      </div>
      </div>
    </div>
  );
}
