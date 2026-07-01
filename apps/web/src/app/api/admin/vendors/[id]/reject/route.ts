import { NextResponse } from "next/server";
import { getServerApiClient } from "@/lib/server-api";
import { handleApiError } from "@/lib/api-error";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const body = await req.json();
  try {
    const vendor = await getServerApiClient().adminVendors.reject(params.id, body.rejectionReason);
    return NextResponse.json(vendor);
  } catch (err) {
    return handleApiError(err);
  }
}
