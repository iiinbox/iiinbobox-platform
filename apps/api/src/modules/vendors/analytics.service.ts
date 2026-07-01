import { ForbiddenException, Injectable } from "@nestjs/common";
import { prisma } from "@iiiiibox/database";
import type { RequestUser } from "../../common/types/request-user";

@Injectable()
export class AnalyticsService {
  async getVendorAnalytics(user: RequestUser) {
    if (!user.vendorId) {
      throw new ForbiddenException("Not a vendor");
    }

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [allPayouts, monthPayouts, orderCount, topItems] = await Promise.all([
      prisma.payout.aggregate({
        where: { vendorId: user.vendorId },
        _sum: { amountMinor: true },
      }),
      prisma.payout.aggregate({
        where: { vendorId: user.vendorId, createdAt: { gte: monthStart } },
        _sum: { amountMinor: true },
      }),
      prisma.subOrder.count({ where: { vendorId: user.vendorId } }),
      prisma.orderItem.groupBy({
        by: ["productId"],
        where: { subOrder: { vendorId: user.vendorId } },
        _sum: { quantity: true, priceMinorSnap: true },
        orderBy: { _sum: { quantity: "desc" } },
        take: 5,
      }),
    ]);

    const productIds = topItems.map((i) => i.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, title: true, slug: true },
    });

    const productMap = new Map(products.map((p) => [p.id, p]));

    return {
      totalRevenueMinor: allPayouts._sum.amountMinor ?? 0,
      thisMonthRevenueMinor: monthPayouts._sum.amountMinor ?? 0,
      totalOrders: orderCount,
      topProducts: topItems.map((item) => ({
        ...productMap.get(item.productId),
        totalSold: item._sum.quantity ?? 0,
        revenueMinor: (item._sum.quantity ?? 0) * (item._sum.priceMinorSnap ?? 0),
      })),
    };
  }
}
