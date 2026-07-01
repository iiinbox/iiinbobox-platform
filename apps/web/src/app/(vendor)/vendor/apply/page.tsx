import Link from "next/link";
import { Store } from "lucide-react";
import { ApiError } from "@iiiiibox/api-client";
import { getServerApiClient } from "@/lib/server-api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ApplyVendorForm } from "./apply-form";

export default async function VendorApplyPage() {
  try {
    const vendor = await getServerApiClient().vendors.me();
    return (
      <div className="container max-w-lg py-12">
        <Card>
          <CardHeader className="text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mx-auto mb-2">
              <Store className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>{vendor.storeName}</CardTitle>
            <CardDescription>Your vendor application</CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-3">
            <Badge variant={vendor.status === "APPROVED" ? "success" : vendor.status === "REJECTED" ? "destructive" : "pending"}>
              {vendor.status}
            </Badge>
            {vendor.status === "APPROVED" && (
              <div className="pt-2">
                <Button asChild>
                  <Link href="/vendor/dashboard">Go to dashboard</Link>
                </Button>
              </div>
            )}
            {vendor.status === "REJECTED" && vendor.rejectionReason && (
              <p className="text-sm text-muted-foreground">{vendor.rejectionReason}</p>
            )}
          </CardContent>
        </Card>
      </div>
    );
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) {
      return (
        <div className="container max-w-lg py-12 text-center">
          <p className="text-muted-foreground">
            <Link href="/login" className="text-primary underline">Log in</Link> first to apply.
          </p>
        </div>
      );
    }
    if (!(err instanceof ApiError) || err.status !== 404) {
      throw err;
    }
  }

  return (
    <div className="container max-w-lg py-12">
      <Card>
        <CardHeader>
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mb-2">
            <Store className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>Apply to sell on iiiiiBOX</CardTitle>
          <CardDescription>Set up your store and start selling.</CardDescription>
        </CardHeader>
        <CardContent>
          <ApplyVendorForm />
        </CardContent>
      </Card>
    </div>
  );
}
