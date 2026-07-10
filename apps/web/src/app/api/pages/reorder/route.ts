import { NextResponse } from "next/server";
import { authedFetch } from "@/lib/authed-fetch";

// Item 5: persist the sidebar's drag-and-drop page order. A static route
// segment always wins over the sibling [slug] route in Next.js, so this
// never gets swallowed as slug="reorder".
export async function PUT(req: Request) {
  const body = await req.json();
  const res = await authedFetch("/page-config/reorder", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
