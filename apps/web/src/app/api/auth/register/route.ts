import { NextResponse } from "next/server";
import { getServerApiClient } from "@/lib/server-api";
import { setAuthCookies } from "@/lib/auth-cookies";
import { handleApiError } from "@/lib/api-error";

export async function POST(req: Request) {
  const body = await req.json();
  try {
    const { accessToken, refreshToken } = await getServerApiClient().auth.register(body);
    setAuthCookies(accessToken, refreshToken);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
