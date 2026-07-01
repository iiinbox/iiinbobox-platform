import type {
  CheckoutCreateInput,
  CheckoutSession,
  CheckoutVerifyInput,
  OrderSummary,
} from "@iiiiibox/shared-types";
import type { ApiClient } from "../client";

export function createCheckoutModule(client: ApiClient) {
  return {
    create: (input: CheckoutCreateInput) => client.post<CheckoutSession>("/checkout", input),
    verify: (input: CheckoutVerifyInput) => client.post<OrderSummary>("/checkout/verify", input),
  };
}
