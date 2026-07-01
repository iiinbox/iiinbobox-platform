import { getServerApiClient } from "@/lib/server-api";
import { formatPrice } from "@/lib/format";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TrendingUp, ShoppingBag, DollarSign } from "lucide-react";

export default async function VendorAnalyticsPage() {
  const stats = await getServerApiClient().analytics.vendor();

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Analytics</h1>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription>Total revenue</CardDescription>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <CardTitle className="text-2xl">{formatPrice(stats.totalRevenueMinor, "INR")}</CardTitle>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription>This month</CardDescription>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <CardTitle className="text-2xl">{formatPrice(stats.thisMonthRevenueMinor, "INR")}</CardTitle>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription>Total orders</CardDescription>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <CardTitle className="text-2xl">{stats.totalOrders}</CardTitle>
          </CardContent>
        </Card>
      </div>

      {stats.topProducts.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4">Top products</h2>
          <div className="rounded-xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Units sold</TableHead>
                  <TableHead>Revenue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.topProducts.map((product, i) => (
                  <TableRow key={product.slug ?? i}>
                    <TableCell className="font-medium">{product.title}</TableCell>
                    <TableCell>{product.totalSold}</TableCell>
                    <TableCell>{formatPrice(product.revenueMinor, "INR")}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
}
