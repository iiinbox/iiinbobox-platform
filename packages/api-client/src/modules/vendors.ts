import type { Vendor, VendorApplyInput } from "@iiiiibox/shared-types";
import type { ApiClient } from "../client";

export function createVendorsModule(client: ApiClient) {
  return {
    apply: (input: VendorApplyInput) =>
      client.post<{ vendor: Vendor; accessToken: string }>("/vendors/apply", input),
    me: () => client.get<Vendor>("/vendors/me"),
    bySlug: (slug: string) => client.get<Vendor>(`/vendors/${slug}`),
  };
}
