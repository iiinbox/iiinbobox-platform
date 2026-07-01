import { getServerApiClient } from "@/lib/server-api";
import { formatPrice } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusSelect } from "./status-select";

const STATUS_VARIANT: Record<string, "success" | "warning" | "pending" | "secondary" | "destructive" | "outline"> = {
  PLACED: "pending",
  CONFIRMED: "pending",
  PACKED: "warning",
  SHIPPED: "warning",
  DELIVERED: "success",
  CANCELLED: "destructive",
  RETURNED: "destructive",
};

export default async function VendorOrdersPage() {
  const { items } = await getServerApiClient().vendorOrders.list();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Orders</h1>
        <p className="text-muted-foreground text-sm mt-1">{items.length} sub-order{items.length !== 1 ? "s" : ""}</p>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-16 text-center border rounded-xl">
          <p className="text-muted-foreground">No orders yet.</p>
        </div>
      ) : (
        <div className="rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Payout</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((subOrder) => (
                <TableRow key={subOrder.id}>
                  <TableCell className="font-medium">{subOrder.subOrderNumber}</TableCell>
                  <TableCell>
                    <div>
                      <p className="text-sm">{subOrder.order.user.name}</p>
                      <p className="text-xs text-muted-foreground">{new Date(subOrder.order.createdAt).toLocaleDateString()}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <ul className="text-xs text-muted-foreground space-y-0.5">
                      {subOrder.items.map((item) => (
                        <li key={item.id}>{item.titleSnapshot} × {item.quantity}</li>
                      ))}
                    </ul>
                  </TableCell>
                  <TableCell className="font-medium">{formatPrice(subOrder.vendorPayoutMinor, "INR")}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Badge variant={STATUS_VARIANT[subOrder.status] ?? "outline"}>{subOrder.status}</Badge>
                      <StatusSelect subOrderId={subOrder.id} status={subOrder.status} />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
