import { NextResponse } from "next/server";
import { getServerApiClient } from "@/lib/server-api";
import { handleApiError } from "@/lib/api-error";

export async function POST(req: Request) {
  const body = await req.json();
  try {
    const session = await getServerApiClient().checkout.create(body);
    return NextResponse.json(session);
  } catch (err) {
    return handleApiError(err);
  }
}
