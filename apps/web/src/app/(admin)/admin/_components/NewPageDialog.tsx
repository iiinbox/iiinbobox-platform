"use client";

import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, FileText, Check } from "lucide-react";
import { PAGE_TYPES, PAGE_TYPE_CATEGORIES, type PageTypeDef } from "../_lib/pageTypes";
import { templatesForPageType, type PageTemplate } from "../_lib/templates";
import { TemplateThumbnail, TEMPLATE_THUMB_WIDTH } from "./TemplateThumbnail";
import type { PageComponent } from "./PageEditor";
import type { PageEntry } from "../_lib/usePagesList";

function regenId() { return Math.random().toString(36).slice(2); }

// Deep-clones a template's config with every component's placeholder id
// replaced by a fresh one — the exact reasoning duplicateInPlace() already
// uses elsewhere in the editor: template source ids are stable-for-authoring
// only, never meant to be reused verbatim once actually applied to a page.
function regenerateConfigIds(config: PageTemplate["config"]): PageTemplate["config"] {
  const regenComponents = (components: PageComponent[]) => components.map((c) => ({ ...c, id: regenId() }));
  return {
    ...config,
    header: {
      desktop: { ...config.header.desktop, components: regenComponents(config.header.desktop.components) },
      mobile: { ...config.header.mobile, components: regenComponents(config.header.mobile.components) },
    },
    template: {
      desktop: { ...config.template.desktop, components: regenComponents(config.template.desktop.components) },
      mobile: { ...config.template.mobile, components: regenComponents(config.template.mobile.components) },
    },
    footer: {
      desktop: { ...config.footer.desktop, components: regenComponents(config.footer.desktop.components) },
      mobile: { ...config.footer.mobile, components: regenComponents(config.footer.mobile.components) },
    },
  };
}

// The canonical page-type id (e.g. "checkout") is shared by every user who
// picks that type — upserting straight onto it would silently overwrite an
// existing page's content. Append the first available numeric suffix instead,
// same convention as "Copy (2)" elsewhere.
function uniqueSlug(pages: PageEntry[], base: string): string {
  const taken = new Set(pages.map((p) => p.slug));
  if (!taken.has(base)) return base;
  let n = 2;
  while (taken.has(`${base}-${n}`)) n += 1;
  return `${base}-${n}`;
}

interface NewPageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pages: PageEntry[];
  createPage: (opts: { slug: string; name: string; config?: unknown; folderId?: string | null }, onDone?: () => void) => Promise<void>;
  // Set when opened from a folder's own "+" button — the new page is
  // assigned straight into that folder instead of landing in Unassigned.
  folderId?: string | null;
}

export function NewPageDialog({ open, onOpenChange, pages, createPage, folderId = null }: NewPageDialogProps) {
  const [step, setStep] = useState<"type" | "gallery">("type");
  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState<PageTypeDef | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<PageTemplate | "blank">("blank");
  const [pageName, setPageName] = useState("");
  const [creating, setCreating] = useState(false);

  const filteredTypes = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return PAGE_TYPES;
    return PAGE_TYPES.filter((t) => t.label.toLowerCase().includes(q));
  }, [search]);

  function reset() {
    setStep("type"); setSearch(""); setSelectedType(null); setSelectedTemplate("blank"); setPageName("");
  }

  function handleOpenChange(next: boolean) {
    if (!next) reset();
    onOpenChange(next);
  }

  function pickType(type: PageTypeDef) {
    setSelectedType(type);
    setSelectedTemplate("blank");
    setPageName(type.label);
    setStep("gallery");
  }

  async function handleCreate() {
    if (!selectedType || !pageName.trim() || creating) return;
    setCreating(true);
    const slug = uniqueSlug(pages, selectedType.id);
    const config = selectedTemplate === "blank" ? undefined : regenerateConfigIds(selectedTemplate.config);
    try {
      await createPage({ slug, name: pageName.trim(), config, folderId }, () => handleOpenChange(false));
    } finally {
      setCreating(false);
    }
  }

  const templates = selectedType ? templatesForPageType(selectedType.id) : [];

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className={step === "gallery" ? "max-w-4xl max-h-[85vh] overflow-y-auto" : "max-w-lg"}>
        <DialogHeader>
          <DialogTitle>{step === "type" ? "New Page" : selectedType?.label}</DialogTitle>
        </DialogHeader>

        {step === "type" && (
          <div className="flex flex-col gap-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search page types…"
                className="pl-8 h-8 text-sm"
              />
            </div>
            <div className="max-h-[50vh] overflow-y-auto flex flex-col gap-4">
              {PAGE_TYPE_CATEGORIES.map((category) => {
                const items = filteredTypes.filter((t) => t.category === category);
                if (items.length === 0) return null;
                return (
                  <div key={category}>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">{category}</p>
                    <div className="grid grid-cols-2 gap-1.5">
                      {items.map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => pickType(t)}
                          className="flex items-center gap-2 text-left px-2.5 py-1.5 rounded-md border border-gray-200 text-xs hover:border-black hover:bg-muted transition-colors"
                        >
                          <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          <span className="truncate flex-1">{t.label}</span>
                          {t.hasCustomTemplates && <span className="text-[9px] uppercase text-muted-foreground shrink-0">templates</span>}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
              {filteredTypes.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-6">No page types match "{search}"</p>
              )}
            </div>
          </div>
        )}

        {step === "gallery" && selectedType && (
          <div className="flex flex-col gap-4">
            <button type="button" onClick={() => setStep("type")} className="text-xs text-muted-foreground hover:text-foreground text-left w-fit">
              ← Choose a different page type
            </button>

            <div className="flex flex-wrap gap-3">
              {/* Blank Page — always first, always available (item 5) */}
              <button
                type="button"
                onClick={() => setSelectedTemplate("blank")}
                className={`relative flex flex-col gap-1.5 rounded-md ${selectedTemplate === "blank" ? "ring-2 ring-black" : ""}`}
                style={{ width: TEMPLATE_THUMB_WIDTH }}
              >
                <div
                  className="flex items-center justify-center border border-dashed border-gray-300 rounded bg-gray-50 text-muted-foreground"
                  style={{ width: TEMPLATE_THUMB_WIDTH, height: TEMPLATE_THUMB_WIDTH * 0.6 }}
                >
                  <FileText className="h-6 w-6" />
                </div>
                {selectedTemplate === "blank" && <Check className="absolute top-1.5 right-1.5 h-4 w-4 bg-black text-white rounded-full p-0.5" />}
                <span className="text-xs font-medium text-left">Blank Page</span>
              </button>

              {templates.map((t) => {
                const isSelected = selectedTemplate !== "blank" && selectedTemplate.id === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setSelectedTemplate(t)}
                    className={`relative flex flex-col gap-1.5 rounded-md ${isSelected ? "ring-2 ring-black" : ""}`}
                    style={{ width: TEMPLATE_THUMB_WIDTH }}
                  >
                    <TemplateThumbnail components={t.config.template.desktop.components} canvasW={1920} canvasH={t.config.template.desktop.height} />
                    {isSelected && <Check className="absolute top-1.5 right-1.5 h-4 w-4 bg-black text-white rounded-full p-0.5" />}
                    <span className="text-xs font-medium text-left">{t.name}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex items-end gap-2 pt-2 border-t">
              <div className="flex-1">
                <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Page Name</label>
                <Input value={pageName} onChange={(e) => setPageName(e.target.value)} className="h-8 text-sm mt-1" />
              </div>
              <Button onClick={handleCreate} disabled={!pageName.trim() || creating}>
                {creating ? "Creating…" : "Create Page"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
