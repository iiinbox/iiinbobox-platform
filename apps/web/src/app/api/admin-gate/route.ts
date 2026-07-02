import { NextResponse } from "next/server";

const ADMIN_PASSWORD = process.env.ADMIN_GATE_PASSWORD ?? "7339111877";

export async function POST(req: Request) {
  const { password } = await req.json();

  if (password !== ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set("admin_gate", "granted", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 8, // 8 hours
    path: "/",
  });
  return res;
}
