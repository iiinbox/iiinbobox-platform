import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { memoryStorage } from "multer";
import {
  productCreateSchema,
  productUpdateSchema,
  type ProductCreateInput,
  type ProductUpdateInput,
} from "@iiiiibox/shared-types";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import type { RequestUser } from "../../common/types/request-user";
import { ProductsService } from "./products.service";

@UseGuards(JwtAuthGuard)
@Controller("vendors/me/products")
export class VendorProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  listMine(@CurrentUser() user: RequestUser) {
    return this.productsService.listMine(user);
  }

  @Post()
  create(
    @CurrentUser() user: RequestUser,
    @Body(new ZodValidationPipe(productCreateSchema)) body: ProductCreateInput,
  ) {
    return this.productsService.create(user, body);
  }

  @Patch(":id")
  update(
    @CurrentUser() user: RequestUser,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(productUpdateSchema)) body: ProductUpdateInput,
  ) {
    return this.productsService.update(user, id, body);
  }

  @Post(":id/images")
  @UseInterceptors(
    FileInterceptor("file", { storage: memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } }),
  )
  addImage(
    @CurrentUser() user: RequestUser,
    @Param("id") id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.productsService.addImage(user, id, file);
  }
}
