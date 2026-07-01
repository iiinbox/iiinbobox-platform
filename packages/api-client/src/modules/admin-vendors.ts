import type { AdminVendor, VendorStatus } from "@iiiiibox/shared-types";
import type { ApiClient } from "../client";

export function createAdminVendorsModule(client: ApiClient) {
  return {
    list: (status?: VendorStatus) =>
      client.get<AdminVendor[]>(`/admin/vendors${status ? `?status=${status}` : ""}`),
    approve: (id: string) => client.patch<AdminVendor>(`/admin/vendors/${id}/approve`),
    reject: (id: string, rejectionReason: string) =>
      client.patch<AdminVendor>(`/admin/vendors/${id}/reject`, { rejectionReason }),
  };
}
