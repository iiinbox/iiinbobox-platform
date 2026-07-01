import { BadRequestException, Injectable, Logger, NotFoundException } from "@nestjs/common";
import { OrderStatus, PaymentStatus, PayoutStatus, prisma, SubOrderStatus, VendorStatus } from "@iiiiibox/database";
import type { CheckoutCreateInput, CheckoutVerifyInput } from "@iiiiibox/shared-types";
import type { RequestUser } from "../../common/types/request-user";
import { AddressesService } from "../addresses/addresses.service";
import { MailService } from "../mail/mail.service";
import { RazorpayService } from "../razorpay/razorpay.service";

const ORDER_INCLUDE = {
  subOrders: {
    include: {
      items: true,
      vendor: { select: { storeName: true, storeSlug: true } },
    },
  },
} as const;

@Injectable()
export class CheckoutService {
  private readonly logger = new Logger(CheckoutService.name);

  constructor(
    private readonly addresses: AddressesService,
    private readonly razorpay: RazorpayService,
    private readonly mail: MailService,
  ) {}

  async create(user: RequestUser, input: CheckoutCreateInput) {
    const address = await this.addresses.assertOwned(user, input.addressId);

    const cart = await prisma.cart.findUnique({
      where: { userId: user.userId },
      include: { items: { include: { product: { include: { vendor: true } } } } },
    });
    if (!cart || cart.items.length === 0) {
      throw new BadRequestException("Cart is empty");
    }

    for (const item of cart.items) {
      if (
        !item.product.isActive ||
        !item.product.isApproved ||
        item.product.vendor.status !== VendorStatus.APPROVED
      ) {
        throw new BadRequestException(`${item.product.title} is no longer available`);
      }
      if (item.product.stockQty < item.quantity) {
        throw new BadRequestException(`${item.product.title} does not have enough stock`);
      }
    }

    const byVendor = new Map<string, typeof cart.items>();
    for (const item of cart.items) {
      const list = byVendor.get(item.product.vendorId) ?? [];
      list.push(item);
      byVendor.set(item.product.vendorId, list);
    }

    const currency = "INR";
    const orderNumber = `ORD-${Date.now()}`;
    let totalAmountMinor = 0;
    const subOrdersData = [...byVendor.entries()].map(([vendorId, items], index) => {
      const vendor = items[0].product.vendor;
      const itemsSubtotalMinor = items.reduce(
        (sum, item) => sum + item.product.priceMinor * item.quantity,
        0,
      );
      const commissionMinor = Math.round(itemsSubtotalMinor * (Number(vendor.commissionPercent) / 100));
      const vendorPayoutMinor = itemsSubtotalMinor - commissionMinor;
      totalAmountMinor += itemsSubtotalMinor;
      return {
        vendorId,
        subOrderNumber: `${orderNumber}-V${index + 1}`,
        itemsSubtotalMinor,
        commissionMinor,
        vendorPayoutMinor,
        items: {
          create: items.map((item) => ({
            productId: item.productId,
            titleSnapshot: item.product.title,
            priceMinorSnap: item.product.priceMinor,
            quantity: item.quantity,
          })),
        },
      };
    });

    const razorpayOrder = await this.razorpay.createOrder({
      amountMinor: totalAmountMinor,
      currency,
      receipt: orderNumber,
    });

    const order = await prisma.order.create({
      data: {
        orderNumber,
        userId: user.userId,
        addressId: address.id,
        totalAmountMinor,
        currency,
        subOrders: { create: subOrdersData },
        payment: {
          create: {
            razorpayOrderId: razorpayOrder.id,
            amountMinor: totalAmountMinor,
            currency,
          },
        },
      },
    });

    return {
      orderId: order.id,
      razorpayOrderId: razorpayOrder.id,
      amountMinor: totalAmountMinor,
      currency,
      razorpayKeyId: this.razorpay.keyId,
    };
  }

