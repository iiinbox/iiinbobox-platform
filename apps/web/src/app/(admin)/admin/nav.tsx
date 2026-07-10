"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Shield, Layout, ChevronDown, FileText, Folder as FolderIcon, Plus, LogOut, Pencil, Trash2, Check, X } from "lucide-react";
import { usePagesList } from "./_lib/usePagesList";
import { useProjectsTree } from "./_lib/useProjectsTree";
import { NewPageDialog } from "./_components/NewPageDialog";

export function AdminTopNav() {
  const [pagesOpen, setPagesOpen] = useState(false);
  const [newPageOpen, setNewPageOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const pathname = usePathname();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);
  const {
    pages, createPage,
    editingSlug, setEditingSlug, editInput, setEditInput, startEdit, commitEdit,
    confirmDeleteSlug, setConfirmDeleteSlug, deletingSlug, deletePage,
  } = usePagesList();
  // Read-only mirror of the editor's Pages panel tree — just enough to
  // navigate by folder here. Rename/delete/drag/Preview/Publish all live in
  // the full Pages panel inside the editor itself, not this compact dropdown.
  const { projects } = useProjectsTree();

  const pagesActive =
    pathname === "/admin/homepage" || pathname === "/admin/seller-dashboard" || pathname === "/admin/rider-dashboard" || pathname.startsWith("/admin/pages/");

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
        setPagesOpen(false);
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

  const navLinkClass = (active: boolean) =>
    `flex items-center gap-1.5 rounded-md px-2.5 py-1 text-sm font-medium whitespace-nowrap transition-colors ${
      active ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
    }`;

  // A single custom (non-root) page row, with rename/delete — used for both
  // a folder's other pages and the Unassigned bucket below.
  function renderPageEntry(pageSlug: string, name: string) {
    const isEditing = editingSlug === pageSlug;
    const isConfirmDelete = confirmDeleteSlug === pageSlug;
    const isDeleting = deletingSlug === pageSlug;
    const isActive = pathname === `/admin/pages/${pageSlug}`;

    if (isEditing) {
      return (
        <div key={pageSlug} className="flex items-center gap-1.5 px-3 py-1.5">
          <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <input
            ref={editInputRef}
            value={editInput}
            onChange={(e) => setEditInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitEdit(pageSlug);
              if (e.key === "Escape") setEditingSlug(null);
            }}
            onBlur={() => commitEdit(pageSlug)}
            className="flex-1 min-w-0 text-sm border rounded px-1.5 py-0.5 bg-background outline-none focus:ring-1 focus:ring-black"
          />
          <button onMouseDown={(e) => { e.preventDefault(); commitEdit(pageSlug); }}
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
        <div key={pageSlug} className="px-3 py-1.5 flex items-center gap-1.5">
          <span className="text-xs text-destructive flex-1 truncate">Delete "{name}"?</span>
          <button onClick={() => deletePage(pageSlug, () => setPagesOpen(false))} disabled={isDeleting}
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
      <div key={pageSlug} className="group flex items-center hover:bg-muted transition-colors">
        <Link href={`/admin/pages/${encodeURIComponent(pageSlug)}`} onClick={() => setPagesOpen(false)}
          className={`flex items-center gap-2 px-3 py-1.5 text-sm flex-1 min-w-0 ${isActive ? "text-foreground font-medium" : "text-muted-foreground"}`}>
          <FileText className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{name}</span>
        </Link>
        <div className="flex items-center gap-0.5 pr-2 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <button onClick={(e) => { e.stopPropagation(); startEdit(pageSlug, name); }}
            className="p-1 rounded hover:bg-background text-muted-foreground hover:text-foreground"
            title="Rename">
            <Pencil className="h-3 w-3" />
          </button>
          <button onClick={(e) => { e.stopPropagation(); setEditingSlug(null); setConfirmDeleteSlug(pageSlug); }}
            className="p-1 rounded hover:bg-background text-muted-foreground hover:text-red-600"
            title="Delete">
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      </div>
    );
  }

  const assignedSlugs = new Set(projects.flatMap((p) => p.folders.flatMap((f) => f.pages.map((fp) => fp.page))));
  const unassigned = pages.filter((p) => !assignedSlugs.has(p.slug));

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
              onClick={() => { setPagesOpen((v) => !v); setEditingSlug(null); setConfirmDeleteSlug(null); }}
              className={`${navLinkClass(pagesActive)} gap-1`}
            >
              <Layout className="h-3.5 w-3.5" />
              Pages
              <ChevronDown className={`h-3 w-3 transition-transform ${pagesOpen ? "rotate-180" : ""}`} />
            </button>

            {pagesOpen && (
              <div className="absolute left-0 top-full mt-1 z-50 bg-background border rounded-lg shadow-lg py-1 min-w-[260px] max-h-[70vh] overflow-y-auto">
                {/* Grouped by Project → Folder, mirroring the editor's Pages
                    panel tree (see useProjectsTree) — root pages (pinned, no
                    edit/delete here) first, then the folder's other pages. */}
                {projects.map((project) => (
                  <div key={project.id} className="py-0.5">
                    <p className="px-3 pt-1 pb-0.5 text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">{project.name}</p>
                    {project.folders.map((folder) => (
                      <div key={folder.id}>
                        {folder.rootPage && (
                          <Link href={`/admin/pages/${encodeURIComponent(folder.rootPage.page)}`} onClick={() => setPagesOpen(false)}
                            className={`flex items-center gap-2 px-3 py-1.5 text-sm transition-colors hover:bg-muted ${pathname === `/admin/pages/${folder.rootPage.page}` ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                            <FolderIcon className="h-3.5 w-3.5 shrink-0" />
                            {folder.name}
                            <span className="ml-auto text-[10px] text-muted-foreground">folder</span>
                          </Link>
                        )}
                        {folder.pages.filter((p) => p.id !== folder.rootPageId).map((fp) => {
                          const pageMeta = pages.find((x) => x.slug === fp.page);
                          return renderPageEntry(fp.page, pageMeta?.name ?? fp.page);
                        })}
                      </div>
                    ))}
                  </div>
                ))}

                {unassigned.length > 0 && (
                  <div className="py-0.5">
                    <p className="px-3 pt-1 pb-0.5 text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">Unassigned</p>
                    {unassigned.map((p) => renderPageEntry(p.slug, p.name))}
                  </div>
                )}

                <div className="h-px bg-border my-1" />

                <button onClick={() => { setPagesOpen(false); setNewPageOpen(true); }} className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted transition-colors">
                  <Plus className="h-3.5 w-3.5" /> New page
                </button>
              </div>
            )}
          </div>
        </nav>

        <NewPageDialog open={newPageOpen} onOpenChange={setNewPageOpen} pages={pages} createPage={createPage} />

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
