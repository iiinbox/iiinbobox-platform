import { NextResponse } from "next/server";
import { authedFetch } from "@/lib/authed-fetch";

export async function GET() {
  try {
    const res = await authedFetch("/settings", { cache: "no-store" });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({}, { status: 200 });
  }
}

export async function PUT(req: Request) {
  const body = await req.json();
  const res = await authedFetch("/settings", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
