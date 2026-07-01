import type { Page, ProductModerateInput, ProductWithVendor } from "@iiiiibox/shared-types";
import type { ApiClient } from "../client";
import { toPageQuery, type PageParams } from "../pagination";

export function createAdminProductsModule(client: ApiClient) {
  return {
    list: (params: PageParams = {}) =>
      client.get<Page<ProductWithVendor>>(`/admin/products${toPageQuery(params)}`),
    moderate: (id: string, input: ProductModerateInput) =>
      client.patch<ProductWithVendor>(`/admin/products/${id}/moderate`, input),
  };
}
