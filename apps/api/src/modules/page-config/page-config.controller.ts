import { Body, Controller, Get, Param, Put, Post, UploadedFile, UseGuards, UseInterceptors } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { PageConfigService } from "./page-config.service";
import { StorageService } from "../storage/storage.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { Role } from "@iiiiibox/shared-types";

@Controller("page-config")
export class PageConfigController {
  constructor(
    private readonly svc: PageConfigService,
    private readonly storage: StorageService,
  ) {}

  @Get(":page")
  get(@Param("page") page: string) {
    return this.svc.get(page);
  }

  @Put(":page")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  save(@Param("page") page: string, @Body() body: { config: unknown }) {
    return this.svc.save(page, body.config);
  }

  @Post("upload-image")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @UseInterceptors(FileInterceptor("file"))
  async uploadImage(@UploadedFile() file: Express.Multer.File) {
    const url = await this.storage.upload(file.buffer, file.mimetype, "homepage");
    return { url };
  }
}
