import { NextResponse } from "next/server";
import { getServerApiClient } from "@/lib/server-api";
import { handleApiError } from "@/lib/api-error";

export async function PATCH(req: Request, { params }: { params: { productId: string } }) {
  const body = await req.json();
  try {
    const cart = await getServerApiClient().cart.updateItem(params.productId, body);
    return NextResponse.json(cart);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(_req: Request, { params }: { params: { productId: string } }) {
  try {
    const cart = await getServerApiClient().cart.removeItem(params.productId);
    return NextResponse.json(cart);
  } catch (err) {
    return handleApiError(err);
  }
}
