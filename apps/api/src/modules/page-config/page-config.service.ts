import { Injectable, BadRequestException } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { prisma } from "@iiiiibox/database";
import { RedisService } from "../redis/redis.service";

function slugToLabel(slug: string) {
  return slug.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

// Item 3: cache published page reads until the page is republished. A
// generous TTL is still set as a safety net in case an invalidation is ever
// missed (e.g. a crash mid-save), so the cache can't go stale forever.
const PUBLISHED_TTL_SECONDS = 24 * 60 * 60;
const publishedKey = (page: string) => `page-config:published:${page}`;

// Reusable Components library (opt-in — see PageEditor.tsx's "Save as
// Reusable Component" action). Shorter TTL than PUBLISHED_TTL_SECONDS since
// this is a low-traffic admin-only read (sidebar mount), not a per-visitor
// hot path — no need for a 24h safety net here.
const REUSABLE_TTL_SECONDS = 5 * 60;
const REUSABLE_KEY = "page-config:reusable-components";

interface ReusableComponentEntry {
  id: string;
  sourcePage: string;
  zone: "header" | "template" | "footer";
  viewport: "desktop" | "mobile";
  name: string;
  type: string;
  component: unknown;
}

@Injectable()
export class PageConfigService {
  constructor(private readonly redis: RedisService) {}

  async list() {
    const rows = await prisma.pageConfig.findMany({
      select: { page: true, config: true },
    });
    // `order` lives inside each page's own config JSON (item 5) — no schema
    // change needed. Pages without one yet (created before drag-reordering
    // existed) sort after ordered ones, alphabetically among themselves.
    return rows
      .map((r) => ({
        slug: r.page,
        name: (r.config as any)?.name ?? slugToLabel(r.page),
        order: typeof (r.config as any)?.order === "number" ? (r.config as any).order : null,
      }))
      .sort((a, b) => {
        if (a.order !== null && b.order !== null) return a.order - b.order;
        if (a.order !== null) return -1;
        if (b.order !== null) return 1;
        return a.slug.localeCompare(b.slug);
      })
      .map(({ slug, name }) => ({ slug, name }));
  }

  // Uncached — used by the editor to load draft content. Must always reflect
  // what's actually in Postgres, including changes made seconds ago (item 4).
  async get(page: string) {
    const row = await prisma.pageConfig.findUnique({ where: { page } });
    return row?.config ?? { components: [] };
  }

  // Cached — used by the live site only. Reads `publishedConfig`, NOT
  // `config` — editing/autosaving a page only ever touches the draft
  // (`config`); a page only shows up here once its Folder has been
  // explicitly published (see publishFolder below), which copies
  // config -> publishedConfig. null = never published = not live, which
  // flows into the live routes' existing isEmptyConfig/notFound() handling
  // with no route-code changes needed.
  async getPublished(page: string) {
    const cached = await this.redis.get(publishedKey(page));
    if (cached !== null) return cached;
    const row = await prisma.pageConfig.findUnique({ where: { page } });
    const config = row?.publishedConfig ?? null;
    if (config !== null) await this.redis.set(publishedKey(page), config, PUBLISHED_TTL_SECONDS);
    return config;
  }

  async save(page: string, config: unknown) {
    const result = await prisma.pageConfig.upsert({
      where: { page },
      update: { config: config as any },
      create: { page, config: config as any },
    });
    // Draft saves no longer affect what's live at all (see getPublished
    // above) — nothing to purge there. Reusable components are scanned from
    // *draft* content though, so this purge stays: any save could have
    // added/removed a reusable:true component, and the sidebar should
    // reflect that right away.
    await this.redis.del(REUSABLE_KEY);
    return result;
  }

  // Promotes every page in a folder — including its own root page, unioned
  // explicitly rather than trusting folderId sync (see comment below) — from
  // draft to live, all at once, in one transaction.
  async publishFolder(folderId: string) {
    const folder = await prisma.folder.findUnique({
      where: { id: folderId },
      include: { rootPage: true, pages: true },
    });
    if (!folder) throw new BadRequestException("Folder not found");

    // Union rootPage + pages rather than filtering by folderId alone: if a
    // root page's folderId ever drifted from its folder's rootPageId, that
    // would silently skip publishing the folder's own root page while
    // everything else in the folder still went live.
    const byId = new Map<string, { id: string; page: string; config: unknown }>();
    if (folder.rootPage) byId.set(folder.rootPage.id, folder.rootPage);
    for (const p of folder.pages) byId.set(p.id, p);
    const pagesToPublish = [...byId.values()];

    await prisma.$transaction(
      pagesToPublish.map((p) =>
        prisma.pageConfig.update({ where: { id: p.id }, data: { publishedConfig: p.config as any } }),
      ),
    );
    await Promise.all(pagesToPublish.map((p) => this.redis.del(publishedKey(p.page))));

    return { ok: true, published: pagesToPublish.map((p) => p.page) };
  }

  // Promotes every page across every folder in a project at once — the same
  // union-by-id logic as publishFolder, just gathered from all of a
  // project's folders instead of one.
  async publishProject(projectId: string) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { folders: { include: { rootPage: true, pages: true } } },
    });
    if (!project) throw new BadRequestException("Project not found");

    const byId = new Map<string, { id: string; page: string; config: unknown }>();
    for (const folder of project.folders) {
      if (folder.rootPage) byId.set(folder.rootPage.id, folder.rootPage);
      for (const p of folder.pages) byId.set(p.id, p);
    }
    const pagesToPublish = [...byId.values()];

    await prisma.$transaction(
      pagesToPublish.map((p) =>
        prisma.pageConfig.update({ where: { id: p.id }, data: { publishedConfig: p.config as any } }),
      ),
    );
    await Promise.all(pagesToPublish.map((p) => this.redis.del(publishedKey(p.page))));

    return { ok: true, published: pagesToPublish.map((p) => p.page) };
  }

  async listProjects() {
    return prisma.project.findMany({
      orderBy: { order: "asc" },
      include: {
        folders: {
          orderBy: { createdAt: "asc" },
          include: {
            rootPage: { select: { page: true, id: true } },
            pages: { select: { page: true, id: true, config: true }, orderBy: { page: "asc" } },
          },
        },
      },
    });
  }

  // Projects start empty — folders are arbitrary now (see the Folder model
  // comment), created one at a time via createFolder below, not a fixed
  // Home/Seller/Rider trio. `order` defaults to "last" so new projects sort
  // after existing ones in the sidebar.
  async createProject(name: string) {
    const last = await prisma.project.findFirst({ orderBy: { order: "desc" } });
    return prisma.project.create({ data: { name, order: (last?.order ?? -1) + 1 } });
  }

  async renameProject(id: string, name: string) {
    return prisma.project.update({ where: { id }, data: { name } });
  }

  async reorderProjects(ids: string[]) {
    await prisma.$transaction(ids.map((id, index) => prisma.project.update({ where: { id }, data: { order: index } })));
    return { ok: true };
  }

  // Blocks deleting a project that still holds a folder with a root page
  // (Home/Seller/Rider, or any future subdomain-wired folder) — those are
  // meant to be permanent. A project of purely arbitrary (rootPageId: null)
  // folders can go; its member pages fall back to Unassigned (folderId
  // SetNull) rather than being deleted outright.
  async deleteProject(id: string) {
    const project = await prisma.project.findUnique({ where: { id }, include: { folders: true } });
    if (!project) throw new BadRequestException("Project not found");
    if (project.folders.some((f) => f.rootPageId)) {
      throw new BadRequestException("Can't delete a project that contains a permanent folder (has a root page)");
    }
    await prisma.project.delete({ where: { id } });
    return { ok: true };
  }

  // Deep copy: new project, new folders (never carrying over `subdomain` —
  // it's globally unique and the original still owns it), new pages with
  // fresh slugs. A duplicated folder's root page (if any) is recreated too
  // and re-linked as the new folder's root, so a duplicated project is a
  // fully independent, immediately-editable copy.
  async duplicateProject(id: string) {
    const project = await prisma.project.findUnique({ where: { id }, include: { folders: { include: { pages: true } } } });
    if (!project) throw new BadRequestException("Project not found");
    const suffix = randomUUID().slice(0, 8);
    return prisma.$transaction(async (tx) => {
      const last = await tx.project.findFirst({ orderBy: { order: "desc" } });
      const newProject = await tx.project.create({ data: { name: `${project.name} (Copy)`, order: (last?.order ?? -1) + 1 } });
      for (const folder of project.folders) {
        const newFolder = await tx.folder.create({ data: { name: folder.name, projectId: newProject.id } });
        let newRootPageId: string | null = null;
        for (const p of folder.pages) {
          const created = await tx.pageConfig.create({
            data: { page: `${p.page}-${suffix}`, config: p.config as any, folderId: newFolder.id },
          });
          if (folder.rootPageId === p.id) newRootPageId = created.id;
        }
        if (newRootPageId) await tx.folder.update({ where: { id: newFolder.id }, data: { rootPageId: newRootPageId } });
      }
      return tx.project.findUniqueOrThrow({ where: { id: newProject.id }, include: { folders: true } });
    });
  }

  // Arbitrary folder — no root page, no subdomain. Purely organizational
  // until pages are dragged/created into it.
  async createFolder(projectId: string, name: string) {
    return prisma.folder.create({ data: { name, projectId } });
  }

  // Any folder can be deleted now (the confirmation dialog in the Pages
  // panel is the safety gate, not a backend block) — member pages fall back
  // to Unassigned automatically (PageConfig.folder is onDelete: SetNull),
  // and a root page is explicitly detached here (folderId: null) rather than
  // deleted, so its content and slug survive as an ordinary draft-only page.
  // A folder connected to a subdomain (folder.subdomain) loses that
  // connection — the frontend warns about this before calling here.
  async deleteFolder(id: string) {
    const folder = await prisma.folder.findUnique({ where: { id } });
    if (!folder) throw new BadRequestException("Folder not found");
    await prisma.$transaction(async (tx) => {
      if (folder.rootPageId) {
        await tx.pageConfig.update({ where: { id: folder.rootPageId }, data: { folderId: null } });
      }
      await tx.folder.delete({ where: { id } });
    });
    return { ok: true };
  }

  // Also updates the root page's own config.name when the folder has one,
  // keeping the folder label and its root page's displayed name in sync —
  // this is also how renaming a pinned page (Home/Seller/Rider) from the
  // page side surfaces as a folder rename.
  async renameFolder(id: string, name: string) {
    const folder = await prisma.folder.findUnique({ where: { id }, include: { rootPage: true } });
    if (!folder) throw new BadRequestException("Folder not found");
    return prisma.$transaction(async (tx) => {
      const updated = await tx.folder.update({ where: { id }, data: { name } });
      if (folder.rootPage) {
        const cfg = { ...((folder.rootPage.config as any) ?? {}), name };
        await tx.pageConfig.update({ where: { id: folder.rootPage.id }, data: { config: cfg } });
      }
      return updated;
    });
  }

  // Folder → Domain/Subdomain connection (Pages panel's "Connect to" box).
  // `subdomain: null` disconnects (folder no longer resolves at any
  // subdomain — its pages are still reachable via the normal /slug route,
  // this only controls the dedicated-subdomain-root shortcut). A non-null
  // value must be globally unique across every folder — enforced here with a
  // friendly error rather than relying solely on the DB's unique constraint
  // (which would surface as an opaque 500).
  async setFolderSubdomain(id: string, subdomain: string | null) {
    const folder = await prisma.folder.findUnique({ where: { id } });
    if (!folder) throw new BadRequestException("Folder not found");
    if (subdomain) {
      const existing = await prisma.folder.findUnique({ where: { subdomain } });
      if (existing && existing.id !== id) {
        throw new BadRequestException(`"${subdomain}" is already connected to another folder`);
      }
    }
    return prisma.folder.update({ where: { id }, data: { subdomain } });
  }

  // Drag-and-drop reparent — folderId: null moves a page back to Unassigned
  // (draft-only, never live, until moved into a folder and that folder is
  // published). Rejects moving a folder's own root page (undefined state —
  // a folder must always keep its root page).
  async movePageToFolder(page: string, folderId: string | null) {
    const row = await prisma.pageConfig.findUnique({ where: { page }, include: { rootOfFolder: true } });
    if (!row) throw new BadRequestException("Page not found");
    if (row.rootOfFolder) throw new BadRequestException("Can't move a folder's own root page out of its folder");

    let nextOrder = 0;
    if (folderId) {
      const siblings = await prisma.pageConfig.findMany({ where: { folderId }, select: { config: true } });
      const orders = siblings.map((s) => (typeof (s.config as any)?.order === "number" ? (s.config as any).order : -1));
      nextOrder = (orders.length ? Math.max(...orders) : -1) + 1;
    }

    return prisma.pageConfig.update({
      where: { page },
      data: { folderId, config: { ...((row.config as any) ?? {}), order: nextOrder } },
    });
  }

  // Copies a page's draft content into a brand-new page in the same folder
  // (or Unassigned, if the original was). Always starts unpublished — a
  // duplicate is never live just because its source was.
  async duplicatePage(page: string) {
    const row = await prisma.pageConfig.findUnique({ where: { page } });
    if (!row) throw new BadRequestException("Page not found");
    const newSlug = `${page}-copy-${randomUUID().slice(0, 6)}`;
    const name = `${(row.config as any)?.name ?? page} (Copy)`;
    return prisma.pageConfig.create({
      data: { page: newSlug, config: { ...(row.config as any), name }, folderId: row.folderId },
    });
  }

  // Public (no auth) — called from middleware.ts on every request to a
  // subdomain's root path, resolving arbitrary Host headers to whichever
  // folder claimed that subdomain. Returns just the root page's slug, not
  // page content — middleware only needs to know what to rewrite the path
  // to, and this must stay a fast, cheap lookup since it runs in the
  // request-serving hot path (unlike everything else in this service, which
  // is admin-editor-only traffic).
  async getFolderBySubdomain(subdomain: string) {
    const folder = await prisma.folder.findUnique({
      where: { subdomain },
      include: { rootPage: { select: { page: true } } },
    });
    return folder?.rootPage ? { slug: folder.rootPage.page } : null;
  }

  // Scans every page's header/template/footer × desktop/mobile component
  // arrays for ones explicitly flagged reusable (opt-in via the editor's
  // "Save as Reusable Component" action) — not every component on every
  // page, which would be mostly noise. Cache-aside, same shape as
  // getPublished() above.
  async listReusableComponents(): Promise<ReusableComponentEntry[]> {
    const cached = await this.redis.get<ReusableComponentEntry[]>(REUSABLE_KEY);
    if (cached !== null) return cached;

    const rows = await prisma.pageConfig.findMany({ select: { page: true, config: true } });
    const result: ReusableComponentEntry[] = [];
    for (const row of rows) {
      const cfg = row.config as any;
      for (const zone of ["header", "template", "footer"] as const) {
        for (const viewport of ["desktop", "mobile"] as const) {
          const components = cfg?.[zone]?.[viewport]?.components;
          if (!Array.isArray(components)) continue;
          for (const c of components) {
            if (c?.reusable === true) {
              result.push({
                id: c.id,
                sourcePage: row.page,
                zone,
                viewport,
                name: c.reusableName || "Untitled",
                type: c.type,
                component: c,
              });
            }
          }
        }
      }
    }

    await this.redis.set(REUSABLE_KEY, result, REUSABLE_TTL_SECONDS);
    return result;
  }

  async remove(page: string) {
    await prisma.pageConfig.delete({ where: { page } });
    await this.redis.del(publishedKey(page));
    return { ok: true };
  }

  // Item 5: persist a new page order from the sidebar's drag-and-drop.
  // Read-modify-write per page (rather than blind-overwriting config) so this
  // can never clobber unrelated header/template/footer content a concurrent
  // editor session might be saving. Draft-only field (order is never
  // rendered on the live page) — no published-cache purge needed here.
  async reorder(slugs: string[]) {
    await Promise.all(
      slugs.map(async (page, index) => {
        const row = await prisma.pageConfig.findUnique({ where: { page } });
        if (!row) return;
        await prisma.pageConfig.update({
          where: { page },
          data: { config: { ...(row.config as any), order: index } },
        });
      }),
    );
    return { ok: true };
  }
}
