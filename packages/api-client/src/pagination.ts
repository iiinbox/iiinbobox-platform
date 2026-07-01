export interface PageParams {
  page?: number;
  pageSize?: number;
}

export function toPageQuery(params: PageParams) {
  const search = new URLSearchParams();
  if (params.page !== undefined) search.set("page", String(params.page));
  if (params.pageSize !== undefined) search.set("pageSize", String(params.pageSize));
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}
