import { getServerApiClient } from "@/lib/server-api";
import { formatPrice } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ModerateButton } from "./moderate-button";

export default async function AdminProductsPage() {
  const { items, total } = await getServerApiClient().adminProducts.list({ pageSize: 50 });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Products</h1>
        <p className="text-muted-foreground text-sm mt-1">{total} total product{total !== 1 ? "s" : ""}</p>
      </div>

      <div className="rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>Vendor</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Listed</TableHead>
              <TableHead>Approved</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((product) => (
              <TableRow key={product.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-muted flex-shrink-0 overflow-hidden">
                      {product.images[0] && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={product.images[0]} alt="" className="h-full w-full object-cover" />
                      )}
                    </div>
                    <span className="font-medium">{product.title}</span>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">{product.vendor.storeName}</TableCell>
                <TableCell>{formatPrice(product.priceMinor, product.currency)}</TableCell>
                <TableCell>
                  <Badge variant={product.isActive ? "success" : "secondary"}>{product.isActive ? "Active" : "Inactive"}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={product.isApproved ? "success" : "destructive"}>{product.isApproved ? "Approved" : "Delisted"}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <ModerateButton productId={product.id} field="isApproved" value={product.isApproved} />
                    <ModerateButton productId={product.id} field="isActive" value={product.isActive} />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
