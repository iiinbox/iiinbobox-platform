import type { Cart, CartAddItemInput, CartUpdateItemInput } from "@iiiiibox/shared-types";
import type { ApiClient } from "../client";

export function createCartModule(client: ApiClient) {
  return {
    get: () => client.get<Cart>("/cart"),
    addItem: (input: CartAddItemInput) => client.post<Cart>("/cart/items", input),
    updateItem: (productId: string, input: CartUpdateItemInput) =>
      client.patch<Cart>(`/cart/items/${productId}`, input),
    removeItem: (productId: string) => client.delete<Cart>(`/cart/items/${productId}`),
  };
}
