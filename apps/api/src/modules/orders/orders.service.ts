import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { prisma, SubOrderStatus } from "@iiiiibox/database";
import type { RequestUser } from "../../common/types/request-user";

const PAGE_SIZE_DEFAULT = 20;
const PAGE_SIZE_MAX = 50;

const ORDER_INCLUDE = {
  subOrders: {
    include: {
      items: true,
      vendor: { select: { storeName: true, storeSlug: true } },
    },
  },
} as const;

function clampPaging(page?: number, pageSize?: number) {
  return {
    page: Math.max(1, page ?? 1),
    pageSize: Math.min(PAGE_SIZE_MAX, Math.max(1, pageSize ?? PAGE_SIZE_DEFAULT)),
  };
}

@Injectable()
export class OrdersService {
  async findMine(user: RequestUser, orderId: string) {
    const order = await prisma.order.findUnique({ where: { id: orderId }, include: ORDER_INCLUDE });
    if (!order || order.userId !== user.userId) {
      throw new NotFoundException("Order not found");
    }
    return order;
  }

  async listMine(user: RequestUser, page?: number, pageSize?: number) {
    const { page: p, pageSize: ps } = clampPaging(page, pageSize);
    const where = { userId: user.userId };
    const [items, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: ORDER_INCLUDE,
        orderBy: { createdAt: "desc" },
        skip: (p - 1) * ps,
        take: ps,
      }),
      prisma.order.count({ where }),
    ]);
    return { items, total, page: p, pageSize: ps };
  }

  async listForVendor(user: RequestUser, page?: number, pageSize?: number) {
    if (!user.vendorId) {
      throw new ForbiddenException("Not a vendor");
    }
    const { page: p, pageSize: ps } = clampPaging(page, pageSize);
    const where = { vendorId: user.vendorId };
    const [items, total] = await Promise.all([
      prisma.subOrder.findMany({
        where,
        include: {
          items: true,
          order: { select: { orderNumber: true, createdAt: true, user: { select: { name: true, email: true } } } },
        },
        orderBy: { createdAt: "desc" },
        skip: (p - 1) * ps,
        take: ps,
      }),
      prisma.subOrder.count({ where }),
    ]);
    return { items, total, page: p, pageSize: ps };
  }

  async updateStatusForVendor(user: RequestUser, subOrderId: string, status: SubOrderStatus) {
    const subOrder = await prisma.subOrder.findUnique({ where: { id: subOrderId } });
    if (!subOrder || subOrder.vendorId !== user.vendorId) {
      throw new NotFoundException("Order not found");
    }
    return prisma.subOrder.update({ where: { id: subOrderId }, data: { status } });
  }

  async listForAdmin(page?: number, pageSize?: number) {
    const { page: p, pageSize: ps } = clampPaging(page, pageSize);
    const [items, total] = await Promise.all([
      prisma.order.findMany({
        include: { ...ORDER_INCLUDE, user: { select: { name: true, email: true } } },
        orderBy: { createdAt: "desc" },
        skip: (p - 1) * ps,
        take: ps,
      }),
      prisma.order.count(),
    ]);
    return { items, total, page: p, pageSize: ps };
  }

  async findForAdmin(orderId: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { ...ORDER_INCLUDE, user: { select: { name: true, email: true } } },
    });
    if (!order) {
      throw new NotFoundException("Order not found");
    }
    return order;
  }
}
