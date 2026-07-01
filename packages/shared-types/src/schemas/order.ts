import { z } from "zod";
import { SubOrderStatus } from "../enums";

export const subOrderStatusUpdateSchema = z.object({
  status: z.enum([
    SubOrderStatus.CONFIRMED,
    SubOrderStatus.PACKED,
    SubOrderStatus.SHIPPED,
    SubOrderStatus.DELIVERED,
    SubOrderStatus.CANCELLED,
    SubOrderStatus.RETURNED,
  ]),
});
export type SubOrderStatusUpdateInput = z.infer<typeof subOrderStatusUpdateSchema>;
