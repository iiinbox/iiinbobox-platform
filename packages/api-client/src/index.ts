import { ApiClient, type ApiClientOptions } from "./client";
import { createAuthModule } from "./modules/auth";
import { createVendorsModule } from "./modules/vendors";
import { createAdminVendorsModule } from "./modules/admin-vendors";
import { createCategoriesModule } from "./modules/categories";
import { createProductsModule } from "./modules/products";
import { createAddressesModule } from "./modules/addresses";
import { createCartModule } from "./modules/cart";
import { createCheckoutModule } from "./modules/checkout";
import { createOrdersModule } from "./modules/orders";
import { createVendorOrdersModule } from "./modules/vendor-orders";
import { createPayoutsModule } from "./modules/payouts";
import { createAdminOrdersModule } from "./modules/admin-orders";
import { createAdminProductsModule } from "./modules/admin-products";
import { createReviewsModule } from "./modules/reviews";
import { createAnalyticsModule } from "./modules/analytics";

export * from "./client";
export * from "./token-storage";
export * from "./pagination";

export function createApiClient(options: ApiClientOptions) {
  const client = new ApiClient(options);
  return {
    auth: createAuthModule(client),
    vendors: createVendorsModule(client),
    adminVendors: createAdminVendorsModule(client),
    categories: createCategoriesModule(client),
    products: createProductsModule(client),
    addresses: createAddressesModule(client),
    cart: createCartModule(client),
    checkout: createCheckoutModule(client),
    orders: createOrdersModule(client),
    vendorOrders: createVendorOrdersModule(client),
    payouts: createPayoutsModule(client),
    adminOrders: createAdminOrdersModule(client),
    adminProducts: createAdminProductsModule(client),
    reviews: createReviewsModule(client),
    analytics: createAnalyticsModule(client),
  };
}

export type IiiiiBoxApi = ReturnType<typeof createApiClient>;
