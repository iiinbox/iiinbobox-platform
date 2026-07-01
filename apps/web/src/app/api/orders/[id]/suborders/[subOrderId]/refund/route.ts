import { NextResponse } from "next/server";
import { ApiError } from "@iiiiibox/api-client";
import { getAccessToken } from "@/lib/auth-cookies";
import { handleApiError } from "@/lib/api-error";

const API_URL = process.env.API_INTERNAL_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export async function POST(
  req: Request,
  { params }: { params: { id: string; subOrderId: string } },
) {
  const body = await req.json();
  const accessToken = getAccessToken();
  try {
    const res = await fetch(
      `${API_URL}/orders/${params.id}/suborders/${params.subOrderId}/refund`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify(body),
      },
    );
    if (!res.ok) {
      throw new ApiError(res.status, await res.text());
    }
    return NextResponse.json(await res.json());
  } catch (err) {
    return handleApiError(err);
  }
}
