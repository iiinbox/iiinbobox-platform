import { Controller, Get, Param, Query, UseGuards } from "@nestjs/common";
import { UserRole } from "@iiiiibox/shared-types";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { OrdersService } from "./orders.service";

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller("admin/orders")
export class AdminOrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  list(@Query("page") page?: string, @Query("pageSize") pageSize?: string) {
    return this.ordersService.listForAdmin(page ? Number(page) : undefined, pageSize ? Number(pageSize) : undefined);
  }

  @Get(":id")
  get(@Param("id") id: string) {
    return this.ordersService.findForAdmin(id);
  }
}
