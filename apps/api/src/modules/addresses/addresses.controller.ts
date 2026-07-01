import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { addressCreateSchema, type AddressCreateInput } from "@iiiiibox/shared-types";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import type { RequestUser } from "../../common/types/request-user";
import { AddressesService } from "./addresses.service";

@UseGuards(JwtAuthGuard)
@Controller("addresses")
export class AddressesController {
  constructor(private readonly addressesService: AddressesService) {}

  @Get()
  listMine(@CurrentUser() user: RequestUser) {
    return this.addressesService.listMine(user);
  }

  @Post()
  create(
    @CurrentUser() user: RequestUser,
    @Body(new ZodValidationPipe(addressCreateSchema)) body: AddressCreateInput,
  ) {
    return this.addressesService.create(user, body);
  }
}
