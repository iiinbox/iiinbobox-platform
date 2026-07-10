import { Body, Controller, Delete, Get, Param, Post, UploadedFile, UseGuards, UseInterceptors } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { categoryCreateSchema, UserRole, type CategoryCreateInput } from "@iiiiibox/shared-types";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { CategoriesService } from "./categories.service";
import { StorageService } from "../storage/storage.service";

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller("admin/categories")
export class AdminCategoriesController {
  constructor(
    private readonly categoriesService: CategoriesService,
    private readonly storage: StorageService,
  ) {}

  @Get()
  list() {
    return this.categoriesService.listWithChildren();
  }

  @Post()
  create(@Body(new ZodValidationPipe(categoryCreateSchema)) body: CategoryCreateInput) {
    return this.categoriesService.create(body);
  }

  @Post("upload-image")
  @UseInterceptors(FileInterceptor("file"))
  async uploadImage(@UploadedFile() file: Express.Multer.File) {
    const { url } = await this.storage.upload(file.buffer, file.mimetype, "categories");
    return { url };
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.categoriesService.remove(id);
  }
}
