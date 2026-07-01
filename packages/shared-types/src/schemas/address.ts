import { z } from "zod";

export const addressCreateSchema = z.object({
  line1: z.string().min(1),
  line2: z.string().optional(),
  city: z.string().min(1),
  state: z.string().min(1),
  pincode: z.string().min(1),
  country: z.string().default("IN"),
  phone: z.string().min(1),
  isDefault: z.boolean().default(false),
});
export type AddressCreateInput = z.infer<typeof addressCreateSchema>;
