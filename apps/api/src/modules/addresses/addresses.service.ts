import { Injectable, NotFoundException } from "@nestjs/common";
import { prisma } from "@iiiiibox/database";
import type { AddressCreateInput } from "@iiiiibox/shared-types";
import type { RequestUser } from "../../common/types/request-user";

@Injectable()
export class AddressesService {
  async create(user: RequestUser, input: AddressCreateInput) {
    if (input.isDefault) {
      await prisma.address.updateMany({ where: { userId: user.userId }, data: { isDefault: false } });
    }
    return prisma.address.create({ data: { ...input, userId: user.userId } });
  }

  async listMine(user: RequestUser) {
    return prisma.address.findMany({ where: { userId: user.userId }, orderBy: { isDefault: "desc" } });
  }

  async assertOwned(user: RequestUser, addressId: string) {
    const address = await prisma.address.findUnique({ where: { id: addressId } });
    if (!address || address.userId !== user.userId) {
      throw new NotFoundException("Address not found");
    }
    return address;
  }
}
