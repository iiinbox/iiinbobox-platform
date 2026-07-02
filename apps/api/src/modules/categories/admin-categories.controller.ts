import { Body, Controller, Delete, Get, Param, Post, UseGuards } from "@nestjs/common";
import { categoryCreateSchema, UserRole, type CategoryCreateInput } from "@iiiiibox/shared-types";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { CategoriesService } from "./categories.service";

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller("admin/categories")
export class AdminCategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  list() {
    return this.categoriesService.listWithChildren();
  }

  @Post()
  create(@Body(new ZodValidationPipe(categoryCreateSchema)) body: CategoryCreateInput) {
    return this.categoriesService.create(body);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.categoriesService.remove(id);
  }
}
