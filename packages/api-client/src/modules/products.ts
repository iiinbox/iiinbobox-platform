import type {
  Product,
  ProductCreateInput,
  ProductPage,
  ProductUpdateInput,
  ProductWithVendor,
} from "@iiiiibox/shared-types";
import type { ApiClient } from "../client";

export interface ProductSearchParams {
  search?: string;
  category?: string;
  vendor?: string;
  page?: number;
  pageSize?: number;
}

function toQuery(params: ProductSearchParams) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) search.set(key, String(value));
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

export function createProductsModule(client: ApiClient) {
  return {
    search: (params: ProductSearchParams = {}) =>
      client.get<ProductPage>(`/products${toQuery(params)}`),
    bySlug: (slug: string) => client.get<ProductWithVendor>(`/products/${slug}`),
    listMine: () => client.get<Product[]>("/vendors/me/products"),
    create: (input: ProductCreateInput) => client.post<Product>("/vendors/me/products", input),
    update: (id: string, input: ProductUpdateInput) =>
      client.patch<Product>(`/vendors/me/products/${id}`, input),
    uploadImage: (id: string, file: Blob, filename: string) => {
      const formData = new FormData();
      formData.append("file", file, filename);
      return client.postForm<Product>(`/vendors/me/products/${id}/images`, formData);
    },
  };
}
