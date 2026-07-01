import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { vendorApplySchema, type VendorApplyInput } from "@iiiiibox/shared-types";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import type { RequestUser } from "../../common/types/request-user";
import { VendorsService } from "./vendors.service";

@Controller("vendors")
export class VendorsController {
  constructor(private readonly vendorsService: VendorsService) {}

  @UseGuards(JwtAuthGuard)
  @Post("apply")
  apply(
    @CurrentUser() user: RequestUser,
    @Body(new ZodValidationPipe(vendorApplySchema)) body: VendorApplyInput,
  ) {
    return this.vendorsService.apply(user, body);
  }

  @UseGuards(JwtAuthGuard)
  @Get("me")
  me(@CurrentUser() user: RequestUser) {
    return this.vendorsService.findMine(user);
  }

  @Get(":slug")
  bySlug(@Param("slug") slug: string) {
    return this.vendorsService.findBySlug(slug);
  }
}
