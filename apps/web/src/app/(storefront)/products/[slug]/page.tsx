import Link from "next/link";
import { Star, ShoppingCart, ArrowLeft } from "lucide-react";
import { getServerApiClient } from "@/lib/server-api";
import { formatPrice } from "@/lib/format";
import { getSession } from "@/lib/session";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { AddToCartButton } from "./add-to-cart-button";
import { ReviewForm } from "./review-form";

export default async function ProductDetailPage({ params }: { params: { slug: string } }) {
  const api = getServerApiClient();
  const product = await api.products.bySlug(params.slug);
  const reviews = await api.reviews.list(params.slug);
  const session = getSession();

  const avgRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : null;

  return (
    <div className="container py-8">
      <Button variant="ghost" size="sm" className="mb-6 -ml-2" asChild>
        <Link href="/products">
          <ArrowLeft className="mr-1 h-4 w-4" /> Back to products
        </Link>
      </Button>

      <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
        {/* Images */}
        <div className="space-y-2">
          {product.images.length > 0 ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={product.images[0]}
                alt={product.title}
                className="aspect-square w-full rounded-xl object-cover"
              />
              {product.images.length > 1 && (
                <div className="grid grid-cols-4 gap-2">
                  {product.images.slice(1).map((url) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={url} src={url} alt={product.title} className="aspect-square rounded-lg object-cover" />
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="aspect-square w-full rounded-xl bg-muted" />
          )}
        </div>

        {/* Info */}
        <div className="flex flex-col gap-4">
          <div>
            <Link href={`/store/${product.vendor.storeSlug}`} className="text-sm text-primary hover:underline">
              {product.vendor.storeName}
            </Link>
            <h1 className="mt-1 text-3xl font-bold">{product.title}</h1>

            {avgRating && (
              <div className="mt-2 flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} className={`h-4 w-4 ${s <= Math.round(avgRating) ? "fill-amber-400 text-amber-400" : "text-muted-foreground"}`} />
                ))}
                <span className="ml-1 text-sm text-muted-foreground">
                  {avgRating.toFixed(1)} ({reviews.length} review{reviews.length !== 1 ? "s" : ""})
                </span>
              </div>
            )}
          </div>

          <div className="text-3xl font-bold">{formatPrice(product.priceMinor, product.currency)}</div>

          {product.stockQty > 0 ? (
            <Badge variant="success" className="w-fit">{product.stockQty} in stock</Badge>
          ) : (
            <Badge variant="secondary" className="w-fit">Out of stock</Badge>
          )}

          {product.description && (
            <p className="text-muted-foreground leading-relaxed">{product.description}</p>
          )}

          <Separator />

          {product.stockQty > 0 ? (
            <AddToCartButton productId={product.id} />
          ) : (
            <Button disabled size="lg" className="w-full">
              <ShoppingCart className="mr-2 h-4 w-4" /> Out of stock
            </Button>
          )}
        </div>
      </div>

      {/* Reviews */}
      <Separator className="my-12" />
      <div className="max-w-2xl">
        <h2 className="text-xl font-bold mb-6">Reviews</h2>
        {reviews.length === 0 ? (
          <p className="text-muted-foreground">No reviews yet. Be the first to review!</p>
        ) : (
          <div className="space-y-4 mb-8">
            {reviews.map((review) => (
              <div key={review.id} className="rounded-lg border p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-sm">{review.user?.name ?? "Customer"}</span>
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className={`h-3.5 w-3.5 ${s <= review.rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground"}`} />
                    ))}
                  </div>
                </div>
                {review.comment && <p className="text-sm text-muted-foreground">{review.comment}</p>}
              </div>
            ))}
          </div>
        )}

        {session && <ReviewForm productSlug={params.slug} />}
      </div>
    </div>
  );
}
