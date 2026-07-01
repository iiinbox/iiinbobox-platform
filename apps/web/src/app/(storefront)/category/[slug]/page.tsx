import { getServerApiClient } from "@/lib/server-api";
import { ProductCard } from "@/components/product-card";

export default async function CategoryPage({ params }: { params: { slug: string } }) {
  const { items, total } = await getServerApiClient().products.search({ category: params.slug });
  const title = params.slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">{title}</h1>
        <p className="text-muted-foreground mt-1">{total} product{total !== 1 ? "s" : ""}</p>
      </div>
      {items.length === 0 ? (
        <p className="text-muted-foreground py-8 text-center">No products in this category yet.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {items.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
