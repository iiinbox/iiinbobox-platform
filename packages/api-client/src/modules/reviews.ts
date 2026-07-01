import type { Review, ReviewCreateInput } from "@iiiiibox/shared-types";
import type { ApiClient } from "../client";

export function createReviewsModule(client: ApiClient) {
  return {
    list: (productSlug: string) => client.get<Review[]>(`/products/${productSlug}/reviews`),
    create: (productSlug: string, input: ReviewCreateInput) =>
      client.post<Review>(`/products/${productSlug}/reviews`, input),
  };
}
