import { z } from "zod";

export const reviewCreateSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().optional(),
});
export type ReviewCreateInput = z.infer<typeof reviewCreateSchema>;
