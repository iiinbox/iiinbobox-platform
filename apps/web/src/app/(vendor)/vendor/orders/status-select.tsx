"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SubOrderStatus } from "@iiiiibox/shared-types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const STATUSES = [
  SubOrderStatus.CONFIRMED,
  SubOrderStatus.PACKED,
  SubOrderStatus.SHIPPED,
  SubOrderStatus.DELIVERED,
  SubOrderStatus.CANCELLED,
];

export function StatusSelect({ subOrderId, status }: { subOrderId: string; status: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function onChange(newStatus: string) {
    setBusy(true);
    await fetch(`/api/vendors/orders/${subOrderId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    setBusy(false);
    router.refresh();
  }

  return (
    <Select value={status} onValueChange={onChange} disabled={busy}>
      <SelectTrigger className="h-7 w-32 text-xs">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {STATUSES.map((s) => (
          <SelectItem key={s} value={s} className="text-xs">
            {s}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
