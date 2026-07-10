import { NextResponse } from "next/server";
import { authedFetch } from "@/lib/authed-fetch";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const res = await authedFetch(`/admin/categories/${id}`, { method: "DELETE" });
  return NextResponse.json({}, { status: res.status });
}
