import { NextResponse } from "next/server";
import { authedFetch } from "@/lib/authed-fetch";

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const res = await authedFetch(`/page-config/projects/${encodeURIComponent(params.id)}/duplicate`, { method: "POST" });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
