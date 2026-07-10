import { NextResponse } from "next/server";
import { authedFetch } from "@/lib/authed-fetch";

export async function POST(_req: Request, { params }: { params: { slug: string } }) {
  const res = await authedFetch(`/page-config/${encodeURIComponent(params.slug)}/duplicate`, { method: "POST" });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
