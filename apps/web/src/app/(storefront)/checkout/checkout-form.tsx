"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Lock } from "lucide-react";
import type { Address } from "@iiiiibox/shared-types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => { open: () => void };
  }
}

function loadRazorpayScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) { resolve(); return; }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Could not load Razorpay checkout"));
    document.body.appendChild(script);
  });
}

export function CheckoutForm({ addresses }: { addresses: Address[] }) {
  const router = useRouter();
  const [addressId, setAddressId] = useState(
    addresses.find((a) => a.isDefault)?.id ?? addresses[0]?.id ?? "",
  );
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function pay() {
    setSubmitting(true);
    setError(null);
    const sessionRes = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ addressId }),
    });
    if (!sessionRes.ok) {
      const data = await sessionRes.json().catch(() => ({}));
      setError(data.error ?? "Could not start checkout");
      setSubmitting(false);
      return;
    }
    const session = await sessionRes.json();

    if (!session.razorpayKeyId) {
      await verify({ orderId: session.orderId });
      return;
    }

    try {
      await loadRazorpayScript();
    } catch {
      setError("Could not load payment widget");
      setSubmitting(false);
      return;
    }

    const razorpay = new window.Razorpay({
      key: session.razorpayKeyId,
      amount: session.amountMinor,
      currency: session.currency,
      order_id: session.razorpayOrderId,
      handler: (response: { razorpay_payment_id: string; razorpay_signature: string }) =>
        verify({ orderId: session.orderId, razorpayPaymentId: response.razorpay_payment_id, razorpaySignature: response.razorpay_signature }),
      modal: { ondismiss: () => setSubmitting(false) },
    });
    razorpay.open();
  }

  async function verify(body: { orderId: string; razorpayPaymentId?: string; razorpaySignature?: string }) {
    const res = await fetch("/api/checkout/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setSubmitting(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Payment verification failed");
      return;
    }
    const order = await res.json();
    router.push(`/orders/${order.id}`);
  }

  if (addresses.length === 0) {
    return <p className="text-muted-foreground text-sm">Add an address above before checking out.</p>;
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {addresses.map((address) => (
          <button
            key={address.id}
            type="button"
            onClick={() => setAddressId(address.id)}
            className={cn(
              "w-full rounded-lg border p-4 text-left text-sm transition-colors",
              address.id === addressId
                ? "border-primary bg-primary/5"
                : "border-border hover:border-muted-foreground",
            )}
          >
            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
              <span>
                {address.line1}, {address.city}, {address.state} {address.pincode}
                <br />
                <span className="text-muted-foreground">{address.phone}</span>
              </span>
            </div>
          </button>
        ))}
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button onClick={pay} disabled={submitting || !addressId} size="lg" className="w-full">
        <Lock className="mr-2 h-4 w-4" />
        {submitting ? "Processing..." : "Pay now"}
      </Button>
    </div>
  );
}
