import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { prisma, VendorStatus } from "@iiiiibox/database";
import type { CartAddItemInput, CartUpdateItemInput } from "@iiiiibox/shared-types";
import type { RequestUser } from "../../common/types/request-user";

const CART_INCLUDE = {
  items: {
    include: {
      product: {
        include: { vendor: { select: { storeName: true, storeSlug: true } } },
      },
    },
  },
} as const;

@Injectable()
export class CartService {
  private async getOrCreateCart(userId: string) {
    return prisma.cart.upsert({
      where: { userId },
      update: {},
      create: { userId },
    });
  }

  async getMine(user: RequestUser) {
    const cart = await this.getOrCreateCart(user.userId);
    return prisma.cart.findUniqueOrThrow({ where: { id: cart.id }, include: CART_INCLUDE });
  }

  async addItem(user: RequestUser, input: CartAddItemInput) {
    const product = await prisma.product.findUnique({
      where: { id: input.productId },
      include: { vendor: true },
    });
    if (
      !product ||
      !product.isActive ||
      !product.isApproved ||
      product.vendor.status !== VendorStatus.APPROVED
    ) {
      throw new NotFoundException("Product not found");
    }
    if (product.stockQty < input.quantity) {
      throw new BadRequestException("Not enough stock");
    }

    const cart = await this.getOrCreateCart(user.userId);
    await prisma.cartItem.upsert({
      where: { cartId_productId: { cartId: cart.id, productId: input.productId } },
      update: { quantity: { increment: input.quantity } },
      create: { cartId: cart.id, productId: input.productId, quantity: input.quantity },
    });
    return this.getMine(user);
  }

  async updateItem(user: RequestUser, productId: string, input: CartUpdateItemInput) {
    const cart = await this.getOrCreateCart(user.userId);
    const item = await prisma.cartItem.findUnique({
      where: { cartId_productId: { cartId: cart.id, productId } },
    });
    if (!item) {
      throw new NotFoundException("Item not in cart");
    }
    await prisma.cartItem.update({ where: { id: item.id }, data: { quantity: input.quantity } });
    return this.getMine(user);
  }

  async removeItem(user: RequestUser, productId: string) {
    const cart = await this.getOrCreateCart(user.userId);
    await prisma.cartItem.deleteMany({ where: { cartId: cart.id, productId } });
    return this.getMine(user);
  }
}
