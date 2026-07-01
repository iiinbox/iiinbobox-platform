import { NextResponse } from "next/server";
import { getServerApiClient } from "@/lib/server-api";
import { handleApiError } from "@/lib/api-error";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const order = await getServerApiClient().orders.get(params.id);
    return NextResponse.json(order);
  } catch (err) {
    return handleApiError(err);
  }
}
