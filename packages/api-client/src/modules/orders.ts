import type { OrderSummary, Page } from "@iiiiibox/shared-types";
import type { ApiClient } from "../client";
import { toPageQuery, type PageParams } from "../pagination";

export function createOrdersModule(client: ApiClient) {
  return {
    get: (id: string) => client.get<OrderSummary>(`/orders/${id}`),
    list: (params: PageParams = {}) => client.get<Page<OrderSummary>>(`/orders${toPageQuery(params)}`),
  };
}
