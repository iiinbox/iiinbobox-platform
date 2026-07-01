import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { reviewCreateSchema, type ReviewCreateInput } from "@iiiiibox/shared-types";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import type { RequestUser } from "../../common/types/request-user";
import { ReviewsService } from "./reviews.service";

@Controller("products/:slug/reviews")
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get()
  list(@Param("slug") slug: string) {
    return this.reviewsService.listForProduct(slug);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  create(
    @CurrentUser() user: RequestUser,
    @Param("slug") slug: string,
    @Body(new ZodValidationPipe(reviewCreateSchema)) body: ReviewCreateInput,
  ) {
    return this.reviewsService.create(user, slug, body);
  }
}
