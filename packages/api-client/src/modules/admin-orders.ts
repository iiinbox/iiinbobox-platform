import type { AdminOrderSummary, Page } from "@iiiiibox/shared-types";
import type { ApiClient } from "../client";
import { toPageQuery, type PageParams } from "../pagination";

export function createAdminOrdersModule(client: ApiClient) {
  return {
    list: (params: PageParams = {}) =>
      client.get<Page<AdminOrderSummary>>(`/admin/orders${toPageQuery(params)}`),
    get: (id: string) => client.get<AdminOrderSummary>(`/admin/orders/${id}`),
  };
}
