import { NextResponse } from "next/server";
import { authedFetch } from "@/lib/authed-fetch";

export async function POST(req: Request) {
  const formData = await req.formData();
  const res = await authedFetch("/page-config/upload-icon", {
    method: "POST",
    body: formData,
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
