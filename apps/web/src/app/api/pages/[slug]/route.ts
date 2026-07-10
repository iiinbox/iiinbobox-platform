import { NextResponse } from "next/server";
import { authedFetch } from "@/lib/authed-fetch";

const API = process.env.API_INTERNAL_URL ?? "http://localhost:4000";

export async function GET(
  _: Request,
  { params }: { params: { slug: string } },
) {
  const { slug } = params;
  try {
    const res = await fetch(`${API}/page-config/${encodeURIComponent(slug)}`, { cache: "no-store" });
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ components: [] });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: { slug: string } },
) {
  const { slug } = params;
  const body = await req.json();
  const res = await authedFetch(`/page-config/${encodeURIComponent(slug)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  // This writes the draft only now — it no longer affects what's live (see
  // page-config.service.ts's getPublished()/save() split), so there's
  // nothing here to revalidate. The equivalent revalidatePath call now lives
  // in the folder-publish route below, generalized to every page in the
  // folder instead of just "home".
  return NextResponse.json(data, { status: res.status });
}

export async function DELETE(
  _: Request,
  { params }: { params: { slug: string } },
) {
  const { slug } = params;
  const res = await authedFetch(`/page-config/${encodeURIComponent(slug)}`, { method: "DELETE" });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
