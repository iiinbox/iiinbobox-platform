import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE } from "@/lib/cookie-names";

const API = process.env.API_INTERNAL_URL ?? "http://localhost:4000";

export async function POST() {
  // Actually revoke the session server-side (deletes it from Redis) before
  // clearing cookies — this used to be purely a client-side cookie clear, so
  // a copied/leaked refresh token stayed valid for its full 30-day lifetime
  // even after the user "logged out". Best-effort: if the backend call fails
  // (e.g. API briefly down), still clear cookies so the user is logged out
  // of this browser regardless.
  const jar = await cookies();
  const refreshToken = jar.get(REFRESH_TOKEN_COOKIE)?.value;
  if (refreshToken) {
    await fetch(`${API}/auth/logout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    }).catch(() => {});
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set("admin_gate", "", { httpOnly: true, sameSite: "lax", secure: true, maxAge: 0, path: "/" });
  res.cookies.set(ACCESS_TOKEN_COOKIE, "", { httpOnly: true, sameSite: "lax", secure: true, maxAge: 0, path: "/" });
  res.cookies.set(REFRESH_TOKEN_COOKIE, "", { httpOnly: true, sameSite: "lax", secure: true, maxAge: 0, path: "/" });
  return res;
}
