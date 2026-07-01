import { NextResponse } from "next/server";
import { getServerApiClient } from "@/lib/server-api";
import { handleApiError } from "@/lib/api-error";

export async function GET() {
  try {
    const addresses = await getServerApiClient().addresses.listMine();
    return NextResponse.json(addresses);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: Request) {
  const body = await req.json();
  try {
    const address = await getServerApiClient().addresses.create(body);
    return NextResponse.json(address);
  } catch (err) {
    return handleApiError(err);
  }
}
