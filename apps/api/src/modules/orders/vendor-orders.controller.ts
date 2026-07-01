import { Body, Controller, Get, Param, Patch, Query, UseGuards } from "@nestjs/common";
import { subOrderStatusUpdateSchema, type SubOrderStatusUpdateInput } from "@iiiiibox/shared-types";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import type { RequestUser } from "../../common/types/request-user";
import { OrdersService } from "./orders.service";

@UseGuards(JwtAuthGuard)
@Controller("vendors/me/orders")
export class VendorOrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  list(
    @CurrentUser() user: RequestUser,
    @Query("page") page?: string,
    @Query("pageSize") pageSize?: string,
  ) {
    return this.ordersService.listForVendor(
      user,
      page ? Number(page) : undefined,
      pageSize ? Number(pageSize) : undefined,
    );
  }

  @Patch(":id/status")
  updateStatus(
    @CurrentUser() user: RequestUser,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(subOrderStatusUpdateSchema)) body: SubOrderStatusUpdateInput,
  ) {
    return this.ordersService.updateStatusForVendor(user, id, body.status);
  }
}
