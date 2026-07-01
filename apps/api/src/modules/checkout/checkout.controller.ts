import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import {
  checkoutCreateSchema,
  checkoutVerifySchema,
  type CheckoutCreateInput,
  type CheckoutVerifyInput,
} from "@iiiiibox/shared-types";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import type { RequestUser } from "../../common/types/request-user";
import { CheckoutService } from "./checkout.service";

@UseGuards(JwtAuthGuard)
@Controller("checkout")
export class CheckoutController {
  constructor(private readonly checkoutService: CheckoutService) {}

  @Post()
  create(
    @CurrentUser() user: RequestUser,
    @Body(new ZodValidationPipe(checkoutCreateSchema)) body: CheckoutCreateInput,
  ) {
    return this.checkoutService.create(user, body);
  }

  @Post("verify")
  verify(
    @CurrentUser() user: RequestUser,
    @Body(new ZodValidationPipe(checkoutVerifySchema)) body: CheckoutVerifyInput,
  ) {
    return this.checkoutService.verify(user, body);
  }
}
