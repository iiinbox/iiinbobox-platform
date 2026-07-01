import { Package, ShoppingBag, CreditCard, BarChart3, ArrowRight } from "lucide-react";
import Link from "next/link";
import { getServerApiClient } from "@/lib/server-api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function VendorDashboardPage() {
  const api = getServerApiClient();
  const [vendor, analytics] = await Promise.all([
    api.vendors.me(),
    api.analytics.vendor().catch(() => null),
  ]);

  if (vendor.status !== "APPROVED") {
    return (
      <div className="flex flex-col items-center gap-6 py-16 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <Package className="h-8 w-8 text-muted-foreground" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">{vendor.storeName}</h1>
          <Badge variant={vendor.status === "PENDING" ? "pending" : "destructive"} className="mt-2">
            {vendor.status}
          </Badge>
        </div>
        <p className="text-muted-foreground max-w-sm">
          {vendor.status === "PENDING"
            ? "Your application is under review. You'll be notified once approved."
            : `Your application was not approved. ${vendor.rejectionReason ? `Reason: ${vendor.rejectionReason}` : ""}`}
        </p>
      </div>
    );
  }

  const QUICK_LINKS = [
    { href: "/vendor/products/new", label: "Add product", description: "List a new item", icon: Package },
    { href: "/vendor/orders", label: "View orders", description: "Manage fulfilment", icon: ShoppingBag },
    { href: "/vendor/payouts", label: "Payouts", description: "Track earnings", icon: CreditCard },
    { href: "/vendor/analytics", label: "Analytics", description: "Sales insights", icon: BarChart3 },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">{vendor.storeName}</h1>
        <p className="text-muted-foreground mt-1">{vendor.storeDescription}</p>
      </div>

      {analytics && (
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total revenue</CardDescription>
              <CardTitle className="text-2xl">₹{(analytics.totalRevenueMinor / 100).toFixed(2)}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>This month</CardDescription>
              <CardTitle className="text-2xl">₹{(analytics.thisMonthRevenueMinor / 100).toFixed(2)}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total orders</CardDescription>
              <CardTitle className="text-2xl">{analytics.totalOrders}</CardTitle>
            </CardHeader>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        {QUICK_LINKS.map(({ href, label, description, icon: Icon }) => (
          <Card key={href} className="hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <Link href={href} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{label}</p>
                    <p className="text-xs text-muted-foreground">{description}</p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
