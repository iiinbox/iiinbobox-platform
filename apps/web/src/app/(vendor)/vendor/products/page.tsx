import Link from "next/link";
import { Plus } from "lucide-react";
import { getServerApiClient } from "@/lib/server-api";
import { formatPrice } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default async function VendorProductsPage() {
  const products = await getServerApiClient().products.listMine();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Products</h1>
          <p className="text-muted-foreground text-sm mt-1">{products.length} product{products.length !== 1 ? "s" : ""}</p>
        </div>
        <Button asChild>
          <Link href="/vendor/products/new">
            <Plus className="mr-1 h-4 w-4" /> Add product
          </Link>
        </Button>
      </div>

      {products.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-16 text-center border rounded-xl">
          <p className="text-muted-foreground">No products yet.</p>
          <Button asChild variant="outline">
            <Link href="/vendor/products/new">Add your first product</Link>
          </Button>
        </div>
      ) : (
        <div className="rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                        {product.images[0] && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={product.images[0]} alt="" className="h-full w-full object-cover" />
                        )}
                      </div>
                      <span className="font-medium">{product.title}</span>
                    </div>
                  </TableCell>
                  <TableCell>{formatPrice(product.priceMinor, product.currency)}</TableCell>
                  <TableCell>{product.stockQty}</TableCell>
                  <TableCell>
                    <Badge variant={product.isActive ? "success" : "secondary"}>
                      {product.isActive ? "Active" : "Inactive"}
                    </Badge>
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
