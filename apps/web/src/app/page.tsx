import Link from "next/link";
import { ArrowRight, ShoppingBag, Store, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getServerApiClient } from "@/lib/server-api";
import { ProductCard } from "@/components/product-card";

const FEATURES = [
  { icon: ShoppingBag, title: "Curated products", description: "Discover unique items from trusted independent sellers." },
  { icon: Store, title: "Multiple vendors", description: "Shop from many stores in a single checkout." },
  { icon: Shield, title: "Secure payments", description: "Powered by Razorpay. Your transactions are always protected." },
];

export default async function HomePage() {
  const { items: featured } = await getServerApiClient().products.search({ pageSize: 8 });

  return (
    <div>
      {/* Hero */}
      <section className="border-b bg-gradient-to-b from-muted/50 to-background">
        <div className="container flex flex-col items-center gap-6 py-24 text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
            Your marketplace,{" "}
            <span className="text-primary">reimagined</span>
          </h1>
          <p className="max-w-xl text-lg text-muted-foreground">
            Browse thousands of products from independent sellers. One checkout, no hassle.
          </p>
          <div className="flex gap-3">
            <Button asChild size="lg">
              <Link href="/products">
                Shop now <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/vendor/apply">Sell with us</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container py-16">
        <div className="grid gap-6 md:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, description }) => (
            <Card key={title} className="border-0 shadow-none">
              <CardContent className="flex flex-col items-center gap-3 p-6 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold">{title}</h3>
                <p className="text-sm text-muted-foreground">{description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Featured products */}
      {featured.length > 0 && (
        <section className="container pb-16">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold tracking-tight">Featured products</h2>
            <Button variant="ghost" asChild>
              <Link href="/products">
                View all <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {featured.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
