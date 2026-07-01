import { NextResponse } from "next/server";
import { getServerApiClient } from "@/lib/server-api";
import { handleApiError } from "@/lib/api-error";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const body = await req.json();
  try {
    const subOrder = await getServerApiClient().vendorOrders.updateStatus(params.id, body);
    return NextResponse.json(subOrder);
  } catch (err) {
    return handleApiError(err);
  }
}
