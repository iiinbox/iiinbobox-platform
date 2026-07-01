import { Injectable, Logger } from "@nestjs/common";
import { createHmac, timingSafeEqual } from "node:crypto";
import Razorpay from "razorpay";

function timingSafeEqualHex(a: string, b: string) {
  const bufA = Buffer.from(a, "hex");
  const bufB = Buffer.from(b, "hex");
  if (bufA.length !== bufB.length) {
    return false;
  }
  return timingSafeEqual(bufA, bufB);
}

@Injectable()
export class RazorpayService {
  private readonly logger = new Logger(RazorpayService.name);
  private readonly client: Razorpay | null;
  readonly keyId = process.env.RAZORPAY_KEY_ID ?? "";

  constructor() {
    if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
      this.client = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
      });
    } else {
      this.client = null;
      this.logger.warn(
        "RAZORPAY_KEY_ID/RAZORPAY_KEY_SECRET not set — orders and transfers are stubbed for local development",
      );
    }
  }

  get isLive() {
    return this.client !== null;
  }

  async createOrder(input: { amountMinor: number; currency: string; receipt: string }) {
    if (!this.client) {
      return { id: `order_stub_${Date.now()}` };
    }
    const order = await this.client.orders.create({
      amount: input.amountMinor,
      currency: input.currency,
      receipt: input.receipt,
    });
    return { id: order.id };
  }

  verifyPaymentSignature(input: {
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
  }) {
    if (!this.client) {
      return true;
    }
    const expected = createHmac("sha256", process.env.RAZORPAY_KEY_SECRET ?? "")
      .update(`${input.razorpayOrderId}|${input.razorpayPaymentId}`)
      .digest("hex");
    return timingSafeEqualHex(expected, input.razorpaySignature);
  }

  async createTransfer(input: {
    razorpayPaymentId: string;
    accountId: string;
    amountMinor: number;
    currency: string;
  }) {
    if (!this.client) {
      return { id: `trf_stub_${Date.now()}` };
    }
    const result = await this.client.payments.transfer(input.razorpayPaymentId, {
      transfers: [
        {
          account: input.accountId,
          amount: input.amountMinor,
          currency: input.currency,
          on_hold: false,
        },
      ],
    } as never);
    return { id: (result as unknown as { items: { id: string }[] }).items[0].id };
  }

  async createRefund(input: { razorpayPaymentId: string; amountMinor: number }) {
    if (!this.client) {
      this.logger.warn(`Stubbing refund of ${input.amountMinor} for payment ${input.razorpayPaymentId}`);
      return { id: `rfnd_stub_${Date.now()}` };
    }
    const refund = await this.client.payments.refund(input.razorpayPaymentId, {
      amount: input.amountMinor,
    });
    return { id: refund.id };
  }

  verifyWebhookSignature(rawBody: Buffer, signature: string) {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET ?? "";
    const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
    return timingSafeEqualHex(expected, signature);
  }
}
