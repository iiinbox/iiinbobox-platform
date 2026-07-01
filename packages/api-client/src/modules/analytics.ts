import type { VendorAnalytics } from "@iiiiibox/shared-types";
import type { ApiClient } from "../client";

export function createAnalyticsModule(client: ApiClient) {
  return {
    vendor: () => client.get<VendorAnalytics>("/vendors/me/analytics"),
  };
}
