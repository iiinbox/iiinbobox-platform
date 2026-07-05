"use client";

import { useEffect, useRef, useState } from "react";
import { Plus, Trash2, ChevronRight, ImageIcon, X, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SubCategory {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  imageUrl?: string | null;
  children: { id: string; name: string; slug: string; description?: string | null; imageUrl?: string | null }[];
}

interface Topic {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  imageUrl?: string | null;
  children: SubCategory[];
}

function slugify(str: string) {
  return str.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

const NONE = "__none__";

interface CategoryForm {
  name: string;
  slug: string;
  description: string;
  imageUrl: string;
  imagePreview: string;
  parentSlug: string;
  uploading: boolean;
}

function emptyForm(): CategoryForm {
  return { name: "", slug: "", description: "", imageUrl: "", imagePreview: "", parentSlug: NONE, uploading: false };
}

export default function CategoriesPage() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dialog state
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<CategoryForm>(emptyForm());
  const [saving, setSaving] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/categories");
      if (!res.ok) { setError(`Failed to load categories (${res.status})`); setTopics([]); }
      else { const data = await res.json(); setTopics(Array.isArray(data) ? data : []); }
    } catch {
      setError("Could not reach API.");
      setTopics([]);
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function openDialog(parentSlug?: string) {
    setForm({ ...emptyForm(), parentSlug: parentSlug ?? NONE });
    setOpen(true);
  }

  function setField<K extends keyof CategoryForm>(key: K, value: CategoryForm[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleImagePick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setField("uploading", true);
    const preview = URL.createObjectURL(file);
    setField("imagePreview", preview);
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await fetch("/api/admin/categories/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (data.url) setField("imageUrl", data.url);
    } catch {
      // keep preview, imageUrl empty — user can try again
    }
    setField("uploading", false);
  }

  async function save() {
    if (!form.name.trim()) return;
    setSaving(true);
    const slug = form.slug || slugify(form.name);
    const body: Record<string, string> = { name: form.name.trim(), slug };
    if (form.description.trim()) body.description = form.description.trim();
    if (form.imageUrl) body.imageUrl = form.imageUrl;
    if (form.parentSlug !== NONE) body.parentSlug = form.parentSlug;

    const res = await fetch("/api/admin/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      setOpen(false);
      setForm(emptyForm());
      await load();
    } else {
      const err = await res.json().catch(() => ({}));
      setError(err.message ?? "Failed to save");
    }
    setSaving(false);
  }

  async function remove(id: string, label: string) {
    if (!confirm(`Delete "${label}" and all its children?`)) return;
    await fetch(`/api/admin/categories/${id}`, { method: "DELETE" });
    await load();
  }

  // Flatten all topics+categories for the parent selector
  const parentOptions: { slug: string; label: string }[] = [];
  topics.forEach((t) => {
    parentOptions.push({ slug: t.slug, label: t.name });
    t.children.forEach((c) => {
      parentOptions.push({ slug: c.slug, label: `  ${t.name} → ${c.name}` });
    });
  });

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold">Categories</h1>
        <Button size="sm" onClick={() => openDialog()}>
          <Plus className="h-4 w-4 mr-1.5" /> Add Category
        </Button>
      </div>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 flex items-center justify-between">
          {error}
          <button onClick={() => setError(null)}><X className="h-4 w-4" /></button>
        </div>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : topics.length === 0 && !error ? (
        <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed rounded-xl">
          <Layers className="h-8 w-8 text-muted-foreground mb-3" />
          <p className="text-sm font-medium mb-1">No categories yet</p>
          <p className="text-xs text-muted-foreground mb-4">Create your first topic to get started</p>
          <Button size="sm" onClick={() => openDialog()}>
            <Plus className="h-4 w-4 mr-1" /> Add Category
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {topics.map((topic) => (
            <div key={topic.id} className="border rounded-xl overflow-hidden shadow-sm">
              {/* Topic row */}
              <div className="flex items-center gap-3 px-4 py-3 bg-muted/50">
                {topic.imageUrl ? (
                  <img src={topic.imageUrl} alt={topic.name} className="h-10 w-10 rounded-lg object-cover shrink-0" />
                ) : (
                  <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                    <ImageIcon className="h-4 w-4 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">{topic.name}</span>
                    <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">topic</span>
                  </div>
                  {topic.description && (
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{topic.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => openDialog(topic.slug)}>
                    <Plus className="h-3 w-3 mr-1" /> Category
                  </Button>
                  <Button variant="ghost" size="sm" className="h-7 text-destructive hover:text-destructive" onClick={() => remove(topic.id, topic.name)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              {/* Categories under topic */}
              {topic.children.map((cat) => (
                <div key={cat.id} className="border-t">
                  <div className="flex items-center gap-3 px-4 py-2.5 bg-background">
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0 ml-2" />
                    {cat.imageUrl ? (
                      <img src={cat.imageUrl} alt={cat.name} className="h-8 w-8 rounded-md object-cover shrink-0" />
                    ) : (
                      <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center shrink-0">
                        <ImageIcon className="h-3 w-3 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium">{cat.name}</span>
                      {cat.description && (
                        <p className="text-xs text-muted-foreground truncate">{cat.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => openDialog(cat.slug)}>
                        <Plus className="h-3 w-3 mr-1" /> Sub
                      </Button>
                      <Button variant="ghost" size="sm" className="h-7 text-destructive hover:text-destructive" onClick={() => remove(cat.id, cat.name)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  {/* Subcategories */}
                  {cat.children.map((sub) => (
                    <div key={sub.id} className="flex items-center gap-3 px-4 py-2 border-t bg-muted/20">
                      <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0 ml-8" />
                      {sub.imageUrl ? (
                        <img src={sub.imageUrl} alt={sub.name} className="h-6 w-6 rounded object-cover shrink-0" />
                      ) : (
                        <div className="h-6 w-6 rounded bg-muted flex items-center justify-center shrink-0">
                          <ImageIcon className="h-2.5 w-2.5 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <span className="text-sm">{sub.name}</span>
                        {sub.description && (
                          <span className="text-xs text-muted-foreground ml-2">{sub.description}</span>
                        )}
                      </div>
                      <Button variant="ghost" size="sm" className="h-7 text-destructive hover:text-destructive shrink-0" onClick={() => remove(sub.id, sub.name)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Add Category Dialog */}
      <Dialog open={open} onOpenChange={(v) => { if (!v) { setOpen(false); setForm(emptyForm()); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Category</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-2">
            {/* Parent / Topic */}
            <div className="flex flex-col gap-1.5">
              <Label>Parent (Topic or Category)</Label>
              <Select
                value={form.parentSlug}
                onValueChange={(v) => setField("parentSlug", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="None — create as top-level Topic" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>None — create as Topic</SelectItem>
                  {parentOptions.map((o) => (
                    <SelectItem key={o.slug} value={o.slug}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {form.parentSlug === NONE
                  ? "This will be a top-level topic."
                  : parentOptions.find(o => o.slug === form.parentSlug)?.label.trim().includes("→")
                    ? "This will be created as a subcategory."
                    : "This will be created as a category under the selected topic."}
              </p>
            </div>

            {/* Name */}
            <div className="flex flex-col gap-1.5">
              <Label>Name <span className="text-destructive">*</span></Label>
              <Input
                placeholder="e.g. Electronics"
                value={form.name}
                onChange={(e) => {
                  setField("name", e.target.value);
                  setField("slug", slugify(e.target.value));
                }}
              />
            </div>

            {/* Slug */}
            <div className="flex flex-col gap-1.5">
              <Label>Slug</Label>
              <Input
                placeholder="auto-generated"
                value={form.slug}
                onChange={(e) => setField("slug", e.target.value)}
                className="font-mono text-sm"
              />
            </div>

            {/* Description */}
            <div className="flex flex-col gap-1.5">
              <Label>Description</Label>
              <Textarea
                placeholder="Short description of this category…"
                value={form.description}
                onChange={(e) => setField("description", e.target.value)}
                rows={2}
                className="resize-none"
              />
            </div>

            {/* Image */}
            <div className="flex flex-col gap-1.5">
              <Label>Image</Label>
              <div className="flex items-center gap-3">
                {(form.imagePreview || form.imageUrl) ? (
                  <div className="relative">
                    <img
                      src={form.imagePreview || form.imageUrl}
                      alt=""
                      className="h-16 w-16 rounded-lg object-cover border"
                    />
                    <button
                      onClick={() => { setField("imagePreview", ""); setField("imageUrl", ""); }}
                      className="absolute -top-1.5 -right-1.5 bg-white border rounded-full p-0.5 shadow-sm"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <div
                    className="h-16 w-16 rounded-lg border-2 border-dashed flex items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => fileRef.current?.click()}
                  >
                    <ImageIcon className="h-5 w-5 text-muted-foreground" />
                  </div>
                )}
                <div className="flex flex-col gap-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={form.uploading}
                    onClick={() => fileRef.current?.click()}
                  >
                    {form.uploading ? "Uploading…" : "Upload Image"}
                  </Button>
                  <p className="text-xs text-muted-foreground">JPG, PNG, WebP — max 10MB</p>
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImagePick}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setOpen(false); setForm(emptyForm()); }}>
              Cancel
            </Button>
            <Button onClick={save} disabled={saving || !form.name.trim() || form.uploading}>
              {saving ? "Saving…" : "Add Category"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
