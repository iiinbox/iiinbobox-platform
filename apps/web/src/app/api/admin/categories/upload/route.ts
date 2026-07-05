import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const API = process.env.API_INTERNAL_URL ?? "http://localhost:4000";

export async function POST(req: Request) {
  const jar = await cookies();
  const token = jar.get("iiiiibox_at")?.value;
  const formData = await req.formData();
  const res = await fetch(`${API}/admin/categories/upload-image`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
