import {
  BadRequestException,
  Controller,
  Headers,
  Post,
  Req,
  UnauthorizedException,
  type RawBodyRequest,
} from "@nestjs/common";
import type { Request } from "express";
import { PaymentStatus, prisma } from "@iiiiibox/database";
import { RazorpayService } from "../razorpay/razorpay.service";
import { CheckoutService } from "../checkout/checkout.service";

interface RazorpayWebhookEvent {
  event: string;
  payload: Record<string, { entity: Record<string, unknown> }>;
}

@Controller("payments")
export class PaymentsController {
  constructor(
    private readonly razorpay: RazorpayService,
    private readonly checkoutService: CheckoutService,
  ) {}

  @Post("webhook")
  async webhook(@Req() req: RawBodyRequest<Request>, @Headers("x-razorpay-signature") signature?: string) {
    if (!req.rawBody) {
      throw new BadRequestException("Missing raw body");
    }
    if (!this.razorpay.verifyWebhookSignature(req.rawBody, signature ?? "")) {
      throw new UnauthorizedException("Invalid webhook signature");
    }

    const event = JSON.parse(req.rawBody.toString("utf8")) as RazorpayWebhookEvent;

    switch (event.event) {
      case "payment.captured": {
        const entity = event.payload.payment.entity as { id: string; order_id: string };
        await prisma.payment.updateMany({
          where: { razorpayOrderId: entity.order_id },
          data: { rawWebhookPayload: event as object },
        });
        const payment = await prisma.payment.findUnique({ where: { razorpayOrderId: entity.order_id } });
        if (payment) {
          await this.checkoutService.markPaid(payment.orderId, entity.id);
          await this.checkoutService.createVendorTransfers(payment.orderId);
        }
        break;
      }
      case "payment.failed": {
        const entity = event.payload.payment.entity as { order_id: string };
        await prisma.payment.updateMany({
          where: { razorpayOrderId: entity.order_id },
          data: { status: PaymentStatus.FAILED, rawWebhookPayload: event as object },
        });
        break;
      }
      case "transfer.processed": {
        const entity = event.payload.transfer.entity as { id: string };
        await prisma.paymentSplit.updateMany({
          where: { razorpayTransferId: entity.id },
          data: { status: PaymentStatus.CAPTURED },
        });
        break;
      }
      case "account.activated": {
        const entity = event.payload.account.entity as { id: string; status: string };
        await prisma.vendor.updateMany({
          where: { razorpayAccountId: entity.id },
          data: { razorpayAccountStatus: entity.status },
        });
        break;
      }
      case "account.needs_clarification": {
        const entity = event.payload.account.entity as { id: string; status: string };
        await prisma.vendor.updateMany({
          where: { razorpayAccountId: entity.id },
          data: { razorpayAccountStatus: entity.status },
        });
        break;
      }
      default:
        break;
    }

    return { received: true };
  }
}
