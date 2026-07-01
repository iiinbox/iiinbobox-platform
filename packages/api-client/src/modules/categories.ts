import type { Category, CategoryCreateInput } from "@iiiiibox/shared-types";
import type { ApiClient } from "../client";

export function createCategoriesModule(client: ApiClient) {
  return {
    list: () => client.get<Category[]>("/categories"),
    create: (input: CategoryCreateInput) => client.post<Category>("/admin/categories", input),
  };
}
