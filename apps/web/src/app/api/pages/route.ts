import { NextResponse } from "next/server";
import { authedFetch } from "@/lib/authed-fetch";

const API = process.env.API_INTERNAL_URL ?? "http://localhost:4000";

export async function GET() {
  try {
    const res = await fetch(`${API}/page-config`, { cache: "no-store" });
    const data = await res.json();
    return NextResponse.json(Array.isArray(data) ? data : []);
  } catch {
    return NextResponse.json([]);
  }
}

export async function POST(req: Request) {
  const { slug, name, config } = await req.json();
  // Template gallery (New Page dialog) passes a pre-built config with real
  // components; Blank Page and any other caller omit it and fall back to
  // today's empty-zone shape, unchanged.
  const finalConfig = config ?? {
    name,
    header: { desktop: { components: [], height: 200 }, mobile: { components: [], height: 150 } },
    template: { desktop: { components: [], height: 900 }, mobile: { components: [], height: 812 } },
    footer: { desktop: { components: [], height: 300 }, mobile: { components: [], height: 220 } },
  };
  const res = await authedFetch(`/page-config/${encodeURIComponent(slug)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ config: { ...finalConfig, name } }),
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
