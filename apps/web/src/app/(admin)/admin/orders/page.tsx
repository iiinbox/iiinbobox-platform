import { getServerApiClient } from "@/lib/server-api";
import { formatPrice } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const STATUS_VARIANT: Record<string, "success" | "warning" | "pending" | "secondary" | "destructive"> = {
  PENDING_PAYMENT: "pending",
  PAID: "success",
  CANCELLED: "destructive",
  REFUNDED: "secondary",
};

export default async function AdminOrdersPage() {
  const { items, total } = await getServerApiClient().adminOrders.list({ pageSize: 50 });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Orders</h1>
        <p className="text-muted-foreground text-sm mt-1">{total} total order{total !== 1 ? "s" : ""}</p>
      </div>

      <div className="rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Vendors</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((order) => (
              <TableRow key={order.id}>
                <TableCell className="font-medium font-mono text-xs">{order.orderNumber}</TableCell>
                <TableCell>
                  <div>
                    <p className="text-sm">{order.user.name}</p>
                    <p className="text-xs text-muted-foreground">{order.user.email}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <ul className="text-xs text-muted-foreground space-y-0.5">
                    {order.subOrders.map((s) => (
                      <li key={s.id}>{s.vendor?.storeName}: {s.status}</li>
                    ))}
                  </ul>
                </TableCell>
                <TableCell className="font-medium">{formatPrice(order.totalAmountMinor, order.currency)}</TableCell>
                <TableCell>
                  <Badge variant={STATUS_VARIANT[order.status] ?? "secondary"}>{order.status}</Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">{new Date(order.createdAt).toLocaleDateString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
