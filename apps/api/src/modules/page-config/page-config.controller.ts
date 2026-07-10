import { BadRequestException, Body, Controller, Delete, Get, Param, Put, Post, UploadedFile, UseGuards, UseInterceptors } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { PageConfigService } from "./page-config.service";
import { StorageService } from "../storage/storage.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { UserRole } from "@iiiiibox/shared-types";

@Controller("page-config")
export class PageConfigController {
  constructor(
    private readonly svc: PageConfigService,
    private readonly storage: StorageService,
  ) {}

  @Get()
  list() {
    return this.svc.list();
  }

  // Must be registered before @Get(":page") — Nest/Express match routes in
  // registration order, so "assets" would otherwise be swallowed as page="assets".
  @Get("assets")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  listAssets() {
    return this.storage.list("homepage");
  }

  // Renames in place (metadata only — see StorageService.rename, the key/URL
  // never changes so nothing already placed on a page breaks).
  @Put("assets")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async renameAsset(@Body() body: { key: string; name: string }) {
    await this.storage.rename("homepage", body.key, body.name);
    return { ok: true };
  }

  // Custom fonts (Text component's font-upload system) — public, same trust
  // tier as getPublished/getFolderBySubdomain below: the live published site
  // needs this to emit @font-face rules for whatever fonts admin has
  // uploaded, so it can't sit behind the admin guard. Registered before
  // @Get(":page") for the same route-order reason as "assets" above.
  @Get("fonts")
  listFonts() {
    return this.storage.listFonts();
  }

  @Post("upload-font")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @UseInterceptors(FileInterceptor("file", { limits: { fileSize: 10 * 1024 * 1024 } }))
  async uploadFont(@UploadedFile() file: Express.Multer.File) {
    const ext = (file.originalname.match(/\.(\w+)$/)?.[1] ?? "").toLowerCase();
    if (!["ttf", "otf", "woff", "woff2"].includes(ext)) {
      throw new BadRequestException("Only .ttf, .otf, .woff, .woff2 font files are allowed");
    }
    const { key, url } = await this.storage.upload(file.buffer, file.mimetype, "fonts", file.originalname);
    return this.storage.describeFont({ key, url, name: file.originalname });
  }

  @Delete("fonts")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  deleteFont(@Body("key") key: string) {
    return this.storage.remove("fonts", key);
  }

  // Item 3: the cached read, hit by the live site. Registered before the
  // bare :page route for the same reason as "assets"/"reorder" above — it's a
  // two-segment path so it wouldn't actually collide, but keeping all the
  // more-specific routes grouped together before :page avoids any ambiguity.
  @Get(":page/published")
  getPublished(@Param("page") page: string) {
    return this.svc.getPublished(page);
  }

  // Public — middleware.ts calls this on every request to a subdomain root,
  // resolving arbitrary Host headers to whichever folder claimed that
  // subdomain. No auth: this is live-site routing infrastructure, not an
  // admin action, same trust level as getPublished above.
  @Get("subdomain/:subdomain")
  getFolderBySubdomain(@Param("subdomain") subdomain: string) {
    return this.svc.getFolderBySubdomain(subdomain);
  }

  // Reusable Components sidebar (admin only) — must be registered before
  // @Get(":page") for the same reason as "assets" above, otherwise
  // "reusable-components" would be swallowed as page="reusable-components".
  @Get("reusable-components")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  listReusableComponents() {
    return this.svc.listReusableComponents();
  }

  // Projects/Folders tree (Pages panel) — same "register before :page" reason
  // as assets/reorder/reusable-components above.
  @Get("projects")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  listProjects() {
    return this.svc.listProjects();
  }

  @Post("projects")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  createProject(@Body("name") name: string) {
    return this.svc.createProject(name);
  }

  @Put("projects/reorder")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  reorderProjects(@Body("ids") ids: string[]) {
    return this.svc.reorderProjects(ids);
  }

  @Put("projects/:id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  renameProject(@Param("id") id: string, @Body("name") name: string) {
    return this.svc.renameProject(id, name);
  }

  @Delete("projects/:id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  deleteProject(@Param("id") id: string) {
    return this.svc.deleteProject(id);
  }

  @Post("projects/:id/duplicate")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  duplicateProject(@Param("id") id: string) {
    return this.svc.duplicateProject(id);
  }

  // Publishes every folder/page in the project at once — the project-level
  // Publish button next to the project name. Folder-level Publish (below)
  // stays the fine-grained action; this is the "publish everything" one.
  @Post("projects/:id/publish")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  publishProject(@Param("id") id: string) {
    return this.svc.publishProject(id);
  }

  @Post("folders")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  createFolder(@Body("projectId") projectId: string, @Body("name") name: string) {
    return this.svc.createFolder(projectId, name);
  }

  @Put("folders/:id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  renameFolder(@Param("id") id: string, @Body("name") name: string) {
    return this.svc.renameFolder(id, name);
  }

  @Delete("folders/:id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  deleteFolder(@Param("id") id: string) {
    return this.svc.deleteFolder(id);
  }

  // "Connect to" box in the Pages panel — ties a folder to the apex domain
  // (subdomain: null) or a specific subdomain (subdomain: "seller", etc).
  @Put("folders/:id/subdomain")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  setFolderSubdomain(@Param("id") id: string, @Body("subdomain") subdomain: string | null) {
    return this.svc.setFolderSubdomain(id, subdomain);
  }

  @Post("folders/:id/publish")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  publishFolder(@Param("id") id: string) {
    return this.svc.publishFolder(id);
  }

  // Drag-and-drop reparent — folderId: null moves a page to Unassigned.
  // Registered before @Put(":page") for the same reason as "reorder" above.
  @Put(":page/folder")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  movePageToFolder(@Param("page") page: string, @Body("folderId") folderId: string | null) {
    return this.svc.movePageToFolder(page, folderId);
  }

  // Same reason as "folder" above for the two-segment path not colliding
  // with :page.
  @Post(":page/duplicate")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  duplicatePage(@Param("page") page: string) {
    return this.svc.duplicatePage(page);
  }

  // Uncached — hit by the admin editor, which must always see the latest
  // draft (item 4).
  @Get(":page")
  get(@Param("page") page: string) {
    return this.svc.get(page);
  }

  // Item 5 — must be registered before @Put(":page") for the same reason as
  // "assets" above (otherwise "reorder" would be swallowed as page="reorder").
  @Put("reorder")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  reorder(@Body() body: { slugs: string[] }) {
    return this.svc.reorder(body.slugs);
  }

  @Put(":page")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  save(@Param("page") page: string, @Body() body: { config: unknown }) {
    return this.svc.save(page, body.config);
  }

  @Delete(":page")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  remove(@Param("page") page: string) {
    return this.svc.remove(page);
  }

  @Post("upload-image")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @UseInterceptors(FileInterceptor("file"))
  async uploadImage(@UploadedFile() file: Express.Multer.File) {
    const { url } = await this.storage.upload(file.buffer, file.mimetype, "homepage");
    return { url };
  }
}
