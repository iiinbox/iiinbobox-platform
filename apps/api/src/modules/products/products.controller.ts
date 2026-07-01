import { Controller, Get, Param, Query } from "@nestjs/common";
import { ProductsService } from "./products.service";

@Controller("products")
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  search(
    @Query("search") search?: string,
    @Query("category") categorySlug?: string,
    @Query("vendor") vendorSlug?: string,
    @Query("page") page?: string,
    @Query("pageSize") pageSize?: string,
  ) {
    return this.productsService.search({
      search,
      categorySlug,
      vendorSlug,
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
    });
  }

  @Get(":slug")
  bySlug(@Param("slug") slug: string) {
    return this.productsService.findBySlug(slug);
  }
}
