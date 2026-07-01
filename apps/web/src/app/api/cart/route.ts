import { NextResponse } from "next/server";
import { getServerApiClient } from "@/lib/server-api";
import { handleApiError } from "@/lib/api-error";

export async function GET() {
  try {
    const cart = await getServerApiClient().cart.get();
    return NextResponse.json(cart);
  } catch (err) {
    return handleApiError(err);
  }
}
