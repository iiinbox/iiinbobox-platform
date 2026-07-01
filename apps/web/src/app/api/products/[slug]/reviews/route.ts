import { NextResponse } from "next/server";
import { getServerApiClient } from "@/lib/server-api";
import { handleApiError } from "@/lib/api-error";

export async function POST(req: Request, { params }: { params: { slug: string } }) {
  const body = await req.json();
  try {
    const review = await getServerApiClient().reviews.create(params.slug, body);
    return NextResponse.json(review);
  } catch (err) {
    return handleApiError(err);
  }
}
