import type { Page, Payout } from "@iiiiibox/shared-types";
import type { ApiClient } from "../client";
import { toPageQuery, type PageParams } from "../pagination";

export function createPayoutsModule(client: ApiClient) {
  return {
    list: (params: PageParams = {}) => client.get<Page<Payout>>(`/vendors/me/payouts${toPageQuery(params)}`),
  };
}
