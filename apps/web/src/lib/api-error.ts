import { NextResponse } from "next/server";
import { ApiError } from "@iiiiibox/api-client";

export function handleApiError(err: unknown) {
  if (err instanceof ApiError) {
    return NextResponse.json({ error: err.message }, { status: err.status });
  }
  return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
}
