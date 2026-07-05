import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const API = process.env.API_INTERNAL_URL ?? "http://localhost:4000";

export async function GET() {
  const res = await fetch(`${API}/page-config/home`, { cache: "no-store" });
  const data = await res.json();
  return NextResponse.json(data);
}

export async function PUT(req: Request) {
  const jar = await cookies();
  const token = jar.get("iiiiibox_at")?.value;
  const body = await req.json();
  const res = await fetch(`${API}/page-config/home`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
