import { NextResponse } from "next/server";
import { getServerApiClient } from "@/lib/server-api";
import { handleApiError } from "@/lib/api-error";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const body = await req.json();
  try {
    const product = await getServerApiClient().adminProducts.moderate(params.id, body);
    return NextResponse.json(product);
  } catch (err) {
    return handleApiError(err);
  }
}
