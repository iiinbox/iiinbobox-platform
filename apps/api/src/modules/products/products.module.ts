import { Module } from "@nestjs/common";
import { StorageModule } from "../storage/storage.module";
import { SearchModule } from "../search/search.module";
import { ProductsController } from "./products.controller";
import { VendorProductsController } from "./vendor-products.controller";
import { AdminProductsController } from "./admin-products.controller";
import { ProductsService } from "./products.service";

@Module({
  imports: [StorageModule, SearchModule],
  controllers: [ProductsController, VendorProductsController, AdminProductsController],
  providers: [ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {}
