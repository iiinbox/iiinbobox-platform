export interface Category {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
}

export interface Product {
  id: string;
  vendorId: string;
  categoryId: string;
  title: string;
  slug: string;
  description: string | null;
  images: string[];
  priceMinor: number;
  currency: string;
  stockQty: number;
  isActive: boolean;
  isApproved: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductWithVendor extends Product {
  vendor: { storeName: string; storeSlug: string };
}

export interface ProductPage {
  items: ProductWithVendor[];
  total: number;
  page: number;
  pageSize: number;
}
