import { NextResponse } from "next/server";
import { getServerApiClient } from "@/lib/server-api";
import { handleApiError } from "@/lib/api-error";

export async function POST(req: Request) {
  const body = await req.json();
  try {
    const order = await getServerApiClient().checkout.verify(body);
    return NextResponse.json(order);
  } catch (err) {
    return handleApiError(err);
  }
}
