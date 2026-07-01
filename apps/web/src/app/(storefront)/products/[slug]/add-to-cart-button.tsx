"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShoppingCart, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AddToCartButton({ productId }: { productId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [added, setAdded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onClick() {
    setBusy(true);
    setError(null);
    const res = await fetch("/api/cart/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, quantity: 1 }),
    });
    setBusy(false);
    if (!res.ok) {
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Could not add to cart");
      return;
    }
    setAdded(true);
    router.refresh();
    setTimeout(() => setAdded(false), 3000);
  }

  return (
    <div className="space-y-2">
      <Button onClick={onClick} disabled={busy} size="lg" className="w-full" variant={added ? "secondary" : "default"}>
        {added ? (
          <>
            <CheckCircle className="mr-2 h-4 w-4" /> Added to cart
          </>
        ) : busy ? (
          "Adding..."
        ) : (
          <>
            <ShoppingCart className="mr-2 h-4 w-4" /> Add to cart
          </>
        )}
      </Button>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
