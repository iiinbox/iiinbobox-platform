import { Search } from "lucide-react";
import { getServerApiClient } from "@/lib/server-api";
import { ProductCard } from "@/components/product-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: { search?: string; category?: string };
}) {
  const { items, total } = await getServerApiClient().products.search({
    search: searchParams.search,
    category: searchParams.category,
  });

  return (
    <div className="container py-8">
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Products</h1>
          <p className="text-muted-foreground mt-1">
            {searchParams.search
              ? `${total} result${total !== 1 ? "s" : ""} for "${searchParams.search}"`
              : `${total} product${total !== 1 ? "s" : ""} available`}
          </p>
        </div>

        {/* Search */}
        <form method="GET" className="flex gap-2 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              name="search"
              placeholder="Search products..."
              defaultValue={searchParams.search}
              className="pl-9"
            />
          </div>
          <Button type="submit">Search</Button>
        </form>

        {/* Grid */}
        {items.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-16 text-center">
            <p className="text-muted-foreground">No products found.</p>
            {searchParams.search && (
              <Button variant="outline" asChild>
                <a href="/products">Clear search</a>
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {items.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
