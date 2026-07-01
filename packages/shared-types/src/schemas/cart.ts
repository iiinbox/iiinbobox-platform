import { z } from "zod";

export const cartAddItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.coerce.number().int().positive().default(1),
});
export type CartAddItemInput = z.infer<typeof cartAddItemSchema>;

export const cartUpdateItemSchema = z.object({
  quantity: z.coerce.number().int().positive(),
});
export type CartUpdateItemInput = z.infer<typeof cartUpdateItemSchema>;
