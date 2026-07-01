import type { Page, SubOrderStatusUpdateInput, VendorSubOrder } from "@iiiiibox/shared-types";
import type { ApiClient } from "../client";
import { toPageQuery, type PageParams } from "../pagination";

export function createVendorOrdersModule(client: ApiClient) {
  return {
    list: (params: PageParams = {}) =>
      client.get<Page<VendorSubOrder>>(`/vendors/me/orders${toPageQuery(params)}`),
    updateStatus: (id: string, input: SubOrderStatusUpdateInput) =>
      client.patch<VendorSubOrder>(`/vendors/me/orders/${id}/status`, input),
  };
}
