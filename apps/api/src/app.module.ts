import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { HealthController } from "./health.controller";
import { AuthModule } from "./modules/auth/auth.module";
import { VendorsModule } from "./modules/vendors/vendors.module";
import { CategoriesModule } from "./modules/categories/categories.module";
import { ProductsModule } from "./modules/products/products.module";
import { AddressesModule } from "./modules/addresses/addresses.module";
import { CartModule } from "./modules/cart/cart.module";
import { CheckoutModule } from "./modules/checkout/checkout.module";
import { PaymentsModule } from "./modules/payments/payments.module";
import { OrdersModule } from "./modules/orders/orders.module";
import { PayoutsModule } from "./modules/payouts/payouts.module";
import { ReviewsModule } from "./modules/reviews/reviews.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    AuthModule,
    VendorsModule,
    CategoriesModule,
    ProductsModule,
    AddressesModule,
    CartModule,
    CheckoutModule,
    PaymentsModule,
    OrdersModule,
    PayoutsModule,
    ReviewsModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
