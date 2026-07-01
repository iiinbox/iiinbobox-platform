import { BadRequestException, ForbiddenException, Injectable } from "@nestjs/common";
import { OrderStatus, prisma } from "@iiiiibox/database";
import type { ReviewCreateInput } from "@iiiiibox/shared-types";
import type { RequestUser } from "../../common/types/request-user";

@Injectable()
export class ReviewsService {
  async listForProduct(productSlug: string) {
    const product = await prisma.product.findUnique({ where: { slug: productSlug } });
    if (!product) {
      return [];
    }
    return prisma.review.findMany({
      where: { productId: product.id },
      include: { user: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    });
  }

  async create(user: RequestUser, productSlug: string, input: ReviewCreateInput) {
    const product = await prisma.product.findUnique({ where: { slug: productSlug } });
    if (!product) {
      throw new BadRequestException("Product not found");
    }

    const hasPurchased = await prisma.orderItem.findFirst({
      where: {
        productId: product.id,
        subOrder: { order: { userId: user.userId, status: OrderStatus.PAID } },
      },
    });
    if (!hasPurchased) {
      throw new ForbiddenException("You can only review products you have purchased");
    }

    const existing = await prisma.review.findUnique({
      where: { productId_userId: { productId: product.id, userId: user.userId } },
    });
    if (existing) {
      return prisma.review.update({
        where: { productId_userId: { productId: product.id, userId: user.userId } },
        data: input,
      });
    }

    return prisma.review.create({
      data: { productId: product.id, userId: user.userId, ...input },
    });
  }
}
