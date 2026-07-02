import { NextResponse } from "next/server";

const ADMIN_GATE_PASSWORD = process.env.ADMIN_GATE_PASSWORD ?? "7339111877";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@iiinbox.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "Admin@iiinbox2024";
const API_URL = process.env.API_INTERNAL_URL ?? "http://api:4000";

const isProd = process.env.NODE_ENV === "production";

export async function POST(req: Request) {
  const { password } = await req.json();

  if (password !== ADMIN_GATE_PASSWORD) {
    return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
  }

  // Auto-login as admin to get JWT tokens
  let accessToken: string | null = null;
  let refreshToken: string | null = null;

  try {
    const loginRes = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
    });
    if (loginRes.ok) {
      const tokens = await loginRes.json();
      accessToken = tokens.accessToken;
      refreshToken = tokens.refreshToken;
    }
  } catch {
    return NextResponse.json({ error: "Auth service unavailable" }, { status: 503 });
  }

  if (!accessToken) {
    return NextResponse.json({ error: "Admin login failed" }, { status: 500 });
  }

  const res = NextResponse.json({ ok: true });

  // Gate cookie
  res.cookies.set("admin_gate", "granted", {
    httpOnly: true,
    sameSite: "lax",
    secure: isProd,
    maxAge: 60 * 60 * 8,
    path: "/",
  });

  // JWT access token
  res.cookies.set("iiiiibox_at", accessToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: isProd,
    maxAge: 60 * 15,
    path: "/",
  });

  // JWT refresh token
  if (refreshToken) {
    res.cookies.set("iiiiibox_rt", refreshToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: isProd,
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
    });
  }

  return res;
}
