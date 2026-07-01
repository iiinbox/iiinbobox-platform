import { z } from "zod";

export const checkoutCreateSchema = z.object({
  addressId: z.string().min(1),
});
export type CheckoutCreateInput = z.infer<typeof checkoutCreateSchema>;

export const checkoutVerifySchema = z.object({
  orderId: z.string().min(1),
  razorpayPaymentId: z.string().optional(),
  razorpaySignature: z.string().optional(),
});
export type CheckoutVerifyInput = z.infer<typeof checkoutVerifySchema>;
