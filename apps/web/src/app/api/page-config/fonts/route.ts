import { NextResponse } from "next/server";
import { authedFetch } from "@/lib/authed-fetch";

export async function GET() {
  try {
    const res = await authedFetch("/page-config/fonts", { cache: "no-store" });
    const data = await res.json();
    return NextResponse.json(Array.isArray(data) ? data : [], { status: res.status });
  } catch {
    return NextResponse.json([]);
  }
}

export async function DELETE(req: Request) {
  const body = await req.json();
  const res = await authedFetch("/page-config/fonts", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
