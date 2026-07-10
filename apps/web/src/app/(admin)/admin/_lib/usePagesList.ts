"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

export interface PageEntry { slug: string; name: string }

export function toSlug(name: string) {
  return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

// Shared page CRUD (fetch/create/rename/delete) behind the admin's "Pages"
// surface — consumed by both the top-nav dropdown (nav.tsx) and the page
// editor's left-sidebar Pages tab, so both stay behaviorally identical
// without duplicating the fetch/optimistic-update/rollback logic.
export function usePagesList() {
  const router = useRouter();
  const pathname = usePathname();
  const [pages, setPages] = useState<PageEntry[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  const [editInput, setEditInput] = useState("");
  const [confirmDeleteSlug, setConfirmDeleteSlug] = useState<string | null>(null);
  const [deletingSlug, setDeletingSlug] = useState<string | null>(null);

  async function fetchPages() {
    try {
      const res = await fetch("/api/pages");
      const data = await res.json();
      if (Array.isArray(data)) setPages(data);
    } catch {}
  }

  useEffect(() => { fetchPages(); }, []);

  // Called by NewPageDialog with a canonical slug (from the chosen page type,
  // not derived from the display name) and, unless "Blank Page" was picked, a
  // template's pre-built config. `folderId` is set when creation was started
  // from a folder's own "+" button (see the Pages panel tree) — the new page
  // lands directly in that folder instead of Unassigned.
  async function createPage(opts: { slug: string; name: string; config?: unknown; folderId?: string | null }, onDone?: () => void) {
    const name = opts.name.trim();
    const slug = opts.slug || toSlug(name);
    if (!name || !slug) return;
    setSubmitting(true);
    try {
      await fetch("/api/pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, name, config: opts.config }),
      });
      if (opts.folderId) {
        await fetch(`/api/pages/${encodeURIComponent(slug)}/folder`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ folderId: opts.folderId }),
        });
      }
      await fetchPages();
      onDone?.();
      router.push(`/admin/pages/${encodeURIComponent(slug)}`);
    } catch {} finally { setSubmitting(false); }
  }

  function startEdit(slug: string, name: string) {
    setConfirmDeleteSlug(null);
    setEditingSlug(slug);
    setEditInput(name);
  }

  async function commitEdit(slug: string) {
    const name = editInput.trim();
    setEditingSlug(null);
    if (!name) return;
    const current = pages.find((p) => p.slug === slug);
    if (name === current?.name) return;
    // Optimistic update
    setPages((ps) => ps.map((p) => (p.slug === slug ? { ...p, name } : p)));
    try {
      const existing = await fetch(`/api/pages/${encodeURIComponent(slug)}`).then((r) => r.json());
      await fetch(`/api/pages/${encodeURIComponent(slug)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ config: { ...existing, name } }),
      });
    } catch {
      await fetchPages(); // rollback on failure
    }
  }

  async function deletePage(slug: string, onDone?: () => void) {
    setDeletingSlug(slug);
    try {
      await fetch(`/api/pages/${encodeURIComponent(slug)}`, { method: "DELETE" });
      setConfirmDeleteSlug(null);
      await fetchPages();
      if (pathname === `/admin/pages/${slug}`) {
        onDone?.();
        router.push("/admin/homepage");
      }
    } catch {} finally { setDeletingSlug(null); }
  }

  // Item 5: drag-to-reorder. Optimistic (the list re-renders in the new order
  // immediately, matching the drag) with rollback to the server's order if the
  // persist call fails — mirrors commitEdit's pattern above.
  async function reorderPages(newOrder: PageEntry[]) {
    const previous = pages;
    setPages(newOrder);
    try {
      const res = await fetch("/api/pages/reorder", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slugs: newOrder.map((p) => p.slug) }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    } catch {
      setPages(previous);
    }
  }

  return {
    pages, fetchPages,
    submitting, createPage,
    editingSlug, setEditingSlug, editInput, setEditInput, startEdit, commitEdit,
    confirmDeleteSlug, setConfirmDeleteSlug, deletingSlug, deletePage,
    reorderPages,
  };
}
