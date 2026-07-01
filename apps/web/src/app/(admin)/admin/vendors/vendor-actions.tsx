"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function VendorActions({ vendorId }: { vendorId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function approve() {
    setBusy(true);
    await fetch(`/api/admin/vendors/${vendorId}/approve`, { method: "PATCH" });
    setBusy(false);
    router.refresh();
  }

  async function reject() {
    const rejectionReason = prompt("Rejection reason?");
    if (!rejectionReason) return;
    setBusy(true);
    await fetch(`/api/admin/vendors/${vendorId}/reject`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rejectionReason }),
    });
    setBusy(false);
    router.refresh();
  }

  return (
    <div className="flex justify-end gap-2">
      <Button variant="outline" size="sm" onClick={reject} disabled={busy}>
        Reject
      </Button>
      <Button size="sm" onClick={approve} disabled={busy}>
        Approve
      </Button>
    </div>
  );
}
