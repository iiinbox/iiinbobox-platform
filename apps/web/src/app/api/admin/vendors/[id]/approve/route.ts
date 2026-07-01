import { NextResponse } from "next/server";
import { getServerApiClient } from "@/lib/server-api";
import { handleApiError } from "@/lib/api-error";

export async function PATCH(_req: Request, { params }: { params: { id: string } }) {
  try {
    const vendor = await getServerApiClient().adminVendors.approve(params.id);
    return NextResponse.json(vendor);
  } catch (err) {
    return handleApiError(err);
  }
}
