import { NextResponse } from "next/server";
import { authedFetch } from "@/lib/authed-fetch";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const body = await req.json();
  const res = await authedFetch(`/page-config/folders/${encodeURIComponent(params.id)}/subdomain`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
