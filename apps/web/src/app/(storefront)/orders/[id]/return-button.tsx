"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function ReturnButton({
  orderId,
  subOrderId,
  action,
}: {
  orderId: string;
  subOrderId: string;
  action: "cancel" | "return";
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onClick() {
    if (!confirm(`${action === "return" ? "Request a return" : "Cancel"} this item?`)) return;
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/orders/${orderId}/suborders/${subOrderId}/refund`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    setBusy(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? `${action} failed`);
      return;
    }
    router.refresh();
  }

  return (
    <div className="space-y-1">
      <Button variant="outline" size="sm" onClick={onClick} disabled={busy}>
        {busy ? "Processing..." : action === "return" ? "Request return" : "Cancel order"}
      </Button>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
