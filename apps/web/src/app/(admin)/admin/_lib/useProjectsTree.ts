"use client";

import { useCallback, useEffect, useState } from "react";

export interface FolderPageEntry {
  id: string;
  page: string;
  config: unknown;
}

export interface ProjectFolder {
  id: string;
  name: string;
  subdomain: string | null;
  projectId: string;
  rootPageId: string | null;
  rootPage: { id: string; page: string } | null;
  pages: FolderPageEntry[];
}

export interface ProjectEntry {
  id: string;
  name: string;
  order: number;
  folders: ProjectFolder[];
}

// Projects → Folders → Pages tree (Pages panel) — sibling to usePagesList,
// which stays responsible for the flat page list (create/delete/rename of
// individual pages) that this hook layers folder/project grouping on top of.
// Kept separate rather than merged into usePagesList since nav.tsx's dropdown
// only ever needs the flat list, not the tree.
export function useProjectsTree() {
  const [projects, setProjects] = useState<ProjectEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [publishingFolderId, setPublishingFolderId] = useState<string | null>(null);
  const [publishingProjectId, setPublishingProjectId] = useState<string | null>(null);
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [folderEditInput, setFolderEditInput] = useState("");
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [projectEditInput, setProjectEditInput] = useState("");
  const [creatingProject, setCreatingProject] = useState(false);
  // Collapse state — folders default open (matches prior behavior), lives
  // client-side only (not persisted), reset on reload.
  const [collapsedProjectIds, setCollapsedProjectIds] = useState<Set<string>>(new Set());
  const [collapsedFolderIds, setCollapsedFolderIds] = useState<Set<string>>(new Set());

  const fetchProjects = useCallback(async () => {
    try {
      const res = await fetch("/api/page-config/projects", { cache: "no-store" });
      const data = await res.json();
      if (Array.isArray(data)) setProjects(data);
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  function toggleProjectCollapsed(id: string) {
    setCollapsedProjectIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function toggleFolderCollapsed(id: string) {
    setCollapsedFolderIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  // Returns the created project's id so the caller can immediately drop it
  // into rename mode (the "+" button creates with a placeholder name — the
  // user's actual first action is almost always to rename it).
  async function createProject(name: string): Promise<string | null> {
    const trimmed = name.trim();
    if (!trimmed) return null;
    setCreatingProject(true);
    try {
      const res = await fetch("/api/page-config/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });
      const data = await res.json();
      await fetchProjects();
      return typeof data?.id === "string" ? data.id : null;
    } catch {
      return null;
    } finally { setCreatingProject(false); }
  }

  async function duplicateProject(id: string) {
    try {
      await fetch(`/api/page-config/projects/${encodeURIComponent(id)}/duplicate`, { method: "POST" });
    } finally {
      await fetchProjects();
    }
  }

  async function deleteProject(id: string): Promise<boolean> {
    try {
      const res = await fetch(`/api/page-config/projects/${encodeURIComponent(id)}`, { method: "DELETE" });
      return res.ok;
    } finally {
      await fetchProjects();
    }
  }

  async function reorderProjects(ids: string[]) {
    const previous = projects;
    setProjects((prev) => {
      const byId = new Map(prev.map((p) => [p.id, p]));
      return ids.map((id) => byId.get(id)).filter((p): p is ProjectEntry => Boolean(p));
    });
    try {
      const res = await fetch("/api/page-config/projects/reorder", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    } catch {
      setProjects(previous);
    }
  }

  async function publishProject(id: string): Promise<boolean> {
    setPublishingProjectId(id);
    try {
      const res = await fetch(`/api/page-config/projects/${encodeURIComponent(id)}/publish`, { method: "POST" });
      return res.ok;
    } catch {
      return false;
    } finally {
      setPublishingProjectId(null);
    }
  }

  function startEditProject(id: string, name: string) {
    setEditingProjectId(id);
    setProjectEditInput(name);
  }

  async function commitEditProject(id: string) {
    const name = projectEditInput.trim();
    setEditingProjectId(null);
    if (!name) return;
    const current = projects.find((p) => p.id === id);
    if (name === current?.name) return;
    setProjects((ps) => ps.map((p) => (p.id === id ? { ...p, name } : p)));
    try {
      await fetch(`/api/page-config/projects/${encodeURIComponent(id)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
    } catch {
      await fetchProjects();
    }
  }

  // Arbitrary folder — no root page, no subdomain, purely organizational
  // until pages are dragged/created into it.
  async function createFolder(projectId: string, name: string) {
    try {
      await fetch("/api/page-config/folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, name }),
      });
    } finally {
      await fetchProjects();
    }
  }

  // Only succeeds server-side for folders without a root page (Home/Seller/
  // Rider stay permanent) — see deleteFolder in page-config.service.ts.
  async function deleteFolder(id: string): Promise<boolean> {
    try {
      const res = await fetch(`/api/page-config/folders/${encodeURIComponent(id)}`, { method: "DELETE" });
      return res.ok;
    } finally {
      await fetchProjects();
    }
  }

  function startEditFolder(id: string, name: string) {
    setEditingFolderId(id);
    setFolderEditInput(name);
  }

  // Also renames the folder's root page (server-side, see renameFolder in
  // page-config.service.ts) — refetch afterward so the root page's displayed
  // name in the "pages inside this folder" list stays in sync too.
  async function commitEditFolder(id: string) {
    const name = folderEditInput.trim();
    setEditingFolderId(null);
    if (!name) return;
    try {
      await fetch(`/api/page-config/folders/${encodeURIComponent(id)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      await fetchProjects();
    } catch {
      await fetchProjects();
    }
  }

  // "Connect to" box — ties a folder to the apex domain (subdomain: null) or
  // a specific subdomain. Optimistic update (the dropdown needs to reflect
  // the new choice immediately), rolled back to the pre-fetch snapshot on
  // failure (e.g. someone else just claimed that subdomain).
  async function setFolderSubdomain(id: string, subdomain: string | null): Promise<{ ok: boolean; error?: string }> {
    const previous = projects;
    setProjects((prev) => prev.map((p) => ({
      ...p,
      folders: p.folders.map((f) => (f.id === id ? { ...f, subdomain } : f)),
    })));
    try {
      const res = await fetch(`/api/page-config/folders/${encodeURIComponent(id)}/subdomain`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subdomain }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setProjects(previous);
        return { ok: false, error: data?.message ?? `HTTP ${res.status}` };
      }
      await fetchProjects();
      return { ok: true };
    } catch {
      setProjects(previous);
      return { ok: false, error: "Network error" };
    }
  }

  async function publishFolder(id: string): Promise<boolean> {
    setPublishingFolderId(id);
    try {
      const res = await fetch(`/api/page-config/folders/${encodeURIComponent(id)}/publish`, { method: "POST" });
      return res.ok;
    } catch {
      return false;
    } finally {
      setPublishingFolderId(null);
    }
  }

  // folderId: null moves a page back to Unassigned (draft-only). Works
  // across projects too — folderId is just a Folder id, not scoped to any
  // particular project, so dragging a page onto a folder in a different
  // project already reparents it there.
  async function movePageToFolder(page: string, folderId: string | null) {
    const previous = projects;
    try {
      const res = await fetch(`/api/pages/${encodeURIComponent(page)}/folder`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folderId }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await fetchProjects();
    } catch {
      setProjects(previous);
    }
  }

  async function duplicatePage(page: string) {
    try {
      await fetch(`/api/pages/${encodeURIComponent(page)}/duplicate`, { method: "POST" });
    } finally {
      await fetchProjects();
    }
  }

  return {
    projects, loading, fetchProjects,
    createProject, creatingProject, duplicateProject, deleteProject, reorderProjects,
    publishProject, publishingProjectId,
    editingProjectId, setEditingProjectId, projectEditInput, setProjectEditInput, startEditProject, commitEditProject,
    createFolder, deleteFolder,
    editingFolderId, setEditingFolderId, folderEditInput, setFolderEditInput, startEditFolder, commitEditFolder,
    setFolderSubdomain,
    publishFolder, publishingFolderId,
    movePageToFolder, duplicatePage,
    collapsedProjectIds, toggleProjectCollapsed, collapsedFolderIds, toggleFolderCollapsed,
  };
}
