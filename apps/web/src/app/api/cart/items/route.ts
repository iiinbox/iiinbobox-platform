import { NextResponse } from "next/server";
import { getServerApiClient } from "@/lib/server-api";
import { handleApiError } from "@/lib/api-error";

export async function POST(req: Request) {
  const body = await req.json();
  try {
    const cart = await getServerApiClient().cart.addItem(body);
    return NextResponse.json(cart);
  } catch (err) {
    return handleApiError(err);
  }
}
