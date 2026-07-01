"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function ModerateButton({
  productId,
  field,
  value,
}: {
  productId: string;
  field: "isActive" | "isApproved";
  value: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function toggle() {
    setBusy(true);
    await fetch(`/api/admin/products/${productId}/moderate`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: !value }),
    });
    setBusy(false);
    router.refresh();
  }

  const label = field === "isApproved"
    ? value ? "Delist" : "Approve"
    : value ? "Disable" : "Enable";

  return (
    <Button
      variant={value ? "outline" : "secondary"}
      size="sm"
      onClick={toggle}
      disabled={busy}
    >
      {label}
    </Button>
  );
}
