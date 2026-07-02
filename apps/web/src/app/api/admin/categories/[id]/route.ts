import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const API = process.env.API_INTERNAL_URL ?? "http://localhost:4000";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const jar = await cookies();
  const token = jar.get("iiiiibox_at")?.value;
  const res = await fetch(`${API}/admin/categories/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  return NextResponse.json({}, { status: res.status });
}
