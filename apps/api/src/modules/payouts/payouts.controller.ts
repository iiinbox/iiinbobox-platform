import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import type { RequestUser } from "../../common/types/request-user";
import { PayoutsService } from "./payouts.service";

@UseGuards(JwtAuthGuard)
@Controller("vendors/me/payouts")
export class PayoutsController {
  constructor(private readonly payoutsService: PayoutsService) {}

  @Get()
  list(
    @CurrentUser() user: RequestUser,
    @Query("page") page?: string,
    @Query("pageSize") pageSize?: string,
  ) {
    return this.payoutsService.listForVendor(
      user,
      page ? Number(page) : undefined,
      pageSize ? Number(pageSize) : undefined,
    );
  }
}
