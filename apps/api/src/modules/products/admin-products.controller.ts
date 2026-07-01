import { Body, Controller, Get, Param, Patch, Query, UseGuards } from "@nestjs/common";
import { productModerateSchema, UserRole, type ProductModerateInput } from "@iiiiibox/shared-types";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { ProductsService } from "./products.service";

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller("admin/products")
export class AdminProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  list(@Query("page") page?: string, @Query("pageSize") pageSize?: string) {
    return this.productsService.listForAdmin(page ? Number(page) : undefined, pageSize ? Number(pageSize) : undefined);
  }

  @Patch(":id/moderate")
  moderate(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(productModerateSchema)) body: ProductModerateInput,
  ) {
    return this.productsService.moderate(id, body);
  }
}
