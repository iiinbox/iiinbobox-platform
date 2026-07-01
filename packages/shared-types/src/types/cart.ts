export interface CartItem {
  id: string;
  productId: string;
  quantity: number;
  product: {
    title: string;
    slug: string;
    priceMinor: number;
    currency: string;
    images: string[];
    stockQty: number;
    vendor: { storeName: string; storeSlug: string };
  };
}

export interface Cart {
  id: string;
  items: CartItem[];
}
