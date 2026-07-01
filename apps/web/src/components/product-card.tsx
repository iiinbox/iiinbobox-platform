import Link from "next/link";
import type { ProductWithVendor } from "@iiiiibox/shared-types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/format";

export function ProductCard({ product }: { product: ProductWithVendor }) {
  return (
    <Link href={`/products/${product.slug}`} className="group block">
      <Card className="overflow-hidden transition-shadow group-hover:shadow-md">
        <div className="aspect-square bg-muted overflow-hidden">
          {product.images[0] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.images[0]}
              alt={product.title}
              className="h-full w-full object-cover transition-transform group-hover:scale-105"
            />
          ) : (
            <div className="h-full w-full bg-muted" />
          )}
        </div>
        <CardContent className="p-3">
          <p className="text-sm font-medium line-clamp-1 group-hover:text-primary transition-colors">
            {product.title}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">{product.vendor.storeName}</p>
          <p className="text-sm font-semibold mt-2">{formatPrice(product.priceMinor, product.currency)}</p>
          {product.stockQty === 0 && (
            <Badge variant="secondary" className="mt-1 text-xs">
              Out of stock
            </Badge>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
