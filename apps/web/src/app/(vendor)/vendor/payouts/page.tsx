import { getServerApiClient } from "@/lib/server-api";
import { formatPrice } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const STATUS_VARIANT: Record<string, "success" | "warning" | "pending" | "secondary" | "destructive" | "outline"> = {
  PENDING: "pending",
  PROCESSING: "warning",
  PROCESSED: "success",
  FAILED: "destructive",
  ON_HOLD: "secondary",
};

export default async function VendorPayoutsPage() {
  const { items } = await getServerApiClient().payouts.list();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Payouts</h1>
        <p className="text-muted-foreground text-sm mt-1">{items.length} payout record{items.length !== 1 ? "s" : ""}</p>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-16 text-center border rounded-xl">
          <p className="text-muted-foreground">No payouts yet.</p>
        </div>
      ) : (
        <div className="rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sub-order</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((payout) => (
                <TableRow key={payout.id}>
                  <TableCell className="font-medium">{payout.subOrder?.subOrderNumber ?? payout.subOrderId}</TableCell>
                  <TableCell className="text-muted-foreground">{new Date(payout.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell className="font-medium">{formatPrice(payout.amountMinor, "INR")}</TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[payout.status] ?? "outline"}>{payout.status}</Badge>
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
