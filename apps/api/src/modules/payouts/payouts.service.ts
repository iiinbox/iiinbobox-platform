import { ForbiddenException, Injectable } from "@nestjs/common";
import { prisma } from "@iiiiibox/database";
import type { RequestUser } from "../../common/types/request-user";

const PAGE_SIZE_DEFAULT = 20;
const PAGE_SIZE_MAX = 50;

@Injectable()
export class PayoutsService {
  async listForVendor(user: RequestUser, page?: number, pageSize?: number) {
    if (!user.vendorId) {
      throw new ForbiddenException("Not a vendor");
    }
    const p = Math.max(1, page ?? 1);
    const ps = Math.min(PAGE_SIZE_MAX, Math.max(1, pageSize ?? PAGE_SIZE_DEFAULT));
    const where = { vendorId: user.vendorId };
    const [items, total] = await Promise.all([
      prisma.payout.findMany({
        where,
        include: { subOrder: { select: { subOrderNumber: true } } },
        orderBy: { createdAt: "desc" },
        skip: (p - 1) * ps,
        take: ps,
      }),
      prisma.payout.count({ where }),
    ]);
    return { items, total, page: p, pageSize: ps };
  }
}
