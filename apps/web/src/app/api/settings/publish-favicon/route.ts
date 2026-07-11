import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

// icon.tsx now fetches with cache: "no-store" so it's already dynamically
// rendered on every request — this route is a defensive extra nudge (not
// strictly required) so the "Publish" button has something concrete to do
// and Next's own route cache for /icon can never be the reason a freshly
// uploaded favicon doesn't show immediately.
export async function POST() {
  revalidatePath("/icon");
  return NextResponse.json({ ok: true });
}
