"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Shield, Layout, ChevronDown, FileText, Plus, LogOut, Pencil, Trash2, Check, X } from "lucide-react";

interface PageEntry { slug: string; name: string }

function toSlug(name: string) {
  return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function AdminTopNav() {
  const [pagesOpen, setPagesOpen] = useState(false);
  const [pages, setPages] = useState<PageEntry[]>([]);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  const [editInput, setEditInput] = useState("");
  const [confirmDeleteSlug, setConfirmDeleteSlug] = useState<string | null>(null);
  const [deletingSlug, setDeletingSlug] = useState<string | null>(null);
  const pathname = usePathname();
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  const pagesActive = pathname === "/admin/homepage" || pathname.startsWith("/admin/pages/");

  async function fetchPages() {
    try {
      const res = await fetch("/api/pages");
      const data = await res.json();
      if (Array.isArray(data)) setPages(data);
    } catch {}
  }

  useEffect(() => { fetchPages(); }, []);

  useEffect(() => {
    if (creating && inputRef.current) inputRef.current.focus();
  }, [creating]);

  useEffect(() => {
    if (editingSlug && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingSlug]);

  useEffect(() => {
    if (!pagesOpen) return;
    function handler(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setPagesOpen(false); setCreating(false); setNewName("");
        setEditingSlug(null); setConfirmDeleteSlug(null);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [pagesOpen]);

  async function logout() {
    setLoggingOut(true);
    try {
      await fetch("/api/logout", { method: "POST" });
    } catch {}
    window.location.href = "/admin-gate";
  }

  async function createPage() {
    const name = newName.trim();
    if (!name) return;
    const slug = toSlug(name);
    if (!slug) return;
    setSubmitting(true);
    try {
      await fetch("/api/pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, name }),
      });
      await fetchPages();
      setCreating(false); setNewName(""); setPagesOpen(false);
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
    setPages((ps) => ps.map((p) => p.slug === slug ? { ...p, name } : p));
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

  async function deletePage(slug: string) {
    setDeletingSlug(slug);
    try {
      await fetch(`/api/pages/${encodeURIComponent(slug)}`, { method: "DELETE" });
      setConfirmDeleteSlug(null);
      await fetchPages();
      if (pathname === `/admin/pages/${slug}`) {
        setPagesOpen(false);
        router.push("/admin/homepage");
      }
    } catch {} finally { setDeletingSlug(null); }
  }

  const navLinkClass = (active: boolean) =>
    `flex items-center gap-1.5 rounded-md px-2.5 py-1 text-sm font-medium whitespace-nowrap transition-colors ${
      active ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
    }`;

  return (
    <div className="border-b bg-background shrink-0">
      <div className="flex items-center h-10 gap-2 px-4">
        {/* Brand */}
        <div className="flex items-center gap-1.5 text-muted-foreground shrink-0">
          <Shield className="h-3.5 w-3.5" />
          <span className="text-xs font-semibold uppercase tracking-wider">Admin</span>
        </div>

        <div className="h-4 w-px bg-border mx-1 shrink-0" />

        <nav className="flex items-center gap-0.5 flex-1 min-w-0">
          {/* Pages dropdown */}
          <div className="relative shrink-0" ref={dropdownRef}>
            <button
              onClick={() => { setPagesOpen((v) => !v); setCreating(false); setNewName(""); setEditingSlug(null); setConfirmDeleteSlug(null); }}
              className={`${navLinkClass(pagesActive)} gap-1`}
            >
              <Layout className="h-3.5 w-3.5" />
              Pages
              <ChevronDown className={`h-3 w-3 transition-transform ${pagesOpen ? "rotate-180" : ""}`} />
            </button>

            {pagesOpen && (
              <div className="absolute left-0 top-full mt-1 z-50 bg-background border rounded-lg shadow-lg py-1 min-w-[240px]">
                {/* Home page — no edit/delete */}
                <Link href="/admin/homepage" onClick={() => setPagesOpen(false)}
                  className={`flex items-center gap-2 px-3 py-1.5 text-sm transition-colors hover:bg-muted ${pathname === "/admin/homepage" ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                  <FileText className="h-3.5 w-3.5 shrink-0" />
                  Home Page
                  <span className="ml-auto text-[10px] text-muted-foreground">default</span>
                </Link>

                {/* Custom pages */}
                {pages.filter((p) => p.slug !== "home").map((p) => {
                  const isEditing = editingSlug === p.slug;
                  const isConfirmDelete = confirmDeleteSlug === p.slug;
                  const isDeleting = deletingSlug === p.slug;
                  const isActive = pathname === `/admin/pages/${p.slug}`;

                  if (isEditing) {
                    return (
                      <div key={p.slug} className="flex items-center gap-1.5 px-3 py-1.5">
                        <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        <input
                          ref={editInputRef}
                          value={editInput}
                          onChange={(e) => setEditInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") commitEdit(p.slug);
                            if (e.key === "Escape") setEditingSlug(null);
                          }}
                          onBlur={() => commitEdit(p.slug)}
                          className="flex-1 min-w-0 text-sm border rounded px-1.5 py-0.5 bg-background outline-none focus:ring-1 focus:ring-black"
                        />
                        <button onMouseDown={(e) => { e.preventDefault(); commitEdit(p.slug); }}
                          className="p-0.5 rounded hover:bg-muted text-green-600">
                          <Check className="h-3.5 w-3.5" />
                        </button>
                        <button onMouseDown={(e) => { e.preventDefault(); setEditingSlug(null); }}
                          className="p-0.5 rounded hover:bg-muted text-muted-foreground">
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    );
                  }

                  if (isConfirmDelete) {
                    return (
                      <div key={p.slug} className="px-3 py-1.5 flex items-center gap-1.5">
                        <span className="text-xs text-destructive flex-1 truncate">Delete "{p.name}"?</span>
                        <button onClick={() => deletePage(p.slug)} disabled={isDeleting}
                          className="text-[11px] px-2 py-0.5 rounded bg-red-600 text-white disabled:opacity-50 shrink-0">
                          {isDeleting ? "…" : "Yes"}
                        </button>
                        <button onClick={() => setConfirmDeleteSlug(null)}
                          className="text-[11px] px-2 py-0.5 rounded border hover:bg-muted shrink-0">
                          No
                        </button>
                      </div>
                    );
                  }

                  return (
                    <div key={p.slug} className="group flex items-center hover:bg-muted transition-colors">
                      <Link href={`/admin/pages/${encodeURIComponent(p.slug)}`} onClick={() => setPagesOpen(false)}
                        className={`flex items-center gap-2 px-3 py-1.5 text-sm flex-1 min-w-0 ${isActive ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                        <FileText className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{p.name}</span>
                      </Link>
                      <div className="flex items-center gap-0.5 pr-2 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        <button onClick={(e) => { e.stopPropagation(); startEdit(p.slug, p.name); }}
                          className="p-1 rounded hover:bg-background text-muted-foreground hover:text-foreground"
                          title="Rename">
                          <Pencil className="h-3 w-3" />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); setEditingSlug(null); setConfirmDeleteSlug(p.slug); }}
                          className="p-1 rounded hover:bg-background text-muted-foreground hover:text-red-600"
                          title="Delete">
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}

                <div className="h-px bg-border my-1" />

                {creating ? (
                  <div className="px-3 py-1.5 flex items-center gap-2">
                    <input ref={inputRef} value={newName} onChange={(e) => setNewName(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") createPage(); if (e.key === "Escape") { setCreating(false); setNewName(""); } }}
                      placeholder="Page name…" className="text-sm border rounded px-2 py-0.5 flex-1 min-w-0 bg-background" disabled={submitting} />
                    <button onClick={createPage} disabled={submitting || !newName.trim()} className="text-xs px-2 py-0.5 rounded bg-black text-white disabled:opacity-40">
                      {submitting ? "…" : "Add"}
                    </button>
                  </div>
                ) : (
                  <button onClick={() => setCreating(true)} className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted transition-colors">
                    <Plus className="h-3.5 w-3.5" /> New page
                  </button>
                )}
              </div>
            )}
          </div>
        </nav>

        {/* Logout */}
        <button
          onClick={logout}
          disabled={loggingOut}
          className="ml-auto flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors shrink-0 disabled:opacity-50"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span>{loggingOut ? "Logging out…" : "Logout"}</span>
        </button>
      </div>
    </div>
  );
}
