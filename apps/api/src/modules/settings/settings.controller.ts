import { Body, Controller, Get, Put, Post, UploadedFile, UseGuards, UseInterceptors } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { SettingsService } from "./settings.service";
import type { SiteSettingsPatch } from "./settings.service";
import { StorageService } from "../storage/storage.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { UserRole } from "@iiiiibox/shared-types";

@Controller("settings")
export class SettingsController {
  constructor(
    private readonly svc: SettingsService,
    private readonly storage: StorageService,
  ) {}

  // No auth — same trust level as published page content. Hit by the live
  // site's header render and the favicon route.
  @Get("public")
  getPublic() {
    return this.svc.getPublic();
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  get() {
    return this.svc.get();
  }

  @Put()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  update(@Body() patch: SiteSettingsPatch) {
    return this.svc.update(patch);
  }

  // Separate "site" prefix — keeps logo/favicon uploads out of the
  // page-editor's shared "homepage" asset prefix.
  @Post("upload-image")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @UseInterceptors(FileInterceptor("file"))
  async uploadImage(@UploadedFile() file: Express.Multer.File) {
    const url = await this.storage.upload(file.buffer, file.mimetype, "site");
    return { url, contentType: file.mimetype };
  }
}
