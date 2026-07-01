import { z } from "zod";

export const productModerateSchema = z
  .object({
    isApproved: z.boolean().optional(),
    isActive: z.boolean().optional(),
  })
  .refine((v) => v.isApproved !== undefined || v.isActive !== undefined, {
    message: "Provide isApproved and/or isActive",
  });
export type ProductModerateInput = z.infer<typeof productModerateSchema>;
