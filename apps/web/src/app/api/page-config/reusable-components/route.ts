import { NextResponse } from "next/server";
import { authedFetch } from "@/lib/authed-fetch";

export async function GET() {
  try {
    const res = await authedFetch("/page-config/reusable-components", { cache: "no-store" });
    const data = await res.json();
    return NextResponse.json(Array.isArray(data) ? data : [], { status: res.status });
  } catch {
    return NextResponse.json([]);
  }
}
