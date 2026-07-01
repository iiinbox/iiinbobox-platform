import { NextResponse } from "next/server";
import { ApiError } from "@iiiiibox/api-client";
import { getAccessToken } from "@/lib/auth-cookies";
import { handleApiError } from "@/lib/api-error";

const API_URL = process.env.API_INTERNAL_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const formData = await req.formData();
  const accessToken = getAccessToken();
  try {
    const res = await fetch(`${API_URL}/vendors/me/products/${params.id}/images`, {
      method: "POST",
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
      body: formData,
    });
    if (!res.ok) {
      throw new ApiError(res.status, await res.text());
    }
    return NextResponse.json(await res.json());
  } catch (err) {
    return handleApiError(err);
  }
}
