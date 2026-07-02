import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const API = process.env.API_INTERNAL_URL ?? "http://localhost:4000";

async function authHeaders() {
  const jar = await cookies();
  const token = jar.get("iiiiibox_at")?.value;
  return { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
}

export async function GET() {
  const res = await fetch(`${API}/admin/categories`, { headers: await authHeaders(), cache: "no-store" });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

export async function POST(req: Request) {
  const body = await req.json();
  const res = await fetch(`${API}/admin/categories`, {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
