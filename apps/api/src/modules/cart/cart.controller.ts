import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { cartAddItemSchema, cartUpdateItemSchema, type CartAddItemInput, type CartUpdateItemInput } from "@iiiiibox/shared-types";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import type { RequestUser } from "../../common/types/request-user";
import { CartService } from "./cart.service";

@UseGuards(JwtAuthGuard)
@Controller("cart")
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  getMine(@CurrentUser() user: RequestUser) {
    return this.cartService.getMine(user);
  }

  @Post("items")
  addItem(
    @CurrentUser() user: RequestUser,
    @Body(new ZodValidationPipe(cartAddItemSchema)) body: CartAddItemInput,
  ) {
    return this.cartService.addItem(user, body);
  }

  @Patch("items/:productId")
  updateItem(
    @CurrentUser() user: RequestUser,
    @Param("productId") productId: string,
    @Body(new ZodValidationPipe(cartUpdateItemSchema)) body: CartUpdateItemInput,
  ) {
    return this.cartService.updateItem(user, productId, body);
  }

  @Delete("items/:productId")
  removeItem(@CurrentUser() user: RequestUser, @Param("productId") productId: string) {
    return this.cartService.removeItem(user, productId);
  }
}
