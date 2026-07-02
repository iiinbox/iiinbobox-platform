import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE } from "@/lib/cookie-names";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET ?? "change-me");
const API_URL = process.env.API_INTERNAL_URL ?? "http://api:4000";
const isProd = process.env.NODE_ENV === "production";

async function refreshAccessToken(refreshToken: string): Promise<string | null> {
  try {
    const res = await fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.accessToken ?? null;
  } catch {
    return null;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const host = req.headers.get("host") ?? "";
  const isAdminSubdomain = host === "admin.iiinbox.com" || host.startsWith("admin.iiinbox.");

  // ── admin.iiinbox.com — password gate ──────────────────────────
  if (isAdminSubdomain) {
    const isGatePath = pathname === "/admin-gate";
    const isGateApi = pathname.startsWith("/api/admin-gate");

    if (isGatePath || isGateApi) return NextResponse.next();

    const granted = req.cookies.get("admin_gate")?.value;
    if (!granted) {
      return NextResponse.redirect(new URL("https://admin.iiinbox.com/admin-gate"));
    }

    // Check if access token is still valid; if not, try refresh
    const accessToken = req.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
    let tokenValid = false;
    if (accessToken) {
      try {
        await jwtVerify(accessToken, JWT_SECRET);
        tokenValid = true;
      } catch {
        tokenValid = false;
      }
    }

    if (!tokenValid) {
      const refreshToken = req.cookies.get(REFRESH_TOKEN_COOKIE)?.value;
      if (refreshToken) {
        const newAccessToken = await refreshAccessToken(refreshToken);
        if (newAccessToken) {
          const res = pathname === "/" || pathname === ""
            ? NextResponse.redirect(new URL("https://admin.iiinbox.com/admin/vendors"))
            : NextResponse.next();
          res.cookies.set(ACCESS_TOKEN_COOKIE, newAccessToken, {
            httpOnly: true, sameSite: "lax", secure: isProd, maxAge: 60 * 15, path: "/",
          });
          return res;
        }
      }
      // Refresh failed — clear gate and re-authenticate
      const res = NextResponse.redirect(new URL("https://admin.iiinbox.com/admin-gate"));
      res.cookies.delete("admin_gate");
      return res;
    }

    // Token valid — redirect root to admin panel
    if (pathname === "/" || pathname === "") {
      return NextResponse.redirect(new URL("https://admin.iiinbox.com/admin/vendors"));
    }

    return NextResponse.next();
  }

  // ── www role-based protection ───────────────────────────────────
  const token = req.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
  let role: string | undefined;
  if (token) {
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      role = payload.role as string;
    } catch {
      role = undefined;
    }
  }

  if (pathname.startsWith("/vendor")) {
    if (!role) return NextResponse.redirect(new URL("/login", req.url));
    if (pathname !== "/vendor/apply" && role !== "VENDOR") {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  if (pathname.startsWith("/admin")) {
    if (!role) return NextResponse.redirect(new URL("/login", req.url));
    if (role !== "ADMIN") return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
