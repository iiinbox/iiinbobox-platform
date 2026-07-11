import { NextResponse } from "next/server";

const API = process.env.API_INTERNAL_URL ?? "http://localhost:4000";

// Public — the live published site needs this to render a bound Table cell,
// same trust tier as /page-config/:page/published. Deliberately not routed
// through authed-fetch (no admin session exists on the public site).
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const res = await fetch(`${API}/page-config/table-cells/resolve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({});
  }
}
