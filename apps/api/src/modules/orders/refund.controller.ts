import { BadRequestException, Body, Controller, Param, Post, UseGuards } from "@nestjs/common";
import { z } from "zod";
import { OrderStatus, PayoutStatus, prisma, SubOrderStatus } from "@iiiiibox/database";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import type { RequestUser } from "../../common/types/request-user";
import { RazorpayService } from "../razorpay/razorpay.service";

const refundRequestSchema = z.object({
  action: z.enum(["cancel", "return"]),
});

const CANCELLABLE = new Set<string>([SubOrderStatus.PLACED, SubOrderStatus.CONFIRMED]);
const RETURNABLE = new Set<string>([SubOrderStatus.DELIVERED]);

@UseGuards(JwtAuthGuard)
@Controller("orders/:orderId/suborders/:subOrderId")
export class RefundController {
  constructor(private readonly razorpay: RazorpayService) {}

  @Post("refund")
  async refund(
    @CurrentUser() user: RequestUser,
    @Param("orderId") orderId: string,
    @Param("subOrderId") subOrderId: string,
    @Body(new ZodValidationPipe(refundRequestSchema)) body: { action: "cancel" | "return" },
  ) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { payment: true, subOrders: { where: { id: subOrderId }, include: { payout: true } } },
    });
    if (!order || order.userId !== user.userId || order.subOrders.length === 0) {
      throw new BadRequestException("Sub-order not found");
    }
    const subOrder = order.subOrders[0]!;
    const canCancel = CANCELLABLE.has(subOrder.status) && body.action === "cancel";
    const canReturn = RETURNABLE.has(subOrder.status) && body.action === "return";

    if (!canCancel && !canReturn) {
      throw new BadRequestException(
        `Cannot ${body.action} a sub-order with status ${subOrder.status}`,
      );
    }

    if (order.status === OrderStatus.PAID && order.payment?.razorpayPaymentId) {
      await this.razorpay.createRefund({
        razorpayPaymentId: order.payment.razorpayPaymentId,
        amountMinor: subOrder.itemsSubtotalMinor,
      });
    }

    await prisma.$transaction(async (tx) => {
      await tx.subOrder.update({
        where: { id: subOrderId },
        data: { status: body.action === "return" ? SubOrderStatus.RETURNED : SubOrderStatus.CANCELLED },
      });
      if (subOrder.payout) {
        await tx.payout.update({ where: { id: subOrder.payout.id }, data: { status: PayoutStatus.ON_HOLD } });
      }
      await tx.product.updateMany({
        where: { orderItems: { some: { subOrderId } } },
        data: {},
      });
      const items = await tx.orderItem.findMany({ where: { subOrderId } });
      for (const item of items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stockQty: { increment: item.quantity } },
        });
      }
    });

    return prisma.order.findUniqueOrThrow({
      where: { id: orderId },
      include: { subOrders: { include: { items: true } } },
    });
  }
}
