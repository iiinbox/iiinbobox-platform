import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { authedFetch } from "@/lib/authed-fetch";

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const res = await authedFetch(`/page-config/projects/${encodeURIComponent(params.id)}/publish`, { method: "POST" });
  const data = await res.json();
  if (res.ok && Array.isArray(data?.published)) {
    for (const slug of data.published as string[]) {
      revalidatePath(slug === "home" ? "/" : `/${slug}`);
    }
  }
  return NextResponse.json(data, { status: res.status });
}
