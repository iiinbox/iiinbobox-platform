"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function ApplyVendorForm() {
  const router = useRouter();
  const [storeName, setStoreName] = useState("");
  const [storeSlug, setStoreSlug] = useState("");
  const [storeDescription, setStoreDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const res = await fetch("/api/vendors/apply", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ storeName, storeSlug, storeDescription: storeDescription || undefined }),
    });
    setSubmitting(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Application failed");
      return;
    }
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="storeName">Store name</Label>
        <Input id="storeName" placeholder="My Awesome Store" value={storeName} onChange={(e) => setStoreName(e.target.value)} required />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="storeSlug">Store URL slug</Label>
        <div className="flex">
          <span className="inline-flex items-center px-3 text-sm text-muted-foreground border border-r-0 rounded-l-md bg-muted">
            /store/
          </span>
          <Input
            id="storeSlug"
            className="rounded-l-none"
            placeholder="my-awesome-store"
            value={storeSlug}
            onChange={(e) => setStoreSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))}
            required
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="description">Description (optional)</Label>
        <Textarea id="description" placeholder="Tell customers about your store..." value={storeDescription} onChange={(e) => setStoreDescription(e.target.value)} />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" className="w-full" disabled={submitting}>
        {submitting ? "Submitting..." : "Submit application"}
      </Button>
    </form>
  );
}
