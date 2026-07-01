import { Body, Controller, Get, Param, Patch, Query, UseGuards } from "@nestjs/common";
import { VendorStatus } from "@iiiiibox/database";
import { UserRole, vendorRejectSchema, type VendorRejectInput } from "@iiiiibox/shared-types";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { VendorsService } from "./vendors.service";

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller("admin/vendors")
export class AdminVendorsController {
  constructor(private readonly vendorsService: VendorsService) {}

  @Get()
  list(@Query("status") status?: VendorStatus) {
    return this.vendorsService.listForAdmin(status);
  }

  @Patch(":id/approve")
  approve(@Param("id") id: string) {
    return this.vendorsService.approve(id);
  }

  @Patch(":id/reject")
  reject(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(vendorRejectSchema)) body: VendorRejectInput,
  ) {
    return this.vendorsService.reject(id, body.rejectionReason);
  }
}
