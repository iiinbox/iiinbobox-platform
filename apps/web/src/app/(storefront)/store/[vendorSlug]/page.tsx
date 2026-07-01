import { getServerApiClient } from "@/lib/server-api";
import { ProductCard } from "@/components/product-card";

export default async function StorePage({ params }: { params: { vendorSlug: string } }) {
  const api = getServerApiClient();
  const [vendor, { items, total }] = await Promise.all([
    api.vendors.bySlug(params.vendorSlug),
    api.products.search({ vendor: params.vendorSlug }),
  ]);

  return (
    <div className="container py-8">
      <div className="mb-8 pb-8 border-b">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4">
          <span className="text-2xl font-bold text-primary">
            {vendor.storeName.charAt(0).toUpperCase()}
          </span>
        </div>
        <h1 className="text-3xl font-bold">{vendor.storeName}</h1>
        {vendor.storeDescription && (
          <p className="text-muted-foreground mt-2 max-w-prose">{vendor.storeDescription}</p>
        )}
        <p className="text-sm text-muted-foreground mt-2">{total} product{total !== 1 ? "s" : ""}</p>
      </div>

      {items.length === 0 ? (
        <p className="text-muted-foreground py-8 text-center">No products listed yet.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {items.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
