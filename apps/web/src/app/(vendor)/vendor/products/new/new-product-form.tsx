"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Category } from "@iiiiibox/shared-types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function NewProductForm({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categorySlug, setCategorySlug] = useState(categories[0]?.slug ?? "");
  const [price, setPrice] = useState("");
  const [stockQty, setStockQty] = useState("0");
  const [image, setImage] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const createRes = await fetch("/api/vendors/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description: description || undefined, categorySlug, priceMinor: Math.round(Number(price) * 100), stockQty: Number(stockQty) }),
    });
    if (!createRes.ok) {
      const data = await createRes.json().catch(() => ({}));
      setError(data.error ?? "Could not create product");
      setSubmitting(false);
      return;
    }
    const product = await createRes.json();
    if (image) {
      const formData = new FormData();
      formData.append("file", image);
      await fetch(`/api/vendors/products/${product.id}/images`, { method: "POST", body: formData });
    }
    setSubmitting(false);
    router.push("/vendor/products");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="title">Title</Label>
        <Input id="title" placeholder="Product title" value={title} onChange={(e) => setTitle(e.target.value)} required />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="desc">Description</Label>
        <Textarea id="desc" placeholder="Describe your product..." value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Category</Label>
          <Select value={categorySlug} onValueChange={setCategorySlug}>
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat.slug} value={cat.slug}>{cat.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="price">Price (₹)</Label>
          <Input id="price" type="number" step="0.01" min="0" placeholder="0.00" value={price} onChange={(e) => setPrice(e.target.value)} required />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="stock">Stock quantity</Label>
        <Input id="stock" type="number" min="0" value={stockQty} onChange={(e) => setStockQty(e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="image">Product image</Label>
        <Input id="image" type="file" accept="image/*" onChange={(e) => setImage(e.target.files?.[0] ?? null)} />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" className="w-full" disabled={submitting}>
        {submitting ? "Creating..." : "Create product"}
      </Button>
    </form>
  );
}
