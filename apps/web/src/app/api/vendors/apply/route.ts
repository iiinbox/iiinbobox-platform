import { NextResponse } from "next/server";
import { getServerApiClient } from "@/lib/server-api";
import { setAuthCookies } from "@/lib/auth-cookies";
import { handleApiError } from "@/lib/api-error";

export async function POST(req: Request) {
  const body = await req.json();
  try {
    const { vendor, accessToken } = await getServerApiClient().vendors.apply(body);
    setAuthCookies(accessToken);
    return NextResponse.json({ vendor });
  } catch (err) {
    return handleApiError(err);
  }
}
