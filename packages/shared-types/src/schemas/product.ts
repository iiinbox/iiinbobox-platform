import { z } from "zod";

const slugRegex = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export const categoryCreateSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1).regex(slugRegex, "lowercase letters, numbers, and hyphens only"),
  parentSlug: z.string().optional(),
});
export type CategoryCreateInput = z.infer<typeof categoryCreateSchema>;

export const productCreateSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  categorySlug: z.string().min(1),
  priceMinor: z.coerce.number().int().positive(),
  currency: z.string().default("INR"),
  stockQty: z.coerce.number().int().nonnegative().default(0),
});
export type ProductCreateInput = z.infer<typeof productCreateSchema>;

export const productUpdateSchema = productCreateSchema.partial().extend({
  isActive: z.boolean().optional(),
});
export type ProductUpdateInput = z.infer<typeof productUpdateSchema>;
