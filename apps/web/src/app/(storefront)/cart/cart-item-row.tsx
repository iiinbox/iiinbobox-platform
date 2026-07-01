"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import type { CartItem } from "@iiiiibox/shared-types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatPrice } from "@/lib/format";

export function CartItemRow({ item }: { item: CartItem }) {
  const router = useRouter();
  const [qty, setQty] = useState(item.quantity);
  const [busy, setBusy] = useState(false);

  async function updateQuantity(quantity: number) {
    if (quantity < 1) return;
    setBusy(true);
    setQty(quantity);
    await fetch(`/api/cart/items/${item.productId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quantity }),
    });
    setBusy(false);
    router.refresh();
  }

  async function remove() {
    setBusy(true);
    await fetch(`/api/cart/items/${item.productId}`, { method: "DELETE" });
    setBusy(false);
    router.refresh();
  }

  return (
    <div className="flex items-center gap-4 py-4">
      <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
        {item.product.images[0] && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.product.images[0]} alt={item.product.title} className="h-full w-full object-cover" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{item.product.title}</p>
        <p className="text-xs text-muted-foreground">{item.product.vendor.storeName}</p>
        <p className="text-sm font-semibold mt-1">{formatPrice(item.product.priceMinor, item.product.currency)}</p>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => updateQuantity(qty - 1)} disabled={busy || qty <= 1}>
          −
        </Button>
        <Input
          value={qty}
          onChange={(e) => setQty(Number(e.target.value))}
          onBlur={(e) => updateQuantity(Number(e.target.value))}
          className="w-14 h-8 text-center"
          type="number"
          min={1}
          max={item.product.stockQty}
          disabled={busy}
        />
        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => updateQuantity(qty + 1)} disabled={busy || qty >= item.product.stockQty}>
          +
        </Button>
      </div>
      <p className="w-24 text-right text-sm font-semibold">
        {formatPrice(item.product.priceMinor * qty, item.product.currency)}
      </p>
      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={remove} disabled={busy}>
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