  async verify(user: RequestUser, input: CheckoutVerifyInput) {
    const order = await prisma.order.findUnique({
      where: { id: input.orderId },
      include: { payment: true, subOrders: true },
    });
    if (!order || order.userId !== user.userId) {
      throw new NotFoundException("Order not found");
    }
    if (!order.payment) {
      throw new NotFoundException("Payment not found for this order");
    }
    if (order.status === OrderStatus.PAID) {
      return prisma.order.findUniqueOrThrow({ where: { id: order.id }, include: ORDER_INCLUDE });
    }

    let razorpayPaymentId = input.razorpayPaymentId;
    if (this.razorpay.isLive) {
      if (!razorpayPaymentId || !input.razorpaySignature) {
        throw new BadRequestException("Missing payment verification fields");
      }
      const valid = this.razorpay.verifyPaymentSignature({
        razorpayOrderId: order.payment.razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature: input.razorpaySignature,
      });
      if (!valid) {
        throw new BadRequestException("Invalid payment signature");
      }
    } else {
      razorpayPaymentId = razorpayPaymentId ?? `pay_stub_${Date.now()}`;
    }

    await this.markPaid(order.id, razorpayPaymentId);
    await this.createVendorTransfers(order.id);

    return prisma.order.findUniqueOrThrow({ where: { id: order.id }, include: ORDER_INCLUDE });
  }

  /** Critical-path state change: payment captured, order paid, stock reserved, cart cleared. */
  async markPaid(orderId: string, razorpayPaymentId: string) {
    const order = await prisma.order.findUniqueOrThrow({
      where: { id: orderId },
      include: { payment: true, subOrders: { include: { items: true } } },
    });
    if (order.status === OrderStatus.PAID || !order.payment) {
      return;
    }

    await prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: order.payment!.id },
        data: { razorpayPaymentId, status: PaymentStatus.CAPTURED },
      });
      await tx.order.update({ where: { id: order.id }, data: { status: OrderStatus.PAID } });

      for (const subOrder of order.subOrders) {
        await tx.paymentSplit.create({
          data: {
            paymentId: order.payment!.id,
            subOrderId: subOrder.id,
            amountMinor: subOrder.vendorPayoutMinor,
            status: PaymentStatus.CAPTURED,
          },
        });
        await tx.payout.create({
          data: {
            vendorId: subOrder.vendorId,
            subOrderId: subOrder.id,
            amountMinor: subOrder.vendorPayoutMinor,
            status: PayoutStatus.PENDING,
          },
        });
        await tx.subOrder.update({
          where: { id: subOrder.id },
          data: { status: SubOrderStatus.CONFIRMED },
        });
        for (const item of subOrder.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stockQty: { decrement: item.quantity } },
          });
        }
      }

      const cart = await tx.cart.findUnique({ where: { userId: order.userId } });
      if (cart) {
        await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
      }
    });

    const user = await prisma.user.findUnique({ where: { id: order.userId } });
    if (user) {
      void this.mail.sendOrderConfirmation(user.email, order.orderNumber, order.totalAmountMinor, order.currency);
    }
  }

  /** Best-effort, outside the DB transaction: one vendor's failed transfer shouldn't block the others. */
  async createVendorTransfers(orderId: string) {
    const order = await prisma.order.findUniqueOrThrow({
      where: { id: orderId },
      include: { payment: true, subOrders: { include: { vendor: true, paymentSplit: true } } },
    });
    if (!order.payment?.razorpayPaymentId) {
      return;
    }

    for (const subOrder of order.subOrders) {
      if (!subOrder.paymentSplit || subOrder.paymentSplit.razorpayTransferId) {
        continue;
      }
      try {
        const transfer = subOrder.vendor.razorpayAccountId
          ? await this.razorpay.createTransfer({
              razorpayPaymentId: order.payment.razorpayPaymentId,
              accountId: subOrder.vendor.razorpayAccountId,
              amountMinor: subOrder.paymentSplit.amountMinor,
              currency: order.currency,
            })
          : { id: `trf_stub_${Date.now()}` };
        await prisma.paymentSplit.update({
          where: { id: subOrder.paymentSplit.id },
          data: { razorpayTransferId: transfer.id },
        });
      } catch (err) {
        this.logger.error(
          `Failed to create Razorpay transfer for sub-order ${subOrder.id}: ${(err as Error).message}`,
        );
      }
    }
  }
}
