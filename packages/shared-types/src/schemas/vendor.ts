import { z } from "zod";

export const vendorApplySchema = z.object({
  storeName: z.string().min(1),
  storeSlug: z
    .string()
    .min(1)
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "lowercase letters, numbers, and hyphens only"),
  storeDescription: z.string().optional(),
});
export type VendorApplyInput = z.infer<typeof vendorApplySchema>;

export const vendorRejectSchema = z.object({
  rejectionReason: z.string().min(1),
});
export type VendorRejectInput = z.infer<typeof vendorRejectSchema>;
