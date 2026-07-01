import Link from "next/link";
import { getServerApiClient } from "@/lib/server-api";
import { formatPrice } from "@/lib/format";
import { getSession } from "@/lib/session";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const STATUS_VARIANT: Record<string, "success" | "warning" | "pending" | "secondary" | "destructive"> = {
  PENDING_PAYMENT: "pending",
  PAID: "success",
  CANCELLED: "destructive",
  REFUNDED: "secondary",
};

export default async function OrdersPage() {
  const session = getSession();

  if (!session) {
    return (
      <div className="container py-24 flex flex-col items-center gap-4 text-center">
        <h1 className="text-2xl font-bold">My orders</h1>
        <p className="text-muted-foreground">Log in to see your order history.</p>
        <Button asChild>
          <Link href="/login">Log in</Link>
        </Button>
      </div>
    );
  }

  const { items } = await getServerApiClient().orders.list();

  return (
    <div className="container max-w-2xl py-8">
      <h1 className="text-3xl font-bold tracking-tight mb-8">My orders</h1>

      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-16 text-center border rounded-xl">
          <p className="text-muted-foreground">No orders yet.</p>
          <Button asChild variant="outline">
            <Link href="/products">Start shopping</Link>
          </Button>
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map((order) => (
            <li key={order.id}>
              <Link href={`/orders/${order.id}`} className="block rounded-xl border p-5 hover:shadow-sm transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium font-mono text-sm">{order.orderNumber}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{new Date(order.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatPrice(order.totalAmountMinor, order.currency)}</p>
                    <Badge variant={STATUS_VARIANT[order.status] ?? "secondary"} className="mt-1">
                      {order.status}
                    </Badge>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
