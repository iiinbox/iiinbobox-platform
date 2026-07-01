import Link from "next/link";
import { ShoppingCart, ArrowRight } from "lucide-react";
import { getServerApiClient } from "@/lib/server-api";
import { getSession } from "@/lib/session";
import { formatPrice } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { CartItemRow } from "./cart-item-row";

export default async function CartPage() {
  const session = getSession();

  if (!session) {
    return (
      <div className="container py-24 flex flex-col items-center gap-4 text-center">
        <ShoppingCart className="h-12 w-12 text-muted-foreground" />
        <h1 className="text-2xl font-bold">Your cart is empty</h1>
        <p className="text-muted-foreground">Log in to see your saved cart items.</p>
        <Button asChild>
          <Link href="/login">Log in</Link>
        </Button>
      </div>
    );
  }

  const cart = await getServerApiClient().cart.get();
  const total = cart.items.reduce((sum, item) => sum + item.product.priceMinor * item.quantity, 0);
  const currency = cart.items[0]?.product.currency ?? "INR";

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold tracking-tight mb-8">
        Shopping cart
        {cart.items.length > 0 && (
          <span className="ml-2 text-xl font-normal text-muted-foreground">
            ({cart.items.length} {cart.items.length === 1 ? "item" : "items"})
          </span>
        )}
      </h1>

      {cart.items.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <ShoppingCart className="h-12 w-12 text-muted-foreground" />
          <p className="text-muted-foreground">Your cart is empty.</p>
          <Button asChild>
            <Link href="/products">Continue shopping</Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="divide-y">
              {cart.items.map((item) => (
                <CartItemRow key={item.id} item={item} />
              ))}
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="rounded-xl border p-6 space-y-4 sticky top-20">
              <h2 className="font-semibold text-lg">Order summary</h2>
              <div className="space-y-2 text-sm">
                {cart.items.map((item) => (
                  <div key={item.id} className="flex justify-between text-muted-foreground">
                    <span className="truncate mr-2">{item.product.title} × {item.quantity}</span>
                    <span>{formatPrice(item.product.priceMinor * item.quantity, currency)}</span>
                  </div>
                ))}
              </div>
              <Separator />
              <div className="flex justify-between font-semibold text-lg">
                <span>Total</span>
                <span>{formatPrice(total, currency)}</span>
              </div>
              <Button asChild size="lg" className="w-full">
                <Link href="/checkout">
                  Checkout <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="ghost" size="sm" className="w-full">
                <Link href="/products">Continue shopping</Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
