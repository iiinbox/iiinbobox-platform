import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getServerApiClient } from "@/lib/server-api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { NewProductForm } from "./new-product-form";

export default async function NewProductPage() {
  const categories = await getServerApiClient().categories.list();

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" className="-ml-2" asChild>
        <Link href="/vendor/products">
          <ArrowLeft className="mr-1 h-4 w-4" /> Back to products
        </Link>
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Add a product</CardTitle>
          <CardDescription>Fill in the details to list a new product.</CardDescription>
        </CardHeader>
        <CardContent>
          {categories.length === 0 ? (
            <p className="text-muted-foreground text-sm">No categories exist yet — ask an admin to create one.</p>
          ) : (
            <NewProductForm categories={categories} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
