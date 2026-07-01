import Link from "next/link";
import { CheckCircle, Package } from "lucide-react";
import { SubOrderStatus } from "@iiiiibox/shared-types";
import { getServerApiClient } from "@/lib/server-api";
import { formatPrice } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ReturnButton } from "./return-button";

const STATUS_VARIANT: Record<string, "success" | "warning" | "pending" | "secondary" | "destructive"> = {
  PLACED: "pending", CONFIRMED: "pending", PACKED: "warning",
  SHIPPED: "warning", DELIVERED: "success", CANCELLED: "destructive", RETURNED: "secondary",
};

export default async function OrderPage({ params }: { params: { id: string } }) {
  const order = await getServerApiClient().orders.get(params.id);
  const currency = order.currency;

  return (
    <div className="container max-w-2xl py-8">
      <div className="flex flex-col items-center gap-2 py-8 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
          <CheckCircle className="h-7 w-7 text-emerald-600" />
        </div>
        <h1 className="text-2xl font-bold mt-2">Order confirmed</h1>
        <p className="text-muted-foreground font-mono text-sm">#{order.orderNumber}</p>
      </div>

      <div className="space-y-4">
        {order.subOrders.map((subOrder) => {
          const CANCELLABLE = [SubOrderStatus.PLACED, SubOrderStatus.CONFIRMED] as string[];
          const canCancel = CANCELLABLE.includes(subOrder.status);
          const canReturn = subOrder.status === SubOrderStatus.DELIVERED;

          return (
            <div key={subOrder.id} className="rounded-xl border p-5 space-y-4">
              <div className="flex items-center justify-between">
                {subOrder.vendor ? (
                  <Link href={`/store/${subOrder.vendor.storeSlug}`} className="flex items-center gap-2 font-medium hover:text-primary">
                    <Package className="h-4 w-4" />
                    {subOrder.vendor.storeName}
                  </Link>
                ) : (
                  <span className="flex items-center gap-2 font-medium">
                    <Package className="h-4 w-4" /> Vendor
                  </span>
                )}
                <Badge variant={STATUS_VARIANT[subOrder.status] ?? "secondary"}>{subOrder.status}</Badge>
              </div>

              <Separator />

              <ul className="space-y-2">
                {subOrder.items.map((item) => (
                  <li key={item.id} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{item.titleSnapshot} × {item.quantity}</span>
                    <span className="font-medium">{formatPrice(item.priceMinorSnap * item.quantity, currency)}</span>
                  </li>
                ))}
              </ul>

              {(canCancel || canReturn) && (
                <ReturnButton orderId={order.id} subOrderId={subOrder.id} action={canReturn ? "return" : "cancel"} />
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-6 rounded-xl border p-5">
        <div className="flex justify-between font-semibold">
          <span>Total paid</span>
          <span>{formatPrice(order.totalAmountMinor, currency)}</span>
        </div>
      </div>

      <div className="mt-6 flex justify-center">
        <Button variant="outline" asChild>
          <Link href="/products">Continue shopping</Link>
        </Button>
      </div>
    </div>
  );
}
